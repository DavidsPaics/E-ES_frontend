function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function parseYyyyMmDd(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  return new Date(year, month, day);
}

function parseDdMmYyyy(value: string): Date | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const year = Number(match[3]);
  return new Date(year, month, day);
}

export function toDate(input: string | number | Date): Date | null {
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }

  if (typeof input === "number") {
    const parsed = new Date(input);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const trimmed = input.trim();
  if (!trimmed) return null;

  const yyyyMmDd = parseYyyyMmDd(trimmed);
  if (yyyyMmDd) return yyyyMmDd;

  const ddMmYyyy = parseDdMmYyyy(trimmed);
  if (ddMmYyyy) return ddMmYyyy;

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDisplayDate(input: string | number | Date): string {
  const date = toDate(input);
  if (!date) return "-";
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

export function formatDisplayTime(input: string | number | Date): string {
  const date = toDate(input);
  if (!date) return "-";
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

