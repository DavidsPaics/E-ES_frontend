// src/pages/AdminPanel.tsx

import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
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
import '@ant-design/v5-patch-for-react-19';

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

const GET_COMPETITORS = "https://dummyjson.com/c/2ef6-cdb5-4f62-b63f";
const POST_COMPETITORS = "https://izv.svaza.lv/api/parameters";
const UPLOAD_AVATAR  = "https://dummyjson.com/c/cd9f-e481-489e-9d62";


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
  const [addVisible, setAddVisible]   = useState(false);
  const [addForm]   = Form.useForm<CompetitorBase>();

  const [editVisible, setEditVisible] = useState(false);
  const [editing, setEditing]         = useState<Competitor | null>(null);
  const [editForm] = Form.useForm<CompetitorBase>();
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


  // save competitors (including ageGroup)
  const handleUpdate = async () => {
    try {
      const payload = competitors.map(({ id, username, U, I, m, ageGroup, avatar }) => ({
        id,
        username,
        U,
        I,
        m,
        ageGroup,
        avatar,
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
  }, []);


  // add competitor (ID is now typed in)
  const handleAddOk = () => {
    addForm.validateFields().then(vals => {
      // Use the `id` typed in (no auto-generation)
      setCompetitors(prev => [
        ...prev,
        { ...vals } as CompetitorBase
      ]);
      addForm.resetFields();
      setAddVisible(false);
    });
  };

  // edit competitor & delete
  const handleEditOk = () => {
    editForm.validateFields().then(vals => {
      setCompetitors(prev =>
        prev.map(c =>
          c.id === editing?.id
            ? { ...c, ...vals }
            : c
        )
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
                prev.map(c =>
                  c.id === rec.id ? { ...c, avatar: url } : c
                )
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

  // table columns (same as before)
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
      sorter: (a: { username: string }, b: { username: string }) =>
        a.username.localeCompare(b.username),
    },
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      sorter: (a: { id: number }, b: { id: number }) => a.id - b.id,
    },
    {
      title: "Age Group",
      dataIndex: "ageGroup",
      key: "ageGroup",
      width: 100,
      render: (ageGroup: string) => <span>{ageGroup}</span>,
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

        <div className="flex flex-col gap-y-4 w-[700px]">
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

      {/* Add Competitor Modal */}
      <Modal
        title="Add Competitor"
        open={addVisible}
        onOk={handleAddOk}
        onCancel={() => setAddVisible(false)}
      >
        <Form layout="vertical" form={addForm}>
          {/* NEW: ID field */}
          <Form.Item
            name="id"
            label="ID"
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="ageGroup"
            label="Age Group"
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g. 18-25, 26-35" />
          </Form.Item>

          <Form.Item name="U" label="U" initialValue={0}>
            <Input type="number" step="0.01" />
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
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="ageGroup"
            label="Age Group"
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g. 18-25, 26-35" />
          </Form.Item>

          <Form.Item name="U" label="U" initialValue={0}>
            <Input type="number" step="0.01" />
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
