import React from 'react';
import { DayForecastItem } from '../../types';

interface FiveDayTableProps {
  days: DayForecastItem[];
}

export const FiveDayTable: React.FC<FiveDayTableProps> = ({ days }) => {
  return (
    <div className="rounded-2xl bg-[#111827] border border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h3 className="font-semibold text-sm text-gray-100">5-Day Scenario Outlook</h3>
        <p className="text-xs text-gray-400">Deterministic scenario trajectory under current synoptic regime persistence</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-900/80 text-gray-400 font-mono text-[11px] uppercase border-b border-gray-800">
            <tr>
              <th className="py-3 px-4">Day</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">q50 (Expected)</th>
              <th className="py-3 px-4">q10 – q90 Span</th>
              <th className="py-3 px-4">P(≥64.5)</th>
              <th className="py-3 px-4">P(≥115.6)</th>
              <th className="py-3 px-4">P(≥204.5)</th>
              <th className="py-3 px-4">Regime</th>
              <th className="py-3 px-4">Provenance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 font-medium">
            {days.map((item) => (
              <tr key={item.day} className="hover:bg-gray-800/30 transition-colors">
                <td className="py-3 px-4 font-mono text-cyan-400">Day +{item.day}</td>
                <td className="py-3 px-4 text-gray-300 font-mono">{item.date}</td>
                <td className="py-3 px-4 font-bold text-gray-100 font-mono">{item.q50_mm} mm</td>
                <td className="py-3 px-4 text-gray-400 font-mono">
                  {item.q10_mm} – {item.q90_mm} mm
                </td>
                <td className="py-3 px-4 font-mono font-semibold text-amber-400">
                  {Math.round(item.p64_5 * 100)}%
                </td>
                <td className="py-3 px-4 font-mono font-semibold text-orange-400">
                  {Math.round(item.p115_6 * 100)}%
                </td>
                <td className="py-3 px-4 font-mono font-semibold text-red-400">
                  {Math.round(item.p204_5 * 100)}%
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-gray-800 text-gray-300 border border-gray-700">
                    {item.dominant_regime}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-[10px] text-gray-500 truncate max-w-[150px]">
                  {item.provenance}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
