import React from "react";
import { Card, Typography } from "antd";
import Logo from "@/assets/Logo.png";

const { Title, Text } = Typography;

type PaletteColor = {
  hex: string;
  name: string;
  role: string;
  textClass: string;
};

const palette: PaletteColor[] = [
  { hex: "#003264", name: "Deep Energy", role: "Primary", textClass: "text-white" },
  { hex: "#1D5288", name: "Structural Blue", role: "Secondary", textClass: "text-white" },
  { hex: "#00AEEF", name: "Efficiency Cyan", role: "Accent", textClass: "text-white" },
  { hex: "#72B5E0", name: "Reflective Blue", role: "Accent", textClass: "text-[#003264]" },
  { hex: "#D9EAF4", name: "Frost Neutral", role: "Neutral", textClass: "text-[#003264]" },
  { hex: "#FFFFFF", name: "Pure Base", role: "Base", textClass: "text-[#003264]" },
];

const ColorPalette: React.FC = () => {
  return (
    <div className="p-6 bg-[#FCFDFD] min-h-screen text-[#0A306D]">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "#0A306D" }}>Brand Color Palette</h1>

      <div>
          <div className="max-w-5xl">
            <div className="mb-4">
              <Title level={2} className="!m-0" style={{ color: "#0A306D" }}>
                Company colors
              </Title>
              <Text style={{ color: "#36598B" }}>
                Swatches for primary, secondary, accents, and neutrals.
              </Text>
            </div>

            <div className="mt-6 flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {palette.map((c) => (
                    <Card
                      key={c.hex}
                      className="border"
                      styles={{
                        body: { padding: 12 },
                      }}
                    >
                      <div
                        className={`h-28 rounded-md flex items-end p-3 ${c.textClass}`}
                        style={{ backgroundColor: c.hex, border: "1px solid #A6C1CC" }}
                      >
                        <div className="leading-tight">
                          <div className="font-semibold">{c.name}</div>
                          <div className="text-sm opacity-90">{c.role}</div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="text-sm" style={{ color: "#36598B" }}>
                          Hex
                        </div>
                        <div className="font-mono" style={{ color: "#0A306D" }}>
                          {c.hex}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="lg:w-120 lg:shrink-0">
                <div className="lg:sticky" style={{ top: 96 }}>
                    <img src={Logo} alt="Company Logo"  style={{ width: "300%" }} />
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default ColorPalette;
