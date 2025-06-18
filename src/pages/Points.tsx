// src/pages/Points.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Select,
  Spin,
  Avatar,
  message,
  InputNumber,
  Button,
  Space,
  Input,
  Divider,
} from "antd";
import type { ColumnType } from "antd/es/table";
import { UpOutlined, DownOutlined } from "@ant-design/icons";
import MainMenu from "@/components/menu";
import "@ant-design/v5-patch-for-react-19";
import { ENDPOINT_RACES, ENDPOINT_RESULTS, ENDPOINT_COMPETITORS, ENDPOINT_POINTS } from "@/config/endpoints";

const { Option } = Select;

/**
 * 1) Raw types for API endpoints
 */
type RawLapForList = {
  RaceName: string;
  Lap: number;
  Length: number;
};

type RawResult = {
  RaceName: string;
  Lap: number;
  ID: number;
  Username: string;
  avatar: string;
  "Used energy": number;
  Efficiency: number;
  Shellefficiency: number;
  "Average power": number;
  "Average speed": number;
  "Elapsed time": string;
};

type TableRow = {
  key: string; // `${ID}-${Lap}`
  id: number;
  username: string;
  avatar: string;
  lap: number;
  usedEnergy: number;
  efficiency: number;
  shellEfficiency: number;
  avgPower: number;
  avgSpeed: number;
  elapsedTime: string;
};

type Competitor = {
  id: number;
  username: string;
  avatar: string;
  U: number;
  I: number;
  m: number;
  ageGroup: string;
};

const Points: React.FC = () => {
  // ─────────────────────────────────────────────────────
  // Section A: Race Results & Points
  const [raceNames, setRaceNames] = useState<string[]>([]);
  const [selectedRace, setSelectedRace] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  // Sorting state
  const [chosenParam, setChosenParam] = useState<
    | "usedEnergy"
    | "efficiency"
    | "shellEfficiency"
    | "avgPower"
    | "avgSpeed"
    | "elapsedTime"
  >("usedEnergy");
  const [aggType, setAggType] = useState<"min" | "max">("min");
  const [metricSortOrder, setMetricSortOrder] = useState<
    "ascend" | "descend" | null
  >(null);

  // Points entry for results table
  const [pointsMap, setPointsMap] = useState<Record<number, number>>({});

  // Suggest Points coefficient
  const [coefficient, setCoefficient] = useState<number>(1);

  // ─────────────────────────────────────────────────────
  // Section B: Manual Entries
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [manualRaceName, setManualRaceName] = useState<string>("");
  const [manualPointsMap, setManualPointsMap] = useState<Record<number, number>>(
    {}
  );

  // ─────────────────────────────────────────────────────
  // Section C: Delete Points / Reset Leaderboard
  // (no extra state needed)

  // ─────────────────────────────────────────────────────
  // 1) On mount: fetch GET /api/races for Section A’s dropdown
  useEffect(() => {
    const fetchAllRaces = async () => {
      try {
        const res = await fetch(ENDPOINT_RACES);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw: RawLapForList[] = (await res.json()) as RawLapForList[];
        const unique = Array.from(new Set(raw.map((lap) => lap.RaceName)));
        setRaceNames(unique);
      } catch (err: any) {
        message.error("Failed to load races: " + err.message);
      }
    };
    fetchAllRaces();
  }, []);

  // 2) When selectedRace changes: GET /api/results/:raceName → TableRow[].
  useEffect(() => {
    if (!selectedRace) {
      setTableData([]);
      return;
    }
    const fetchResults = async () => {
      setLoadingResults(true);
      try {
        const url = `${ENDPOINT_RESULTS}/${encodeURIComponent(selectedRace)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rawResults: RawResult[] = (await res.json()) as RawResult[];
        const rows: TableRow[] = rawResults.map((r) => ({
          key: `${r.ID}-${r.Lap}`,
          id: r.ID,
          username: r.Username,
          avatar: r.avatar,
          lap: r.Lap,
          usedEnergy: r["Used energy"],
          efficiency: r.Efficiency,
          shellEfficiency: r.Shellefficiency,
          avgPower: r["Average power"],
          avgSpeed: r["Average speed"],
          elapsedTime: r["Elapsed time"],
        }));
        setTableData(rows);
        // Reset result‐table points & sorting
        setPointsMap({});
        setMetricSortOrder(null);
      } catch (err: any) {
        message.error("Failed to load results: " + err.message);
        setTableData([]);
        setPointsMap({});
      } finally {
        setLoadingResults(false);
      }
    };
    fetchResults();
  }, [selectedRace]);

  // 3) Fetch all competitors for Section B
  useEffect(() => {
    const fetchCompetitors = async () => {
      try {
        const res = await fetch(ENDPOINT_COMPETITORS);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw: Competitor[] = (await res.json()) as Competitor[];
        setCompetitors(raw);
      } catch (err: any) {
        message.error("Failed to load competitors: " + err.message);
      }
    };
    fetchCompetitors();
  }, []);

  // ─────────────────────────────────────────────────────
  // Helpers for Section A:

  const parseTime = (timeStr: string) => {
    const parts = timeStr.split(":");
    if (parts.length !== 3) return 0;
    const hh = parseInt(parts[0], 10);
    const mm = parseInt(parts[1], 10);
    const ss = parseFloat(parts[2]);
    return hh * 3600 + mm * 60 + ss;
  };

  const groupedById = useMemo(() => {
    const map: Record<number, TableRow[]> = {};
    tableData.forEach((row) => {
      if (!map[row.id]) {
        map[row.id] = [];
      }
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
        result[id] =
          aggType === "min" ? Math.min(...secs) : Math.max(...secs);
      } else {
        const vals = rows.map((r) => (r as any)[chosenParam] as number);
        result[id] =
          aggType === "min" ? Math.min(...vals) : Math.max(...vals);
      }
    });
    return result;
  }, [groupedById, chosenParam, aggType]);

  const sortedAscendingIds = useMemo(() => {
    return Object.keys(metricsById)
      .map((k) => Number(k))
      .sort((a, b) => metricsById[a] - metricsById[b]);
  }, [metricsById]);

  const sortedRows = useMemo(() => {
    let idsToUse: number[];
    if (metricSortOrder === "ascend") {
      idsToUse = sortedAscendingIds;
    } else if (metricSortOrder === "descend") {
      idsToUse = [...sortedAscendingIds].reverse();
    } else {
      idsToUse = Object.keys(groupedById).map((k) => Number(k));
    }

    const result: TableRow[] = [];
    idsToUse.forEach((id) => {
      const rows = groupedById[id] || [];
      const ordered = rows.slice().sort((a, b) => a.lap - b.lap);
      result.push(...ordered);
    });
    return result;
  }, [sortedAscendingIds, groupedById, metricSortOrder]);

  const idCounts = useMemo(() => {
    const map: Record<number, number> = {};
    sortedRows.forEach((row) => {
      map[row.id] = (map[row.id] || 0) + 1;
    });
    return map;
  }, [sortedRows]);

  const suggestPoints = () => {
    let idsOrdered: number[];
    if (metricSortOrder === "ascend") {
      idsOrdered = sortedAscendingIds;
    } else if (metricSortOrder === "descend") {
      idsOrdered = [...sortedAscendingIds].reverse();
    } else {
      idsOrdered = Object.keys(groupedById).map((k) => Number(k));
    }
    const numParticipants = idsOrdered.length;
    const maxPts = numParticipants * coefficient;
    const newMap: Record<number, number> = {};
    idsOrdered.forEach((id, idx) => {
      const assigned = Math.max(maxPts - coefficient * idx, 0);
      newMap[id] = assigned;
    });
    setPointsMap(newMap);
  };

  const uploadPoints = async () => {
    if (!selectedRace) {
      message.error("No race selected.");
      return;
    }
    const payloadArray = Object.entries(pointsMap).map(([idStr, pts]) => ({
      ID: Number(idStr),
      Points: pts,
    }));
    const payload = {
      RaceName: selectedRace,
      Points: payloadArray,
    };
    try {
      const res = await fetch(ENDPOINT_POINTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      message.success("Points uploaded successfully.");
    } catch (err: any) {
      message.error("Failed to upload points: " + err.message);
    }
  };

  // Column definitions for Section A’s results table
  const columns: ColumnType<TableRow>[] = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      render: (value: number) => value,
      onCell: (_: any, rowIndex?: number) => {
        if (rowIndex === undefined) return {};
        const record = sortedRows[rowIndex];
        const prev = rowIndex > 0 ? sortedRows[rowIndex - 1] : null;
        const firstOfID = rowIndex === 0 || (prev && prev.id !== record.id);
        if (!firstOfID) return { rowSpan: 0 };
        return { rowSpan: idCounts[record.id] || 1 };
      },
    },
    {
      title: "Username",
      key: "username",
      render: (_: any, record: TableRow) => (
        <span style={{ display: "flex", alignItems: "center" }}>
          <Avatar src={record.avatar} size={32} style={{ marginRight: 8 }} />
          <span>{record.username}</span>
        </span>
      ),
      onCell: (_: any, rowIndex?: number) => {
        if (rowIndex === undefined) return {};
        const record = sortedRows[rowIndex];
        const prev = rowIndex > 0 ? sortedRows[rowIndex - 1] : null;
        const firstOfID = rowIndex === 0 || (prev && prev.id !== record.id);
        if (!firstOfID) return { rowSpan: 0 };
        return { rowSpan: idCounts[record.id] || 1 };
      },
    },
    {
      title: (
        <Space size="small" align="center">
          <Select
            size="small"
            style={{ width: 140 }}
            value={chosenParam}
            onChange={(val) =>
              setChosenParam(
                val as
                  | "usedEnergy"
                  | "efficiency"
                  | "shellEfficiency"
                  | "avgPower"
                  | "avgSpeed"
                  | "elapsedTime"
              )
            }
            options={[
              { label: "Used Energy", value: "usedEnergy" },
              { label: "Efficiency", value: "efficiency" },
              { label: "Shell Eff", value: "shellEfficiency" },
              { label: "Avg Power", value: "avgPower" },
              { label: "Avg Speed", value: "avgSpeed" },
              { label: "Elapsed Time", value: "elapsedTime" },
            ]}
          />
          <Select
            size="small"
            style={{ width: 80 }}
            value={aggType}
            onChange={(val) => setAggType(val as "min" | "max")}
            options={[
              { label: "Min", value: "min" },
              { label: "Max", value: "max" },
            ]}
          />

          <UpOutlined
            style={{
              cursor: "pointer",
              color:
                metricSortOrder === "ascend" ? "#1677ff" : "rgba(0,0,0,0.35)",
            }}
            onClick={() => {
              setMetricSortOrder((prev) =>
                prev === "ascend" ? null : "ascend"
              );
            }}
          />
          <DownOutlined
            style={{
              cursor: "pointer",
              color:
                metricSortOrder === "descend" ? "#1677ff" : "rgba(0,0,0,0.35)",
            }}
            onClick={() => {
              setMetricSortOrder((prev) =>
                prev === "descend" ? null : "descend"
              );
            }}
          />
        </Space>
      ),
      key: "metric",
      render: (_: any, record: TableRow, rowIndex: number) => {
        const prev = rowIndex > 0 ? sortedRows[rowIndex - 1] : null;
        const firstOfID = rowIndex === 0 || (prev && prev.id !== record.id);
        if (!firstOfID) {
          return null;
        }
        const metricValue = metricsById[record.id];
        if (chosenParam === "elapsedTime") {
          const totalSec = metricValue;
          const hh = Math.floor(totalSec / 3600);
          const mm = Math.floor((totalSec % 3600) / 60);
          const ss = (totalSec % 60).toFixed(2);
          const hhStr = String(hh).padStart(2, "0");
          const mmStr = String(mm).padStart(2, "0");
          const ssStr = ss.padStart(5, "0");
          return `${hhStr}:${mmStr}:${ssStr}`;
        } else {
          if (chosenParam === "avgPower" || chosenParam === "avgSpeed") {
            return metricValue.toFixed(2);
          } else {
            return metricValue.toFixed(4);
          }
        }
      },
      onCell: (_: any, rowIndex?: number) => {
        if (rowIndex === undefined) return {};
        const record = sortedRows[rowIndex];
        const prev = rowIndex > 0 ? sortedRows[rowIndex - 1] : null;
        const firstOfID = rowIndex === 0 || (prev && prev.id !== record.id);
        if (!firstOfID) return { rowSpan: 0 };
        return { rowSpan: idCounts[record.id] || 1 };
      },
    },
    {
      title: "Points",
      key: "points",
      width: 120,
      render: (_: any, record: TableRow, rowIndex: number) => {
        const prev = rowIndex > 0 ? sortedRows[rowIndex - 1] : null;
        const firstOfID = rowIndex === 0 || (prev && prev.id !== record.id);
        if (!firstOfID) {
          return null;
        }
        return (
          <InputNumber
            min={0}
            value={pointsMap[record.id] || 0}
            onChange={(val) => {
              setPointsMap((prev) => ({
                ...prev,
                [record.id]: typeof val === "number" ? val : 0,
              }));
            }}  
          />
        );
      },
      onCell: (_: any, rowIndex?: number) => {
        if (rowIndex === undefined) return {};
        const record = sortedRows[rowIndex];
        const prev = rowIndex > 0 ? sortedRows[rowIndex - 1] : null;
        const firstOfID = rowIndex === 0 || (prev && prev.id !== record.id);
        if (!firstOfID) return { rowSpan: 0 };
        return { rowSpan: idCounts[record.id] || 1 };
      },
    },
    {
      title: "Lap",
      dataIndex: "lap",
      key: "lap",
      width: 80,
      sorter: (a: TableRow, b: TableRow) => a.lap - b.lap,
    },
    {
      title: "Used Energy",
      dataIndex: "usedEnergy",
      key: "usedEnergy",
      width: 120,
      sorter: (a: TableRow, b: TableRow) => a.usedEnergy - b.usedEnergy,
      render: (val: number | undefined) =>
        val != null ? val.toFixed(4) : "—",
    },
    {
      title: "Efficiency",
      dataIndex: "efficiency",
      key: "efficiency",
      width: 120,
      sorter: (a: TableRow, b: TableRow) => a.efficiency - b.efficiency,
      render: (val: number | undefined) =>
        val != null ? val.toFixed(4) : "—",
    },
    {
      title: "Shell Efficiency",
      dataIndex: "shellEfficiency",
      key: "shellEfficiency",
      width: 140,
      sorter: (a: TableRow, b: TableRow) =>
        a.shellEfficiency - b.shellEfficiency,
      render: (val: number | undefined) =>
        val != null ? val.toFixed(4) : "—",
    },
    {
      title: "Avg Power",
      dataIndex: "avgPower",
      key: "avgPower",
      width: 120,
      sorter: (a: TableRow, b: TableRow) => a.avgPower - b.avgPower,
      render: (val: number | undefined) =>
        val != null ? val.toFixed(2) : "—",
    },
    {
      title: "Avg Speed",
      dataIndex: "avgSpeed",
      key: "avgSpeed",
      width: 120,
      sorter: (a: TableRow, b: TableRow) => a.avgSpeed - b.avgSpeed,
      render: (val: number | undefined) =>
        val != null ? val.toFixed(2) : "—",
    },
    {
      title: "Elapsed Time",
      dataIndex: "elapsedTime",
      key: "elapsedTime",
      width: 140,
      render: (val: string | undefined) => val || "—",
    },
  ];

  // ─────────────────────────────────────────────────────
  // Section C:

  const deletePointsForRace = async (raceName: string) => {
    try {
      const res = await fetch(ENDPOINT_POINTS, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ RaceName: raceName }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      message.success(`Points for "${raceName}" deleted.`);
    } catch (err: any) {
      message.error("Failed to delete points: " + err.message);
    }
  };

  const resetLeaderboard = async () => {
    try {
      const res = await fetch(ENDPOINT_POINTS, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      message.success("Leaderboard relative position reset.");
    } catch (err: any) {
      message.error("Failed to reset leaderboard: " + err.message);
    }
  };

  // ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 w-full p-4 bg-white/20 backdrop-blur text-xl font-bold text-center text-white z-10">
        🏆 Race Results &amp; Points
      </header>

      <div className="flex flex-1 mt-16 p-8 gap-x-12">
        <div className="p-4">
          <MainMenu />
        </div>

        <div className="flex flex-col gap-y-6 w-[900px]">
          {/* ─────────────────────────────────────────────────────
               SECTION A: Results & Points
             ───────────────────────────────────────────────────── */}
          <h2 className="text-white text-xl font-semibold">
            Select a Race to View Results &amp; Assign Points
          </h2>

          <Select
            placeholder="Choose a race..."
            style={{ width: 300 }}
            value={selectedRace || undefined}
            onChange={(val: string) => setSelectedRace(val)}
            loading={raceNames.length === 0}
          >
            {raceNames.map((rn) => (
              <Option key={rn} value={rn}>
                {rn}
              </Option>
            ))}
          </Select>

          {selectedRace && (
            <Space style={{ marginTop: 16 }} wrap>
              <span style={{ color: "#fff", fontWeight: "bold" }}>
                Sort by:
              </span>
              <Select
                size="small"
                style={{ width: 140 }}
                value={chosenParam}
                onChange={(val) =>
                  setChosenParam(
                    val as
                      | "usedEnergy"
                      | "efficiency"
                      | "shellEfficiency"
                      | "avgPower"
                      | "avgSpeed"
                      | "elapsedTime"
                  )
                }
                options={[
                  { label: "Used Energy", value: "usedEnergy" },
                  { label: "Efficiency", value: "efficiency" },
                  { label: "Shell Eff", value: "shellEfficiency" },
                  { label: "Avg Power", value: "avgPower" },
                  { label: "Avg Speed", value: "avgSpeed" },
                  { label: "Elapsed Time", value: "elapsedTime" },
                ]}
              />
              <Select
                size="small"
                style={{ width: 80 }}
                value={aggType}
                onChange={(val) => setAggType(val as "min" | "max")}
                options={[
                  { label: "Min", value: "min" },
                  { label: "Max", value: "max" },
                ]}
              />

              <span style={{ color: "#fff", fontWeight: "bold" }}>
                Coefficient:
              </span>
              <InputNumber
                min={1}
                value={coefficient}
                onChange={(val) =>
                  setCoefficient(typeof val === "number" ? val : 1)
                }
              />

              <Button type="default" onClick={suggestPoints}>
                Suggest Points
              </Button>
              <Button type="primary" onClick={uploadPoints}>
                Upload Points
              </Button>
            </Space>
          )}

          {selectedRace && loadingResults && (
            <div style={{ marginTop: 32, textAlign: "center" }}>
              <Spin size="large" />
            </div>
          )}

          {selectedRace && !loadingResults && (
            <div style={{ marginTop: 16 }}>
              <Table<TableRow>
                dataSource={sortedRows}
                columns={columns}
                rowKey="key"
                pagination={false}
                size="middle"
                scroll={{ x: "max-content" }}
              />
            </div>
          )}

          {!selectedRace && (
            <div className="text-gray-300 italic" style={{ marginTop: 12 }}>
              Please select a race from the dropdown above to view results.
            </div>
          )}

          <Divider />

          {/* ─────────────────────────────────────────────────────
               SECTION B: Manual Points Entry (table of all competitors)
             ───────────────────────────────────────────────────── */}
          <h2 className="text-white text-xl font-semibold">
            Manual Points Entry
          </h2>

          {/* Race Name input */}
          <Space style={{ marginBottom: 12 }}>
            <Input
              placeholder="Race Name"
              style={{ width: 200 }}
              value={manualRaceName}
              onChange={(e) => setManualRaceName(e.target.value)}
            />
            <Button
              type="primary"
              onClick={async () => {
                if (!manualRaceName.trim()) {
                  message.error("Please enter a race name.");
                  return;
                }
                // Build payload with every competitor
                const payload = {
                  RaceName: manualRaceName.trim(),
                  Points: competitors.map((comp) => ({
                    ID: comp.id,
                    Points: manualPointsMap[comp.id] || 0,
                  })),
                };
                try {
                  const res = await fetch(ENDPOINT_POINTS, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  if (!res.ok) throw new Error(`HTTP ${res.status}`);
                  message.success("Manual points submitted successfully.");
                  setManualRaceName("");
                  setManualPointsMap({});
                } catch (err: any) {
                  message.error("Failed to submit manual points: " + err.message);
                  console.log("Payload:", payload);
                }
              }}
            >
              Submit Manual Entries
            </Button>
          </Space>

          {/* Competitors table with Points column */}
          <Table<Competitor>
            dataSource={competitors}
            rowKey="id"
            pagination={false}
            size="middle"
            scroll={{ x: "max-content" }}
          >
            <Table.Column<Competitor>
              title="ID"
              dataIndex="id"
              key="id"
              width={80}
            />
            <Table.Column<Competitor>
              title="Username"
              key="username"
              render={(_, rec) => (
                <span style={{ display: "flex", alignItems: "center" }}>
                  <Avatar
                    src={rec.avatar}
                    size={32}
                    style={{ marginRight: 8 }}
                  />
                  <span>{rec.username}</span>
                </span>
              )}
            />
            <Table.Column<Competitor>
              title="Points"
              key="points"
              width={120}
              render={(_, rec) => (
                <InputNumber
                  min={0}
                  value={manualPointsMap[rec.id] || 0}
                  onChange={(val) => {
                    setManualPointsMap((prev) => ({
                      ...prev,
                      [rec.id]: typeof val === "number" ? val : 0,
                    }));
                  }}
                />
              )}
            />
          </Table>

          <Divider />

          {/* ─────────────────────────────────────────────────────
               SECTION C: Delete Points & Reset Leaderboard
             ───────────────────────────────────────────────────── */}
          <h2 className="text-white text-xl font-semibold">
            Delete Points by Race
          </h2>
          <Space align="center" style={{ marginBottom: 16 }}>
            <Input
              placeholder="Race name to delete"
              style={{ width: 200 }}
              id="delete-race-input"
              onPressEnter={(e) => {
                const val = (e.target as HTMLInputElement).value.trim();
                if (val) {
                  deletePointsForRace(val);
                  (e.target as HTMLInputElement).value = "";
                }
              }}
            />
            <Button
              danger
              onClick={() => {
                const input = document.getElementById(
                  "delete-race-input"
                ) as HTMLInputElement;
                const val = input?.value.trim();
                if (val) {
                  deletePointsForRace(val);
                  input.value = "";
                } else {
                  message.error("Please enter a race name to delete.");
                }
              }}
            >
              Delete Points for that Race
            </Button>
          </Space>

          <Divider />

          <h2 className="text-white text-xl font-semibold">
            Reset Leaderboard
          </h2>
          <Button danger onClick={resetLeaderboard}>
            Reset Leaderboard Relative Position
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Points;
