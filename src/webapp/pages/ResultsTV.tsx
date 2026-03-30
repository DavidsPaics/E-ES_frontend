import React, { useEffect, useState } from "react";
import { Table, Select, Spin, Alert, Avatar } from "antd";
import type { TableProps } from "antd";
import { useAuth } from "@/webapp/authentification/AuthContext";
import { ENDPOINT_RACE_CONFIG, ENDPOINT_RESULTS } from "@/webapp/config/endpoints";
import { apiFetch } from "@/webapp/utils/api";
import { fakeRaceConfigs, fakeResultsByRace } from "@/webapp/data/fakeData";

type ApiRaceConfig = {
  RaceName: string;
  Length: number;
  Coef: number;
  SortBy: string;
  Distribution: number[];
};

type ApiResultEntry = {
  ID: number;
  Username: string;
  avatar: string;
  "Used energy": number;
  "Average power": number;
  "Average speed": number;
  "Elapsed time": string;
  Points: number;
  [key: string]: string | number;
};

const ResultsTV: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [races, setRaces] = useState<string[]>([]);
  const [selectedRace, setSelectedRace] = useState<string>();
  const [data, setData] = useState<ApiResultEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = "/signin";
    }
  }, [isAuthenticated]);

  // Load race names
  useEffect(() => {
    apiFetch(ENDPOINT_RACE_CONFIG)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ApiRaceConfig[]>;
      })
      .then((cfgs) => {
        const raceNames = cfgs.map((c) => c.RaceName);
        setRaces(raceNames);
        if (raceNames.length > 0) {
          setSelectedRace(raceNames[0]);
        }
      })
      .catch(() => {
        console.log("Using fake race configs");
        const raceNames = fakeRaceConfigs.map((c) => c.RaceName);
        setRaces(raceNames);
        if (raceNames.length > 0) {
          setSelectedRace(raceNames[0]);
        }
      });
  }, []);

  // Load results when race changes
  useEffect(() => {
    if (!selectedRace) {
      setData([]);
      return;
    }
    setLoading(true);
    apiFetch(`${ENDPOINT_RESULTS}/${encodeURIComponent(selectedRace)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ApiResultEntry[]>;
      })
      .then((json) => setData(json))
      .catch(() => {
        console.log("Using fake results data");
        const fakeResults = fakeResultsByRace[selectedRace] || [];
        setData(fakeResults as ApiResultEntry[]);
      })
      .finally(() => setLoading(false));
  }, [selectedRace]);

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

  const categories = data[0]
    ? Object.keys(data[0]).filter((k) => !["ID", "Username", "avatar"].includes(k))
    : [];

  const columns: TableProps<ApiResultEntry>["columns"] = [
    {
      title: "",
      dataIndex: "avatar",
      key: "avatar",
      width: 64,
      render: (src: string) => <Avatar src={src} size={48} />,
    },
    {
      title: "ID",
      dataIndex: "ID",
      key: "ID",
    },
    {
      title: "Username",
      dataIndex: "Username",
      key: "Username",
    },
    ...categories.map((cat) => ({
      title: cat,
      dataIndex: cat,
      key: cat,
    })),
    {
      title: "Total Points",
      key: "total",
      render: (_: any, rec: ApiResultEntry) =>
        categories.reduce((s, k) => s + Number(rec[k] || 0), 0),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#0A306D] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-[#0A306D] to-[#36598B] flex-shrink-0">
        <div>
          <h1 className="text-4xl font-bold text-white">🏁 Results TV</h1>
          <p className="text-[#4EA9D5] text-lg mt-1">Race: {selectedRace}</p>
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
          <Spin tip="Loading results…" />
        ) : (
          <Table<ApiResultEntry>
            dataSource={data}
            columns={columns}
            rowKey="ID"
            pagination={false}
            size="large"
            style={{ fontSize: "14px" }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-[#0A306D] to-[#36598B] px-6 py-3 border-t border-white/10 flex items-center justify-between flex-shrink-0">
        <p className="text-white text-sm">Total Competitors: {data.length}</p>
        <p className="text-[#4EA9D5] text-sm">
          {isScrolling ? `Scrolling ${scrollOffset}%` : "Complete"}
        </p>
      </div>
    </div>
  );
};

export default ResultsTV;
