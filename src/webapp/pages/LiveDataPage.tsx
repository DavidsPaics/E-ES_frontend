// src/pages/LiveDataPage.tsx
import React, { useEffect, useState, useRef } from "react";
import { Table, Alert, Tag, Avatar, Button } from "antd";
import { FullscreenExitOutlined, FullscreenOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Battery from "@/webapp/components/battery";
import { formatDistance } from "date-fns";
import { ENDPOINT_WS_LIVE, MAPTILER_TILE_URL } from "@/webapp/config/endpoints";
import { fakeLiveData, generateUpdatedLiveData } from "@/webapp/data/fakeData";
import { useTranslation } from 'react-i18next';

// Fix Leaflet default icon paths
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

interface MergedRow {
  key: string;
  ID: number;
  username: string;
  avatar: string;
  status: "online" | "offline" | "ping";
  position: number;
  lat: number;
  lon: number;
  spd: number;
  power: number;
  acceleration: number;
  voltage: number;
  updatedAt: string;
}

type Row = Pick<
  MergedRow,
  | "key"
  | "username"
  | "avatar"
  | "status"
  | "position"
  | "lat"
  | "lon"
  | "spd"
  | "power"
  | "acceleration"
  | "voltage"
  | "updatedAt"
> & { id: number };

const LiveDataPage: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedView, setExpandedView] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fakeDataInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize with fake data for demo
  useEffect(() => {
    // Start with fake data immediately for visualization
    const initialFakeData = fakeLiveData.map((r) => ({
      key: r.key,
      id: r.ID,
      username: r.username,
      avatar: r.avatar,
      status: r.status,
      position: r.position,
      lat: r.lat,
      lon: r.lon,
      spd: r.spd,
      power: r.power,
      acceleration: r.acceleration,
      voltage: r.voltage,
      updatedAt: r.updatedAt,
    }));
    setData(initialFakeData);
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;

    const connect = () => {
      const token = localStorage.getItem("token");
      const wsUrl = token
        ? `${ENDPOINT_WS_LIVE}?token=${encodeURIComponent(token)}`
        : ENDPOINT_WS_LIVE;

      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttempts.current = 0;
        setError(null);
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
        }
        if (fakeDataInterval.current) {
          clearInterval(fakeDataInterval.current);
        }
      };

      ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data) as MergedRow[];
          setData(
            raw.map((r) => ({
              key: r.key,
              id: r.ID,
              username: r.username,
              avatar: r.avatar,
              status: r.status,
              position: r.position,
              lat: r.lat,
              lon: r.lon,
              spd: r.spd,
              power: r.power,
              acceleration: r.acceleration,
              voltage: r.voltage,
              updatedAt: r.updatedAt,
            }))
          );
        } catch (err) {
          console.error("WS parse error:", err);
        }
      };

      ws.onerror = () => {
        console.log("WebSocket error, switching to fake data mode");
      };

      ws.onclose = () => {
        reconnectAttempts.current += 1;
        if (reconnectAttempts.current > 3) {
          // After 3 attempts, use fake data instead of showing error
          console.log("WebSocket failed, using fake data for demo");
          setError(null);
          
          // Start fake data updates
          if (!fakeDataInterval.current) {
            fakeDataInterval.current = setInterval(() => {
              const updated = generateUpdatedLiveData();
              setData(updated.map((r) => ({
                key: r.key,
                id: r.ID,
                username: r.username,
                avatar: r.avatar,
                status: r.status,
                position: r.position,
                lat: r.lat,
                lon: r.lon,
                spd: r.spd,
                power: r.power,
                acceleration: r.acceleration,
                voltage: r.voltage,
                updatedAt: r.updatedAt,
              })));
            }, 2000);
          }
          return;
        }
        reconnectTimeout.current = setTimeout(
          connect,
          1000 * Math.min(reconnectAttempts.current, 10)
        );
      };
    };

    connect();
    return () => {
      if (ws) ws.close();
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (fakeDataInterval.current) {
        clearInterval(fakeDataInterval.current);
      }
    };
  }, []);

  if (error) return <Alert type="error" message="Error" description={error} />;

  // Fullscreen table view
  if (expandedView) {
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
      { title: "Avatar", dataIndex: "avatar", key: "avatar", render: (url) => <Avatar src={url} /> },
      { title: "# Pos", dataIndex: "position", key: "position", sorter: (a, b) => a.position - b.position },
      { title: "ID", dataIndex: "id", key: "id", sorter: (a, b) => a.id - b.id },
      { title: "Username", dataIndex: "username", key: "username", sorter: (a, b) => a.username.localeCompare(b.username) },
      { title: "Spd (km/h)", dataIndex: "spd", key: "spd", sorter: (a, b) => a.spd - b.spd },
      { title: "Power (W)", dataIndex: "power", key: "power", sorter: (a, b) => a.power - b.power },
      { title: "Accel.", dataIndex: "acceleration", key: "acceleration", sorter: (a, b) => a.acceleration - b.acceleration },
      { title: "Voltage", dataIndex: "voltage", key: "voltage", render: (v) => <Battery voltage={v} /> },
      {
        title: "Last update",
        dataIndex: "updatedAt",
        key: "updatedAt",
        render: (u: string) => formatDistance(new Date(u), new Date(), { addSuffix: true }),
      },
    ];

    return (
      <div className="fixed inset-0 z-50 bg-[#0A306D] overflow-auto sm:mt-0 mt-16">
        <div className="flex justify-end p-4 border-b border-white/10">
          <Button
            icon={<FullscreenExitOutlined />}
            onClick={() => setExpandedView(false)}
            style={{ background: "transparent", border: "none", color: "white" }}
          />
        </div>
        <h2 className="text-2xl font-bold text-white px-6 py-4">{t('liveData.header')}</h2>
        <div className="px-6 pb-12">
          <Table<Row> dataSource={data} columns={columns} pagination={false} size="small" rowKey="key" />
        </div>
      </div>
    );
  }

  const makeAvatarIcon = (url: string) =>
    L.divIcon({
      html: `<div style="width:40px;height:40px;border:2px solid white;border-radius:50%;overflow:hidden;"><img src="${url}" style="width:100%;height:100%;object-fit:cover"/></div>`,
      className: "",
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -30],
    });

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
    { title: "Avatar", dataIndex: "avatar", key: "avatar", render: (url) => <Avatar src={url} /> },
    { title: "# Pos", dataIndex: "position", key: "position", sorter: (a, b) => a.position - b.position },
    { title: "ID", dataIndex: "id", key: "id", sorter: (a, b) => a.id - b.id },
    { title: "Username", dataIndex: "username", key: "username", sorter: (a, b) => a.username.localeCompare(b.username) },
    { title: "Spd (km/h)", dataIndex: "spd", key: "spd", sorter: (a, b) => a.spd - b.spd },
    { title: "Power (W)", dataIndex: "power", key: "power", sorter: (a, b) => a.power - b.power },
    { title: "Accel.", dataIndex: "acceleration", key: "acceleration", sorter: (a, b) => a.acceleration - b.acceleration },
    { title: "Voltage", dataIndex: "voltage", key: "voltage", render: (v) => <Battery voltage={v} /> },
    {
      title: "Last update",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (u: string) => formatDistance(new Date(u), new Date(), { addSuffix: true }),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">{t('liveData.header')}</h1>
      <div className="flex flex-col gap-4">
          <div className="w-full md:w-2/4 lg:w-2/2 h-[500px] rounded-lg overflow-hidden shadow">
            <MapContainer
              center={[56.66090993638844, 23.74363904512851]}
              zoom={17}
              className="w-full h-full"
              scrollWheelZoom={true}
              touchZoom={false}
              doubleClickZoom={false}
              dragging={true}
              zoomControl={false}
              keyboard={false}
            >
              {MAPTILER_TILE_URL && <TileLayer url={MAPTILER_TILE_URL} />}
              {data.map((r) => (
                <Marker key={r.key} position={[r.lat, r.lon]} icon={makeAvatarIcon(r.avatar)}>
                  <Popup>
                    <Avatar src={r.avatar} size={40} /> <br />
                    <strong>{r.username}</strong> (#{r.id})<br />
                    Spd: {r.spd} km/h<br />
                    Power: {r.power} W
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          <div className="backdrop-blur-md rounded-xl shadow overflow-auto flex flex-col" style={{ backgroundColor: 'rgba(166, 193, 204, 0.35)' }}>
            <div className="flex justify-end p-2">
              <Button
                size="small"
                icon={<FullscreenOutlined />}
                onClick={() => setExpandedView(true)}
                style={{ background: "transparent", border: "none" }}
              />
            </div>
            <Table<Row> dataSource={data} columns={columns} pagination={false} size="small" rowKey="key" />
          </div>
      </div>
    </div>
  );
};

export default LiveDataPage;
