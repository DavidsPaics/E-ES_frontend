import time
import json
import random
import uuid
import threading
import paho.mqtt.client as mqtt

# MQTT broker settings
MQTT_HOST = "mqtt.svaza.lv"
MQTT_PORT = 1883
MQTT_USER = "esp32"
MQTT_PASSWORD = "T-SIM7000G"

def create_client_instance(car_id):
    client_id = f"car_emulator_{car_id}_{uuid.uuid4().hex[:6]}"
    client = mqtt.Client(client_id=client_id, clean_session=True)
    client.username_pw_set(MQTT_USER, MQTT_PASSWORD)

    # Callbacks for diagnostics
    def on_connect(c, userdata, flags, rc):
        print(f"[{client_id}] Connected with result code {rc}")
    def on_disconnect(c, userdata, rc):
        print(f"[{client_id}] Disconnected with result code {rc}")
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect

    client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
    client.loop_start()
    return client

def publish_sequence_for_all_ids(car_ids, clients):
    seq = 0
    topic = "data"
    try:
        while True:
            for car_id, client in zip(car_ids, clients):
                rssi = random.randint(-90, -30)
                accel = {"X": random.randint(-200, 200),
                         "Y": random.randint(-200, 200),
                         "Z": random.randint(800, 1200)}
                psu = {"Uop": random.randint(0, 5000),
                       "Iop": random.randint(0, 2000),
                       "Pop": random.randint(0, 10000),
                       "Uip": random.randint(2300, 2500),
                       "Wh": random.randint(0, 1000)}
                gps = {"Lat": int(56.92940 * 1e5 + random.uniform(-50, 50)),
                       "Lon": int(24.32622 * 1e5 + random.uniform(-50, 50)),
                       "Spd": round(random.uniform(0, 120), 2),
                       "Sat": random.randint(3, 12)}
                payload = {
                    "ID": car_id,
                    "Seq": seq,
                    "RSSI": rssi,
                    "Accel": accel,
                    "PSU": psu,
                    "GPS": gps
                }
                msg = json.dumps(payload)
                result = client.publish(topic, msg, qos=1)
               # print(f"[{client._client_id.decode()}] Published seq {seq}")
            seq += 1
            time.sleep(0.5)
    except Exception as e:
        print(f"Exception: {e}")
    finally:
        for client in clients:
            client.loop_stop()
            client.disconnect()

def main():
    num_cars = 30
    car_ids = list(range(num_cars))
    clients = [create_client_instance(i) for i in car_ids]
    publish_sequence_for_all_ids(car_ids, clients)

if __name__ == "__main__":
    main()