import React, { useState } from "react";
import { Card, Avatar, Tag, InputNumber, Slider, Button, message } from "antd";
import { useTranslation } from "react-i18next";
import { ENDPOINT_POINTS } from "@/webapp/config/endpoints";
import { apiFetch } from "@/webapp/utils/api";
import type { Competitor, TechnicalScore } from "./types";

interface Props {
  competitors: Competitor[];
}

const TechnicalDesignTab: React.FC<Props> = ({ competitors }) => {
  const { t } = useTranslation();
  const [technicalScores, setTechnicalScores] = useState<Record<number, TechnicalScore>>({});

  const getWeightedScore = (score: TechnicalScore): number =>
    score.design * 0.4 + score.team * 0.3 + score.additional * 0.3;

  const updateTechnicalScore = (competitorId: number, field: keyof TechnicalScore, value: number) => {
    setTechnicalScores((prev) => ({
      ...prev,
      [competitorId]: {
        ...(prev[competitorId] || { design: 0, team: 0, additional: 0 }),
        [field]: value,
      },
    }));
  };

  const submitTechnicalScores = async () => {
    const payloadArray = Object.entries(technicalScores).map(([idStr, score]) => ({
      ID: Number(idStr),
      Points: Math.round(getWeightedScore(score) * 10) / 10,
    }));
    const payload = { RaceName: "technical_design", Points: payloadArray };
    try {
      const res = await apiFetch(ENDPOINT_POINTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      message.success("Technical design scores submitted.");
    } catch (err: any) {
      message.error("Failed to submit technical scores: " + err.message);
    }
  };

  return (
    <div className="flex flex-col gap-y-6">
      <h2 className="text-white text-xl font-semibold">{t("points.technicalDesign.title")}</h2>
      <p className="text-gray-300">{t("points.technicalDesign.description")}</p>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {competitors.map((comp) => {
          const score = technicalScores[comp.id] || { design: 0, team: 0, additional: 0 };
          const weighted = getWeightedScore(score);

          return (
            <Card
              key={comp.id}
              className="border-0"
              style={{ backgroundColor: "rgba(10, 48, 109, 0.6)", borderRadius: 12 }}
              styles={{ body: { padding: 20 } }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Avatar src={comp.avatar} size={40} />
                <div>
                  <span className="text-white font-semibold text-lg">{comp.username}</span>
                  <Tag color="blue" className="ml-2">{comp.ageGroup}</Tag>
                </div>
              </div>

              {/* Design (40%) */}
              <div className="mb-3">
                <div className="flex justify-between items-center text-white mb-1">
                  <span className="font-medium">{t("points.technicalDesign.criteriaDesign")}</span>
                  <InputNumber
                    min={0} max={10} value={score.design}
                    onChange={(val) => updateTechnicalScore(comp.id, "design", typeof val === "number" ? val : 0)}
                    style={{ width: 60 }}
                  />
                </div>
                <p className="text-gray-400 text-xs mb-1">{t("points.technicalDesign.criteriaDesignDesc")}</p>
                <Slider
                  min={0} max={10} step={1} value={score.design}
                  onChange={(val) => updateTechnicalScore(comp.id, "design", val)}
                  styles={{ track: { backgroundColor: "#4EA9D5" }, rail: { backgroundColor: "rgba(255,255,255,0.15)" } }}
                />
              </div>

              {/* Team (30%) */}
              <div className="mb-3">
                <div className="flex justify-between items-center text-white mb-1">
                  <span className="font-medium">{t("points.technicalDesign.criteriaTeam")}</span>
                  <InputNumber
                    min={0} max={10} value={score.team}
                    onChange={(val) => updateTechnicalScore(comp.id, "team", typeof val === "number" ? val : 0)}
                    style={{ width: 60 }}
                  />
                </div>
                <p className="text-gray-400 text-xs mb-1">{t("points.technicalDesign.criteriaTeamDesc")}</p>
                <Slider
                  min={0} max={10} step={1} value={score.team}
                  onChange={(val) => updateTechnicalScore(comp.id, "team", val)}
                  styles={{ track: { backgroundColor: "#4EA9D5" }, rail: { backgroundColor: "rgba(255,255,255,0.15)" } }}
                />
              </div>

              {/* Additional Solutions (30%) */}
              <div className="mb-3">
                <div className="flex justify-between items-center text-white mb-1">
                  <span className="font-medium">{t("points.technicalDesign.criteriaAdditional")}</span>
                  <InputNumber
                    min={0} max={10} value={score.additional}
                    onChange={(val) => updateTechnicalScore(comp.id, "additional", typeof val === "number" ? val : 0)}
                    style={{ width: 60 }}
                  />
                </div>
                <p className="text-gray-400 text-xs mb-1">{t("points.technicalDesign.criteriaAdditionalDesc")}</p>
                <Slider
                  min={0} max={10} step={1} value={score.additional}
                  onChange={(val) => updateTechnicalScore(comp.id, "additional", val)}
                  styles={{ track: { backgroundColor: "#4EA9D5" }, rail: { backgroundColor: "rgba(255,255,255,0.15)" } }}
                />
              </div>

              {/* Weighted Score */}
              <div className="flex justify-between items-center mt-2 pt-3 border-t border-white/20">
                <span className="text-white font-semibold">{t("points.technicalDesign.weightedScore")}</span>
                <span className="text-2xl font-bold text-[#4EA9D5]">{weighted.toFixed(1)}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {competitors.length > 0 && (
        <Button type="primary" size="large" onClick={submitTechnicalScores} className="self-start">
          {t("points.technicalDesign.submitAll")}
        </Button>
      )}
    </div>
  );
};

export default TechnicalDesignTab;
