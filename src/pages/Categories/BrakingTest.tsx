// src/pages/BrakingTest.tsx
import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Select,
  message,
  Avatar,
} from "antd";
import MainMenu from "@/components/menu";
import dayjs from "dayjs";
import '@ant-design/v5-patch-for-react-19';

type Competitor = {
  id: number;
  username: string;
  avatar?: string;
  startedAt?: string;   // ISO timestamp when this competitor’s timer was started
  finishedAt?: string;  // “MM:SS.CS” string when competitor finished
};

const GET_COMPETITORS = "https://izv.svaza.lv/api/parameters";
const POST_START_RACE = "https://dummyjson.com/c/0399-50b0-471f-904b";
const POST_FINISH = "https://dummyjson.com/c/08e3-faaa-400d-8cd2";

const BrakingTest: React.FC = () => {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [races] = useState<string[]>(["1", "2", "3"]);
  const [selectedLap, setSelectedLap] = useState<string>();
  const [pendingStart, setPendingStart] = useState<number | null>(null);
  const [pendingFinish, setPendingFinish] = useState<number | null>(null);
  const [tick, setTick] = useState(Date.now());

  // fetch competitors
  const fetchCompetitors = async () => {
    try {
      const res = await fetch(GET_COMPETITORS);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCompetitors((await res.json()) as Competitor[]);
    } catch (err: any) {
      message.error("Failed to load competitors: " + err.message);
    }
  };

  useEffect(() => {
    fetchCompetitors();
  }, []);

  // update tick for per-competitor timers
  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 100);
    return () => clearInterval(timer);
  }, []);

  // handle competitor start (with confirmation)
  const handleStartClick = (id: number) => {
    if (pendingStart === id) {
      performStart(id);
      setPendingStart(null);
    } else {
      setPendingStart(id);
      setTimeout(() => {
        if (pendingStart === id) setPendingStart(null);
      }, 3000);
    }
  };

  const performStart = async (id: number) => {
    // update locally
    setCompetitors(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, startedAt: new Date().toISOString(), finishedAt: undefined }
          : c
      )
    );
    message.success(`Competitor ${id} timer started`);

    // POST start with { raceName, ID }
    if (!selectedLap) {
      message.error("No lap selected for POST");
      return;
    }
    const raceName = `BrakingTest${selectedLap}`;
    try {
      const payload = { raceName, ID: id };
      const res = await fetch(POST_START_RACE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Start failed (${res.status})`);
      message.success(`Start posted for competitor ${payload.ID}`);
    } catch (e: any) {
      message.error("Start post failed: " + e.message);
    }
  };

  // handle competitor finish (with confirmation)
  const handleFinishClick = (id: number) => {
    if (pendingFinish === id) {
      performFinish(id);
      setPendingFinish(null);
    } else {
      setPendingFinish(id);
      setTimeout(() => {
        if (pendingFinish === id) setPendingFinish(null);
      }, 3000);
    }
  };

  const performFinish = async (id: number) => {
    const competitor = competitors.find(c => c.id === id);
    if (!competitor?.startedAt) return;
    const startTime = dayjs(competitor.startedAt);
    const diff = dayjs().diff(startTime);
    const mm = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
    const ss = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
    const cs = String(Math.floor((diff % 1000) / 10)).padStart(2, "0");
    const finishString = `${mm}:${ss}.${cs}`;

    // update locally
    setCompetitors(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, finishedAt: finishString }
          : c
      )
    );

    // POST finish with { raceName, ID }
    if (!selectedLap) {
      message.error("No lap selected for POST");
      return;
    }

    try {
      const payload = {ID: id };
      const res = await fetch(POST_FINISH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Finish failed (${res.status})`);
      message.success(`Finish posted for competitor ${id}`);
    } catch (e: any) {
      message.error("Finish post failed: " + e.message);
    }
  };

  // table columns, including per-competitor timer
  const tableColumns = [
    {
      title: "Avatar",
      dataIndex: "avatar",
      key: "avatar",
      width: 64,
      render: (_: any, rec: Competitor) => <Avatar src={rec.avatar} size={48} />,
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      sorter: (a: Competitor, b: Competitor) => a.username.localeCompare(b.username),
    },
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      sorter: (a: Competitor, b: Competitor) => a.id - b.id,
    },
    {
      title: "Time",
      key: "time",
      width: 120,
      render: (_: any, rec: Competitor) => {
        if (rec.finishedAt) {
          return <span style={{ color: "#40a9ff", fontWeight: "bold" }}>{rec.finishedAt}</span>;
        }
        if (rec.startedAt) {
          const elapsedMs = dayjs(tick).diff(dayjs(rec.startedAt));
          const mm = String(Math.floor((elapsedMs % 3600000) / 60000)).padStart(2, "0");
          const ss = String(Math.floor((elapsedMs % 60000) / 1000)).padStart(2, "0");
          const cs = String(Math.floor((elapsedMs % 1000) / 10)).padStart(2, "0");
          return `${mm}:${ss}.${cs}`;
        }
        return "--:--.--";
      },
    },
    {
      title: "Action",
      key: "action",
      width: 180,
      align: "center" as const,
      render: (_: any, rec: Competitor) => {
        if (rec.finishedAt) {
          // Completed
          return <span style={{ color: "#40a9ff", fontWeight: "bold" }}>Finished</span>;
        }
        if (rec.startedAt) {
          // Show finish button with confirmation
          const isPending = pendingFinish === rec.id;
          const label = isPending ? "Confirm Finish" : "FINISH";
          return (
            <Button
              type={isPending ? "default" : "primary"}
              danger={!isPending}
              onClick={() => handleFinishClick(rec.id)}
            >
              {label}
            </Button>
          );
        }
        // Show start button with confirmation
        const isPendingStart = pendingStart === rec.id;
        const startLabel = isPendingStart ? "Confirm Start" : "START";
        return (
          <Button
            type={isPendingStart ? "default" : "primary"}
            onClick={() => handleStartClick(rec.id)}
            disabled={!selectedLap}
          >
            {startLabel}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 w-full p-4 bg-white/20 backdrop-blur text-xl font-bold text-center text-white z-10">
        ⚙️ Braking Test Control Panel
      </header>

      <div className="flex flex-1 mt-16 p-8 gap-x-12">
        <div className="p-4">
          <MainMenu />
        </div>

        <div className="flex flex-col gap-y-4 w-[600px]">
          <h2 className="text-white text-xl font-semibold">Competitors</h2>
          <Table
            dataSource={competitors}
            columns={tableColumns}
            rowKey="id"
            pagination={false}
            size="middle"
          />
        </div>

        <div className="flex flex-col items-center ml-auto gap-y-4">
          <span className="text-white text-lg">Choose the lap</span>
          <Select<string>
            placeholder="Lap"
            style={{ width: 220 }}
            value={selectedLap}
            onChange={setSelectedLap}
          >
            {races.map(r => (
              <Select.Option key={r} value={r}>
                {r}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
};

export default BrakingTest;
