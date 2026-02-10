import React, { useState } from "react";
import { Table, Avatar, InputNumber, Input, Button, Space, message } from "antd";
import { useTranslation } from "react-i18next";
import { ENDPOINT_POINTS } from "@/webapp/config/endpoints";
import { apiFetch } from "@/webapp/utils/api";
import type { Competitor } from "./types";

interface Props {
  competitors: Competitor[];
}

const KnowledgeTestTab: React.FC<Props> = ({ competitors }) => {
  const { t } = useTranslation();
  const [knowledgeRaceName, setKnowledgeRaceName] = useState<string>("knowledge_test");
  const [knowledgePointsMap, setKnowledgePointsMap] = useState<Record<number, number>>({});

  const submitKnowledgeScores = async () => {
    if (!knowledgeRaceName.trim()) {
      message.error("Enter a station/test name.");
      return;
    }
    const payloadArray = Object.entries(knowledgePointsMap).map(([idStr, pts]) => ({
      ID: Number(idStr),
      Points: pts,
    }));
    const payload = { RaceName: knowledgeRaceName.trim(), Points: payloadArray };
    try {
      const res = await apiFetch(ENDPOINT_POINTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      message.success("Knowledge test scores submitted.");
      setKnowledgePointsMap({});
    } catch (err: any) {
      message.error("Failed to submit knowledge scores: " + err.message);
    }
  };

  return (
    <div className="flex flex-col gap-y-6">
      <h2 className="text-white text-xl font-semibold">{t("points.knowledgeTest.title")}</h2>
      <p className="text-gray-300">{t("points.knowledgeTest.description")}</p>

      <Space style={{ marginBottom: 12 }}>
        <Input
          placeholder={t("points.raceName")}
          style={{ width: 250 }}
          value={knowledgeRaceName}
          onChange={(e) => setKnowledgeRaceName(e.target.value)}
        />
        <Button type="primary" onClick={submitKnowledgeScores}>
          {t("points.knowledgeTest.submitScore")}
        </Button>
      </Space>

      <Table<Competitor>
        dataSource={competitors}
        rowKey="id"
        pagination={false}
        size="middle"
        scroll={{ x: "max-content" }}
      >
        <Table.Column<Competitor> title={t("common.id")} dataIndex="id" key="id" width={80} />
        <Table.Column<Competitor>
          title={t("common.username")}
          key="username"
          render={(_, rec) => (
            <span style={{ display: "flex", alignItems: "center" }}>
              <Avatar src={rec.avatar} size={32} style={{ marginRight: 8 }} />
              <span>{rec.username}</span>
            </span>
          )}
        />
        <Table.Column<Competitor>
          title={t("common.totalPoints")}
          key="points"
          width={120}
          render={(_, rec) => (
            <InputNumber
              min={0}
              value={knowledgePointsMap[rec.id] || 0}
              onChange={(val) =>
                setKnowledgePointsMap((prev) => ({ ...prev, [rec.id]: typeof val === "number" ? val : 0 }))
              }
            />
          )}
        />
      </Table>
    </div>
  );
};

export default KnowledgeTestTab;
