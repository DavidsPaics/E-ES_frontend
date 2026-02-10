import React from "react";
import { Input, Button, Space, Divider, message } from "antd";
import { useTranslation } from "react-i18next";
import { ENDPOINT_POINTS } from "@/webapp/config/endpoints";
import { apiFetch } from "@/webapp/utils/api";

const AdminTab: React.FC = () => {
  const { t } = useTranslation();

  const deletePointsForRace = async (raceName: string) => {
    try {
      const res = await apiFetch(ENDPOINT_POINTS, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ RaceName: raceName }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      message.success(`Points for "${raceName}" deleted.`);
    } catch (err: any) {
      message.error("Failed to delete points: " + err.message);
    }
  };

  const resetLeaderboard = async () => {
    try {
      const res = await apiFetch(ENDPOINT_POINTS, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      message.success("Leaderboard relative position reset.");
    } catch (err: any) {
      message.error("Failed to reset leaderboard: " + err.message);
    }
  };

  return (
    <div className="flex flex-col gap-y-6">
      <h2 className="text-white text-xl font-semibold">{t("points.deleteByRace")}</h2>
      <Space align="center" style={{ marginBottom: 16 }}>
        <Input
          placeholder={t("points.raceToDelete")}
          style={{ width: 200 }}
          id="delete-race-input"
          onPressEnter={(e) => {
            const val = (e.target as HTMLInputElement).value.trim();
            if (val) {
              deletePointsForRace(val);
              (e.target as HTMLInputElement).value = "";
            }
          }}
        />
        <Button
          danger
          onClick={() => {
            const input = document.getElementById("delete-race-input") as HTMLInputElement;
            const val = input?.value.trim();
            if (val) {
              deletePointsForRace(val);
              input.value = "";
            } else {
              message.error("Please enter a race name to delete.");
            }
          }}
        >
          {t("points.deletePoints")}
        </Button>
      </Space>

      <Divider />

      <h2 className="text-white text-xl font-semibold">{t("points.resetLeaderboard")}</h2>
      <Button danger onClick={resetLeaderboard}>
        {t("points.resetRelativePosition")}
      </Button>
    </div>
  );
};

export default AdminTab;
