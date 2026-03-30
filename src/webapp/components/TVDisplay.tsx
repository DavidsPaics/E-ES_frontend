import React, { useEffect, useState, useRef } from "react";
import { Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";

interface TVDisplayProps {
  title: string;
  groups: string[];
  renderTable: (group: string) => React.ReactNode;
  onClose: () => void;
}

const TVDisplay: React.FC<TVDisplayProps> = ({ title, groups, renderTable, onClose }) => {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollComplete, setScrollComplete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const groupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const currentGroup = groups[currentGroupIndex];

  // Smooth scroll using requestAnimationFrame - NO LOOP, single pass
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.scrollTop = 0;
    setScrollProgress(0);
    setScrollComplete(false);

    // Wait a moment for content to render
    const initTimeout = setTimeout(() => {
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const maxScroll = scrollHeight - clientHeight;

      if (maxScroll > 10) {
        // Content needs scrolling - scroll once slowly (30 seconds for full scroll)
        setIsScrolling(true);
        const scrollDuration = 15000; // 30 seconds for full scroll
        startTimeRef.current = null;

        const animateScroll = (timestamp: number) => {
          if (!startTimeRef.current) startTimeRef.current = timestamp;
          const elapsed = timestamp - startTimeRef.current;
          const progress = Math.min(elapsed / scrollDuration, 1);

          // Ease-in-out function for smoother motion
          const easeProgress = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          const newScrollTop = easeProgress * maxScroll;
          container.scrollTop = newScrollTop;
          setScrollProgress(Math.round(progress * 100));

          if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(animateScroll);
          } else {
            // Scroll complete - wait 5 seconds then move to next group
            setIsScrolling(false);
            setScrollComplete(true);
            groupTimerRef.current = setTimeout(() => {
              if (currentGroupIndex < groups.length - 1) {
                setCurrentGroupIndex(prev => prev + 1);
              }
            }, 5000);
          }
        };

        animationFrameRef.current = requestAnimationFrame(animateScroll);
      } else {
        // Content fits on screen - wait 15 seconds then move to next group
        setIsScrolling(false);
        groupTimerRef.current = setTimeout(() => {
          if (currentGroupIndex < groups.length - 1) {
            setCurrentGroupIndex(prev => prev + 1);
          }
        }, 15000);
      }
    }, 500);

    return () => {
      clearTimeout(initTimeout);
      if (groupTimerRef.current) clearTimeout(groupTimerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [currentGroupIndex, groups.length]);

  const isLastGroup = currentGroupIndex === groups.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-[#0A306D] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-[#0A306D] to-[#36598B] flex-shrink-0">
        <div>
          <h1 className="text-4xl font-bold text-white">{title}</h1>
          <p className="text-[#4EA9D5] text-lg mt-1">Age Group: "{currentGroup}"</p>
        </div>
        <Button
          size="large"
          icon={<CloseOutlined />}
          onClick={onClose}
          style={{ background: "transparent", border: "none", color: "white" }}
        />
      </div>

      {/* Content Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden px-6 py-4"
      >
        {renderTable(currentGroup)}
      </div>

      {/* Footer with group indicator */}
      <div className="bg-gradient-to-r from-[#0A306D] to-[#36598B] px-6 py-3 border-t border-white/10 flex items-center justify-between flex-shrink-0">
        <p className="text-white text-sm">
          Group {currentGroupIndex + 1} / {groups.length}
        </p>
        <div className="flex gap-1">
          {groups.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 w-8 rounded-full transition-all ${
                idx < currentGroupIndex ? "bg-green-500" : idx === currentGroupIndex ? "bg-[#4EA9D5]" : "bg-white/20"
              }`}
            />
          ))}
        </div>
        <p className="text-[#4EA9D5] text-sm">
          {isScrolling ? `Scrolling ${scrollProgress}%` : scrollComplete && isLastGroup ? "Complete" : "Waiting..."}
        </p>
      </div>
    </div>
  );
};

export default TVDisplay;
