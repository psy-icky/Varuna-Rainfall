import React from 'react';
import { AlertTriangle, ShieldCheck, AlertOctagon } from 'lucide-react';
import { CalibrationStatus } from '../../types';

interface ThresholdCardsProps {
  p64_5: number;
  p115_6: number;
  p204_5: number;
  calibrationStatus: CalibrationStatus;
}

export const ThresholdCards: React.FC<ThresholdCardsProps> = ({
  p64_5,
  p115_6,
  p204_5,
  calibrationStatus
}) => {
  const getCalibBadge = () => {
    switch (calibrationStatus) {
      case 'GREEN':
        return (
          <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Calibrated (Green)
          </span>
        );
      case 'AMBER':
        return (
          <span className="text-[10px] font-medium text-amber-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Limited Support (Amber)
          </span>
        );
      case 'ABSTAIN':
        return (
          <span className="text-[10px] font-medium text-red-400 flex items-center gap-1">
            <AlertOctagon className="w-3 h-3" /> Abstain (Degraded)
          </span>
        );
    }
  };

  const thresholds = [
    {
      category: 'HEAVY RAINFALL',
      cutoff: '≥ 64.5 mm/day',
      probability: p64_5,
      color: 'from-amber-500/20 to-amber-600/10',
      border: 'border-amber-800/40',
      textAccent: 'text-amber-400',
      barColor: 'bg-amber-500'
    },
    {
      category: 'VERY HEAVY',
      cutoff: '≥ 115.6 mm/day',
      probability: p115_6,
      color: 'from-orange-500/20 to-orange-600/10',
      border: 'border-orange-800/40',
      textAccent: 'text-orange-400',
      barColor: 'bg-orange-500'
    },
    {
      category: 'EXTREMELY HEAVY',
      cutoff: '≥ 204.5 mm/day',
      probability: p204_5,
      color: 'from-red-500/20 to-red-600/10',
      border: 'border-red-800/40',
      textAccent: 'text-red-400',
      barColor: 'bg-red-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {thresholds.map((t, idx) => {
        const percent = Math.round(t.probability * 100);
        return (
          <div
            key={idx}
            className={`p-4 rounded-2xl bg-gradient-to-b ${t.color} bg-[#111827] border ${t.border} flex flex-col justify-between space-y-3`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                  {t.category}
                </span>
                <div className="text-sm font-semibold text-gray-200">{t.cutoff}</div>
              </div>
              {getCalibBadge()}
            </div>

            <div className="flex items-baseline justify-between">
              <span className={`text-3xl font-extrabold font-mono ${t.textAccent}`}>
                {percent}%
              </span>
              <span className="text-xs text-gray-400">exceedance probability</span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-gray-800/80 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${t.barColor}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
