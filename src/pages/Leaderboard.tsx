// src/pages/Leaderboard.tsx
import React, { useEffect, useState } from "react";
import { Table, Spin, Alert, Avatar, Button } from "antd";
import { FullscreenExitOutlined, FullscreenOutlined } from "@ant-design/icons";
import type { SortOrder } from "antd/es/table/interface";
import type { TableProps } from "antd";
import MainMenu from "@/components/menu";

type ApiRecord = {
  ID: number;
  username: string;
  avatar: string;
  "Category names": string[];
  "Category points": number[];
};

type LeaderboardEntry = {
  ID: number;
  avatar?: string;
  username: string;
  [category: string]: number | string | undefined;
};

const GET_LEADERBOARD = "https://dummyjson.com/c/e578-a7f4-4f12-9c55"; // your endpoint

const Leaderboard: React.FC = () => {
  const [data, setData]           = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [expanded, setExpanded]   = useState(false);

  // fetch data
  const fetchData = () => {
    setLoading(true);
    fetch(GET_LEADERBOARD)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ApiRecord[]>;
      })
      .then(raw => {
        const entries = raw.map(rec => {
          const entry: LeaderboardEntry = {
            ID: rec.ID,
            avatar: rec.avatar,
            username: rec.username,
          };
          rec["Category names"].forEach((cat, i) => {
            entry[cat] = rec["Category points"][i];
          });
          return entry;
        });
        setData(entries);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <Spin tip="Loading…" style={{ margin: 50 }} />;
  if (error)   return <Alert type="error" message="Error" description={error} />;

  const categories = data[0]
    ? Object.keys(data[0]).filter(k => !["ID","username","avatar"].includes(k))
    : [];

  const columns: TableProps<LeaderboardEntry>["columns"] = [
    {
      title: "ID",
      dataIndex: "ID",
      key: "ID",
      sorter: (a, b) => a.ID - b.ID,
      width: 60,
    },
    {
      title: "",
      dataIndex: "avatar",
      key: "avatar",
      width: 60,
      render: src => <Avatar src={src} size="large" />,
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      sorter: (a, b) => String(a.username).localeCompare(String(b.username)),
    },
    ...categories.map(cat => ({
      title: cat,
      dataIndex: cat,
      key: cat,
      sorter: (a: { [x: string]: any; }, b: { [x: string]: any; }) => Number(a[cat] || 0) - Number(b[cat] || 0),
    })),
    {
      title: "Total Points",
      key: "total",
      defaultSortOrder: "descend" as SortOrder,
      sorter: (a, b) =>
        categories.reduce((s, k) => s + Number(a[k] || 0), 0) -
        categories.reduce((s, k) => s + Number(b[k] || 0), 0),
      render: (_,_rec) =>
        categories.reduce((s, k) => s + Number(_rec[k] || 0), 0),
    },
  ];

  // Fullscreen table overlay
  if (expanded) {
    return (
<div className="min-h-screen flex-1 flex-col pb-32 fixed inset-1 overflow-auto">
  <div className="flex justify-end mb-2">
    <Button
      icon={<FullscreenExitOutlined />}
      onClick={() => setExpanded(false)}
      style={{ background: "transparent", border: "none" }}
    />
  </div>

  <Table<LeaderboardEntry>
    dataSource={data}
    columns={columns}
    rowKey="ID"
    pagination={false}
    size="middle"
    scroll={{ y: '100%' }}
  />
</div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-8">
      {/* Header */}
      <header
        className="fixed text-center top-0 left-0 right-0 w-full p-4 bg-white/20 backdrop-blur-md shadow-md flex items-center justify-center text-xl font-bold text-white z-10"
      >
        🏆 Leaderboard
        
      </header>

      {/* Sidebar & Table */}
      <div className="flex mt-16">
        <div className="p-4">
          <MainMenu />
        </div>
        <div className="flex-1 p-4">
          <div className="bg-white/30 backdrop-blur-md p-6 rounded-xl shadow-lg ">
            <Table<LeaderboardEntry>
              dataSource={data}
              columns={columns}
              rowKey="ID"
              pagination={false}
              size="middle"
            />
            <div className="absolute right-0 top-0">
              <Button
            icon={<FullscreenOutlined />}
            onClick={() => setExpanded(true)}
            style={{ background: "transparent", border: "none" }}
              >
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Leaderboard;
