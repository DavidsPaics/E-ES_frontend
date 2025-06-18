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
  message,
  Avatar,
  Dropdown,
  type MenuProps,
} from "antd";
import MainMenu from "@/components/menu";
import '@ant-design/v5-patch-for-react-19';
import { ENDPOINT_COMPETITORS, ENDPOINT_ADMIN_SETTINGS, ENDPOINT_ADMIN_DELETE } from "@/config/endpoints";

type CompetitorBase = {
  id: string;
  username: string;
  U: number;
  I: number;
  m: number;
  ageGroup: string;
  avatar?: string;
};
type Competitor = CompetitorBase & { finishedAt?: string };

const AdminPanel: React.FC = () => {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [addVisible, setAddVisible] = useState(false);
  const [addForm] = Form.useForm<CompetitorBase>();

  const [editVisible, setEditVisible] = useState(false);
  const [editing, setEditing] = useState<Competitor | null>(null);
  const [editForm] = Form.useForm<CompetitorBase>();

  const [powerCoef, setPowerCoef] = useState<number>(0);
  const [maxSpd, setMaxSpd] = useState<number>(0);

  const fetchCompetitors = async () => {
    try {
      const res = await fetch(ENDPOINT_COMPETITORS);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCompetitors((await res.json()) as Competitor[]);
    } catch (err: any) {
      message.error("Failed to load competitors: " + err.message);
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
      const res = await fetch(ENDPOINT_COMPETITORS, {
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
      const payload = { PowerCoef: powerCoef, MaxSpd: maxSpd };
      console.log("POST settings payload:", payload);
      const res = await fetch(ENDPOINT_ADMIN_SETTINGS, {
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
      const res = await fetch(ENDPOINT_ADMIN_DELETE, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      message.success("Database reset and saved");
      fetchCompetitors();
    } catch (err: any) {
      message.error("Reset failed: " + err.message);
    }
  };

  useEffect(() => {
    fetchCompetitors();
    // Fetch global settings
    fetch(ENDPOINT_ADMIN_SETTINGS)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setPowerCoef(data.PowerCoef ?? 0);
        setMaxSpd(data.MaxSpd ?? 0);
      })
      .catch(err => {
        message.error("Failed to load settings: " + err.message);
      });
  }, []);

  const handleAddOk = () => {
    addForm.validateFields().then(vals => {
      setCompetitors(prev => [...prev, vals]);
      addForm.resetFields();
      setAddVisible(false);
    });
  };

  const handleEditOk = () => {
    editForm.validateFields().then(vals => {
      setCompetitors(prev =>
        prev.map(c => (c.id === editing?.id ? { ...c, ...vals } : c))
      );
      setEditVisible(false);
    });
  };

  const handleDelete = (id: string) => {
    setCompetitors(prev => prev.filter(c => c.id !== id));
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
      title: "Username",
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
        parseInt(a.id, 10) - parseInt(b.id, 10),
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
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 w-full p-4 bg-white/20 backdrop-blur text-xl font-bold text-center text-white z-10">
        ⚙️ Admin Panel
      </header>

      <div className="flex flex-1 mt-16 p-8 gap-x-12">
        <div className="p-4"><MainMenu /></div>
        <div className="flex flex-col gap-y-6 w-[700px]">
          <div className="p-4 bg-white/10 rounded-lg">
            <h2 className="text-white text-xl font-semibold mb-4">Global Settings</h2>
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
              <Form.Item>
                <Button type="primary" onClick={handleUpdateSettings}>
                  Update Global Settings
                </Button>
              </Form.Item>
            </Form>
          </div>

          <h2 className="text-white text-xl font-semibold">Parameters</h2>
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
      </div>

      <div className="p-8 text-center">
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
            <Input />
          </Form.Item>
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: "Please enter a username" }]}
          >
            <Input />
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
            label="Username"
            rules={[{ required: true, message: "Please enter a username" }]}
          >
            <Input />
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
