import re
from datetime import datetime
from collections import defaultdict
import requests

LOG_URL = "https://izv.svaza.lv/api/mqtt/log"
MAX_GAP_SECONDS = 25  # max interval within a session

def fetch_log(url):
    r = requests.get(url)
    r.raise_for_status()
    return r.text.splitlines()

def parse_line(line):
    """
    Matches lines like:
      19.06.2025 16:21:40 - Accel_OUT/17: {"Accel":…}
      19.06.2025 16:21:33 - SUS_OUT/17: SPD: 0.000000
    Returns (timestamp, vehicle_id) or None if it doesn't match.
    """
    m = re.match(
        r'^(\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}) - [^/]+/(\d{1,2}):', 
        line
    )
    if not m:
        return None
    ts = datetime.strptime(m.group(1), "%d.%m.%Y %H:%M:%S")
    vid = int(m.group(2))
    return ts, vid

def group_into_sessions(ts_list, max_gap=MAX_GAP_SECONDS):
    sessions = []
    if not ts_list:
        return sessions
    current = [ts_list[0]]
    for prev, cur in zip(ts_list, ts_list[1:]):
        if (cur - prev).total_seconds() <= max_gap:
            current.append(cur)
        else:
            sessions.append(current)
            current = [cur]
    sessions.append(current)
    return sessions

def analyze(log_lines):
    by_id = defaultdict(list)
    for line in log_lines:
        parsed = parse_line(line)
        if not parsed:
            continue
        ts, vid = parsed
        by_id[vid].append(ts)

    results = {}
    for vid, times in by_id.items():
        times.sort()
        sessions = group_into_sessions(times)
        stats = []
        for sess in sessions:
            start, end = sess[0], sess[-1]
            duration = max(1, (end - start).total_seconds())
            count    = len(sess)
            stats.append({
                "start": start,
                "end":   end,
                "messages": count,
                "duration_s": duration,
                "avg_msg_per_s": count / duration
            })
        results[vid] = stats
    return results

def main():
    print("Fetching log…")
    lines = fetch_log(LOG_URL)
    print(f"Got {len(lines)} lines, parsing…")
    stats = analyze(lines)

    for vid in sorted(stats):
        sessions = stats[vid]
        print(f"\nVehicle ID {vid}: {len(sessions)} session(s)")
        for i, s in enumerate(sessions, 1):
            print(
                f" Session {i}: {s['messages']} msgs over "
                f"{s['duration_s']:.0f}s (avg {s['avg_msg_per_s']:.2f} msg/s) "
                f"[{s['start']} → {s['end']}]"
            )

if __name__ == "__main__":
    main()
