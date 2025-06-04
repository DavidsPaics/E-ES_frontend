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
import MainMenu from "@/components/menu";
import '@ant-design/v5-patch-for-react-19';

type Race = {
    id: number;
    raceName: string;
    length: number;
    laps: number;
};

const GET_RACES = "https://izv.svaza.lv/api/races";
const POST_RACES = "https://izv.svaza.lv/api/races";

const RaceConfiguration: React.FC = () => {
    const [races, setRaces] = useState<Race[]>([]);
    const [addVisible, setAddVisible] = useState(false);
    const [addForm] = Form.useForm<Race>();

    const [editVisible, setEditVisible] = useState(false);
    const [editing, setEditing] = useState<Race | null>(null);
    const [editForm] = Form.useForm<Race>();

    // Fetch races
    const fetchRaces = async () => {
        try {
            const res = await fetch(GET_RACES);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setRaces((await res.json()) as Race[]);
        } catch (err: any) {
            message.error("Failed to load races: " + err.message);
        }
    };

    // Save races
    const handleUpdate = async () => {
        try {
            const payload = races.map(({ id, raceName, length, laps }) => ({
                id,
                raceName,
                length,
                laps,
            }));
            const res = await fetch(POST_RACES, {
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
        fetchRaces();
    }, []);

    // Add race
    const handleAddOk = () => {
        addForm.validateFields().then(vals => {
            setRaces(prev => [...prev, { ...vals, id: Date.now() } as Race]);
            addForm.resetFields();
            setAddVisible(false);
        });
    };

    // Edit race
    const handleEditOk = () => {
        editForm.validateFields().then(vals => {
            setRaces(prev =>
                prev.map(r => (r.id === editing?.id ? { ...r, ...vals } : r))
            );
            setEditVisible(false);
        });
    };

    const handleDelete = (id: number) => {
        setRaces(prev => prev.filter(r => r.id !== id));
        setEditVisible(false);
    };

    // Table columns
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
        <div className="min-h-screen flex flex-col">
            <header className="fixed top-0 left-0 right-0 w-full p-4 bg-white/20 backdrop-blur text-xl font-bold text-center text-white z-10">
                🏁 Race Configuration
            </header>

            <div className="flex flex-1 mt-16 p-8 gap-x-12">
                <div className="p-4"><MainMenu /></div>

                <div className="flex flex-col gap-y-4 w-[700px]">
                    <h2 className="text-white text-xl font-semibold">Race Parameters</h2>
                    <Table
                        dataSource={races}
                        columns={tableColumns}
                        rowKey="id"
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
            </div>

            {/* Add Race Modal */}
            <Modal
                title="Add Race"
                open={addVisible}
                onOk={handleAddOk}
                onCancel={() => setAddVisible(false)}
            >
                <Form layout="vertical" form={addForm}>
                    <Form.Item
                        name="raceName"
                        label="Race Name"
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="length"
                        label="Length (km)"
                        rules={[{ required: true }]}
                    >
                        <Input type="number" />
                    </Form.Item>

                    <Form.Item
                        name="laps"
                        label="Laps"
                        rules={[{ required: true }]}
                    >
                        <Input type="number" />
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
                    <Button key="delete" danger onClick={() => handleDelete(editing!.id)}>
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
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="length"
                        label="Length (km)"
                        rules={[{ required: true }]}
                    >
                        <Input type="number" />
                    </Form.Item>

                    <Form.Item
                        name="laps"
                        label="Laps"
                        rules={[{ required: true }]}
                    >
                        <Input type="number" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default RaceConfiguration;
