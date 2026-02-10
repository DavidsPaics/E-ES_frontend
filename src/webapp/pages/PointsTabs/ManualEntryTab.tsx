import React, { useState } from "react";
import { Table, Avatar, InputNumber, Input, Button, Space, message } from "antd";
import { useTranslation } from "react-i18next";
import { ENDPOINT_POINTS } from "@/webapp/config/endpoints";
import { apiFetch } from "@/webapp/utils/api";
import type { Competitor } from "./types";

interface Props {
  competitors: Competitor[];
}

const ManualEntryTab: React.FC<Props> = ({ competitors }) => {
  const { t } = useTranslation();
  const [manualRaceName, setManualRaceName] = useState<string>("");
  const [manualPointsMap, setManualPointsMap] = useState<Record<number, number>>({});

  const submitManualPoints = async () => {
    if (!manualRaceName.trim()) {
      message.error("Please enter a race name.");
      return;
    }
    const payload = {
      RaceName: manualRaceName.trim(),
      Points: competitors.map((comp) => ({
        ID: comp.id,
        Points: manualPointsMap[comp.id] || 0,
      })),
    };
    try {
      const res = await apiFetch(ENDPOINT_POINTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      message.success("Manual points submitted successfully.");
      setManualRaceName("");
      setManualPointsMap({});
    } catch (err: any) {
      message.error("Failed to submit manual points: " + err.message);
      console.log("Payload:", payload);
    }
  };

  return (
    <div className="flex flex-col gap-y-6">
      <h2 className="text-white text-xl font-semibold">{t("points.manualEntry")}</h2>

      <Space style={{ marginBottom: 12 }}>
        <Input
          placeholder={t("points.raceName")}
          style={{ width: 200 }}
          value={manualRaceName}
          onChange={(e) => setManualRaceName(e.target.value)}
        />
        <Button type="primary" onClick={submitManualPoints}>
          {t("points.submitManual")}
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
              value={manualPointsMap[rec.id] || 0}
              onChange={(val) =>
                setManualPointsMap((prev) => ({ ...prev, [rec.id]: typeof val === "number" ? val : 0 }))
              }
            />
          )}
        />
      </Table>
    </div>
  );
};

export default ManualEntryTab;
