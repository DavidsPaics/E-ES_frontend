// src/pages/RaceConfigPage.tsx
import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, InputNumber, Select, message } from "antd";
import MainMenu from "@/components/menu";

type ApiRaceConfig = {
  RaceName: string;
  Length: number;
  Coef: number;
  SortBy: "time" | "Wh";
  Distribution: number[];
};

type RaceConfig = {
  id: number;
  name: string;
  lengthKm: number;
  coef: number;
  sortBy: "time" | "Wh";
  distribution: number[];
};

const GET_URL = "https://dummyjson.com/c/0ed1-4826-4920-9b90";
const POST_URL = "https://dummyjson.com/c/4dc5-4173-4ba8-88bb";

const RaceConfigPage: React.FC = () => {
  const [configs, setConfigs] = useState<RaceConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<RaceConfig | null>(null);
  const [form] = Form.useForm<RaceConfig>();

  // Load from API
  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await fetch(GET_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const apiData: ApiRaceConfig[] = await res.json();
      // Map to our internal type, assign IDs from index
      const mapped: RaceConfig[] = apiData.map((r, i) => ({
        id: i + 1,
        name: r.RaceName,
        lengthKm: r.Length,
        coef: r.Coef,
        sortBy: r.SortBy,
        distribution: r.Distribution,
      }));
      setConfigs(mapped);
    } catch (err: any) {
      message.error("Failed to load configurations: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save to API
  const handleUpdate = async () => {
    setLoading(true);
    try {
      // Map back to API shape
      const payload: ApiRaceConfig[] = configs.map(c => ({
        RaceName: c.name,
        Length: c.lengthKm,
        Coef: c.coef,
        SortBy: c.sortBy,
        Distribution: c.distribution,
      }));

      const res = await fetch(POST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      message.success("Configurations saved.");
      await fetchConfigs();
    } catch (err: any) {
      message.error("Failed to save configurations: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEdit = (cfg: RaceConfig) => {
    setEditing(cfg);
    form.setFieldsValue(cfg);
    setModalVisible(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    if (editing) {
      setConfigs(prev => prev.map(c => (c.id === editing.id ? { ...c, ...values } : c)));
    } else {
      const nextId = Math.max(0, ...configs.map(c => c.id)) + 1;
      setConfigs(prev => [...prev, { ...values, id: nextId }]);
    }
    setModalVisible(false);
  };

  const handleDelete = (id: number) => {
    setConfigs(prev => prev.filter(c => c.id !== id));
  };

  const columns = [
    { title: "Race Name", dataIndex: "name", key: "name" },
    { title: "Length (km)", dataIndex: "lengthKm", key: "lengthKm" },
    { title: "Coef (I = m·coef/U)", dataIndex: "coef", key: "coef" },
    { title: "Sort By", dataIndex: "sortBy", key: "sortBy" },
    {
      title: "Distribution",
      dataIndex: "distribution",
      key: "distribution",
      render: (dist: number[]) => dist.join(" / "),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: RaceConfig) => (
        <>
          <Button size="small" onClick={() => openEdit(record)}>Edit</Button>{" "}
          <Button size="small" danger onClick={() => handleDelete(record.id)}>Delete</Button>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 w-screen p-4 bg-white/20 backdrop-blur-md shadow-md text-xl font-bold text-center text-white z-10">
        🛠 Race Configuration
      </header>

      {/* Body */}
      <div className="flex flex-1 mt-16 bg-white/5 backdrop-blur-sm p-8 gap-x-12">
        {/* Sidebar */}
        <div className="p-4">
          <MainMenu />
        </div>

        {/* Config Table */}
        <div className="flex-1 flex flex-col gap-y-4">
          <div className="flex gap-4">
            <Button type="primary" onClick={openAdd} disabled={loading}>
              + Add Race Config
            </Button>
            <Button onClick={handleUpdate} loading={loading}>
              Update Data
            </Button>
          </div>

          <Table
            size="small"
            dataSource={configs}
            columns={columns}
            rowKey="id"
            pagination={false}
            loading={loading}
            className="bg-white/30 backdrop-blur-md rounded-lg shadow-lg overflow-hidden"
          />
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        title={editing ? "Edit Race Config" : "Add Race Config"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Race Name"
            name="name"
            rules={[{ required: true, message: "Enter a race name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Race Length (km)"
            name="lengthKm"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} className="w-full" />
          </Form.Item>

          <Form.Item
            label="Coefficient (I = m·coef/U)"
            name="coef"
            rules={[{ required: true }]}
          >
            <InputNumber step={0.01} className="w-full" />
          </Form.Item>

          <Form.Item
            label="Sort By"
            name="sortBy"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="time">Time (fastest first)</Select.Option>
              <Select.Option value="Wh">Wh (highest first)</Select.Option>
            </Select>
          </Form.Item>

          <Form.List
            name="distribution"
            rules={[{ validator: async (_, dist) => {
              if (!dist || dist.length < 1) {
                return Promise.reject(new Error("Add at least one place"));
              }
            }}]}
          >
            {(fields, { add, remove }) => (
              <>
                <label className="block font-medium mt-4">Points by place</label>
                {fields.map((field, idx) => (
                  <Form.Item
                    {...field}
                    key={field.key}
                    rules={[{ required: true, message: `Points for place ${idx+1}` }]}
                  >
                    <InputNumber placeholder={`Place ${idx+1}`} min={0} className="w-full" />
                  </Form.Item>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block>+ Add place</Button>
                  {fields.length > 0 && (
                    <Button type="link" danger onClick={() => remove(fields.length-1)}>
                      Remove last place
                    </Button>
                  )}
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

export default RaceConfigPage;
