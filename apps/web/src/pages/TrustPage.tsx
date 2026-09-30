import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Zap,
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { TrustResponse } from '../types';

interface TrustPageProps {
  trustData?: TrustResponse;
  onInjectFault: (fault: string) => Promise<void>;
  onResetDemo: () => Promise<void>;
  isMutating: boolean;
}

export const TrustPage: React.FC<TrustPageProps> = ({
  trustData,
  onInjectFault,
  onResetDemo,
  isMutating
}) => {
  const [selectedFault, setSelectedFault] = useState<string>('stale_satellite');

  if (!trustData) {
    return <div className="p-8 text-center text-gray-400">Loading trust telemetry...</div>;
  }

  const ladderSteps = ['REGIME_AWARE', 'POOLED_GLOBAL', 'QM', 'RAW_NWP', 'ABSTAIN'];
  const currentState = trustData.current_fallback_state;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="p-6 rounded-3xl bg-[#111827] border border-gray-800 space-y-2">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Operational Trust & Automated Fallback Ladder</span>
        </div>
        <h1 className="text-2xl font-bold text-white">
          Data Freshness SLAs, Fallback Degeneracy & Human Review
        </h1>
        <p className="text-xs text-gray-400 max-w-3xl">
          VARUNA actively verifies upstream input integrity. If an SLA is breached or out-of-distribution patterns appear, the system falls back systematically down the declared ladder instead of hallucinating precision.
        </p>
      </div>

      {/* Human Review Required Banner (when active) */}
      {trustData.human_review_required && (
        <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-800 flex items-start gap-4">
          <div className="p-2 rounded-xl bg-amber-900/60 text-amber-300 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-amber-200">
              Human Forecaster Review Required (Automated Advice Suspended)
            </h3>
            <p className="text-xs text-amber-300/80 leading-relaxed">
              Current state: <b>{currentState}</b>. Upstream input degradation or high regime epistemic uncertainty triggered an escalation. Forecaster inspection must clear this packet before downstream district emergency actions.
            </p>
          </div>
        </div>
      )}

      {/* Fallback Ladder Visual Path */}
      <div className="p-6 rounded-3xl bg-[#111827] border border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-gray-100">Declared Fallback Ladder</h3>
            <p className="text-xs text-gray-400">Orderly degradation from full regime mixture to abstention</p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-800/60">
            Active: {currentState}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
          {ladderSteps.map((step, idx) => {
            const isActive = step === currentState;
            const isAbstain = step === 'ABSTAIN';

            return (
              <div
                key={step}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isActive
                    ? isAbstain
                      ? 'bg-red-950/60 border-red-500 text-red-200 shadow-lg shadow-red-950'
                      : 'bg-cyan-950/60 border-cyan-500 text-cyan-200 shadow-lg shadow-cyan-950'
                    : 'bg-gray-900/60 border-gray-800 text-gray-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] font-bold">L-{idx + 1}</span>
                  {isActive && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </div>
                <div className="font-mono font-bold text-xs">{step}</div>
                <div className="text-[10px] text-gray-400 mt-2">
                  {step === 'REGIME_AWARE' && 'Full synoptic mixture'}
                  {step === 'POOLED_GLOBAL' && 'Climatological pool'}
                  {step === 'QM' && 'Transparent quantile map'}
                  {step === 'RAW_NWP' && 'Uncalibrated pass-thru'}
                  {step === 'ABSTAIN' && 'Automated block'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fault Injection Panel */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-gray-900 to-[#111827] border border-cyan-900/60 space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="font-bold text-sm text-gray-100">Live Fault Injector & SLA Demonstration</h3>
            <p className="text-xs text-gray-400">
              Simulate operational telemetry disruptions to verify instantaneous fallback without page refresh.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <select
            value={selectedFault}
            onChange={(e) => setSelectedFault(e.target.value)}
            className="bg-gray-800 text-white text-xs font-medium px-4 py-2.5 rounded-xl border border-gray-700 cursor-pointer min-w-[240px]"
          >
            <option value="stale_satellite">Stale Satellite (&gt;240m) → Fallback to QM</option>
            <option value="missing_nwp">Missing NWP Feed → Fallback to ABSTAIN</option>
            <option value="schema_error">Corrupt Schema Telemetry → Fallback to RAW NWP</option>
            <option value="regime_ood">Regime Predictors OOD → Fallback to POOLED GLOBAL</option>
          </select>

          <button
            onClick={() => onInjectFault(selectedFault)}
            disabled={isMutating}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-amber-950 disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Inject Fault</span>
          </button>

          <button
            onClick={onResetDemo}
            disabled={isMutating}
            className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-xs transition-colors flex items-center gap-2 border border-gray-700 disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo to Nominal</span>
          </button>
        </div>

        {trustData.active_fault && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              Active Fault in Memory: <b>{trustData.active_fault}</b>
            </span>
            <span className="font-mono text-[11px] text-red-400">Affecting active forecast packets</span>
          </div>
        )}
      </div>

      {/* Upstream Ingestion Source Health Table */}
      <div className="rounded-2xl bg-[#111827] border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h3 className="font-semibold text-sm text-gray-100">Upstream Ingestion Source SLA Matrix</h3>
          <p className="text-xs text-gray-400">Monitoring expected delivery intervals, age thresholds, and fallback triggers</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/80 text-gray-400 font-mono text-[11px] uppercase border-b border-gray-800">
              <tr>
                <th className="py-3 px-4">Source Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Last Success</th>
                <th className="py-3 px-4">Age</th>
                <th className="py-3 px-4">SLA Max Age</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Fallback Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 font-medium">
              {trustData.sources.map((s) => {
                const isBad = s.status !== 'fresh';
                return (
                  <tr key={s.source_id} className={isBad ? 'bg-red-950/20' : 'hover:bg-gray-800/30'}>
                    <td className="py-3 px-4 font-semibold text-gray-100">{s.name}</td>
                    <td className="py-3 px-4 font-mono text-gray-400">{s.source_type}</td>
                    <td className="py-3 px-4 font-mono text-gray-300">{s.last_success_at}</td>
                    <td className="py-3 px-4 font-mono text-gray-300">{s.age_minutes} min</td>
                    <td className="py-3 px-4 font-mono text-gray-400">{s.stale_after_minutes} min</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${
                          s.status === 'fresh'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : s.status === 'stale'
                            ? 'bg-amber-950 text-amber-400 border-amber-800'
                            : 'bg-red-950 text-red-400 border-red-800'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{s.fallback_impact}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
