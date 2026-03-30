import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Select, Spin, Table } from "antd";
import { FullscreenExitOutlined, FullscreenOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { ENDPOINT_RACE_CONFIG, ENDPOINT_RESULTS } from "@/webapp/config/endpoints";
import { apiFetch } from "@/webapp/utils/api";
import { fakeCategoryCompetitors, fakeRaceConfigs } from "@/webapp/data/fakeData";
import { useTranslation } from "react-i18next";
import { addPenalty, formatSeconds, timeToSeconds, toNumber } from "./Categories/resultsTableUtils";

type ApiRaceConfig = {
  RaceName: string;
  Length: number;
  Coef: number;
  SortBy: string;
  Distribution: number[];
};

type RawResultRow = Record<string, unknown>;

type DisplayRow = {
  key: string;
  id: number;
  team: string;
  [key: string]: string | number | boolean;
};

type RaceKey =
  | "BrakingTest"
  | "SteeringTest"
  | "ShuttleRun"
  | "DragRace"
  | "MainRace"
  | "EkoRace";

type ColumnType = "number" | "time" | "boolean" | "text";

type ColumnDefinition = {
  key: string;
  title: string;
  type: ColumnType;
};

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildRowKeyMap(row: RawResultRow): Record<string, unknown> {
  const map: Record<string, unknown> = {};
  Object.entries(row).forEach(([key, value]) => {
    map[normalizeKey(key)] = value;
  });
  return map;
}

function getStringFromMap(map: Record<string, unknown>, aliases: string[], fallback: string): string {
  for (const alias of aliases) {
    const value = map[normalizeKey(alias)];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return fallback;
}

function getNumberFromMap(map: Record<string, unknown>, aliases: string[], fallback: number): number {
  for (const alias of aliases) {
    const value = map[normalizeKey(alias)];
    const parsed = toNumber(value, Number.NaN);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function getBooleanFromMap(map: Record<string, unknown>, aliases: string[], fallback: boolean): boolean {
  for (const alias of aliases) {
    const value = map[normalizeKey(alias)];
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "yes", "1", "valid"].includes(normalized)) return true;
      if (["false", "no", "0", "invalid"].includes(normalized)) return false;
    }
  }
  return fallback;
}

function parseFlexibleTimeToSeconds(value: string): number {
  const trimmed = value.trim();
  const mmss = /^(\d+):(\d{2})\.(\d{2})$/.exec(trimmed);
  if (mmss) {
    const minutes = Number(mmss[1]);
    const seconds = Number(mmss[2]);
    const centiseconds = Number(mmss[3]);
    return minutes * 60 + seconds + centiseconds / 100;
  }

  const hhmmss = /^(\d+):(\d{2}):(\d{2})\.(\d{2})$/.exec(trimmed);
  if (hhmmss) {
    const hours = Number(hhmmss[1]);
    const minutes = Number(hhmmss[2]);
    const seconds = Number(hhmmss[3]);
    const centiseconds = Number(hhmmss[4]);
    return hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
  }

  return Number.NaN;
}

function normalizeTimeValue(raw: unknown, fallback: string): string {
  if (typeof raw !== "string" || !raw.trim()) return fallback;
  const seconds = parseFlexibleTimeToSeconds(raw);
  if (!Number.isFinite(seconds)) return fallback;
  return formatSeconds(seconds);
}

function resolveRaceKey(raceName?: string): RaceKey | undefined {
  if (!raceName) return undefined;
  const normalized = raceName.toLowerCase().replace(/[\s_-]/g, "");
  if (normalized.includes("braking")) return "BrakingTest";
  if (normalized.includes("steering") || normalized.includes("figuredriving")) return "SteeringTest";
  if (normalized.includes("shuttle")) return "ShuttleRun";
  if (normalized.includes("drag")) return "DragRace";
  if (normalized.includes("main") || normalized.includes("final")) return "MainRace";
  if (normalized.includes("eko") || normalized.includes("efficiency")) return "EkoRace";
  return undefined;
}

function uniqueRaceNames(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim())));
}

function buildExampleRows(race: RaceKey): DisplayRow[] {
  const base = fakeCategoryCompetitors.slice(0, 8).map((competitor, index) => ({
    id: competitor.id,
    team: competitor.username,
    index,
  }));

  if (race === "BrakingTest") {
    return base.map((row) => ({
      key: `${race}-${row.id}`,
      id: row.id,
      team: row.team,
      brakingDistance: Number((2 + row.index * 0.23).toFixed(2)),
      enteringSpeed: Number((28 + row.index * 1.35).toFixed(1)),
      attemptNo: 1,
      isValid: row.index % 5 !== 0,
    }));
  }

  if (race === "SteeringTest") {
    return base.map((row) => {
      const timeSpent = formatSeconds(38 + row.index * 2.45);
      const penalties = row.index % 3;
      return {
        key: `${race}-${row.id}`,
        id: row.id,
        team: row.team,
        timeSpent,
        penalties,
        totalTime: addPenalty(timeSpent, penalties),
        attemptNo: 1,
        isValid: row.index % 4 !== 0,
      };
    });
  }

  if (race === "ShuttleRun") {
    return base.map((row) => ({
      key: `${race}-${row.id}`,
      id: row.id,
      team: row.team,
      timeSpent: formatSeconds(26 + row.index * 1.72),
      penalties: row.index % 3,
      attemptNo: 1,
      isValid: row.index % 4 !== 0,
    }));
  }

  if (race === "DragRace") {
    return base.map((row) => ({
      key: `${race}-${row.id}`,
      id: row.id,
      team: row.team,
      timeSpent: formatSeconds(19 + row.index * 1.12),
      maxSpeed: Number((42 + row.index * 1.8).toFixed(1)),
      attemptNo: 1,
      isValid: row.index % 5 !== 0,
    }));
  }

  if (race === "MainRace") {
    return base.map((row) => {
      const timeSpent = formatSeconds(170 + row.index * 4.85);
      const penalties = row.index % 3;
      return {
        key: `${race}-${row.id}`,
        id: row.id,
        team: row.team,
        timeSpent,
        avgSpeed: Number((24 + row.index * 0.85).toFixed(1)),
        penalties,
        totalTime: addPenalty(timeSpent, penalties),
        place: row.index + 1,
      };
    });
  }

  return base.map((row) => {
    const timeSpent = formatSeconds(155 + row.index * 4.35);
    const penalties = row.index % 3;
    const usedEnergy = Number((0.36 + row.index * 0.05).toFixed(3));
    const efficiency = Number((1.6 + row.index * 0.15).toFixed(3));
    return {
      key: `${race}-${row.id}`,
      id: row.id,
      team: row.team,
      timeSpent,
      avgSpeed: Number((22 + row.index * 0.78).toFixed(1)),
      penalties,
      totalTime: addPenalty(timeSpent, penalties),
      place: row.index + 1,
      attemptNo: 1,
      isValid: row.index % 4 !== 0,
      usedEnergy,
      efficiency,
    };
  });
}

function normalizeRowsForRace(race: RaceKey, rows: RawResultRow[]): DisplayRow[] {
  const mapped = rows.map((raw, index) => {
    const map = buildRowKeyMap(raw);
    const id = getNumberFromMap(map, ["id", "ID"], index + 1);
    const team = getStringFromMap(
      map,
      ["team", "teamName", "team_name", "username", "Username"],
      `Team ${id}`
    );

    if (race === "BrakingTest") {
      return {
        key: `${race}-${id}-${index}`,
        id,
        team,
        brakingDistance: getNumberFromMap(map, ["brakingDistance", "distance"], 0),
        enteringSpeed: getNumberFromMap(map, ["enteringSpeed", "speed"], 0),
        attemptNo: getNumberFromMap(map, ["attemptNo", "attempt", "lap"], 1),
        isValid: getBooleanFromMap(map, ["isValid", "valid", "attemptValid"], true),
      } as DisplayRow;
    }

    if (race === "SteeringTest") {
      const timeSpent = normalizeTimeValue(
        map[normalizeKey("timeSpent")] ?? map[normalizeKey("elapsedTime")] ?? map[normalizeKey("time")],
        "00:00.00"
      );
      const penalties = getNumberFromMap(map, ["penalties", "penalty", "penaltySeconds"], 0);
      return {
        key: `${race}-${id}-${index}`,
        id,
        team,
        timeSpent,
        penalties,
        totalTime: normalizeTimeValue(map[normalizeKey("totalTime")], addPenalty(timeSpent, penalties)),
        attemptNo: getNumberFromMap(map, ["attemptNo", "attempt", "lap"], 1),
        isValid: getBooleanFromMap(map, ["isValid", "valid", "attemptValid"], true),
      } as DisplayRow;
    }

    if (race === "ShuttleRun") {
      return {
        key: `${race}-${id}-${index}`,
        id,
        team,
        timeSpent: normalizeTimeValue(
          map[normalizeKey("timeSpent")] ?? map[normalizeKey("elapsedTime")] ?? map[normalizeKey("time")],
          "00:00.00"
        ),
        penalties: getNumberFromMap(map, ["penalties", "penalty", "penaltySeconds"], 0),
        attemptNo: getNumberFromMap(map, ["attemptNo", "attempt", "lap"], 1),
        isValid: getBooleanFromMap(map, ["isValid", "valid", "attemptValid"], true),
      } as DisplayRow;
    }

    if (race === "DragRace") {
      return {
        key: `${race}-${id}-${index}`,
        id,
        team,
        timeSpent: normalizeTimeValue(
          map[normalizeKey("timeSpent")] ?? map[normalizeKey("elapsedTime")] ?? map[normalizeKey("time")],
          "00:00.00"
        ),
        maxSpeed: getNumberFromMap(map, ["maxSpeed", "speed"], 0),
        attemptNo: getNumberFromMap(map, ["attemptNo", "attempt", "lap"], 1),
        isValid: getBooleanFromMap(map, ["isValid", "valid", "attemptValid"], true),
      } as DisplayRow;
    }

    if (race === "MainRace") {
      const timeSpent = normalizeTimeValue(
        map[normalizeKey("timeSpent")] ?? map[normalizeKey("elapsedTime")] ?? map[normalizeKey("time")],
        "00:00.00"
      );
      const penalties = getNumberFromMap(map, ["penalties", "penalty", "penaltySeconds"], 0);
      return {
        key: `${race}-${id}-${index}`,
        id,
        team,
        timeSpent,
        avgSpeed: getNumberFromMap(map, ["avgSpeed", "averageSpeed", "speed"], 0),
        penalties,
        totalTime: normalizeTimeValue(map[normalizeKey("totalTime")], addPenalty(timeSpent, penalties)),
        place: getNumberFromMap(map, ["place", "position", "rank"], index + 1),
      } as DisplayRow;
    }

    const timeSpent = normalizeTimeValue(
      map[normalizeKey("timeSpent")] ?? map[normalizeKey("elapsedTime")] ?? map[normalizeKey("time")],
      "00:00.00"
    );
    const penalties = getNumberFromMap(map, ["penalties", "penalty", "penaltySeconds"], 0);
    return {
      key: `${race}-${id}-${index}`,
      id,
      team,
      timeSpent,
      avgSpeed: getNumberFromMap(map, ["avgSpeed", "averageSpeed", "speed"], 0),
      penalties,
      totalTime: normalizeTimeValue(map[normalizeKey("totalTime")], addPenalty(timeSpent, penalties)),
      place: getNumberFromMap(map, ["place", "position", "rank"], index + 1),
      attemptNo: getNumberFromMap(map, ["attemptNo", "attempt", "lap"], 1),
      isValid: getBooleanFromMap(map, ["isValid", "valid", "attemptValid"], true),
      usedEnergy: getNumberFromMap(map, ["usedEnergy", "energy", "usedenergy"], 0),
      efficiency: getNumberFromMap(map, ["efficiency", "e", "efficiencye"], 0),
    } as DisplayRow;
  });

  if (race === "MainRace" || race === "EkoRace") {
    const shouldReRank = mapped.every((row) => {
      const placeValue = toNumber(row.place, Number.NaN);
      return !Number.isFinite(placeValue);
    });

    if (shouldReRank) {
      const ranked = [...mapped].sort((a, b) => {
        const aValue = typeof a.totalTime === "string" ? timeToSeconds(a.totalTime) : Number.NaN;
        const bValue = typeof b.totalTime === "string" ? timeToSeconds(b.totalTime) : Number.NaN;
        if (!Number.isFinite(aValue) && !Number.isFinite(bValue)) return a.id - b.id;
        if (!Number.isFinite(aValue)) return 1;
        if (!Number.isFinite(bValue)) return -1;
        return aValue - bValue;
      });
      const placeMap = new Map<number, number>(
        ranked.map((entry, entryIndex) => [entry.id, entryIndex + 1])
      );
      return mapped.map((row) => ({ ...row, place: placeMap.get(row.id) ?? row.place }));
    }
  }

  return mapped;
}

const ResultsPage: React.FC = () => {
  const { t } = useTranslation();
  const [races, setRaces] = useState<string[]>([]);
  const [selectedRace, setSelectedRace] = useState<string>();
  const [data, setData] = useState<DisplayRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [expandedView, setExpandedView] = useState(false);
  const [showExampleNotice, setShowExampleNotice] = useState(false);

  useEffect(() => {
    apiFetch(ENDPOINT_RACE_CONFIG)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ApiRaceConfig[]>;
      })
      .then((configs) => setRaces(uniqueRaceNames(configs.map((item) => item.RaceName))))
      .catch(() => setRaces(uniqueRaceNames(fakeRaceConfigs.map((item) => item.RaceName))));
  }, []);

  useEffect(() => {
    if (!selectedRace) {
      setData([]);
      setShowExampleNotice(false);
      return;
    }

    const raceKey = resolveRaceKey(selectedRace);
    if (!raceKey) {
      setError(t("results.unsupportedRace"));
      setData([]);
      return;
    }

    setLoading(true);
    setError(undefined);
    setShowExampleNotice(false);

    apiFetch(`${ENDPOINT_RESULTS}/${encodeURIComponent(selectedRace)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<RawResultRow[]>;
      })
      .then((rows) => {
        if (!Array.isArray(rows) || rows.length === 0) {
          setData(buildExampleRows(raceKey));
          setShowExampleNotice(true);
          return;
        }
        setData(normalizeRowsForRace(raceKey, rows));
      })
      .catch(() => {
        setData(buildExampleRows(raceKey));
        setShowExampleNotice(true);
      })
      .finally(() => setLoading(false));
  }, [selectedRace, t]);

  const raceKey = useMemo(() => resolveRaceKey(selectedRace), [selectedRace]);

  const columnDefinitions = useMemo<ColumnDefinition[]>(() => {
    if (!raceKey) return [];

    const base: Record<RaceKey, ColumnDefinition[]> = {
      BrakingTest: [
        { key: "id", title: t("common.id"), type: "number" },
        { key: "team", title: t("raceControl.team"), type: "text" },
        { key: "brakingDistance", title: t("raceControl.brakingDistance"), type: "number" },
        { key: "enteringSpeed", title: t("raceControl.enteringSpeed"), type: "number" },
        { key: "attemptNo", title: t("raceControl.attemptNo"), type: "number" },
        { key: "isValid", title: t("raceControl.isValid"), type: "boolean" },
      ],
      SteeringTest: [
        { key: "id", title: t("common.id"), type: "number" },
        { key: "team", title: t("raceControl.team"), type: "text" },
        { key: "timeSpent", title: t("raceControl.timeSpent"), type: "time" },
        { key: "penalties", title: t("raceControl.penaltiesSeconds"), type: "number" },
        { key: "totalTime", title: t("raceControl.totalTime"), type: "time" },
        { key: "attemptNo", title: t("raceControl.attemptNo"), type: "number" },
        { key: "isValid", title: t("raceControl.isValid"), type: "boolean" },
      ],
      ShuttleRun: [
        { key: "id", title: t("common.id"), type: "number" },
        { key: "team", title: t("raceControl.team"), type: "text" },
        { key: "timeSpent", title: t("common.time"), type: "time" },
        { key: "penalties", title: t("raceControl.penaltiesSeconds"), type: "number" },
        { key: "attemptNo", title: t("raceControl.attemptNo"), type: "number" },
        { key: "isValid", title: t("raceControl.isValid"), type: "boolean" },
      ],
      DragRace: [
        { key: "id", title: t("common.id"), type: "number" },
        { key: "team", title: t("raceControl.team"), type: "text" },
        { key: "timeSpent", title: t("common.time"), type: "time" },
        { key: "maxSpeed", title: t("raceControl.maxSpeed"), type: "number" },
        { key: "attemptNo", title: t("raceControl.attemptNo"), type: "number" },
        { key: "isValid", title: t("raceControl.isValid"), type: "boolean" },
      ],
      MainRace: [
        { key: "id", title: t("common.id"), type: "number" },
        { key: "team", title: t("raceControl.team"), type: "text" },
        { key: "timeSpent", title: t("raceControl.timeSpent"), type: "time" },
        { key: "avgSpeed", title: t("common.avgSpeed"), type: "number" },
        { key: "penalties", title: t("raceControl.penaltiesSeconds"), type: "number" },
        { key: "totalTime", title: t("raceControl.totalTime"), type: "time" },
        { key: "place", title: t("results.place"), type: "number" },
      ],
      EkoRace: [
        { key: "id", title: t("common.id"), type: "number" },
        { key: "team", title: t("raceControl.team"), type: "text" },
        { key: "timeSpent", title: t("raceControl.timeSpent"), type: "time" },
        { key: "avgSpeed", title: t("common.avgSpeed"), type: "number" },
        { key: "penalties", title: t("raceControl.penaltiesSeconds"), type: "number" },
        { key: "totalTime", title: t("raceControl.totalTime"), type: "time" },
        { key: "place", title: t("results.place"), type: "number" },
        { key: "attemptNo", title: t("raceControl.attemptNo"), type: "number" },
        { key: "isValid", title: t("raceControl.isValid"), type: "boolean" },
        { key: "usedEnergy", title: t("common.usedEnergy"), type: "number" },
        { key: "efficiency", title: t("common.efficiency"), type: "number" },
      ],
    };

    return base[raceKey];
  }, [raceKey, t]);

  const columns = useMemo<TableColumnsType<DisplayRow>>(
    () =>
      columnDefinitions.map((definition) => ({
        title: definition.title,
        dataIndex: definition.key,
        key: definition.key,
        sorter: (a, b) => {
          const left = a[definition.key];
          const right = b[definition.key];

          if (definition.type === "boolean") {
            return Number(Boolean(left)) - Number(Boolean(right));
          }

          if (definition.type === "time") {
            const leftSec = typeof left === "string" ? timeToSeconds(left) : Number.NaN;
            const rightSec = typeof right === "string" ? timeToSeconds(right) : Number.NaN;
            if (!Number.isFinite(leftSec) && !Number.isFinite(rightSec)) return 0;
            if (!Number.isFinite(leftSec)) return 1;
            if (!Number.isFinite(rightSec)) return -1;
            return leftSec - rightSec;
          }

          if (definition.type === "number") {
            return toNumber(left, 0) - toNumber(right, 0);
          }

          return String(left ?? "").localeCompare(String(right ?? ""));
        },
        render: (value: unknown) => {
          if (definition.type === "boolean") {
            return value ? t("common.yes") : t("common.no");
          }

          if (definition.type === "number") {
            const numeric = toNumber(value, Number.NaN);
            if (!Number.isFinite(numeric)) return "-";
            if (definition.key === "usedEnergy" || definition.key === "efficiency") return numeric.toFixed(3);
            if (
              definition.key === "maxSpeed" ||
              definition.key === "avgSpeed" ||
              definition.key === "enteringSpeed"
            ) {
              return numeric.toFixed(1);
            }
            if (definition.key === "brakingDistance") return numeric.toFixed(2);
            return numeric;
          }

          return String(value ?? "-");
        },
      })),
    [columnDefinitions, t]
  );

  if (error) return <Alert type="error" message={t("results.error")} description={error} />;
  if (loading) return <Spin tip={t("results.loading")} style={{ margin: 50 }} />;

  const table = (
    <Table<DisplayRow>
      dataSource={data}
      columns={columns}
      rowKey="key"
      pagination={false}
      size="middle"
      scroll={{ x: "max-content" }}
    />
  );

  if (expandedView && selectedRace) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0A306D] overflow-auto sm:mt-0 mt-16">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">{selectedRace}</h2>
          <Button
            icon={<FullscreenExitOutlined />}
            onClick={() => setExpandedView(false)}
            style={{ background: "transparent", border: "none", color: "white" }}
          />
        </div>
        <div className="px-6 pb-12">{table}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">{t("results.header")}</h1>
      <div className="flex-1">
        <div className="mb-4 flex items-center gap-4">
          <span className="text-white text-lg">{t("results.chooseRace")}</span>
          <Select
            placeholder={t("results.selectRace")}
            className="w-56"
            value={selectedRace}
            onChange={setSelectedRace}
            options={races.map((race) => ({ label: race, value: race }))}
          />
        </div>

        {showExampleNotice && (
          <Alert
            className="mb-4"
            type="info"
            showIcon
            message={t("results.usingExampleData")}
          />
        )}

        <div className="bg-[#36598B]/30 backdrop-blur-md p-4 rounded-xl shadow-lg overflow-x-auto flex flex-col">
          <div className="flex justify-end mb-2">
            <Button
              size="small"
              icon={<FullscreenOutlined />}
              onClick={() => setExpandedView(true)}
              disabled={!selectedRace}
              style={{ background: "transparent", border: "none" }}
            />
          </div>
          {table}
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
