// src/pages/ResultsPage.tsx
import React, { useEffect, useState } from "react";
import { Table, Select, Spin, Alert, Avatar } from "antd";
import type { TableProps } from "antd";
import MainMenu from "@/components/menu";

type ApiRaceConfig = {
  RaceName: string;
  Length: number;
  Coef: number;
  SortBy: string;
  Distribution: number[];
};

type ApiResultEntry = {
  ID: number;
  Username: string;
  avatar: string;
  "Used energy": number;
  "Average power": number;
  "Average speed": number;
  "Elapsed time": string;   // "hh:mm:ss.CS"
  Points: number;
  [key: string]: string | number;
};

const RACE_CONFIG_URL = "https://izv.svaza.lv/api/raceconfiguration";
const RESULTS_URL = (race: string) => `https://izv.svaza.lv/api/results/${encodeURIComponent(race)}`;

const ResultsPage: React.FC = () => {
  const [races, setRaces]           = useState<string[]>([]);
  const [selectedRace, setSelectedRace] = useState<string>();
  const [data, setData]             = useState<ApiResultEntry[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string>();

  // Load race names
  useEffect(() => {
    fetch(RACE_CONFIG_URL)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ApiRaceConfig[]>;
      })
      .then(cfgs => setRaces(cfgs.map(c => c.RaceName)))
      .catch(err => setError(err.message));
  }, []);

  // Load results when race changes
  useEffect(() => {
    if (!selectedRace) {
      setData([]);
      return;
    }
    setLoading(true);
    fetch(RESULTS_URL(selectedRace))
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ApiResultEntry[]>;
      })
      .then(json => setData(json))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedRace]);

  if (error)   return <Alert type="error" message="Error" description={error} />;
  if (loading) return <Spin tip="Loading results…" style={{ margin: 50 }} />;

  // Determine dynamic categories (exclude fixed fields)
  const categories = data[0]
    ? Object.keys(data[0]).filter(
        k => !["ID", "Username", "avatar"].includes(k)
      )
    : [];

  // Build columns: avatar, ID, Username, dynamic categories, Total
  const columns: TableProps<ApiResultEntry>["columns"] = [
    {
      title: "",
      dataIndex: "avatar",
      key: "avatar",
      width: 64,
      render: (src: string) => <Avatar src={src} size={48} />,
    },
    {
      title: "ID",
      dataIndex: "ID",
      key: "ID",
      sorter: (a, b) => Number(a.ID) - Number(b.ID),
    },
    {
      title: "Username",
      dataIndex: "Username",
      key: "Username",
      sorter: (a, b) => String(a.Username).localeCompare(String(b.Username)),
    },
    ...categories.map(cat => ({
      title: cat,
      dataIndex: cat,
      key: cat,
      sorter: (a: ApiResultEntry, b: ApiResultEntry) => Number(a[cat] || 0) - Number(b[cat] || 0),
    })),
    {
      title: "Total Points",
      key: "total",
      defaultSortOrder: "descend" as any,
      sorter: (a, b) =>
        categories.reduce((s, k) => s + Number(a[k] || 0), 0) -
        categories.reduce((s, k) => s + Number(b[k] || 0), 0),
      render: (_: any, rec: ApiResultEntry) =>
        categories.reduce((s, k) => s + Number(rec[k] || 0), 0),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header + Sidebar */}
      <div className="flex">
        <MainMenu />
        <div className="flex-1 p-8">
          {/* Race selector */}
          <div className="mb-4 flex items-center gap-4">
            <span className="text-white text-lg">Choose race:</span>
            <Select
              placeholder="Select a race"
              className="w-56"
              value={selectedRace}
              onChange={setSelectedRace}
            >
              {races.map(r => (
                <Select.Option key={r} value={r}>
                  {r}
                </Select.Option>
              ))}
            </Select>
          </div>
          {/* Results table */}
          <div className="bg-white/30 backdrop-blur-md p-4 rounded-xl shadow-lg overflow-x-auto">
            <Table
              dataSource={data}
              columns={columns}
              rowKey="ID"
              pagination={false}
              size="middle"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
