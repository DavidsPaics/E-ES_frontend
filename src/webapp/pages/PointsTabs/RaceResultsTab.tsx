import React, { useEffect, useMemo, useState } from "react";
import { Table, Select, Spin, Avatar, InputNumber, Button, Space, message } from "antd";
import type { ColumnType } from "antd/es/table";
import { UpOutlined, DownOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { ENDPOINT_RACE_RESULTS_ALL, ENDPOINT_POINTS } from "@/webapp/config/endpoints";
import { apiFetch } from "@/webapp/utils/api";
import {
  RACE_OPTIONS,
  formatDuration,
  getRaceLabel,
  normalizeRaceResults,
  type RaceKey,
  type RaceResultRow,
} from "@/webapp/utils/raceResults";
import type { TableRow } from "./types";

const { Option } = Select;

const RaceResultsTab: React.FC = () => {
  const { t } = useTranslation();

  const [selectedRace, setSelectedRace] = useState<RaceKey | null>(null);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  const [chosenParam, setChosenParam] = useState<
    "usedEnergy" | "efficiency" | "shellEfficiency" | "avgPower" | "avgSpeed" | "elapsedTime"
  >("usedEnergy");
  const [aggType, setAggType] = useState<"min" | "max">("min");
  const [metricSortOrder, setMetricSortOrder] = useState<"ascend" | "descend" | null>(null);
  const [pointsMap, setPointsMap] = useState<Record<number, number>>({});
  const [coefficient, setCoefficient] = useState<number>(1);

  const mapResults = (raw: RaceResultRow[]): TableRow[] =>
    raw.map((r) => ({
      key: r.key,
      id: r.id,
      username: r.team,
      avatar: "",
      lap: Number(r.attemptNr || 1),
      usedEnergy: Number(r.usedEnergy || 0),
      efficiency: Number(r.efficiency || 0),
      shellEfficiency: Number(r.shellEfficiency || 0),
      avgPower: 0,
      avgSpeed: Number(r.averageSpeed || 0),
      elapsedTime: formatDuration(r.totalTime || r.usedTime),
    }));

  useEffect(() => {
    const fetchResults = async () => {
      setLoadingResults(true);
      try {
        const res = await apiFetch(ENDPOINT_RACE_RESULTS_ALL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const allResults = normalizeRaceResults(await res.json());
        setTableData(selectedRace ? mapResults(allResults.filter((row) => row.raceName === selectedRace)) : []);
        setPointsMap({});
        setMetricSortOrder(null);
      } catch (err: any) {
        message.error("Failed to load race results: " + err.message);
        setTableData([]);
        setPointsMap({});
        setMetricSortOrder(null);
      } finally {
        setLoadingResults(false);
      }
    };
    if (!selectedRace) { setTableData([]); return; }
    fetchResults();
  }, [selectedRace]);

  // ─── Sorting / aggregation helpers ──────────────────
  const parseTime = (timeStr: string) => {
    const parts = timeStr.split(":");
    if (parts.length === 2) return parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
    if (parts.length !== 3) return 0;
    return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseFloat(parts[2]);
  };

  const groupedById = useMemo(() => {
    const map: Record<number, TableRow[]> = {};
    tableData.forEach((row) => {
      if (!map[row.id]) map[row.id] = [];
      map[row.id].push(row);
    });
    return map;
  }, [tableData]);

  const metricsById = useMemo(() => {
    const result: Record<number, number> = {};
    Object.entries(groupedById).forEach(([idStr, rows]) => {
      const id = Number(idStr);
      if (chosenParam === "elapsedTime") {
        const secs = rows.map((r) => parseTime(r.elapsedTime));
        result[id] = aggType === "min" ? Math.min(...secs) : Math.max(...secs);
      } else {
        const vals = rows.map((r) => (r as any)[chosenParam] as number);
        result[id] = aggType === "min" ? Math.min(...vals) : Math.max(...vals);
      }
    });
    return result;
  }, [groupedById, chosenParam, aggType]);

  const sortedAscendingIds = useMemo(() => {
    return Object.keys(metricsById).map((k) => Number(k)).sort((a, b) => metricsById[a] - metricsById[b]);
  }, [metricsById]);

  const sortedRows = useMemo(() => {
    let idsToUse: number[];
    if (metricSortOrder === "ascend") idsToUse = sortedAscendingIds;
    else if (metricSortOrder === "descend") idsToUse = [...sortedAscendingIds].reverse();
    else idsToUse = Object.keys(groupedById).map((k) => Number(k));

    const result: TableRow[] = [];
    idsToUse.forEach((id) => {
      const rows = groupedById[id] || [];
      result.push(...rows.slice().sort((a, b) => a.lap - b.lap));
    });
    return result;
  }, [sortedAscendingIds, groupedById, metricSortOrder]);

  const idCounts = useMemo(() => {
    const map: Record<number, number> = {};
    sortedRows.forEach((row) => { map[row.id] = (map[row.id] || 0) + 1; });
    return map;
  }, [sortedRows]);

  // ─── Actions ────────────────────────────────────────
  const suggestPoints = () => {
    let idsOrdered: number[];
    if (metricSortOrder === "ascend") idsOrdered = sortedAscendingIds;
    else if (metricSortOrder === "descend") idsOrdered = [...sortedAscendingIds].reverse();
    else idsOrdered = Object.keys(groupedById).map((k) => Number(k));

    const maxPts = idsOrdered.length * coefficient;
    const newMap: Record<number, number> = {};
    idsOrdered.forEach((id, idx) => { newMap[id] = Math.max(maxPts - coefficient * idx, 0); });
    setPointsMap(newMap);
  };

  const uploadPoints = async () => {
    if (!selectedRace) { message.error("No race selected."); return; }
    const payload = {
      RaceName: selectedRace,
      Points: Object.entries(pointsMap).map(([idStr, pts]) => ({ ID: Number(idStr), Points: pts })),
    };
    try {
      const res = await apiFetch(ENDPOINT_POINTS, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      message.success("Points uploaded successfully.");
    } catch (err: any) {
      message.error("Failed to upload points: " + err.message);
    }
  };

  // ─── Row-span helper ────────────────────────────────
  const spanCell = (_: any, rowIndex?: number) => {
    if (rowIndex === undefined) return {};
    const record = sortedRows[rowIndex];
    const prev = rowIndex > 0 ? sortedRows[rowIndex - 1] : null;
    const firstOfID = rowIndex === 0 || (prev && prev.id !== record.id);
    if (!firstOfID) return { rowSpan: 0 };
    return { rowSpan: idCounts[record.id] || 1 };
  };

  // ─── Column definitions ────────────────────────────
  const columns: ColumnType<TableRow>[] = [
    {
      title: t("common.id"), dataIndex: "id", key: "id", width: 80,
      render: (value: number) => value, onCell: spanCell,
    },
    {
      title: t("common.username"), key: "username",
      render: (_: any, record: TableRow) => (
        <span style={{ display: "flex", alignItems: "center" }}>
          <Avatar src={record.avatar} size={32} style={{ marginRight: 8 }} />
          <span>{record.username}</span>
        </span>
      ),
      onCell: spanCell,
    },
    {
      title: (
        <Space size="small" align="center">
          <Select size="small" style={{ width: 140 }} value={chosenParam}
            onChange={(val) => setChosenParam(val as any)}
            options={[
              { label: t("common.usedEnergy"), value: "usedEnergy" },
              { label: t("common.efficiency"), value: "efficiency" },
              { label: t("common.shellEfficiency"), value: "shellEfficiency" },
              { label: t("common.avgPower"), value: "avgPower" },
              { label: t("common.avgSpeed"), value: "avgSpeed" },
              { label: t("common.elapsedTime"), value: "elapsedTime" },
            ]}
          />
          <Select size="small" style={{ width: 80 }} value={aggType}
            onChange={(val) => setAggType(val as "min" | "max")}
            options={[{ label: "Min", value: "min" }, { label: "Max", value: "max" }]}
          />
          <UpOutlined
            style={{ cursor: "pointer", color: metricSortOrder === "ascend" ? "#1677ff" : "rgba(0,0,0,0.35)" }}
            onClick={() => setMetricSortOrder((p) => (p === "ascend" ? null : "ascend"))}
          />
          <DownOutlined
            style={{ cursor: "pointer", color: metricSortOrder === "descend" ? "#1677ff" : "rgba(0,0,0,0.35)" }}
            onClick={() => setMetricSortOrder((p) => (p === "descend" ? null : "descend"))}
          />
        </Space>
      ),
      key: "metric",
      render: (_: any, record: TableRow, rowIndex: number) => {
        const prev = rowIndex > 0 ? sortedRows[rowIndex - 1] : null;
        if (!(rowIndex === 0 || (prev && prev.id !== record.id))) return null;
        const v = metricsById[record.id];
        if (chosenParam === "elapsedTime") {
          const hh = Math.floor(v / 3600); const mm = Math.floor((v % 3600) / 60); const ss = (v % 60).toFixed(2);
          return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${ss.padStart(5, "0")}`;
        }
        return (chosenParam === "avgPower" || chosenParam === "avgSpeed") ? v.toFixed(2) : v.toFixed(4);
      },
      onCell: spanCell,
    },
    {
      title: t("common.totalPoints"), key: "points", width: 120,
      render: (_: any, record: TableRow, rowIndex: number) => {
        const prev = rowIndex > 0 ? sortedRows[rowIndex - 1] : null;
        if (!(rowIndex === 0 || (prev && prev.id !== record.id))) return null;
        return (
          <InputNumber min={0} value={pointsMap[record.id] || 0}
            onChange={(val) => setPointsMap((p) => ({ ...p, [record.id]: typeof val === "number" ? val : 0 }))}
          />
        );
      },
      onCell: spanCell,
    },
    { title: t("common.lap"), dataIndex: "lap", key: "lap", width: 80, sorter: (a, b) => a.lap - b.lap },
    { title: t("common.usedEnergy"), dataIndex: "usedEnergy", key: "usedEnergy", width: 120, sorter: (a, b) => a.usedEnergy - b.usedEnergy, render: (v: number | undefined) => v != null ? v.toFixed(4) : "—" },
    { title: t("common.efficiency"), dataIndex: "efficiency", key: "efficiency", width: 120, sorter: (a, b) => a.efficiency - b.efficiency, render: (v: number | undefined) => v != null ? v.toFixed(4) : "—" },
    { title: t("common.shellEfficiency"), dataIndex: "shellEfficiency", key: "shellEfficiency", width: 140, sorter: (a, b) => a.shellEfficiency - b.shellEfficiency, render: (v: number | undefined) => v != null ? v.toFixed(4) : "—" },
    { title: t("common.avgPower"), dataIndex: "avgPower", key: "avgPower", width: 120, sorter: (a, b) => a.avgPower - b.avgPower, render: (v: number | undefined) => v != null ? v.toFixed(2) : "—" },
    { title: t("common.avgSpeed"), dataIndex: "avgSpeed", key: "avgSpeed", width: 120, sorter: (a, b) => a.avgSpeed - b.avgSpeed, render: (v: number | undefined) => v != null ? v.toFixed(2) : "—" },
    { title: t("common.elapsedTime"), dataIndex: "elapsedTime", key: "elapsedTime", width: 140, render: (v: string | undefined) => v || "—" },
  ];

  return (
    <div className="flex flex-col gap-y-6">
      <h2 className="text-white text-xl font-semibold">{t("points.selectRace")}</h2>

      <Select placeholder={t("points.chooseRace")} style={{ width: 300 }}
        value={selectedRace || undefined} onChange={(val: RaceKey) => setSelectedRace(val)}
      >
        {RACE_OPTIONS.map((race) => (
          <Option key={race.value} value={race.value}>{getRaceLabel(race.value)}</Option>
        ))}
      </Select>

      {selectedRace && (
        <Space style={{ marginTop: 16 }} wrap>
          <span style={{ color: "#fff", fontWeight: "bold" }}>{t("points.sortBy")}</span>
          <Select size="small" style={{ width: 140 }} value={chosenParam}
            onChange={(val) => setChosenParam(val as any)}
            options={[
              { label: t("common.usedEnergy"), value: "usedEnergy" },
              { label: t("common.efficiency"), value: "efficiency" },
              { label: t("common.shellEfficiency"), value: "shellEfficiency" },
              { label: t("common.avgPower"), value: "avgPower" },
              { label: t("common.avgSpeed"), value: "avgSpeed" },
              { label: t("common.elapsedTime"), value: "elapsedTime" },
            ]}
          />
          <Select size="small" style={{ width: 80 }} value={aggType}
            onChange={(val) => setAggType(val as "min" | "max")}
            options={[{ label: "Min", value: "min" }, { label: "Max", value: "max" }]}
          />
          <span style={{ color: "#fff", fontWeight: "bold" }}>{t("points.coefficient")}</span>
          <InputNumber min={1} value={coefficient}
            onChange={(val) => setCoefficient(typeof val === "number" ? val : 1)}
          />
          <Button type="default" onClick={suggestPoints}>{t("points.suggestPoints")}</Button>
          <Button type="primary" onClick={uploadPoints}>{t("points.uploadPoints")}</Button>
        </Space>
      )}

      {selectedRace && loadingResults && (
        <div style={{ marginTop: 32, textAlign: "center" }}><Spin size="large" /></div>
      )}

      {selectedRace && !loadingResults && (
        <div style={{ marginTop: 16 }}>
          <Table<TableRow> dataSource={sortedRows} columns={columns} rowKey="key"
            pagination={false} size="middle" scroll={{ x: "max-content" }}
          />
        </div>
      )}

      {!selectedRace && (
        <div className="text-gray-300 italic" style={{ marginTop: 12 }}>
          {t("points.selectRaceFirst")}
        </div>
      )}
    </div>
  );
};

export default RaceResultsTab;
