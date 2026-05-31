import React, { useEffect, useMemo, useState } from "react";
import { Button, InputNumber, Select, Space, Switch, Table, message } from "antd";
import "@ant-design/v5-patch-for-react-19";
import { ENDPOINT_COMPETITORS, ENDPOINT_RESULTS } from "@/webapp/config/endpoints";
import { apiFetch } from "@/webapp/utils/api";
import { fakeCategoryCompetitors } from "@/webapp/data/fakeData";
import { useTranslation } from "react-i18next";
import { getTeam, getValidity, normalizeCategoryCompetitors, toNumber } from "./resultsTableUtils";

type Competitor = {
  id: number;
  username: string;
  team?: string;
  brakingDistance?: number;
  enteringSpeed?: number;
  attemptNo?: number;
  isValid?: boolean;
};

type BrakingEntry = {
  id: number;
  team: string;
  brakingDistance: number;
  enteringSpeed: number;
  isValid: boolean;
};

const CATEGORY_KEY = "BrakingTest";

const BrakingTest: React.FC = () => {
  const { t } = useTranslation();
  const [attempts, setAttempts] = useState<number[]>([1]);
  const [selectedAttempt, setSelectedAttempt] = useState<number>(1);
  const [attemptEntries, setAttemptEntries] = useState<Record<number, BrakingEntry[]>>({});
  const [submitting, setSubmitting] = useState(false);

  const toEntry = (rec: Competitor, index: number): BrakingEntry => ({
    id: rec.id,
    team: getTeam(rec as any, `Team ${rec.id}`),
    brakingDistance: toNumber(rec.brakingDistance, 2 + ((rec.id + index) % 6) * 0.35),
    enteringSpeed: toNumber(rec.enteringSpeed, 24 + ((rec.id + index) % 8) * 1.8),
    isValid: getValidity(rec as any, index),
  });

  useEffect(() => {
    const fetchCompetitors = async () => {
      let source: Competitor[];
      try {
        const res = await apiFetch(ENDPOINT_COMPETITORS);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        source = normalizeCategoryCompetitors(await res.json()) as Competitor[];
      } catch {
        source = fakeCategoryCompetitors as unknown as Competitor[];
      }

      const unique = Array.from(
        new Map(source.map((rec) => [rec.id, rec])).values()
      ) as Competitor[];
      const normalized = unique.map(toEntry);
      setAttemptEntries({ 1: normalized });
      setAttempts([1]);
      setSelectedAttempt(1);
    };
    fetchCompetitors();
  }, []);

  const currentEntries = attemptEntries[selectedAttempt] ?? [];

  const updateEntry = <K extends keyof BrakingEntry>(
    id: number,
    key: K,
    value: BrakingEntry[K]
  ) => {
    setAttemptEntries((prev) => {
      const rows = prev[selectedAttempt] ?? [];
      return {
        ...prev,
        [selectedAttempt]: rows.map((item) =>
          item.id === id ? { ...item, [key]: value } : item
        ),
      };
    });
  };

  const addAttempt = () => {
    const nextAttempt = (attempts.length ? Math.max(...attempts) : 0) + 1;
    const template = currentEntries.length ? currentEntries : attemptEntries[1] ?? [];
    const blank = template.map((entry) => ({
      ...entry,
      brakingDistance: 0,
      enteringSpeed: 0,
      isValid: true,
    }));
    setAttemptEntries((prev) => ({ ...prev, [nextAttempt]: blank }));
    setAttempts((prev) => [...prev, nextAttempt]);
    setSelectedAttempt(nextAttempt);
  };

  const submitAttempt = async () => {
    const payload = {
      category: CATEGORY_KEY,
      attemptNo: selectedAttempt,
      submittedAt: new Date().toISOString(),
      entries: currentEntries.map((row) => ({
        id: row.id,
        team: row.team,
        brakingDistance: row.brakingDistance,
        enteringSpeed: row.enteringSpeed,
        attemptNo: selectedAttempt,
        isValid: row.isValid,
      })),
    };

    setSubmitting(true);
    try {
      const res = await apiFetch(ENDPOINT_RESULTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      message.success(t("raceControl.submitSuccess"));
    } catch {
      const storageKey = `manual-category:${CATEGORY_KEY}`;
      const existingRaw = localStorage.getItem(storageKey);
      const existing = existingRaw ? JSON.parse(existingRaw) : {};
      existing[String(selectedAttempt)] = payload;
      localStorage.setItem(storageKey, JSON.stringify(existing));
      message.warning(t("raceControl.submitOfflineFallback"));
    } finally {
      setSubmitting(false);
    }
  };

  const resultRows = useMemo(
    () =>
      currentEntries.map((rec) => ({
        key: rec.id,
        id: rec.id,
        team: rec.team,
        brakingDistance: rec.brakingDistance,
        enteringSpeed: rec.enteringSpeed,
        attemptNo: selectedAttempt,
        isValid: rec.isValid,
      })),
    [currentEntries, selectedAttempt]
  );

  const columns = [
    {
      title: t("common.id"),
      dataIndex: "id",
      key: "id",
      sorter: (a: { id: number }, b: { id: number }) => a.id - b.id,
    },
    {
      title: t("raceControl.team"),
      dataIndex: "team",
      key: "team",
    },
    {
      title: t("raceControl.brakingDistance"),
      dataIndex: "brakingDistance",
      key: "brakingDistance",
      render: (value: number, row: { id: number }) => (
        <InputNumber
          min={0}
          step={0.01}
          value={value}
          onChange={(next) => updateEntry(row.id, "brakingDistance", typeof next === "number" ? next : 0)}
        />
      ),
    },
    {
      title: t("raceControl.enteringSpeed"),
      dataIndex: "enteringSpeed",
      key: "enteringSpeed",
      render: (value: number, row: { id: number }) => (
        <InputNumber
          min={0}
          step={0.1}
          value={value}
          onChange={(next) => updateEntry(row.id, "enteringSpeed", typeof next === "number" ? next : 0)}
        />
      ),
    },
    {
      title: t("raceControl.attemptNo"),
      dataIndex: "attemptNo",
      key: "attemptNo",
    },
    {
      title: t("raceControl.isValid"),
      dataIndex: "isValid",
      key: "isValid",
      render: (value: boolean, row: { id: number }) => (
        <Switch checked={value} onChange={(checked) => updateEntry(row.id, "isValid", checked)} />
      ),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">
        {t("stages.qualification")} - {t("categories.brakingTest")}
      </h1>

      <Space wrap className="mb-4">
        <span className="text-white">{t("raceControl.attempt")}</span>
        <Select<number>
          style={{ width: 120 }}
          value={selectedAttempt}
          onChange={setSelectedAttempt}
          options={attempts.map((attempt) => ({ value: attempt, label: attempt }))}
        />
        <Button onClick={addAttempt}>{t("raceControl.newAttempt")}</Button>
        <Button type="primary" onClick={submitAttempt} loading={submitting}>
          {t("points.submitManual")}
        </Button>
      </Space>

      <div className="flex-1 min-w-0">
        <h2 className="text-white text-xl font-semibold mb-4">{t("raceControl.competitors")}</h2>
        <Table dataSource={resultRows} columns={columns} rowKey="key" pagination={false} size="middle" />
      </div>
    </div>
  );
};

export default BrakingTest;
