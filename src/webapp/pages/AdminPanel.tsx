// src/pages/AdminPanel.tsx

import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Popconfirm,
  Input,
  InputNumber,
  Form,
  Select,
  message,
  Avatar,
  Dropdown,
  type MenuProps,
} from "antd";
import '@ant-design/v5-patch-for-react-19';
import {
  ENDPOINT_COMPETITORS,
  ENDPOINT_ADMIN_SETTINGS,
  ENDPOINT_ADMIN_DELETE,
  ENDPOINT_TEAM_APPLICATIONS,
} from "@/webapp/config/endpoints";
import { apiFetch } from "@/webapp/utils/api";
import { fakeCompetitors, fakeAdminSettings } from "@/webapp/data/fakeData";
import { useTranslation } from 'react-i18next';

type CompetitorBase = {
  id: number;
  username: string;
  U: number;
  I: number;
  m: number;
  ageGroup: string;
  avatar?: string;
};
type Competitor = CompetitorBase & { finishedAt?: string };
type TeamOption = {
  value: string;
  label: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function firstNonEmpty(values: unknown[], fallback = ""): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return fallback;
}

function firstNumber(values: unknown[], fallback = 0): number {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

function getArrayPayloadItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];

  for (const key of ["data", "teams", "applications", "teamApplications", "cars", "competitors"]) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
  }

  return [];
}

function normalizeTeamOption(value: unknown): TeamOption | null {
  if (!isRecord(value)) return null;
  const data = isRecord(value.dati) ? value.dati : value;

  const teamName = firstNonEmpty([
    value.teamName,
    value.komandasNosaukums,
    value.team,
    value.name,
    isRecord(value.team) ? value.team.name : undefined,
    data.teamName,
    data.komandasNosaukums,
    data.name,
  ]);
  if (!teamName) return null;

  return {
    value: teamName,
    label: teamName,
  };
}

function normalizeCompetitor(value: unknown, index: number): Competitor | null {
  if (!isRecord(value)) return null;

  const id = firstNumber([value.id, value.ID, value.car_id, value.carId], index + 1);
  const username = firstNonEmpty(
    [value.username, value.Username, value.teamName, value.team_name, value.team],
    ""
  );
  if (!username) return null;

  return {
    id,
    username,
    U: typeof value.U === "number" ? value.U : 0,
    I: typeof value.I === "number" ? value.I : 0,
    m: typeof value.m === "number" ? value.m : 0,
    ageGroup: firstNonEmpty([value.ageGroup, value.age_group], ""),
    avatar: typeof value.avatar === "string" ? value.avatar : undefined,
  };
}

function normalizeCompetitorsPayload(payload: unknown): Competitor[] {
  return getArrayPayloadItems(payload)
    .map(normalizeCompetitor)
    .filter((item): item is Competitor => item !== null);
}

const AdminPanel: React.FC = () => {
  const { t } = useTranslation();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [addVisible, setAddVisible] = useState(false);
  const [addForm] = Form.useForm<CompetitorBase>();

  const [editVisible, setEditVisible] = useState(false);
  const [editing, setEditing] = useState<Competitor | null>(null);
  const [editForm] = Form.useForm<CompetitorBase>();

  const [powerCoef, setPowerCoef] = useState<number>(0);
  const [maxSpd, setMaxSpd] = useState<number>(0);
  const [fullRaceLength, setFullRaceLength] = useState<number>(0);
  const [dragRaceLength, setDragRaceLength] = useState<number>(0);
  const validTeamNames = new Set(teamOptions.map((option) => option.value.toLowerCase()));

  const validateTeamName = (_: unknown, value?: string) => {
    if (!value || !value.trim()) {
      return Promise.reject(new Error("Please select a team name"));
    }
    if (!validTeamNames.has(value.trim().toLowerCase())) {
      return Promise.reject(new Error("Team name must match an existing team application"));
    }
    return Promise.resolve();
  };

  const fetchCompetitors = async () => {
    try {
      const res = await apiFetch(ENDPOINT_COMPETITORS);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCompetitors(normalizeCompetitorsPayload(await res.json()));
    } catch (err: any) {
      // Use fake data on error
      console.log("Using fake competitors data");
      setCompetitors(fakeCompetitors.map(c => ({
        id: c.id,
        username: c.username,
        U: c.U,
        I: c.I,
        m: c.m,
        ageGroup: c.ageGroup,
        avatar: c.avatar,
      })));
    }
  };

  const fetchTeamOptions = async () => {
    setTeamsLoading(true);
    try {
      const res = await apiFetch(ENDPOINT_TEAM_APPLICATIONS);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const payload: unknown = await res.json();
      const options = getArrayPayloadItems(payload)
        .map(normalizeTeamOption)
        .filter((option): option is TeamOption => option !== null);

      const uniqueOptions = Array.from(
        new Map(options.map((option) => [option.value.toLowerCase(), option])).values()
      ).sort((a, b) => a.label.localeCompare(b.label));

      setTeamOptions(uniqueOptions);
    } catch (err: any) {
      setTeamOptions([]);
      message.error("Failed to load team names: " + err.message);
    } finally {
      setTeamsLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const payload = competitors.map(c => ({
        id: c.id,
        username: c.username,
        U: c.U,
        I: c.I,
        m: c.m,
        ageGroup: c.ageGroup,
        avatar: c.avatar,
      }));
      console.log("POST competitors payload:", payload);
      const res = await apiFetch(ENDPOINT_COMPETITORS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      message.success("Competitor data saved");
    } catch (err: any) {
      message.error("Save failed: " + err.message);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      const payload = {
        PowerCoef: powerCoef,
        MaxSpd: maxSpd,
        FullRaceLength: fullRaceLength,
        DragRaceLength: dragRaceLength,
      };
      console.log("POST settings payload:", payload);
      const res = await apiFetch(ENDPOINT_ADMIN_SETTINGS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      message.success("Global settings updated");
    } catch (err: any) {
      message.error("Update settings failed: " + err.message);
    }
  };

  const handleResetAndSave = async () => {
    try {
      const res = await apiFetch(ENDPOINT_ADMIN_DELETE, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      message.success("Database reset and saved");
      fetchCompetitors();
    } catch (err: any) {
      message.error("Reset failed: " + err.message);
    }
  };

  useEffect(() => {
    fetchCompetitors();
    fetchTeamOptions();
    // Fetch global settings
    apiFetch(ENDPOINT_ADMIN_SETTINGS)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setPowerCoef(data.PowerCoef ?? 0);
        setMaxSpd(data.MaxSpd ?? 0);
        setFullRaceLength(data.FullRaceLength ?? 0);
        setDragRaceLength(data.DragRaceLength ?? 0);
      })
      .catch(() => {
        // Use fake settings
        console.log("Using fake admin settings");
        setPowerCoef(fakeAdminSettings.PowerCoef);
        setMaxSpd(fakeAdminSettings.MaxSpd);
        setFullRaceLength(fakeAdminSettings.FullRaceLength);
        setDragRaceLength(fakeAdminSettings.DragRaceLength);
      });
  }, []);

  const handleAddOk = () => {
    addForm.validateFields().then(vals => {
      setCompetitors(prev => [...(Array.isArray(prev) ? prev : []), vals]);
      addForm.resetFields();
      setAddVisible(false);
    });
  };

  const handleEditOk = () => {
    editForm.validateFields().then(vals => {
      setCompetitors(prev =>
        (Array.isArray(prev) ? prev : []).map(c => (c.id === editing?.id ? { ...c, ...vals } : c))
      );
      setEditVisible(false);
    });
  };

  const handleDelete = (id: number) => {
    setCompetitors(prev => (Array.isArray(prev) ? prev : []).filter(c => c.id !== id));
    setEditVisible(false);
  };

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
  ];

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
      title: "Team name",
      dataIndex: "username",
      key: "username",
      sorter: (a: Competitor, b: Competitor) =>
        a.username.localeCompare(b.username),
    },
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      sorter: (a: Competitor, b: Competitor) =>
        a.id - b.id,
    },
    {
      title: "Age Group",
      dataIndex: "ageGroup",
      key: "ageGroup",
      width: 100,
    },
    { title: "U", dataIndex: "U", key: "U", width: 60 },
    { title: "I", dataIndex: "I", key: "I", width: 60 },
    { title: "m", dataIndex: "m", key: "m", width: 60 },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">{t('admin.header')}</h1>

      <div className="flex flex-col gap-y-6 w-full max-w-[700px]">
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(54, 89, 139, 0.3)' }}>
            <h2 className="text-white text-xl font-semibold mb-4">{t('admin.globalSettings')}</h2>
            <Form layout="inline">
              <Form.Item label="Power Coefficient">
                <InputNumber
                  min={0}
                  value={powerCoef}
                  onChange={v => setPowerCoef(v ?? 0)}
                  style={{ width: 120 }}
                />
              </Form.Item>
              <Form.Item label="Max Speed">
                <InputNumber
                  min={0}
                  value={maxSpd}
                  onChange={v => setMaxSpd(v ?? 0)}
                  style={{ width: 120 }}
                />
              </Form.Item>
              <Form.Item label="Full Race Length">
                <InputNumber
                  min={0}
                  step={0.01}
                  value={fullRaceLength}
                  onChange={v => setFullRaceLength(v ?? 0)}
                  style={{ width: 140 }}
                />
              </Form.Item>
              <Form.Item label="Drag Race Length">
                <InputNumber
                  min={0}
                  step={0.01}
                  value={dragRaceLength}
                  onChange={v => setDragRaceLength(v ?? 0)}
                  style={{ width: 140 }}
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" onClick={handleUpdateSettings}>
                  Update Global Settings
                </Button>
              </Form.Item>
            </Form>
          </div>

          <h2 className="text-white text-xl font-semibold">{t('admin.parameters')}</h2>
          <Table
            dataSource={competitors}
            columns={tableColumns}
            rowKey="id"
            pagination={false}
            size="middle"
          />
          <div className="flex gap-4">
            <Button type="primary" onClick={() => setAddVisible(true)}>
              Add user
            </Button>
            <Button onClick={handleUpdate}>Update data</Button>
          </div>
        </div>

      <div className="mt-6 text-center">
        <Popconfirm
          title="Are you sure you want to reset the database?"
          onConfirm={handleResetAndSave}
          okText="Yes"
          cancelText="No"
        >
          <Button danger>
            Reset and Save Database
          </Button>
        </Popconfirm>
      </div>

      {/* Add Competitor Modal */}
      <Modal
        title="Add Competitor"
        open={addVisible}
        onOk={handleAddOk}
        onCancel={() => setAddVisible(false)}
      >
        <Form layout="vertical" form={addForm}>
          <Form.Item
            name="id"
            label="ID"
            rules={[{ required: true, message: "Please enter an ID" }]}
          >
            <InputNumber min={1} precision={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="username"
            label="Team name"
            rules={[{ validator: validateTeamName }]}
          >
            <Select
              showSearch
              loading={teamsLoading}
              options={teamOptions}
              placeholder="Select existing team"
              optionFilterProp="label"
              notFoundContent={teamsLoading ? "Loading teams..." : "No teams found"}
            />
          </Form.Item>
          <Form.Item
            name="ageGroup"
            label="Age Group"
            rules={[{ required: true, message: "Please enter an age group" }]}
          >
            <Input placeholder="e.g. 18-25, 26-35" />
          </Form.Item>
          <Form.Item name="U" label="U" initialValue={0}>
            <InputNumber step={0.01} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="I" label="I" initialValue={0}>
            <InputNumber step={0.01} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="m" label="m" initialValue={0}>
            <InputNumber style={{ width: "100%" }} />
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
          <Form.Item
            name="username"
            label="Team name"
            rules={[{ validator: validateTeamName }]}
          >
            <Select
              showSearch
              loading={teamsLoading}
              options={teamOptions}
              placeholder="Select existing team"
              optionFilterProp="label"
              notFoundContent={teamsLoading ? "Loading teams..." : "No teams found"}
            />
          </Form.Item>
          <Form.Item
            name="ageGroup"
            label="Age Group"
            rules={[{ required: true, message: "Please enter an age group" }]}
          >
            <Input placeholder="e.g. 18-25, 26-35" />
          </Form.Item>
          <Form.Item name="U" label="U" initialValue={0}>
            <InputNumber step={0.01} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="I" label="I" initialValue={0}>
            <InputNumber step={0.01} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="m" label="m" initialValue={0}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminPanel;
