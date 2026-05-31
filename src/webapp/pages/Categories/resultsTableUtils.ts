export type CategoryRawCompetitor = {
  id: number;
  username?: string;
  startedAt?: string;
  finishedAt?: string;
  [key: string]: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getArrayPayloadItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];

  for (const key of ["data", "cars", "competitors", "items", "results"]) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
  }

  return [];
}

export function normalizeCategoryCompetitors(payload: unknown): CategoryRawCompetitor[] {
  return getArrayPayloadItems(payload)
    .map((item, index) => {
      if (!isRecord(item)) return null;
      const id = toNumber(item.id ?? item.ID ?? item.car_id ?? item.carId, Number.NaN);
      if (!Number.isFinite(id)) return null;

      const username =
        getTeam(item as CategoryRawCompetitor, `Team ${id}`) ||
        `Team ${id}`;

      return {
        ...item,
        id,
        username,
        key: item.key ?? `${id}-${index}`,
      } as CategoryRawCompetitor;
    })
    .filter((item): item is CategoryRawCompetitor => item !== null);
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function toNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function parseTime(value: string): number {
  const match = /^(\d+):(\d{2})\.(\d{2})$/.exec(value.trim());
  if (!match) return Number.NaN;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  const centiseconds = Number(match[3]);
  return minutes * 60 + seconds + centiseconds / 100;
}

export function formatSeconds(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = Math.floor(safe % 60);
  const centiseconds = Math.floor((safe - Math.floor(safe)) * 100);
  return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
}

export function timeToSeconds(value: string): number {
  return parseTime(value);
}

export function getTimeSpent(value: CategoryRawCompetitor, tickMs: number): string {
  if (typeof value.finishedAt === "string" && value.finishedAt.trim()) return value.finishedAt;
  if (typeof value.startedAt !== "string" || !value.startedAt.trim()) return "--:--.--";
  const started = Date.parse(value.startedAt);
  if (!Number.isFinite(started)) return "--:--.--";
  return formatSeconds(Math.max(0, (tickMs - started) / 1000));
}

export function addPenalty(timeValue: string, penaltySeconds: number): string {
  const base = timeToSeconds(timeValue);
  if (!Number.isFinite(base)) return "--:--.--";
  return formatSeconds(base + penaltySeconds);
}

export function getTeam(value: CategoryRawCompetitor, fallback: string): string {
  const candidates = [
    value.team,
    value.teamName,
    value.team_name,
    value.username,
  ];
  for (const item of candidates) {
    if (typeof item === "string" && item.trim()) return item.trim();
  }
  return fallback;
}

export function getAttemptNo(
  value: CategoryRawCompetitor,
  index: number,
  selectedLap?: string
): number {
  const direct = toNumber(value.attemptNo ?? value.attempt ?? value.lap, Number.NaN);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const selected = toNumber(selectedLap, Number.NaN);
  if (Number.isFinite(selected) && selected > 0) return selected;
  return 1;
}

export function getValidity(value: CategoryRawCompetitor, index: number): boolean {
  const candidates = [value.isValid, value.valid, value.attemptValid];
  for (const item of candidates) {
    if (typeof item === "boolean") return item;
    if (typeof item === "number") return item !== 0;
    if (typeof item === "string") {
      const normalized = item.trim().toLowerCase();
      if (["true", "yes", "1", "valid"].includes(normalized)) return true;
      if (["false", "no", "0", "invalid"].includes(normalized)) return false;
    }
  }
  return true;
}

export function getPenalty(value: CategoryRawCompetitor, index: number): number {
  const direct = toNumber(
    value.penalties ?? value.penalty ?? value.penaltySeconds,
    Number.NaN
  );
  if (Number.isFinite(direct) && direct >= 0) return direct;
  return 0;
}
