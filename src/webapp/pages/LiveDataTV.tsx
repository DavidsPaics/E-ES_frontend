import React, { useEffect, useState, useRef } from "react";
import { Table, Alert, Tag, Avatar, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useAuth } from "@/webapp/authentification/AuthContext";
import Battery from "@/webapp/components/battery";
import { formatDistance } from "date-fns";
import { ENDPOINT_WS_LIVE } from "@/webapp/config/endpoints";
import { fakeLiveData, generateUpdatedLiveData } from "@/webapp/data/fakeData";

interface Row {
  key: string;
  id: number;
  username: string;
  avatar: string;
  status: "online" | "offline" | "ping";
  position: number;
  spd: number;
  power: number;
  acceleration: number;
  voltage: number;
  updatedAt: string;
}

const LiveDataTV: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fakeDataInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = "/signin";
    }
  }, [isAuthenticated]);

  // Initialize with fake data
  useEffect(() => {
    const initialFakeData = fakeLiveData.map((r) => ({
      key: r.key,
      id: r.ID,
      username: r.username,
      avatar: r.avatar,
      status: r.status,
      position: r.position,
      spd: r.spd,
      power: r.power,
      acceleration: r.acceleration,
      voltage: r.voltage,
      updatedAt: r.updatedAt,
    }));
    setData(initialFakeData);
    setLoading(false);
  }, []);

  // WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem("auth_token") || "test_token";

    const attemptWebSocketConnection = () => {
      if (reconnectAttempts.current >= 3) {
        console.log("Max reconnect attempts reached, using fake data");
        fakeDataInterval.current = setInterval(() => {
          setData((prev) =>
            prev.map((r) => ({
              ...r,
              ...generateUpdatedLiveData(),
            }))
          );
        }, 2000);
        return;
      }

      const wsUrl = `${ENDPOINT_WS_LIVE}?token=${encodeURIComponent(token)}`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
        reconnectAttempts.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (Array.isArray(payload)) {
            const formattedData = payload.map((r: any) => ({
              key: String(r.ID),
              id: r.ID,
              username: r.username,
              avatar: r.avatar,
              status: r.status || "ping",
              position: r.position,
              spd: r.spd,
              power: r.power,
              acceleration: r.acceleration,
              voltage: r.voltage,
              updatedAt: r.updatedAt || new Date().toISOString(),
            }));
            setData(formattedData);
          }
        } catch (e) {
          console.error("Failed to parse WS message:", e);
        }
      };

      wsRef.current.onerror = () => {
        console.error("WebSocket error, attempting reconnect");
        reconnectAttempts.current++;
        if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = setTimeout(attemptWebSocketConnection, 2000);
      };

      wsRef.current.onclose = () => {
        console.log("WebSocket disconnected");
        if (reconnectAttempts.current < 3) {
          reconnectTimeout.current = setTimeout(attemptWebSocketConnection, 2000);
        }
      };
    };

    attemptWebSocketConnection();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (fakeDataInterval.current) clearInterval(fakeDataInterval.current);
    };
  }, []);

  // Auto-scroll content - smooth, single pass, no loop
  useEffect(() => {
    if (!containerRef.current || loading) return;

    const container = containerRef.current;
    container.scrollTop = 0;
    setScrollOffset(0);

    const initTimeout = setTimeout(() => {
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const maxScroll = scrollHeight - clientHeight;

      if (maxScroll > 10) {
        setIsScrolling(true);
        const scrollDuration = 30000; // 30 seconds for full scroll
        let startTime: number | null = null;
        let animationFrame: number;

        const animateScroll = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const progress = Math.min(elapsed / scrollDuration, 1);

          // Ease-in-out for smooth motion
          const easeProgress = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          container.scrollTop = easeProgress * maxScroll;
          setScrollOffset(Math.round(progress * 100));

          if (progress < 1) {
            animationFrame = requestAnimationFrame(animateScroll);
          } else {
            setIsScrolling(false);
          }
        };

        animationFrame = requestAnimationFrame(animateScroll);
        return () => cancelAnimationFrame(animationFrame);
      } else {
        setIsScrolling(false);
      }
    }, 500);

    return () => clearTimeout(initTimeout);
  }, [data, loading]);

  if (error) {
    return <Alert type="error" message="Error" description={error} />;
  }

  const columns: ColumnsType<Row> = [
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s) => {
        const color = s === "online" ? "green" : s === "offline" ? "red" : "orange";
        return <Tag color={color}>{s.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Avatar",
      dataIndex: "avatar",
      key: "avatar",
      render: (url) => <Avatar src={url} size={40} />,
    },
    {
      title: "# Pos",
      dataIndex: "position",
      key: "position",
    },
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Spd (km/h)",
      dataIndex: "spd",
      key: "spd",
    },
    {
      title: "Power (W)",
      dataIndex: "power",
      key: "power",
    },
    {
      title: "Accel.",
      dataIndex: "acceleration",
      key: "acceleration",
    },
    {
      title: "Voltage",
      dataIndex: "voltage",
      key: "voltage",
      render: (v) => <Battery voltage={v} />,
    },
    {
      title: "Last update",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (u: string) => formatDistance(new Date(u), new Date(), { addSuffix: true }),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#0A306D] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-[#0A306D] to-[#36598B] flex-shrink-0">
        <div>
          <h1 className="text-4xl font-bold text-white">📊 Live Data TV</h1>
          <p className="text-[#4EA9D5] text-lg mt-1">Real-time competitor information</p>
        </div>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition-colors"
        >
          Close
        </button>
      </div>

      {/* Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden px-6 py-4"
      >
        {loading ? (
          <Spin tip="Loading live data…" />
        ) : (
          <Table<Row>
            dataSource={data}
            columns={columns}
            pagination={false}
            size="large"
            rowKey="key"
            style={{ fontSize: "14px" }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-[#0A306D] to-[#36598B] px-6 py-3 border-t border-white/10 flex items-center justify-between flex-shrink-0">
        <p className="text-white text-sm">Active Competitors: {data.length}</p>
        <p className="text-[#4EA9D5] text-sm">
          {isScrolling ? `Scrolling ${scrollOffset}%` : "Complete"}
        </p>
      </div>
    </div>
  );
};

export default LiveDataTV;
