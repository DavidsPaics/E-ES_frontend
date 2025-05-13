import React from "react";

interface Props {
  voltage: number; // total pack voltage (3 × 18 V)
}

// thresholds per battery ×3
const voltageThresholds = [
  16.5 * 3, // → 1 bar
  18.0 * 3, // → 2 bars
  19.0 * 3, // → 3 bars
  20.0 * 3, // → 4 bars
];

const getBarCount = (v: number): number => {
  if (v < voltageThresholds[0]) return 0;
  if (v < voltageThresholds[1]) return 1;
  if (v < voltageThresholds[2]) return 2;
  if (v < voltageThresholds[3]) return 3;
  return 4;
};

const getBarColor = (bars: number): string => {
  if (bars >= 3) return "#00ff00";   // green
  if (bars === 2) return "#ffff00";  // yellow
  if (bars === 1) return "#ff0000";  // red
  return "#444";                     // off
};

const MakitaBatteryIndicator: React.FC<Props> = ({ voltage }) => {
  const bars = getBarCount(voltage);
  const fillColor = getBarColor(bars);

  // borderColor logic: red at 1 bar, white at 2–4, flashing at 0
  const staticBorderColor = bars === 1
    ? "transparent"
    : "transparent";

  // only animate border at 0 bars
  const borderAnimation = bars === 0
    ? "flashBorder 1s infinite"
    : undefined;

  const keyframes = `
    @keyframes flashBorder {
      0%,100% { border-color: red; }
      50%    { border-color: transparent; }
    }
  `;

  return (
    <>
      <style>{keyframes}</style>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px",
          backgroundColor: "transparent",
          border: `2px solid ${staticBorderColor}`,
          borderRadius: "4px",
          width: "100px",
          boxSizing: "border-box",
          animation: borderAnimation,
        }}
      >
        {/* Bars container */}
        <div
          style={{
            display: "flex",
            gap: "2px",
            width: "66px", // 4 bars × 10px + 3 gaps × 3px
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: "0 0 10px",
                height: "18px",
                backgroundColor: i < bars ? fillColor : "#444",
                border: "1px solid black",
                borderRadius: "3px",
              }}
            />
          ))}
        </div>

        {/* Voltage readout */}
        <div
          style={{
            flex: "1 1 0",
            textAlign: "right",
            color: "#0f0f0f",
            fontSize: "0.8rem",
            whiteSpace: "nowrap",
          }}
        >
          {voltage.toFixed(1)} V
        </div>
      </div>
    </>
  );
};

export default MakitaBatteryIndicator;
