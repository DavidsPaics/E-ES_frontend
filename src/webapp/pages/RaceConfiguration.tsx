// src/pages/RaceConfiguration.tsx

import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Input,
  Form,
  message,
} from "antd";
import "@ant-design/v5-patch-for-react-19";
import { ENDPOINT_RACES } from "@/webapp/config/endpoints";
import { apiFetch } from "@/webapp/utils/api";
import { fakeRaces } from "@/webapp/data/fakeData";
import { useTranslation } from 'react-i18next';

type RawLap = {
  RaceName: string;
  Lap: number;
  Length: number;
};

type Race = {
  id: string;         // we’ll use `raceName` as the unique id
  raceName: string;   // e.g. "raceA" or "raceB"
  length: number;     // same length for every lap of that race
  laps: number;       // total number of laps for that race
};

const RaceConfiguration: React.FC = () => {
  const { t } = useTranslation();
  const [races, setRaces] = useState<Race[]>([]);
  const [addVisible, setAddVisible] = useState(false);
  const [addForm] = Form.useForm<Race>();

  const [editVisible, setEditVisible] = useState(false);
  const [editing, setEditing] = useState<Race | null>(null);
  const [editForm] = Form.useForm<Race>();

  // 1) Fetch the raw “array of laps” from API, then aggregate into one Race per unique RaceName
  const fetchRaces = async () => {
    try {
      const res = await apiFetch(ENDPOINT_RACES);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const raw: RawLap[] = (await res.json()) as RawLap[];

      // Group by RaceName → count laps, keep length
      const map = new Map<string, { length: number; laps: number }>();

      raw.forEach((lapObj) => {
        const name = lapObj.RaceName;
        const length = lapObj.Length;

        if (map.has(name)) {
          map.get(name)!.laps += 1;
        } else {
          map.set(name, { length, laps: 1 });
        }
      });

      // Transform into Race[]
      const aggregated: Race[] = [];
      map.forEach((value, key) => {
        aggregated.push({
          id: key,
          raceName: key,
          length: value.length,
          laps: value.laps,
        });
      });

      setRaces(aggregated);
    } catch (err: any) {
      // Use fake data on error
      console.log("Using fake races data");
      const map = new Map<string, { length: number; laps: number }>();
      
      fakeRaces.forEach((lapObj) => {
        const name = lapObj.RaceName;
        const length = lapObj.Length;

        if (map.has(name)) {
          map.get(name)!.laps += 1;
        } else {
          map.set(name, { length, laps: 1 });
        }
      });

      const aggregated: Race[] = [];
      map.forEach((value, key) => {
        aggregated.push({
          id: key,
          raceName: key,
          length: value.length,
          laps: value.laps,
        });
      });

      setRaces(aggregated);
    }
  };

  useEffect(() => {
    fetchRaces();
  }, []);

  // 2) When “Update Data” is clicked, expand each Race back into individual lap‐objects,
  //    so that the POST payload matches [{ RaceName, Lap, Length }, …].
  const handleUpdate = async () => {
    try {
      // Build the array of RawLap’s:
      const payload: RawLap[] = races.flatMap((r) =>
        Array.from({ length: r.laps }, (_, idx) => ({
          RaceName: r.raceName,
          Lap: idx + 1,
          Length: r.length,
        }))
      );

      const res = await apiFetch(ENDPOINT_RACES, {
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

  // 3) When “Add Race” modal is submitted:
  const handleAddOk = () => {
    addForm.validateFields().then((vals) => {
      // vals will be { raceName: string; length: number; laps: number }
      // We use raceName as the `id` so that each rowKey is unique.
      setRaces((prev) => [
        ...prev,
        {
          id: vals.raceName,
          raceName: vals.raceName,
          length: vals.length,
          laps: vals.laps,
        },
      ]);
      addForm.resetFields();
      setAddVisible(false);
    });
  };

  // 4) When “Edit Race” modal is submitted:
  const handleEditOk = () => {
    editForm.validateFields().then((vals) => {
      if (!editing) return;
      setRaces((prev) =>
        prev.map((r) =>
          r.id === editing.id
            ? { ...r, raceName: vals.raceName, length: vals.length, laps: vals.laps }
            : r
        )
      );
      setEditVisible(false);
    });
  };

  // 5) Delete a race entirely:
  const handleDelete = (id: string) => {
    setRaces((prev) => prev.filter((r) => r.id !== id));
    setEditVisible(false);
  };

  // 6) Table columns (we use `rowKey="id"` so each row is uniquely keyed by raceName)
  const tableColumns = [
    {
      title: "Race Name",
      dataIndex: "raceName",
      key: "raceName",
      sorter: (a: Race, b: Race) => a.raceName.localeCompare(b.raceName),
    },
    {
      title: "Length (km)",
      dataIndex: "length",
      key: "length",
      sorter: (a: Race, b: Race) => a.length - b.length,
    },
    {
      title: "Laps",
      dataIndex: "laps",
      key: "laps",
      sorter: (a: Race, b: Race) => a.laps - b.laps,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, rec: Race) => (
        <Button
          type="link"
          onClick={() => {
            setEditing(rec);
            editForm.setFieldsValue(rec);
            setEditVisible(true);
          }}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">{t('raceConfig.header')}</h1>

      <div className="flex flex-col gap-y-4 w-full max-w-[700px]">
          <h2 className="text-white text-xl font-semibold">{t('raceConfig.raceParameters')}</h2>
          <Table
            dataSource={races}
            columns={tableColumns}
            rowKey="id"       /* now `id === raceName`, which is unique */
            pagination={false}
            size="middle"
          />
          <div className="flex gap-4">
            <Button type="primary" onClick={() => setAddVisible(true)}>
              Add Race
            </Button>
            <Button onClick={handleUpdate}>Update Data</Button>
          </div>
        </div>

      {/* Add Race Modal */}
      <Modal
        title="Add Race"
        open={addVisible}
        onOk={handleAddOk}
        onCancel={() => setAddVisible(false)}
      >
        <Form layout="vertical" form={addForm} initialValues={{ laps: 1, length: 1 }}>
          <Form.Item
            name="raceName"
            label="Race Name"
            rules={[{ required: true, message: "Please enter a race name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="length"
            label="Length (km)"
            rules={[{ required: true, message: "Please enter race length" }]}
          >
            <Input type="number" min={0} />
          </Form.Item>

          <Form.Item
            name="laps"
            label="Laps"
            rules={[{ required: true, message: "Please enter number of laps" }]}
          >
            <Input type="number" min={1} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Race Modal */}
      <Modal
        title="Edit Race"
        open={editVisible}
        onOk={handleEditOk}
        onCancel={() => setEditVisible(false)}
        footer={[
          <Button
            key="delete"
            danger
            onClick={() => handleDelete(editing!.id)}
          >
            Delete Race
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
            name="raceName"
            label="Race Name"
            rules={[{ required: true, message: "Please enter a race name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="length"
            label="Length (km)"
            rules={[{ required: true, message: "Please enter race length" }]}
          >
            <Input type="number" min={0} />
          </Form.Item>

          <Form.Item
            name="laps"
            label="Laps"
            rules={[{ required: true, message: "Please enter number of laps" }]}
          >
            <Input type="number" min={1} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RaceConfiguration;
