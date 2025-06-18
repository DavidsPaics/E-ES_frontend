import requests
import re
import json
from collections import defaultdict

def fetch_log(url):
    """
    Fetch raw log text from the given URL endpoint.
    """
    resp = requests.get(url)
    resp.raise_for_status()
    return resp.text


def parse_entries(log_text):
    """
    Parse log lines into a list of data dictionaries.
    Extracts JSON after ' - data: '.
    """
    pattern = re.compile(r" - data: (\{.*\})")
    entries = []
    for line in log_text.splitlines():
        match = pattern.search(line)
        if match:
            try:
                data = json.loads(match.group(1))
                entries.append(data)
            except json.JSONDecodeError:
                continue
    return entries


def analyze_sequences(entries, expected_ids):
    """
    Check each sequence number for missing IDs.
    Returns a dict mapping sequence -> set of missing IDs.
    """
    seq_map = defaultdict(set)
    for entry in entries:
        seq = entry.get('Seq')
        id_ = entry.get('ID')
        if seq is not None and id_ is not None:
            seq_map[seq].add(id_)

    missing_map = {}
    for seq, received_ids in seq_map.items():
        missing = set(expected_ids) - received_ids
        if missing:
            missing_map[seq] = missing
    return missing_map


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Check MQTT log for missing posts per sequence.")
    parser.add_argument('--url', default='https://izv.svaza.lv/api/mqtt/log', help='URL to fetch log')
    parser.add_argument('--ids', type=int, nargs='+', default=list(range(30)),
                        help='List of expected device IDs')
    args = parser.parse_args()

    print(f"Fetching log from {args.url}...")
    log_text = fetch_log(args.url)

    print("Parsing entries...")
    entries = parse_entries(log_text)
    print(f"Total entries parsed: {len(entries)}")

    print("Analyzing sequences for missing posts...")
    missing = analyze_sequences(entries, args.ids)

    if missing:
        print("Missing posts detected:")
        for seq in sorted(missing):
            print(f"  Seq {seq}: missing IDs {sorted(missing[seq])}")
    else:
        print("All posts received for each sequence.")

if __name__ == '__main__':
    main()
