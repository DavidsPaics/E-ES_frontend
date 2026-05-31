import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { ReloadOutlined, SendOutlined } from "@ant-design/icons";
import { ENDPOINT_MQTT_LOGS, ENDPOINT_MQTT_MESSAGE } from "@/webapp/config/endpoints";
import { apiFetch } from "@/webapp/utils/api";
import { formatDisplayDate, formatDisplayTime } from "@/utils/dateFormat";

const { Text } = Typography;

interface MQTTMessage {
  topic: string;
  payload: string;
}

interface MQTTLogEntry extends MQTTMessage {
  key: string;
  timestamp?: string;
  qos?: number;
  retained?: boolean;
  raw: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function firstString(values: unknown[], fallback = ""): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return fallback;
}

function valueToDisplayString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getArrayPayloadItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];

  for (const key of ["data", "logs", "entries", "messages"]) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
  }

  return [];
}

function normalizeLogEntry(value: unknown, index: number): MQTTLogEntry | null {
  if (!isRecord(value)) return null;

  const message = isRecord(value.message) ? value.message : undefined;
  const topic = firstString(
    [value.topic, value.Topic, value.tema, message?.topic, message?.Topic],
    ""
  );
  if (!topic) return null;

  return {
    key: firstString([value.key, value.id, value.ID], `${topic}-${index}`),
    topic,
    payload: valueToDisplayString(
      value.payload ?? value.Payload ?? value.zina ?? message?.payload ?? message?.Payload ?? value.message
    ),
    timestamp: firstString(
      [
        value.timestamp,
        value.time,
        value.createdAt,
        value.receivedAt,
        value.received_at,
        value.date,
      ],
      ""
    ) || undefined,
    qos: typeof value.qos === "number" ? value.qos : undefined,
    retained: typeof value.retained === "boolean" ? value.retained : undefined,
    raw: value,
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function topicMatchesFilter(topic: string, filter: string): boolean {
  const trimmed = filter.trim();
  if (!trimmed) return true;

  if (trimmed.includes("*")) {
    const pattern = `^${trimmed.split("*").map(escapeRegExp).join(".*")}$`;
    return new RegExp(pattern, "i").test(topic);
  }

  return (
    topic.toLowerCase() === trimmed.toLowerCase() ||
    topic.toLowerCase().startsWith(`${trimmed.replace(/\/+$/, "").toLowerCase()}/`) ||
    topic.toLowerCase().includes(trimmed.toLowerCase())
  );
}

function formatTimestamp(value?: string): string {
  if (!value) return "-";
  const date = formatDisplayDate(value);
  const time = formatDisplayTime(value);
  if (date !== "-" && time !== "-") return `${date} ${time}`;
  return value;
}

const MqttManagementPage: React.FC = () => {
  const [limit, setLimit] = useState(50);
  const [topicFilter, setTopicFilter] = useState("");
  const [logs, setLogs] = useState<MQTTLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [form] = Form.useForm<MQTTMessage>();

  const filteredLogs = useMemo(
    () => logs.filter((entry) => topicMatchesFilter(entry.topic, topicFilter)),
    [logs, topicFilter]
  );

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const response = await apiFetch(`${ENDPOINT_MQTT_LOGS}/${encodeURIComponent(limit)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const payload: unknown = await response.json();
      const normalized = getArrayPayloadItems(payload)
        .map((entry, index) => normalizeLogEntry(entry, index))
        .filter((entry): entry is MQTTLogEntry => entry !== null);

      setLogs(normalized);
    } catch (error) {
      setLogs([]);
      const text = error instanceof Error ? error.message : "Neizdevās ielādēt MQTT ierakstus.";
      message.error(text);
    } finally {
      setLogsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const handleSend = async (values: MQTTMessage) => {
    setSending(true);
    try {
      const response = await apiFetch(ENDPOINT_MQTT_MESSAGE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: values.topic.trim(),
          payload: values.payload,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      message.success("MQTT ziņa nosūtīta.");
      form.resetFields();
      void fetchLogs();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Neizdevās nosūtīt MQTT ziņu.";
      message.error(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">MQTT pārvaldība</h1>

      <div className="flex flex-col gap-6 w-full max-w-[1400px]">
        <Card title="MQTT ierakstu pārskats">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-4">
            <Space wrap>
              <Text>Pēdējie</Text>
              <InputNumber
                min={1}
                max={5000}
                value={limit}
                onChange={(value) => setLimit(value ?? 50)}
                className="w-28"
              />
              <Text>MQTT ieraksti</Text>
              <Button icon={<ReloadOutlined />} onClick={fetchLogs} loading={logsLoading}>
                Ielādēt
              </Button>
            </Space>

            <Input
              allowClear
              value={topicFilter}
              onChange={(event) => setTopicFilter(event.target.value)}
              placeholder="Filtrēt pēc tēmas, piemēram /car/* vai /car/89/accel"
              className="w-full lg:max-w-md"
            />
          </div>

          <Table<MQTTLogEntry>
            dataSource={filteredLogs}
            rowKey="key"
            loading={logsLoading}
            pagination={filteredLogs.length > 20 ? { pageSize: 20 } : false}
            expandable={{
              expandedRowRender: (record) => (
                <pre className="m-0 whitespace-pre-wrap break-words text-xs">
                  {JSON.stringify(record.raw, null, 2)}
                </pre>
              ),
            }}
            columns={[
              {
                title: "Laiks",
                dataIndex: "timestamp",
                key: "timestamp",
                width: 190,
                render: (value: string | undefined) => formatTimestamp(value),
              },
              {
                title: "Tēma",
                dataIndex: "topic",
                key: "topic",
                render: (value: string) => <Tag color="blue">{value}</Tag>,
              },
              {
                title: "Payload",
                dataIndex: "payload",
                key: "payload",
                render: (value: string) => (
                  <span className="block max-w-[520px] whitespace-pre-wrap break-words">
                    {value || "-"}
                  </span>
                ),
              },
              {
                title: "QoS",
                dataIndex: "qos",
                key: "qos",
                width: 80,
                render: (value: number | undefined) => value ?? "-",
              },
              {
                title: "Retained",
                dataIndex: "retained",
                key: "retained",
                width: 110,
                render: (value: boolean | undefined) =>
                  value === undefined ? "-" : value ? "Jā" : "Nē",
              },
            ]}
          />
        </Card>

        <Card title="MQTT sūtīšana">
          <Form<MQTTMessage>
            form={form}
            layout="vertical"
            onFinish={handleSend}
            initialValues={{ topic: "", payload: "" }}
          >
            <Form.Item
              name="topic"
              label="Tēma"
              rules={[{ required: true, message: "Ievadiet MQTT tēmu." }]}
            >
              <Input placeholder="test/topic" />
            </Form.Item>
            <Form.Item
              name="payload"
              label="Payload"
              rules={[{ required: true, message: "Ievadiet MQTT payload." }]}
            >
              <Input.TextArea rows={5} placeholder="This is a test MQTT message" />
            </Form.Item>
            <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={sending}>
              Nosūtīt
            </Button>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default MqttManagementPage;
