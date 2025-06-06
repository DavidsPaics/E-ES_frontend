
"""
fake_multi_http_wrapped.py

Every second, each “car” (IDs 1–4) does four separate HTTP PUTs to:

    /api/mqtt/send/PSU_IN/<car>
    /api/mqtt/send/PSU_OUT/<car>
    /api/mqtt/send/GPS_OUT/<car>
    /api/mqtt/send/ACCEL_OUT/<car>

But each JSON body wraps the inner fields under a top‐level key equal to
the base topic name (dropping any “_IN” or “_OUT” suffix). E.g.:

    Topic = "GPS_OUT/2"
    Body  = { "GPS": { "Lat":…, "Lon":…, "Spd":… } }

Your Go handler (`sendToMqtt`) will simply republish each raw JSON under
that exact topic to MQTT.
"""

import json
import random
import threading
import time

import requests


# ─── CONFIGURATION ───────────────────────────────────────────────────────────

# Change this to wherever your Go service is listening:
GO_SERVER_BASE = "https://izv.svaza.lv"
ENDPOINT_PREFIX = f"{GO_SERVER_BASE}/api/mqtt/send"

# Car IDs to emulate:
CAR_IDS = ["1", "2", "3", "4"]

# How often (in seconds) to emit all four topics per car:
PUBLISH_INTERVAL_S = 1.0


# ─── HELPER: Wrap under base key ──────────────────────────────────────────────

def wrap_payload(topic: str, inner: dict) -> dict:
    """
    Given a topic like "PSU_IN/2" or "GPS_OUT/3", return a dict:
        { base_key: inner }

    base_key is the part before "/" with any "_IN"/"_OUT" suffix removed.
    E.g. "PSU_IN/2"  →  "PSU"
          "PSU_OUT/2" →  "PSU"
          "GPS_OUT/2" →  "GPS"
          "ACCEL_OUT/2"→  "ACCEL"
    """
    base, _ = topic.split("/", 1)  # e.g. "GPS_OUT"
    # If there's an underscore, drop everything from the underscore onward:
    if "_" in base:
        base = base.split("_", 1)[0]
    return {base: inner}


# ─── FAKE‐DATA GENERATORS ─────────────────────────────────────────────────────

def make_psu_in() -> dict:
    """
    { "I": int, "U": int, "St": int }
    """
    return {
        "I": random.randint(0, 1000),
        "U": random.randint(0, 6000),
        "St": random.choice([0, 1])
    }

def make_psu_out() -> dict:
    """
    { "Uop": int, "Iop": int, "Pop": int, "Uip": int, "Wh": int }
    """
    Uop = random.randint(3000, 3500)
    Iop = random.randint(100, 500)
    Pop = int(Uop * Iop + random.randint(-500, 500))
    Uip = random.randint(5000, 5500)
    Wh  = random.randint(10000, 20000)
    return {
        "Uop": Uop,
        "Iop": Iop,
        "Pop": Pop,
        "Uip": Uip,
        "Wh":  Wh
    }

def make_gps_out() -> dict:
    """
    { "Lat": float, "Lon": float, "Spd": float }
    """
    base_lat = 52.0
    base_lon = 21.0
    lat = base_lat + random.uniform(-0.1, 0.1)
    lon = base_lon + random.uniform(-0.1, 0.1)
    spd = random.uniform(0, 20)
    return {
        "Lat": round(lat, 5),
        "Lon": round(lon, 5),
        "Spd": round(spd, 2)
    }

def make_accel_out() -> dict:
    """
    { "X": float, "Y": float, "Z": float }
    """
    return {
        "X": round(random.uniform(-2.0, 2.0), 2),
        "Y": round(random.uniform(-2.0, 2.0), 2),
        "Z": round(random.uniform(-2.0, 2.0), 2)
    }


# ─── BOARD THREAD ─────────────────────────────────────────────────────────────

class BoardEmulator(threading.Thread):
    def __init__(self, car_id: str):
        super().__init__(daemon=True)
        self.car_id = car_id
        self.running = True

    def run(self):
        while self.running:
            # Build a dict of raw inner payloads, keyed by full topic:
            # e.g. "PSU_IN/2" → {"I":..., "U":..., "St":...}, etc.
            topic_to_inner = {
                f"PSU_IN/{self.car_id}":   make_psu_in(),
                f"PSU_OUT/{self.car_id}":  make_psu_out(),
                f"GPS_OUT/{self.car_id}":  make_gps_out(),
                f"Accel_OUT/{self.car_id}": make_accel_out(),
            }

            # For each topic, wrap the inner dict under the base key,
            # JSON‐encode, and PUT to /api/mqtt/send/<topic>
            for topic, inner in topic_to_inner.items():
                wrapped = wrap_payload(topic, inner)
                url = f"{ENDPOINT_PREFIX}/{topic}"
                headers = {"Content-Type": "application/json"}
                try:
                    resp = requests.put(url, headers=headers, data=json.dumps(wrapped), timeout=5)
                    if resp.status_code == 200:
                        print(f"[Car {self.car_id}] PUT → {topic}: {wrapped}")
                    else:
                        print(f"[Car {self.car_id}] ERROR {resp.status_code} for {topic}: {resp.text}")
                except Exception as ex:
                    print(f"[Car {self.car_id}] Exception PUT {topic}: {ex}")

            print("─" * 60)
            time.sleep(PUBLISH_INTERVAL_S)

    def stop(self):
        self.running = False


# ─── MAIN ──────────────────────────────────────────────────────────────────────

def main():
    emulators = []
    for cid in CAR_IDS:
        t = BoardEmulator(car_id=cid)
        t.start()
        emulators.append(t)

    print(f"Started HTTP‐based, wrapped‐payload emulation for cars: {', '.join(CAR_IDS)}")
    print("Press Ctrl+C to stop.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Stopping emulators…")
        for e in emulators:
            e.stop()
        print("Shutdown complete.")


if __name__ == "__main__":
    main()
