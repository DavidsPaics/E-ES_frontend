// src/pages/Points.tsx

import React, { useEffect, useState } from "react";
import { Tabs } from "antd";
import "@ant-design/v5-patch-for-react-19";
import { ENDPOINT_COMPETITORS } from "@/webapp/config/endpoints";
import { apiFetch } from "@/webapp/utils/api";
import { fakeCompetitors as fakeCompetitorsList } from "@/webapp/data/fakeData";
import { useTranslation } from "react-i18next";
import type { Competitor } from "./PointsTabs/types";

import RaceResultsTab from "./PointsTabs/RaceResultsTab";
import TechnicalDesignTab from "./PointsTabs/TechnicalDesignTab";
import KnowledgeTestTab from "./PointsTabs/KnowledgeTestTab";
import ManualEntryTab from "./PointsTabs/ManualEntryTab";
import AdminTab from "./PointsTabs/AdminTab";

const Points: React.FC = () => {
  const { t } = useTranslation();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);

  useEffect(() => {
    const fetchCompetitors = async () => {
      try {
        const res = await apiFetch(ENDPOINT_COMPETITORS);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw: Competitor[] = (await res.json()) as Competitor[];
        setCompetitors(raw);
      } catch {
        console.log("Using fake competitors for Points");
        const fakeComps: Competitor[] = fakeCompetitorsList.map((c) => ({
          id: parseInt(c.id),
          username: c.username,
          avatar: c.avatar,
          U: c.U,
          I: c.I,
          m: c.m,
          ageGroup: c.ageGroup,
        }));
        setCompetitors(fakeComps);
      }
    };
    fetchCompetitors();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">{t("points.header")}</h1>
      <div className="flex flex-col gap-y-6 w-full max-w-[1200px]">
          <Tabs
            type="card"
            className="points-tabs"
            items={[
              {
                key: "race-results",
                label: t("points.tabRaceResults"),
                children: <RaceResultsTab />,
              },
              {
                key: "technical-design",
                label: t("points.tabTechnicalDesign"),
                children: <TechnicalDesignTab competitors={competitors} />,
              },
              {
                key: "knowledge-test",
                label: t("points.tabKnowledgeTest"),
                children: <KnowledgeTestTab competitors={competitors} />,
              },
              {
                key: "manual-entry",
                label: t("points.tabManualEntry"),
                children: <ManualEntryTab competitors={competitors} />,
              },
              {
                key: "admin",
                label: t("points.tabAdmin"),
                children: <AdminTab />,
              },
            ]}
          />
      </div>
    </div>
  );
};

export default Points;

