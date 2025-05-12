// src/pages/AdminPanel.tsx
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
  Dropdown,
  Upload,
  type MenuProps,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import MainMenu from "@/components/menu";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import '@ant-design/v5-patch-for-react-19';

type ApiRaceConfig = {
  RaceName: string;
  Length: number;
  Coef: number;
  SortBy: string;
  Distribution: number[];
};

type CompetitorBase = {
  id: number;
  username: string;
  U: number;
  I: number;
  m: number;
  avatar?: string;
};
type Competitor = CompetitorBase & { finishedAt?: string };

const GET_COMPETITORS = "https://dummyjson.com/c/b6c3-8fa1-416b-9d7b";
const POST_COMPETITORS = "https://dummyjson.com/c/ee3d-a8c5-49b9-b8e5";
const GET_RACES = "https://dummyjson.com/c/0ed1-4826-4920-9b90";
const UPLOAD_AVATAR  = "https://dummyjson.com/c/cd9f-e481-489e-9d62";
const POST_START_RACE    = "https://dummyjson.com/c/2fa2-d909-402e-8ea2";

const POST_FINISH       = "https://dummyjson.com/c/151b-a42c-4383-8b61";
const POST_END_RACE     = "https://dummyjson.com/c/08e3-faaa-400d-8cd2";

async function uploadAvatar(file: File): Promise<string> {
  const form = new FormData();
  form.append("avatar", file);
  const res = await fetch(UPLOAD_AVATAR, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  const { avatarUrl } = (await res.json()) as { avatarUrl: string };
  return avatarUrl;
}

const AdminPanel: React.FC = () => {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [races, setRaces]             = useState<string[]>([]);
  const [selectedRace, setSelectedRace] = useState<string>();
  const [raceStarted, setRaceStarted]   = useState(false);
  const [startTime, setStartTime]       = useState<Date | null>(null);
  const [elapsed, setElapsed]           = useState("00:00:00.00");
  const [countdown, setCountdown]       = useState<number | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<number | null>(null);

  const [addVisible, setAddVisible]   = useState(false);
  const [addForm]   = Form.useForm<CompetitorBase>();

  const [editVisible, setEditVisible] = useState(false);
  const [editing, setEditing]         = useState<Competitor | null>(null);
  const [editForm] = Form.useForm<CompetitorBase>();

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
      const raw = (await res.json()) as ApiRaceConfig[];
      setRaces(raw.map(r => r.RaceName).filter(r => !!r));
    } catch (err: any) {
      message.error("Failed to load races: " + err.message);
    }
  };

  // save competitors
  const handleUpdate = async () => {
    try {
      const payload = competitors.map(({ id, username, U, I, m, avatar }) => ({
        id, username, U, I, m, avatar
      }));
      console.log("POST competitors payload:", payload);
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
                const mm = String(Math.floor((diff%3600000)/60000)).padStart(2,"0");
                const ss = String(Math.floor((diff%60000)/1000)).padStart(2,"0");
                const cs = String(Math.floor((diff%1000)/10)).padStart(2,"0");
                return `${mm}:${ss}.${cs}`;
              })(),
            }
          : c
      )
    );
    // POST finish
    try {
      const payload = { ID: id };
      console.log("POST finish payload:", payload);
      const res = await fetch(POST_FINISH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Finish failed (${res.status})`);
      message.success(`Competitor ${id} finished posted`);
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
        console.log("POST start payload:", payload);
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
      console.log("POST end payload:", payload);
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
      setCompetitors(prev => [...prev, { ...vals, id: nextId }]);
      addForm.resetFields();
      setAddVisible(false);
    });
  };

  // edit competitor + delete
  const handleEditOk = () => {
    editForm.validateFields().then(vals => {
      setCompetitors(prev =>
        prev.map(c => c.id === editing?.id ? { ...c, ...vals } : c)
      );
      setEditVisible(false);
    });
  };
  const handleDelete = (id: number) => {
    console.log("Deleting competitor:", id);
    setCompetitors(prev => prev.filter(c => c.id !== id));
    setEditVisible(false);
  };

  // avatar menu
  const avatarMenuItems = (rec: Competitor): MenuProps["items"] => [
    {
      key: "edit",
      label: "Edit…",
      onClick: () => {
        setEditing(rec);
        editForm.setFieldsValue(rec);
        setEditVisible(true);
      },
    },
    {
      key: "upload",
      label: (
        <Upload
          showUploadList={false}
          customRequest={async ({ file, onSuccess, onError }) => {
            try {
              const url = await uploadAvatar(file as File);
              console.log("Uploaded avatar URL:", url);
              setCompetitors(prev =>
                prev.map(c => c.id === rec.id ? { ...c, avatar: url } : c)
              );
              onSuccess?.({}, new XMLHttpRequest());
            } catch (e: any) {
              message.error("Upload failed: " + e.message);
              onError?.(e);
            }
          }}
        >
          <span><UploadOutlined /> Upload Photo…</span>
        </Upload>
      ),
    },
  ];

  // table columns
  const tableColumns = [
    {
      title: "Avatar",
      dataIndex: "avatar",
      key: "avatar",
      width: 64,
      render: (_: any, rec: Competitor) => (
        <Dropdown menu={{ items: avatarMenuItems(rec) }} trigger={["click"]}>
          <Avatar src={rec.avatar} size={48} style={{ cursor: "pointer" }} />
        </Dropdown>
      ),
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      sorter: (a: { username: string; }, b: { username: any; }) => a.username.localeCompare(b.username),
    },
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      sorter: (a: { id: number; }, b: { id: number; }) => a.id - b.id,
    },
    { title: "U", dataIndex: "U", key: "U", width: 60 },
    { title: "I", dataIndex: "I", key: "I", width: 60 },
    { title: "m", dataIndex: "m", key: "m", width: 60 },
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
        ⚙️ Admin Panel
      </header>

      <div className="flex flex-1 mt-16 p-8 gap-x-12">
        <div className="p-4"><MainMenu /></div>

        <div className="flex flex-col gap-y-4 w-[600px]">
          <h2 className="text-white text-xl font-semibold">Parameters</h2>
          <Table
            dataSource={competitors}
            columns={tableColumns}
            rowKey="id"
            pagination={false}
            size="middle"
          />
          <div className="flex gap-4">
            <Button type="primary" onClick={() => setAddVisible(true)}>Add user</Button>
            <Button onClick={handleUpdate}>Update data</Button>
          </div>
        </div>

        <div className="flex flex-col items-center ml-auto gap-y-4">
          <span className="text-white text-lg">Choose the race</span>
          <Select<string>
            placeholder="Race name"
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
            END RACE
          </Button>
          <Button onClick={() => navigate("/race-config")}>Configure Race</Button>
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
          <Form.Item name="U" label="U" initialValue={0}>
            <Input type="number" step="0.01" />
          </Form.Item>
          <Form.Item name="I" label="I" initialValue={0}>
            <Input type="number" step="0.001" />
          </Form.Item>
          <Form.Item name="m" label="m" initialValue={0}>
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Competitor Modal */}
      <Modal
        title="Edit Competitor"
        open={editVisible}
        onOk={handleEditOk}
        onCancel={() => setEditVisible(false)}
        footer={[
          <Button key="delete" danger onClick={() => handleDelete(editing!.id)}>
            Delete User
          </Button>,
          <Button key="cancel" onClick={() => setEditVisible(false)}>
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={handleEditOk}>
            Save
          </Button>,
        ]}
      >
        <Form layout="vertical" form={editForm}>
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="U" label="U" initialValue={0}>
            <Input type="number" step="0.01" />
          </Form.Item>
          <Form.Item name="I" label="I" initialValue={0}>
            <Input type="number" step="0.001" />
          </Form.Item>
          <Form.Item name="m" label="m" initialValue={0}>
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminPanel;
