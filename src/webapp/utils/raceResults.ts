import type { TableColumnsType } from "antd";
import type { TFunction } from "i18next";

export type RaceKey =
  | "EkoRace"
  | "DragRace"
  | "ShuttleRun"
  | "SteeringTest"
  | "BrakingTest"
  | "MainRace";

export type RawRaceResultEntry = Record<string, unknown>;

export type RaceResultRow = {
  key: string;
  id: number;
  team: string;
  raceName: RaceKey;
  [key: string]: string | number | boolean;
};

type ColumnType = "number" | "time" | "boolean" | "text" | "datetime";

export type RaceResultColumnDefinition = {
  key: string;
  title: string;
  type: ColumnType;
  always?: boolean;
};

export const RACE_OPTIONS: Array<{ value: RaceKey; label: string }> = [
  { value: "DragRace", label: "Dragreiss" },
  { value: "BrakingTest", label: "Bremzēšanas efektivitāte" },
  { value: "ShuttleRun", label: "Atspole" },
  { value: "SteeringTest", label: "Figūru izbraukšana" },
  { value: "EkoRace", label: "Efektivitātes posms" },
  { value: "MainRace", label: "Fināla posms" },
];

export function getRaceLabel(race: RaceKey): string {
  return RACE_OPTIONS.find((option) => option.value === race)?.label ?? race;
}

export function isRaceKey(value: unknown): value is RaceKey {
  return typeof value === "string" && RACE_OPTIONS.some((option) => option.value === value);
}

export function getArrayPayloadItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (typeof payload !== "object" || payload === null) return [];

  const record = payload as Record<string, unknown>;
  for (const key of ["data", "results", "entries", "items"]) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }

  return [];
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildKeyMap(row: RawRaceResultEntry): Record<string, unknown> {
  const map: Record<string, unknown> = {};
  Object.entries(row).forEach(([key, value]) => {
    map[normalizeKey(key)] = value;
  });
  return map;
}

function firstString(map: Record<string, unknown>, aliases: string[], fallback = ""): string {
  for (const alias of aliases) {
    const value = map[normalizeKey(alias)];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return fallback;
}

function firstNumber(map: Record<string, unknown>, aliases: string[], fallback = 0): number {
  for (const alias of aliases) {
    const value = map[normalizeKey(alias)];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

function firstBoolean(map: Record<string, unknown>, aliases: string[], fallback = false): boolean {
  for (const alias of aliases) {
    const value = map[normalizeKey(alias)];
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "yes", "1", "valid", "derīgs"].includes(normalized)) return true;
      if (["false", "no", "0", "invalid", "nederīgs"].includes(normalized)) return false;
    }
  }
  return fallback;
}

export function secondsFromDuration(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.abs(value) > 1_000_000 ? value / 1_000_000_000 : value;
  }

  if (typeof value !== "string" || !value.trim()) return 0;
  const trimmed = value.trim();
  const numeric = Number(trimmed);
  if (Number.isFinite(numeric)) return secondsFromDuration(numeric);

  const hhmmss = /^(\d+):(\d{2}):(\d{2})(?:\.(\d+))?$/.exec(trimmed);
  if (hhmmss) {
    return (
      Number(hhmmss[1]) * 3600 +
      Number(hhmmss[2]) * 60 +
      Number(hhmmss[3]) +
      Number(`0.${hhmmss[4] ?? "0"}`)
    );
  }

  const mmss = /^(\d+):(\d{2})(?:\.(\d+))?$/.exec(trimmed);
  if (mmss) {
    return Number(mmss[1]) * 60 + Number(mmss[2]) + Number(`0.${mmss[3] ?? "0"}`);
  }

  const duration = /^(?:(\d+(?:\.\d+)?)h)?(?:(\d+(?:\.\d+)?)m)?(?:(\d+(?:\.\d+)?)s)?$/.exec(trimmed);
  if (duration && (duration[1] || duration[2] || duration[3])) {
    return Number(duration[1] ?? 0) * 3600 + Number(duration[2] ?? 0) * 60 + Number(duration[3] ?? 0);
  }

  return 0;
}

export function formatDuration(value: unknown): string {
  const totalSeconds = secondsFromDuration(value);
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(2).padStart(5, "0")}`;
}

export function normalizeRaceResults(payload: unknown): RaceResultRow[] {
  return getArrayPayloadItems(payload)
    .map((entry, index) => {
      if (typeof entry !== "object" || entry === null) return null;
      const raw = entry as RawRaceResultEntry;
      const map = buildKeyMap(raw);
      const raceName = firstString(map, ["race_name", "raceName", "RaceName"]);
      if (!isRaceKey(raceName)) return null;

      const id = firstNumber(map, ["car_id", "carId", "ID", "id"], index + 1);
      const attemptNr = firstNumber(map, ["attempt_nr", "attemptNr", "attemptNo", "attempt"], 0);

      const row: RaceResultRow = {
        key: `${raceName}-${id}-${attemptNr}-${index}`,
        raceName,
        id,
        team: firstString(map, ["team_name", "teamName", "TeamName", "username", "Username"], `Team ${id}`),
        attemptNr,
        raceStartTime: firstString(map, ["race_start_time", "raceStartTime"], ""),
        raceEndTime: firstString(map, ["race_end_time", "raceEndTime"], ""),
        penalties: secondsFromDuration(map[normalizeKey("penalties")]),
        usedTime: secondsFromDuration(map[normalizeKey("used_time")] ?? map[normalizeKey("usedTime")]),
        maxSpeed: firstNumber(map, ["max_speed", "maxSpeed"], 0),
        valid: firstBoolean(map, ["valid"], false),
        brakingDistance: firstNumber(map, ["braking_distance", "brakingDistance"], 0),
        driveinSpeed: firstNumber(map, ["drivein_speed", "driveinSpeed"], 0),
        averageSpeed: firstNumber(map, ["average_speed", "averageSpeed"], 0),
        totalTime: secondsFromDuration(map[normalizeKey("total_time")] ?? map[normalizeKey("totalTime")]),
        placement: firstNumber(map, ["placement"], 0),
        usedEnergy: firstNumber(map, ["used_energy", "usedEnergy"], 0),
        efficiency: firstNumber(map, ["efficiency"], 0),
        shellEfficiency: firstNumber(map, ["shell_efficiency", "shellEfficiency"], 0),
      };
      return row;
    })
    .filter((entry): entry is RaceResultRow => entry !== null);
}

export function getColumnDefinitions(t: TFunction): RaceResultColumnDefinition[] {
  return [
    { key: "id", title: t("common.id"), type: "number", always: true },
    { key: "team", title: "Komanda", type: "text", always: true },
    { key: "attemptNr", title: "Mēģinājums", type: "number" },
    { key: "raceStartTime", title: "Sākums", type: "datetime" },
    { key: "raceEndTime", title: "Beigas", type: "datetime" },
    { key: "penalties", title: "Sodi (s)", type: "number" },
    { key: "usedTime", title: "Patērētais laiks", type: "time" },
    { key: "maxSpeed", title: "Maks. ātrums (km/h)", type: "number" },
    { key: "valid", title: "Derīgs", type: "boolean" },
    { key: "brakingDistance", title: "Bremzēšanas distance (m)", type: "number" },
    { key: "driveinSpeed", title: "Iebraukšanas ātrums (km/h)", type: "number" },
    { key: "averageSpeed", title: "Vid. ātrums", type: "number" },
    { key: "totalTime", title: "Kopējais laiks", type: "time" },
    { key: "placement", title: t("results.place"), type: "number" },
    { key: "usedEnergy", title: t("common.usedEnergy"), type: "number" },
    { key: "efficiency", title: t("common.efficiency"), type: "number" },
    { key: "shellEfficiency", title: t("common.shellEfficiency"), type: "number" },
  ];
}

function hasDisplayValue(row: RaceResultRow, definition: RaceResultColumnDefinition): boolean {
  const value = row[definition.key];
  if (definition.always) return true;
  if (value === null || value === undefined || value === "") return false;
  if (definition.type === "number" || definition.type === "time") {
    return typeof value === "number" && Number.isFinite(value) && value !== 0;
  }
  return true;
}

export function getVisibleColumnDefinitions(
  rows: RaceResultRow[],
  definitions: RaceResultColumnDefinition[]
): RaceResultColumnDefinition[] {
  return definitions.filter((definition) =>
    definition.always || rows.some((row) => hasDisplayValue(row, definition))
  );
}

function toSortableNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return Number.NaN;
}

export function buildRaceResultColumns(
  definitions: RaceResultColumnDefinition[],
  t: TFunction
): TableColumnsType<RaceResultRow> {
  return definitions.map((definition) => ({
    title: definition.title,
    dataIndex: definition.key,
    key: definition.key,
    sorter: (a, b) => {
      const left = a[definition.key];
      const right = b[definition.key];
      if (definition.type === "text" || definition.type === "datetime") {
        return String(left ?? "").localeCompare(String(right ?? ""));
      }
      if (definition.type === "boolean") return Number(Boolean(left)) - Number(Boolean(right));
      const leftNumber = toSortableNumber(left);
      const rightNumber = toSortableNumber(right);
      if (!Number.isFinite(leftNumber) && !Number.isFinite(rightNumber)) return 0;
      if (!Number.isFinite(leftNumber)) return 1;
      if (!Number.isFinite(rightNumber)) return -1;
      return leftNumber - rightNumber;
    },
    render: (value: unknown) => {
      if (definition.type === "boolean") return value ? t("common.yes") : t("common.no");
      if (definition.type === "time") return formatDuration(value);
      if (definition.type === "number") {
        const numeric = toSortableNumber(value);
        if (!Number.isFinite(numeric)) return "";
        if (definition.key === "attemptNr" || definition.key === "placement" || definition.key === "id") {
          return numeric;
        }
        return Number.isInteger(numeric) ? numeric : numeric.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
      }
      if (definition.type === "datetime" && typeof value === "string" && value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : date.toLocaleString("lv-LV");
      }
      return String(value ?? "");
    },
  }));
}
