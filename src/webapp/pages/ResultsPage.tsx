import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Select, Spin, Table } from "antd";
import { FullscreenExitOutlined, FullscreenOutlined } from "@ant-design/icons";
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

const ResultsPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedRace, setSelectedRace] = useState<RaceKey>("DragRace");
  const [allResults, setAllResults] = useState<RaceResultRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [expandedView, setExpandedView] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(undefined);

    apiFetch(ENDPOINT_RACE_RESULTS_ALL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((payload) => setAllResults(normalizeRaceResults(payload)))
      .catch((err: unknown) => {
        const text = err instanceof Error ? err.message : t("results.error");
        setError(text);
        setAllResults([]);
      })
      .finally(() => setLoading(false));
  }, [t]);

  const data = useMemo(
    () => allResults.filter((row) => row.raceName === selectedRace),
    [allResults, selectedRace]
  );

  const columns = useMemo(() => {
    const definitions = getVisibleColumnDefinitions(data, getColumnDefinitions(t));
    return buildRaceResultColumns(definitions, t);
  }, [data, t]);

  if (error) return <Alert type="error" message={t("results.error")} description={error} />;
  if (loading) return <Spin tip={t("results.loading")} style={{ margin: 50 }} />;

  const table = (
    <Table<RaceResultRow>
      dataSource={data}
      columns={columns}
      rowKey="key"
      pagination={false}
      size="middle"
      scroll={{ x: "max-content" }}
    />
  );

  if (expandedView) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0A306D] overflow-auto sm:mt-0 mt-16">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">{getRaceLabel(selectedRace)}</h2>
          <Button
            icon={<FullscreenExitOutlined />}
            onClick={() => setExpandedView(false)}
            style={{ background: "transparent", border: "none", color: "white" }}
          />
        </div>
        <div className="px-6 pb-12">{table}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">{t("results.header")}</h1>
      <div className="flex-1">
        <div className="mb-4 flex items-center gap-4">
          <span className="text-white text-lg">{t("results.chooseRace")}</span>
          <Select<RaceKey>
            placeholder={t("results.selectRace")}
            className="w-72"
            value={selectedRace}
            onChange={setSelectedRace}
            options={RACE_OPTIONS}
          />
        </div>

        <div className="bg-[#36598B]/30 backdrop-blur-md p-4 rounded-xl shadow-lg overflow-x-auto flex flex-col">
          <div className="flex justify-end mb-2">
            <Button
              size="small"
              icon={<FullscreenOutlined />}
              onClick={() => setExpandedView(true)}
              style={{ background: "transparent", border: "none" }}
            />
          </div>
          {table}
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
