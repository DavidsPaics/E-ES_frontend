// src/pages/ResultsPage.tsx
import React, { useEffect, useState } from "react";
import { Table, Select, Spin, Alert, Avatar } from "antd";
import type { TableProps } from "antd";
import { ENDPOINT_RACE_CONFIG, ENDPOINT_RESULTS } from "@/webapp/config/endpoints";
import { apiFetch } from "@/webapp/utils/api";
import { fakeRaceConfigs, fakeResultsByRace } from "@/webapp/data/fakeData";
import { useTranslation } from 'react-i18next';

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

const ResultsPage: React.FC = () => {
  const { t } = useTranslation();
  const [races, setRaces]           = useState<string[]>([]);
  const [selectedRace, setSelectedRace] = useState<string>();
  const [data, setData]             = useState<ApiResultEntry[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error]           = useState<string>();

  // Load race names
  useEffect(() => {
    apiFetch(ENDPOINT_RACE_CONFIG)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ApiRaceConfig[]>;
      })
      .then(cfgs => setRaces(cfgs.map(c => c.RaceName)))
      .catch(() => {
        // Use fake data
        console.log("Using fake race configs");
        setRaces(fakeRaceConfigs.map(c => c.RaceName));
      });
  }, []);

  // Load results when race changes
  useEffect(() => {
    if (!selectedRace) {
      setData([]);
      return;
    }
    setLoading(true);
    apiFetch(`${ENDPOINT_RESULTS}/${encodeURIComponent(selectedRace)}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ApiResultEntry[]>;
      })
      .then(json => setData(json))
      .catch(() => {
        // Use fake data
        console.log("Using fake results data");
        const fakeResults = fakeResultsByRace[selectedRace] || [];
        setData(fakeResults as ApiResultEntry[]);
      })
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
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">{t('results.header')}</h1>
      <div className="flex-1">
          {/* Race selector */}
          <div className="mb-4 flex items-center gap-4">
            <span className="text-white text-lg">{t('results.chooseRace')}</span>
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
          <div className="bg-[#36598B]/30 backdrop-blur-md p-4 rounded-xl shadow-lg overflow-x-auto">
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
  );
};

export default ResultsPage;
