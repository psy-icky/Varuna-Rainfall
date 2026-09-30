import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';

interface DistributionChartProps {
  rawRainMm: number;
  expectedRainMm: number;
  observedRainMm: number | null;
  q10Mm: number;
  q50Mm: number;
  q90Mm: number;
  uncertaintyMm: number;
  correctionMethod: string;
}

export const DistributionChart: React.FC<DistributionChartProps> = ({
  rawRainMm,
  expectedRainMm,
  observedRainMm,
  q10Mm,
  q50Mm,
  q90Mm,
  uncertaintyMm,
  correctionMethod
}) => {
  const chartData = [
    { name: 'Raw NWP', rainfall: rawRainMm, type: 'raw' },
    { name: 'Corrected q10', rainfall: q10Mm, type: 'quantile' },
    { name: 'Corrected q50', rainfall: q50Mm, type: 'calibrated' },
    { name: 'Corrected q90', rainfall: q90Mm, type: 'quantile' },
    ...(observedRainMm !== null ? [{ name: 'Observed (Retrospective)', rainfall: observedRainMm, type: 'observed' }] : [])
  ];

  return (
    <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-sm text-gray-100">Forecast Quantile Comparison</h3>
          <p className="text-xs text-gray-400">
            Method: <span className="font-mono text-cyan-400">{correctionMethod}</span> · Uncertainty Span (q90-q10): <span className="font-mono text-cyan-300 font-semibold">{uncertaintyMm} mm</span>
          </p>
        </div>

        {/* Quantile chips */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-1 rounded bg-gray-800 text-gray-300 border border-gray-700">
            q10: {q10Mm}mm
          </span>
          <span className="px-2 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
            q50: {q50Mm}mm
          </span>
          <span className="px-2 py-1 rounded bg-gray-800 text-gray-300 border border-gray-700">
            q90: {q90Mm}mm
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#6B7280"
              fontSize={11}
              tickLine={false}
              angle={-10}
              textAnchor="end"
            />
            <YAxis
              stroke="#6B7280"
              fontSize={11}
              tickLine={false}
              unit=" mm"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                borderColor: '#374151',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(val: number) => [`${val} mm`, 'Rainfall']}
            />
            {/* IMD Threshold reference lines */}
            <ReferenceLine y={64.5} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: 'Heavy (64.5)', fill: '#F59E0B', fontSize: 10 }} />
            <ReferenceLine y={115.6} stroke="#F97316" strokeDasharray="4 4" label={{ value: 'Very Heavy (115.6)', fill: '#F97316', fontSize: 10 }} />
            <Bar dataKey="rainfall" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => {
                let fill = '#3B82F6';
                if (entry.type === 'raw') fill = '#64748B';
                if (entry.type === 'calibrated') fill = '#06B6D4';
                if (entry.type === 'quantile') fill = '#0284C7';
                if (entry.type === 'observed') fill = '#10B981';
                return <Cell key={`cell-${index}`} fill={fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {observedRainMm !== null && (
        <div className="text-[11px] text-gray-500 italic text-right">
          * Observed value is used strictly for retrospective demonstration verification and baseline benchmarking.
        </div>
      )}
    </div>
  );
};
