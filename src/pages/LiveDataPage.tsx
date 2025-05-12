// src/pages/LiveDataPage.tsx
import React, { useEffect, useState, useRef } from "react";
import { Table, Alert, Tag, Avatar, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import MainMenu from "@/components/menu";

// ← Point at the root, not “/live-data”
const WS_LIVE_URL = "ws://localhost:8765";

// fix Leaflet’s default icon
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl       from "leaflet/dist/images/marker-icon.png";
import shadowUrl     from "leaflet/dist/images/marker-shadow.png";



const MAPTILER_KEY    = "Krp2QFFxeqjVIOTDvIVE";
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
  updatedAt: string;
}

type Row = Pick<
  MergedRow,
  "key" | "username" | "avatar" | "status" | "position" | "lat" | "lon" | "spd" | "power" | "acceleration" | "updatedAt"
> & { id: number };

export const LiveDataPage: React.FC = () => {
  const [data, setData]           = useState<Row[]>([]);
  const [error, setError]         = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket(WS_LIVE_URL);

      ws.onopen = () => {
        console.log("✅ WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
        const raw = JSON.parse(event.data) as MergedRow[];
        setData(
          raw.map((r) => ({
            key:          r.key,
            id:           r.ID,
            username:     r.username,
            avatar:       r.avatar,
            status:       r.status,
            position:     r.position,
            lat:          r.lat,
            lon:          r.lon,
            spd:          r.spd,
            power:        r.power,
            acceleration: r.acceleration,
            updatedAt:    r.updatedAt,
          }))
        );
      } catch (err: any) {
        console.error("WS parse error:", err);
      }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      ws.onclose = () => {
        console.log("❌ WebSocket closed. Attempting reconnect...");
        reconnectTimeout = setTimeout(connect, 1000); // retry after 1s
      };
    };

    connect();

    return () => {
      if (ws) {
        ws.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, []);


  if (error) {
    return <Alert type="error" message="Error" description={error} />;
  }

  function makeAvatarIcon(url: string) {
    return L.divIcon({
      html: `
        <div style="
          width: 40px; height: 40px;
          border:2px solid white;
          border-radius:50%;
          overflow:hidden;
        ">
          <img src="${url}" style="
            width:100%; height:100%;
            object-fit:cover;
          "/>
        </div>`,
      className: "",
      iconSize:   [40, 40],
      iconAnchor: [20, 40],
      popupAnchor:[0, -40],
    });
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
      render: (url) => <Avatar src={url} />,
    },
    { title: "# Pos",    dataIndex: "position", key: "position", sorter: (a,b) => a.position - b.position },
    { title: "ID",        dataIndex: "id",       key: "id",       sorter: (a,b) => a.id       - b.id },
    { title: "Username",  dataIndex: "username", key: "username", sorter: (a,b) => a.username.localeCompare(b.username) },
    { title: "Spd (km/h)",dataIndex: "spd",      key: "spd",      sorter: (a,b) => a.spd      - b.spd },
    { title: "Power (W)", dataIndex: "power",    key: "power",    sorter: (a,b) => a.power    - b.power },
    { title: "Accel.",    dataIndex: "acceleration", key: "acceleration", sorter: (a,b) => a.acceleration - b.acceleration },
    { title: "Last update", dataIndex: "updatedAt", key: "updatedAt" },
  ];

  const center: [number, number] =
    data.length > 0
      ? [
          data.reduce((sum, r) => sum + r.lat, 0) / data.length,
          data.reduce((sum, r) => sum + r.lon, 0) / data.length,
        ]
      : [0, 0];

   return (
    <div className="min-h-screen flex flex-col">
      {/* header */}
      <header className="fixed top-0 left-0 right-0 p-4 bg-white/20 backdrop-blur text-xl font-bold text-center z-10">
        🚩 Real-Time Tracker
      </header>

      <div className="flex flex-1 mt-16">
        {/* sidebar */}
        <aside className="p-4">
          <MainMenu />
        </aside>

        {/* main */}
        <main className="flex-1 flex flex-col gap-4 p-4">
          {/* map */}
          <div className="w-full md:w-2/4 lg:w-2/2 h-[300px] rounded-lg overflow-hidden shadow">
           <MapContainer
              center={[56.66090993638844, 23.74363904512851]}
              zoom={16.5}
              className="w-full h-full"
                scrollWheelZoom={true}
                // disable pinch/touch zoom
                touchZoom={false}
                // disable double‐click to zoom
                doubleClickZoom={false}
                // disable dragging (panning)
                dragging={true}
                // hide the +/- zoom control
                zoomControl={false}
                // optionally disable keyboard navigation too
                keyboard={false}
            >
              <TileLayer
                url={`https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`} />
              {data.map(r => (
                <Marker
                  key={r.key}
                  position={[r.lat, r.lon]}
                  icon={makeAvatarIcon(r.avatar)}
                >
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

          {/* table */}
          <div className="bg-white/80 backdrop-blur-md rounded-xl shadow overflow-auto">
            <Table<Row>
              dataSource={data}
              columns={columns}
              pagination={false}
              size="small"
              rowKey="key"
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default LiveDataPage;