// src/pages/EkoRace.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Button,
  Select,
  message,
  Avatar,
} from "antd";
import dayjs from "dayjs";
import '@ant-design/v5-patch-for-react-19';
import { ENDPOINT_COMPETITORS, ENDPOINT_COMPETITORS_START_RACE, ENDPOINT_COMPETITORS_FINISH } from "@/webapp/config/endpoints";
import { apiFetch } from "@/webapp/utils/api";
import { fakeCategoryCompetitors } from "@/webapp/data/fakeData";
import { useTranslation } from 'react-i18next';
import {
  addPenalty,
  getAttemptNo,
  getPenalty,
  getTeam,
  getTimeSpent,
  getValidity,
  timeToSeconds,
  toNumber,
} from "./resultsTableUtils";

type Competitor = {
  id: number;
  username: string;
  avatar?: string;
  startedAt?: string;   // ISO timestamp when this competitor’s timer was started
  finishedAt?: string;  // “MM:SS.CS” string when competitor finished
};

const EkoRace: React.FC = () => {
  const { t } = useTranslation();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [races] = useState<string[]>(["1", "2", "3"]);
  const [selectedLap, setSelectedLap] = useState<string>();
  const [pendingStart, setPendingStart] = useState<number | null>(null);
  const [pendingFinish, setPendingFinish] = useState<number | null>(null);
  const [tick, setTick] = useState(Date.now());

  // fetch competitors
  const fetchCompetitors = async () => {
    try {
      const res = await apiFetch(ENDPOINT_COMPETITORS);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCompetitors((await res.json()) as Competitor[]);
    } catch (err: any) {
      // Use fake data
      console.log("Using fake competitors for EkoRace");
      setCompetitors(fakeCategoryCompetitors);
    }
  };

  useEffect(() => {
    fetchCompetitors();
  }, []);

  // update tick for per-competitor timers
  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 100);
    return () => clearInterval(timer);
  }, []);

  // handle competitor start (with confirmation)
  const handleStartClick = (id: number) => {
    if (pendingStart === id) {
      performStart(id);
      setPendingStart(null);
    } else {
      setPendingStart(id);
      setTimeout(() => {
        if (pendingStart === id) setPendingStart(null);
      }, 3000);
    }
  };

  const performStart = async (id: number) => {
    // update locally
    setCompetitors(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, startedAt: new Date().toISOString(), finishedAt: undefined }
          : c
      )
    );
    message.success(`Competitor ${id} timer started`);

    // POST start with { raceName, ID }
    if (!selectedLap) {
      message.error("No lap selected for POST");
      return;
    }
    const raceName = `EkoRace${selectedLap}`;
    try {
      const payload = { raceName, ID: id };
      const res = await apiFetch(ENDPOINT_COMPETITORS_START_RACE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Start failed (${res.status})`);
      message.success(`Start posted for competitor ${payload.ID}` + ` in ${raceName}`);
    } catch (e: any) {
      message.error("Start post failed: " + e.message);
    }
  };

  // handle competitor finish (with confirmation)
  const handleFinishClick = (id: number) => {
    if (pendingFinish === id) {
      performFinish(id);
      setPendingFinish(null);
    } else {
      setPendingFinish(id);
      setTimeout(() => {
        if (pendingFinish === id) setPendingFinish(null);
      }, 3000);
    }
  };

  const performFinish = async (id: number) => {
    const competitor = competitors.find(c => c.id === id);
    if (!competitor?.startedAt) return;
    const startTime = dayjs(competitor.startedAt);
    const diff = dayjs().diff(startTime);
    const mm = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
    const ss = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
    const cs = String(Math.floor((diff % 1000) / 10)).padStart(2, "0");
    const finishString = `${mm}:${ss}.${cs}`;

    // update locally
    setCompetitors(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, finishedAt: finishString }
          : c
      )
    );

    // POST finish with { raceName, ID }
    if (!selectedLap) {
      message.error("No lap selected for POST");
      return;
    }

    try {
      const payload = {ID: id };
      const res = await apiFetch(ENDPOINT_COMPETITORS_FINISH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Finish failed (${res.status})`);
      message.success(`Finish posted for competitor ${id}`);
    } catch (e: any) {
      message.error("Finish post failed: " + e.message);
    }
  };

  const resultRows = useMemo(() => {
    const base = competitors.map((rec, index) => {
      const penalties = getPenalty(rec as any, index);
      const timeSpent = getTimeSpent(rec as any, tick);
      const totalTime = addPenalty(timeSpent, penalties);
      const usedEnergy = toNumber(
        (rec as any).usedEnergy ?? (rec as any).energy,
        0.35 + ((rec.id + index) % 6) * 0.08
      );
      const massKg = toNumber(
        (rec as any).massKg ?? (rec as any).mass ?? (rec as any).m,
        75 + ((rec.id + index) % 7) * 4
      );
      const distanceKm = toNumber(
        (rec as any).distanceKm ?? (rec as any).distance,
        1.0
      );
      const eValue = usedEnergy / Math.max(massKg, 1);
      const kmPerKwh = distanceKm / Math.max(usedEnergy, 0.001);
      return {
        key: rec.id,
        id: rec.id,
        team: getTeam(rec as any, `Team ${rec.id}`),
        timeSpent,
        avgSpeed: toNumber((rec as any).avgSpeed ?? (rec as any).speed, 22 + ((rec.id + index) % 8) * 1.5),
        penalties,
        totalTime,
        attemptNo: getAttemptNo(rec as any, index, selectedLap),
        isValid: getValidity(rec as any, index),
        usedEnergy,
        efficiencyText: `${eValue.toFixed(4)} kWh/kg | ${kmPerKwh.toFixed(2)} km/1kWh`,
        raw: rec,
      };
    });

    const ranked = [...base].sort((a, b) => {
      const aSeconds = timeToSeconds(a.totalTime);
      const bSeconds = timeToSeconds(b.totalTime);
      if (!Number.isFinite(aSeconds) && !Number.isFinite(bSeconds)) return a.id - b.id;
      if (!Number.isFinite(aSeconds)) return 1;
      if (!Number.isFinite(bSeconds)) return -1;
      return aSeconds - bSeconds;
    });

    const placeById = new Map<number, number>(ranked.map((entry, index) => [entry.id, index + 1]));
    return base.map((entry) => ({
      ...entry,
      place: placeById.get(entry.id) ?? "-",
    }));
  }, [competitors, selectedLap, tick]);

  const tableColumns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Team",
      dataIndex: "team",
      key: "team",
    },
    {
      title: "Time spend",
      dataIndex: "timeSpent",
      key: "timeSpent",
    },
    {
      title: "Avg speed",
      dataIndex: "avgSpeed",
      key: "avgSpeed",
      render: (value: number) => `${value.toFixed(1)} km/h`,
    },
    {
      title: "Penalties",
      dataIndex: "penalties",
      key: "penalties",
      render: (value: number) => `${value} s`,
    },
    {
      title: "Total time",
      dataIndex: "totalTime",
      key: "totalTime",
    },
    {
      title: "Place",
      dataIndex: "place",
      key: "place",
    },
    {
      title: "Attempt No",
      dataIndex: "attemptNo",
      key: "attemptNo",
    },
    {
      title: "Is valid",
      dataIndex: "isValid",
      key: "isValid",
      render: (value: boolean) => (value ? "Yes" : "No"),
    },
    {
      title: "Used energy",
      dataIndex: "usedEnergy",
      key: "usedEnergy",
      render: (value: number) => `${value.toFixed(3)} kWh`,
    },
    {
      title:
        "Efficiency (e): patērētā enerģija uz pilnas masas; info: nobraukums ar 1kWh",
      dataIndex: "efficiencyText",
      key: "efficiencyText",
    },
    {
      title: "Action",
      key: "action",
      align: "center" as const,
      render: (_: any, row: { raw: Competitor }) => {
        const rec = row.raw;
        if (rec.finishedAt) {
          // Completed
          return <span style={{ color: "#40a9ff", fontWeight: "bold" }}>Finished</span>;
        }
        if (rec.startedAt) {
          // Show finish button with confirmation
          const isPending = pendingFinish === rec.id;
          const label = isPending ? "Confirm Finish" : "FINISH";
          return (
            <Button
              type={isPending ? "default" : "primary"}
              danger={!isPending}
              onClick={() => handleFinishClick(rec.id)}
            >
              {label}
            </Button>
          );
        }
        // Show start button with confirmation
        const isPendingStart = pendingStart === rec.id;
        const startLabel = isPendingStart ? "Confirm Start" : "START";
        return (
          <Button
            type={isPendingStart ? "default" : "primary"}
            onClick={() => handleStartClick(rec.id)}
            disabled={!selectedLap}
          >
            {startLabel}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">⚙️ {t('stages.efficiency')} – {t('categories.efficiencyRace')}</h1>

      <div className="flex gap-x-12">
        <div className="flex-1 min-w-0">
          <h2 className="text-white text-xl font-semibold">{t('raceControl.competitors')}</h2>
          <Table
            dataSource={resultRows}
            columns={tableColumns}
            rowKey="key"
            pagination={false}
            size="middle"
          />
        </div>

        <div className="flex flex-col items-center ml-auto gap-y-4">
          <span className="text-white text-lg">{t('raceControl.chooseLap')}</span>
          <Select<string>
            placeholder="Lap"
            style={{ width: 220 }}
            value={selectedLap}
            onChange={setSelectedLap}
          >
            {races.map(r => (
              <Select.Option key={r} value={r}>
                {r}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
};

export default EkoRace



