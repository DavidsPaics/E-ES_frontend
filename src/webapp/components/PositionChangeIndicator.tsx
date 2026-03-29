import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface PositionChangeIndicatorProps {
  position_change: number;
}

const PositionChangeIndicator: React.FC<PositionChangeIndicatorProps> = ({ position_change }) => {
  if (position_change === 0) {
    return null;
  }

  const isUp = position_change > 0;
  const ArrowIcon = isUp ? ArrowUp : ArrowDown;
  const colorClass = isUp ? 'text-green-500' : 'text-red-500';
  const displayValue = isUp ? `+${position_change}` : `${position_change}`;

  return (
    <div className="flex items-center space-x-1">
      <ArrowIcon className={`w-4 h-4 ${colorClass}`} />
      <span className={`font-medium ${colorClass}`}>{displayValue}</span>
    </div>
  );
};

export default PositionChangeIndicator;
