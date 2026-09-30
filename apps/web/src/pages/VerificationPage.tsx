import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { BarChart3, Info, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { VerificationResponse, DemoCase } from '../types';

interface VerificationPageProps {
  verificationData?: VerificationResponse;
  cases: DemoCase[];
  selectedCaseId: string;
  onSelectCase: (caseId: string) => void;
  thresholdMm: number;
  onChangeThreshold: (threshold: number) => void;
}

export const VerificationPage: React.FC<VerificationPageProps> = ({
  verificationData,
  cases,
  selectedCaseId,
  onSelectCase,
  thresholdMm,
  onChangeThreshold
}) => {
  if (!verificationData) {
    return <div className="p-8 text-center text-gray-400">Loading verification metrics...</div>;
  }

  const baselines = verificationData.baselines;
  const methods = ['climatology', 'raw_nwp', 'qm', 'emos', 'regime_aware'];
  const methodDisplayNames: Record<string, string> = {
    climatology: '1. Climatology',
    raw_nwp: '2. Raw NWP',
    qm: '3. Global QM',
    emos: '4. EMOS Baseline',
    regime_aware: '5. VARUNA Regime-Aware'
  };

  // Bar chart data comparing methods
  const comparisonData = methods.map((m) => {
    const data = baselines[m] || { rmse: 0, ets: 0, csi: 0, pod: 0, far: 0, fss: 0, brier: 0 };
    return {
      method: methodDisplayNames[m] || m,
      key: m,
      rmse: data.rmse,
      ets: data.ets,
      csi: data.csi,
      pod: data.pod,
      far: data.far,
      fss: data.fss,
      brier: data.brier
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-[#111827] border border-gray-800 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <BarChart3 className="w-4 h-4" />
              <span>Rigorous Baseline Ladder Verification</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              Retrospective Verification on Held-Out Validation Set
            </h1>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl">
              Evaluates categorical, continuous, and spatial skill across five comparative baselines. No model is labeled "best" without neutral metric disclosures.
            </p>
          </div>

          {/* Selectors */}
          <div className="flex items-center gap-3">
            <select
              value={selectedCaseId}
              onChange={(e) => onSelectCase(e.target.value)}
              className="bg-gray-800 text-white text-xs font-medium px-3 py-2 rounded-xl border border-gray-700 cursor-pointer"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Threshold Selector */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-900 border border-gray-800 text-xs">
              {[64.5, 115.6, 204.5].map((t) => (
                <button
                  key={t}
                  onClick={() => onChangeThreshold(t)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    thresholdMm === t
                      ? 'bg-cyan-600 text-white font-medium'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  ≥ {t} mm
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mandatory Neutral Comparison Banner */}
        <div className="p-3 rounded-xl bg-gray-900/90 border border-gray-800 flex items-center justify-between text-xs text-gray-300">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <b>Neutral Evaluation Principle:</b> {verificationData.neutral_comparison_statement}
            </span>
          </div>
          <span className="text-[11px] font-mono text-gray-500 hidden sm:inline">
            Split: {verificationData.split_name} · Samples: 48
          </span>
        </div>
      </div>

      {/* Baseline Comparison Table */}
      <div className="rounded-2xl bg-[#111827] border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-gray-100">5-Baseline Ladder Performance</h3>
            <p className="text-xs text-gray-400">Rainfall threshold cutoff: <b className="text-white">≥ {thresholdMm} mm/day</b> (Lead day: +1)</p>
          </div>
          <span className="text-[11px] font-mono text-gray-400 px-2 py-1 rounded bg-gray-800 border border-gray-700">
            N={baselines.regime_aware?.event_count || 48} Events
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/80 text-gray-400 font-mono text-[11px] uppercase border-b border-gray-800">
              <tr>
                <th className="py-3 px-4">Baseline Method</th>
                <th className="py-3 px-4">RMSE (mm) ↓</th>
                <th className="py-3 px-4">ETS ↑</th>
                <th className="py-3 px-4">CSI ↑</th>
                <th className="py-3 px-4">POD ↑</th>
                <th className="py-3 px-4">FAR ↓</th>
                <th className="py-3 px-4">FSS (25km) ↑</th>
                <th className="py-3 px-4">Brier Score ↓</th>
                <th className="py-3 px-4">BSS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 font-medium">
              {methods.map((m) => {
                const b = baselines[m];
                if (!b) return null;
                const isVaruna = m === 'regime_aware';

                return (
                  <tr key={m} className={isVaruna ? 'bg-cyan-950/20 hover:bg-cyan-950/30' : 'hover:bg-gray-800/30'}>
                    <td className="py-3 px-4 font-semibold text-gray-100 flex items-center gap-2">
                      {isVaruna && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                      <span className={isVaruna ? 'text-cyan-300 font-bold' : ''}>
                        {methodDisplayNames[m]}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{b.rmse.toFixed(1)}</td>
                    <td className="py-3 px-4 font-mono">{b.ets.toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono">{b.csi.toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono">{b.pod.toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono">{b.far.toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono">{b.fss.toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono">{b.brier.toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono">{(b.brier_skill_score * 100).toFixed(0)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: CSI & POD vs FAR Bar Chart + Fractions Skill Score by Scale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CSI and POD Comparison */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800 space-y-4">
          <div>
            <h3 className="font-semibold text-sm text-gray-100">Categorical Skill Comparison (CSI & POD)</h3>
            <p className="text-xs text-gray-400">Critical Success Index and Probability of Detection across baselines</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="method" stroke="#6B7280" fontSize={10} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={11} domain={[0, 1]} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="csi" name="CSI (Critical Success)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pod" name="POD (Detection)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* FSS vs Spatial Scale */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800 space-y-4">
          <div>
            <h3 className="font-semibold text-sm text-gray-100">Fractions Skill Score (FSS) vs Spatial Window</h3>
            <p className="text-xs text-gray-400">Evaluates displacement tolerance across 10km to 100km radius windows</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={verificationData.fss_by_scale} margin={{ top: 10, right: 20, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="neighbourhood_km" stroke="#6B7280" fontSize={11} unit=" km" tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={11} domain={[0, 1]} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="raw_nwp" name="Raw NWP" stroke="#64748B" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="qm" name="Global QM" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="emos" name="EMOS" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="regime_aware" name="VARUNA Regime-Aware" stroke="#06B6D4" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Reliability Diagram */}
      <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800 space-y-4">
        <div>
          <h3 className="font-semibold text-sm text-gray-100">Probability Reliability Diagram (Calibrated Calibration Curve)</h3>
          <p className="text-xs text-gray-400">Compares forecast probability bins against observed empirical event frequency</p>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={verificationData.reliability_curve} margin={{ top: 10, right: 20, left: -20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="forecast_probability" stroke="#6B7280" fontSize={11} domain={[0, 1]} tickLine={false} />
              <YAxis stroke="#6B7280" fontSize={11} domain={[0, 1]} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: number) => [val.toFixed(2), '']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line type="monotone" dataKey="observed_frequency" name="Calibrated Observed Frequency" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} />
              <Line type="monotone" dataKey="forecast_probability" name="Perfect Reliability (1:1 Reference)" stroke="#4B5563" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
