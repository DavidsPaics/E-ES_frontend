import React, { useEffect, useMemo, useState } from "react";
import { Alert, Select, Spin, Table } from "antd";
import type { TableProps } from "antd";
import { useAuth } from "@/webapp/authentification/AuthContext";
import { ENDPOINT_RACE_RESULTS_ALL } from "@/webapp/config/endpoints";
import { apiFetch } from "@/webapp/utils/api";
import {
  RACE_OPTIONS,
  buildRaceResultColumns,
  getColumnDefinitions,
  getRaceLabel,
  getVisibleColumnDefinitions,
  normalizeRaceResults,
  type RaceKey,
  type RaceResultRow,
} from "@/webapp/utils/raceResults";
import { useTranslation } from "react-i18next";

const ResultsTV: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [selectedRace, setSelectedRace] = useState<RaceKey>("DragRace");
  const [allResults, setAllResults] = useState<RaceResultRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = "/signin";
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    apiFetch(ENDPOINT_RACE_RESULTS_ALL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((payload) => setAllResults(normalizeRaceResults(payload)))
      .catch((err: unknown) => {
        const text = err instanceof Error ? err.message : "Failed to load results";
        setError(text);
        setAllResults([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const data = useMemo(
    () => allResults.filter((row) => row.raceName === selectedRace),
    [allResults, selectedRace]
  );

  const columns = useMemo<TableProps<RaceResultRow>["columns"]>(() => {
    const definitions = getVisibleColumnDefinitions(data, getColumnDefinitions(t));
    return buildRaceResultColumns(definitions, t);
  }, [data, t]);

  useEffect(() => {
    if (!containerRef.current || loading) return;

    const container = containerRef.current;
    container.scrollTop = 0;
    setScrollOffset(0);

    const initTimeout = setTimeout(() => {
      const maxScroll = container.scrollHeight - container.clientHeight;

      if (maxScroll > 10) {
        setIsScrolling(true);
        const scrollDuration = 30000;
        let startTime: number | null = null;
        let animationFrame: number;

        const animateScroll = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const progress = Math.min(elapsed / scrollDuration, 1);
          const easeProgress =
            progress < 0.5
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
      }

      setIsScrolling(false);
    }, 500);

    return () => clearTimeout(initTimeout);
  }, [data, loading]);

  if (error) {
    return <Alert type="error" message="Error" description={error} />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0A306D] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-[#0A306D] to-[#36598B] flex-shrink-0">
        <div>
          <h1 className="text-4xl font-bold text-white">Results TV</h1>
          <p className="text-[#4EA9D5] text-lg mt-1">Race: {getRaceLabel(selectedRace)}</p>
        </div>
        <div className="flex items-center gap-4">
          <Select<RaceKey>
            className="w-72"
            value={selectedRace}
            onChange={setSelectedRace}
            options={RACE_OPTIONS}
          />
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-hidden px-6 py-4">
        {loading ? (
          <Spin tip="Loading results..." />
        ) : (
          <Table<RaceResultRow>
            dataSource={data}
            columns={columns}
            rowKey="key"
            pagination={false}
            size="large"
            style={{ fontSize: "14px" }}
          />
        )}
      </div>

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
