import requests
import pandas as pd
from datetime import datetime, timedelta

# Configuration
URL = "https://dummyjson.com/c/b6c3-8fa1-416b-9d7b"
START_TIME = datetime.strptime("11:00", "%H:%M")
NUM_LAPS = 2
TASK_DURATION = timedelta(minutes=1)

# Fetch competitors
def fetch_competitors(url):
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

# Extract relevant fields
def parse_competitors(data):
    return [
        {"Komanda": c["username"], "ID": c["id"]}
        for c in data
    ]

# Define Station 2 order: rotate so competitor 10 starts first
def get_station2_order(comp_list):
    ids = [c["ID"] for c in comp_list]
    return ids[9:] + ids[:9]

# Build schedule entries
def build_schedule(competitors, station2_order):
    entries = []
    race_number = 1
    num_competitors = len(competitors)

    # Station 1 (natural order)
    for lap in range(1, NUM_LAPS + 1):
        lap_offset = timedelta(minutes=(lap - 1) * num_competitors)
        for idx, comp in enumerate(competitors):
            start = START_TIME + lap_offset + timedelta(minutes=idx)
            entries.append({
                "Brauciena №": race_number,
                "Disciplīna": "Station 1",
                "Mēģinājums": lap,
                "Starta laiks": start.strftime("%H:%M"),
                "ID": comp["ID"],
                "Komanda": comp["Komanda"]
            })
            race_number += 1

    # Station 2 (custom order)
    for lap in range(1, NUM_LAPS + 1):
        lap_offset = timedelta(minutes=(lap - 1) * num_competitors)
        for idx, comp_id in enumerate(station2_order):
            comp = next(c for c in competitors if c["ID"] == comp_id)
            start = START_TIME + lap_offset + timedelta(minutes=idx)
            entries.append({
                "Brauciena №": race_number,
                "Disciplīna": "Station 2",
                "Mēģinājums": lap,
                "Starta laiks": start.strftime("%H:%M"),
                "ID": comp["ID"],
                "Komanda": comp["Komanda"]
            })
            race_number += 1

    return entries

# Main execution
def main():
    raw_data = fetch_competitors(URL)
    competitors = parse_competitors(raw_data)
    station2_order = get_station2_order(competitors)
    schedule_entries = build_schedule(competitors, station2_order)

    # Export to Excel
    df = pd.DataFrame(schedule_entries)
    output_file = "competition_schedule.xlsx"
    df.to_excel(output_file, index=False)
    print(f"Schedule exported to {output_file}.")

if __name__ == "__main__":
    main()
