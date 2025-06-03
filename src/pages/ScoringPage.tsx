// src/pages/ScoringRace.tsx
import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Select,
  Modal,
  Input,
  Form,
  message,
  Avatar,
} from "antd";
import MainMenu from "@/components/menu";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import '@ant-design/v5-patch-for-react-19';

type Competitor = {
  id: number;
  username: string;
  avatar?: string;
  finishedAt?: string;
};

const GET_COMPETITORS = "https://izv.svaza.lv/api/parameters";
const POST_COMPETITORS = "https://izv.svaza.lv/api/parameters";
const GET_RACES = "https://dummyjson.com/c/0ed1-4826-4920-9b90";
const POST_START_RACE = "https://dummyjson.com/c/2fa2-d909-402e-8ea2";
const POST_FINISH = "https://dummyjson.com/c/151b-a42c-4383-8b61";
const POST_END_RACE = "https://dummyjson.com/c/08e3-faaa-400d-8cd2";

const ScoringRace: React.FC = () => {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [races, setRaces] = useState<string[]>([]);
  const [selectedRace, setSelectedRace] = useState<string>();
  const [raceStarted, setRaceStarted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState("00:00:00.00");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<number | null>(null);

  const [addVisible, setAddVisible] = useState(false);
  const [addForm] = Form.useForm<{ username: string }>();

  const navigate = useNavigate();

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

  // fetch races
  const fetchRaces = async () => {
    try {
      const res = await fetch(GET_RACES);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = (await res.json()) as { RaceName: string }[];
      setRaces(raw.map(r => r.RaceName).filter(r => !!r));
    } catch (err: any) {
      message.error("Failed to load races: " + err.message);
    }
  };

  // save competitors
  const handleUpdate = async () => {
    try {
      const payload = competitors.map(({ id, username, avatar }) => ({
        id,
        username,
        avatar,
      }));
      const res = await fetch(POST_COMPETITORS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      message.success("Data saved");
    } catch (err: any) {
      message.error("Save failed: " + err.message);
    }
  };

  useEffect(() => {
    fetchCompetitors();
    fetchRaces();
  }, []);

  // live timer
  useEffect(() => {
    let t: NodeJS.Timeout;
    if (raceStarted && startTime) {
      t = setInterval(() => {
        const diff = dayjs().diff(startTime);
        const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
        const cs = String(Math.floor((diff % 1000) / 10)).padStart(2, "0");
        setElapsed(`${h}:${m}:${s}.${cs}`);
      }, 100);
    }
    return () => clearInterval(t);
  }, [raceStarted, startTime]);

  // handle finish click / confirm
  const handleFinishClick = (id: number) => {
    if (pendingConfirm === id) {
      performFinish(id);
      setPendingConfirm(null);
    } else {
      setPendingConfirm(id);
      setTimeout(() => {
        if (pendingConfirm === id) setPendingConfirm(null);
      }, 3000);
    }
  };

  // perform finish: update state + POST
  const performFinish = async (id: number) => {
    if (!raceStarted || !startTime) return;
    // update locally
    setCompetitors(prev =>
      prev.map(c =>
        c.id === id && !c.finishedAt
          ? {
              ...c,
              finishedAt: (() => {
                const diff = dayjs().diff(startTime);
                const mm = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
                const ss = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
                const cs = String(Math.floor((diff % 1000) / 10)).padStart(2, "0");
                return `${mm}:${ss}.${cs}`;
              })(),
            }
          : c
      )
    );
    // POST finish
    try {
      const payload = { ID: id };
      const res = await fetch(POST_FINISH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Finish failed (${res.status})`);
      message.success(`Competitor ${id} finish recorded`);
    } catch (e: any) {
      message.error("Finish post failed: " + e.message);
    }
  };

  // confirm start: just set countdown
  const confirmStart = () => {
    if (!selectedRace) return message.warning("Select a race");
    Modal.confirm({ title: `Start "${selectedRace}"?`, onOk: () => setCountdown(3) });
  };

  // countdown → POST start → local start
  useEffect(() => {
    if (countdown == null) return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
    (async () => {
      try {
        const payload = { raceName: selectedRace };
        const res = await fetch(POST_START_RACE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Start failed (${res.status})`);
        message.success(`Start posted`);
      } catch (e: any) {
        message.error("Start post failed: " + e.message);
      }
      // then local
      setCountdown(null);
      setRaceStarted(true);
      setStartTime(new Date());
      setCompetitors(prev => prev.map(c => ({ ...c, finishedAt: undefined })));
    })();
  }, [countdown, selectedRace]);

  // handle end: POST then stop
  const handleEnd = async () => {
    if (!selectedRace) return;
    try {
      const payload = { raceName: selectedRace };
      const res = await fetch(POST_END_RACE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`End failed (${res.status})`);
      message.success(`End posted`);
    } catch (e: any) {
      message.error("End post failed: " + e.message);
    }
    setRaceStarted(false);
  };

  // add competitor
  const handleAddOk = () => {
    addForm.validateFields().then(vals => {
      const nextId = Math.max(0, ...competitors.map(c => c.id)) + 1;
      setCompetitors(prev => [...prev, { id: nextId, username: vals.username }]);
      addForm.resetFields();
      setAddVisible(false);
    });
  };

  // table columns (Avatar displayed without dropdown)
  const tableColumns = [
    {
      title: "Avatar",
      dataIndex: "avatar",
      key: "avatar",
      width: 64,
      render: (_: any, rec: Competitor) => (
        <Avatar src={rec.avatar} size={48} />
      ),
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
      title: "Action",
      key: "action",
      width: 140,
      align: "center" as const,
      render: (_: any, rec: Competitor) => {
        const isPending = pendingConfirm === rec.id;
        const label = rec.finishedAt
          ? `Finished ${rec.finishedAt}`
          : isPending
            ? "Confirm Finish"
            : "FINISH";
        return (
          <Button
            type={isPending ? "default" : "primary"}
            danger={!isPending}
            disabled={!raceStarted || !!rec.finishedAt}
            onClick={() => handleFinishClick(rec.id)}
          >
            {label}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {countdown != null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <span className="text-white text-9xl">{countdown}</span>
        </div>
      )}

      <header className="fixed top-0 left-0 right-0 w-full p-4 bg-white/20 backdrop-blur text-xl font-bold text-center text-white z-10">
        ⚙️ Braking Test Control Panel
      </header>

      <div className="flex flex-1 mt-16 p-8 gap-x-12">
        <div className="p-4"><MainMenu /></div>

        <div className="flex flex-col gap-y-4 w-[600px]">
          <h2 className="text-white text-xl font-semibold">Competitors</h2>
          <Table
            dataSource={competitors}
            columns={tableColumns}
            rowKey="id"
            pagination={false}
            size="middle"
          />
          <div className="flex gap-4">
            <Button type="primary" onClick={() => setAddVisible(true)}>Add User</Button>
            <Button onClick={handleUpdate}>Update Data</Button>
          </div>
        </div>

        <div className="flex flex-col items-center ml-auto gap-y-4">
          <span className="text-white text-lg">Choose the test session</span>
          <Select<string>
            placeholder="Session name"
            style={{ width: 220 }}
            value={selectedRace}
            onChange={setSelectedRace}
            disabled={raceStarted || countdown != null}
          >
            {races.map(r => (
              <Select.Option key={r} value={r}>{r}</Select.Option>
            ))}
          </Select>
          <Button
            type="primary"
            onClick={confirmStart}
            disabled={!selectedRace || raceStarted || countdown != null}
          >
            START
          </Button>
          <Button danger onClick={handleEnd} disabled={!raceStarted}>
            END SESSION
          </Button>
          <Button onClick={() => navigate("/race-config")}>Configure Session</Button>
          <div className="text-white text-2xl font-bold text-center">
            Time elapsed:<br />{elapsed}
          </div>
        </div>
      </div>

      {/* Add Competitor Modal */}
      <Modal title="Add Competitor" open={addVisible} onOk={handleAddOk} onCancel={() => setAddVisible(false)}>
        <Form layout="vertical" form={addForm}>
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ScoringRace;
