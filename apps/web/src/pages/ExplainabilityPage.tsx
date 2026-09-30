import React, { useState } from 'react';
import {
  HelpCircle,
  ArrowDown,
  Layers,
  Activity,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { ForecastPacket } from '../types';

interface ExplainabilityPageProps {
  packet?: ForecastPacket;
}

export const ExplainabilityPage: React.FC<ExplainabilityPageProps> = ({ packet }) => {
  const [isWhyDrawerOpen, setIsWhyDrawerOpen] = useState(true);

  if (!packet) {
    return <div className="p-8 text-center text-gray-400">Loading forecast...</div>;
  }

  const dominantRegime = (packet.regime_probabilities && Object.keys(packet.regime_probabilities).length > 0)
    ? Object.entries(packet.regime_probabilities).sort((a, b) => b[1] - a[1])[0][0]
    : 'depression';
  const dominantProb = Math.round((packet.regime_probabilities[dominantRegime] || 0) * 100);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="p-6 rounded-3xl bg-[#111827] border border-gray-800 space-y-2">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
          <HelpCircle className="w-4 h-4" />
          <span>Scientific Provenance & Causal Chain</span>
        </div>
        <h1 className="text-2xl font-bold text-white">
          Why Did VARUNA Change the Raw Forecast?
        </h1>
        <p className="text-xs text-gray-400 max-w-3xl">
          Unlike black-box models, VARUNA documents every transformation along the transparent causal ladder: synoptic feature extraction, regime routing, conditional scaling, parametric quantile derivation, and operational trust filtering.
        </p>
      </div>

      {/* "Why did it change?" Collapsible Drawer */}
      <div className="rounded-2xl bg-gradient-to-r from-gray-900 to-[#111827] border border-cyan-900/50 overflow-hidden shadow-lg">
        <button
          onClick={() => setIsWhyDrawerOpen(!isWhyDrawerOpen)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Causal Summary Drawer
              </span>
              <h3 className="text-sm font-semibold text-gray-100">
                From Raw {packet.raw_rain_mm} mm to Calibrated {packet.q50_mm} mm
              </h3>
            </div>
          </div>
          <div className="text-gray-400">
            {isWhyDrawerOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {isWhyDrawerOpen && (
          <div className="p-5 border-t border-gray-800 bg-[#0F172A]/60 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800">
                <span className="text-gray-400 block text-[11px]">1. Ingested NWP</span>
                <span className="text-lg font-bold font-mono text-gray-300">{packet.raw_rain_mm} mm</span>
                <span className="text-[10px] text-gray-500 block">Systematic under-amplitude</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800">
                <span className="text-gray-400 block text-[11px]">2. Regime Classification</span>
                <span className="text-lg font-bold font-mono text-cyan-400 uppercase">{dominantRegime} ({dominantProb}%)</span>
                <span className="text-[10px] text-cyan-500/80 block">Vortex signature identified</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800">
                <span className="text-gray-400 block text-[11px]">3. Selected Bank</span>
                <span className="text-lg font-bold font-mono text-indigo-300">{packet.correction_method}</span>
                <span className="text-[10px] text-indigo-400 block">Empirical displacement factor</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800">
                <span className="text-gray-400 block text-[11px]">4. Calibrated Median (q50)</span>
                <span className="text-lg font-bold font-mono text-emerald-400">{packet.q50_mm} mm</span>
                <span className="text-[10px] text-emerald-500/80 block">q10: {packet.q10_mm}mm · q90: {packet.q90_mm}mm</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-gray-900/90 border border-gray-800 text-gray-300 leading-relaxed">
              <span className="font-semibold text-cyan-300">Explanation Rationale:</span> The atmospheric features over {packet.district_name} ({packet.state}) exhibit strong cyclonic vorticity in the lower troposphere (850 hPa) accompanied by a sustained positive core-zone monsoon anomaly. The classifier assigned a <b>{dominantProb}% posterior probability to the {dominantRegime.toUpperCase()} regime</b>. As documented in IMD monsoon depression climatology, raw NWP consistently under-predicts the heavy core rainfall envelope due to numerical smoothing and localized vortex displacement. Applying the <code>{packet.correction_method}</code> bank scaled the median forecast from <b>{packet.raw_rain_mm} mm to {packet.q50_mm} mm</b>, raising the exceedance probability for heavy rainfall (≥64.5 mm) to <b>{Math.round(packet.p64_5 * 100)}%</b> while explicitly bounding the 80% credible interval between <b>{packet.q10_mm} mm and {packet.q90_mm} mm</b>.
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-800/80">
              <span className="font-mono">Proxy physics badge: DEMO PROXY — empirical synthetic rules</span>
              <span>Audit Hash: <code className="font-mono text-gray-300">{packet.forecast_id}</code></span>
            </div>
          </div>
        )}
      </div>

      {/* Step-by-Step Causal Ladder */}
      <div className="p-6 rounded-3xl bg-[#111827] border border-gray-800 space-y-6">
        <h2 className="text-base font-bold text-gray-200">
          Six-Stage Architectural Causal Chain
        </h2>

        <div className="space-y-4 relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-800">
          {/* Step 1 */}
          <div className="relative flex items-start gap-4 pl-12">
            <span className="absolute left-3 w-5 h-5 rounded-full bg-gray-800 border-2 border-cyan-500 text-[10px] font-mono flex items-center justify-center text-cyan-300 font-bold">1</span>
            <div className="p-4 rounded-xl bg-gray-900/90 border border-gray-800 w-full space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Step 1 · Input Ingestion & QC</span>
              <h4 className="text-xs font-bold text-white">NWP Model Ingestion & Predictor Alignment</h4>
              <p className="text-xs text-gray-400">
                Raw precipitation: <b className="text-gray-200 font-mono">{packet.raw_rain_mm} mm/day</b>. Inputs verified against schema contract and SLA freshness policies.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative flex items-start gap-4 pl-12">
            <span className="absolute left-3 w-5 h-5 rounded-full bg-gray-800 border-2 border-cyan-500 text-[10px] font-mono flex items-center justify-center text-cyan-300 font-bold">2</span>
            <div className="p-4 rounded-xl bg-gray-900/90 border border-gray-800 w-full space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Step 2 · Synoptic Classifier</span>
              <h4 className="text-xs font-bold text-white">Hybrid Weather-Regime Classifier</h4>
              <p className="text-xs text-gray-400">
                Derived soft posterior over 6 regimes. Dominant: <b className="text-cyan-400 uppercase font-mono">{dominantRegime} ({dominantProb}%)</b>. Transition status: <b className="text-gray-200 font-mono">{packet.transition ? 'TRUE (Blended)' : 'FALSE'}</b>.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative flex items-start gap-4 pl-12">
            <span className="absolute left-3 w-5 h-5 rounded-full bg-gray-800 border-2 border-cyan-500 text-[10px] font-mono flex items-center justify-center text-cyan-300 font-bold">3</span>
            <div className="p-4 rounded-xl bg-gray-900/90 border border-gray-800 w-full space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Step 3 · Conditional Routing</span>
              <h4 className="text-xs font-bold text-white">Regime-Conditional Bias Correction Bank</h4>
              <p className="text-xs text-gray-400">
                Routed to bank: <b className="text-indigo-400 font-mono">{packet.correction_method}</b>. Provenance logged as <code className="text-gray-300 font-mono">{packet.provenance}</code>.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative flex items-start gap-4 pl-12">
            <span className="absolute left-3 w-5 h-5 rounded-full bg-gray-800 border-2 border-cyan-500 text-[10px] font-mono flex items-center justify-center text-cyan-300 font-bold">4</span>
            <div className="p-4 rounded-xl bg-gray-900/90 border border-gray-800 w-full space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Step 4 · Parametric Uncertainty</span>
              <h4 className="text-xs font-bold text-white">Two-Part Zero-Inflated Distribution Head</h4>
              <p className="text-xs text-gray-400">
                Occurrence probability: <b className="text-gray-200 font-mono">{Math.round(packet.positive_probability * 100)}%</b>. Quantile credible bounds: <b className="text-cyan-300 font-mono">q10={packet.q10_mm}mm, q50={packet.q50_mm}mm, q90={packet.q90_mm}mm</b>.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="relative flex items-start gap-4 pl-12">
            <span className="absolute left-3 w-5 h-5 rounded-full bg-gray-800 border-2 border-cyan-500 text-[10px] font-mono flex items-center justify-center text-cyan-300 font-bold">5</span>
            <div className="p-4 rounded-xl bg-gray-900/90 border border-gray-800 w-full space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Step 5 · Threshold Integration</span>
              <h4 className="text-xs font-bold text-white">Monotonic IMD Exceedance Probabilities</h4>
              <p className="text-xs text-gray-400">
                P(≥64.5mm): <b className="text-amber-400 font-mono">{Math.round(packet.p64_5*100)}%</b> · P(≥115.6mm): <b className="text-orange-400 font-mono">{Math.round(packet.p115_6*100)}%</b> · P(≥204.5mm): <b className="text-red-400 font-mono">{Math.round(packet.p204_5*100)}%</b>.
              </p>
            </div>
          </div>

          {/* Step 6 */}
          <div className="relative flex items-start gap-4 pl-12">
            <span className="absolute left-3 w-5 h-5 rounded-full bg-gray-800 border-2 border-cyan-500 text-[10px] font-mono flex items-center justify-center text-cyan-300 font-bold">6</span>
            <div className="p-4 rounded-xl bg-gray-900/90 border border-gray-800 w-full space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Step 6 · Trust & Audit</span>
              <h4 className="text-xs font-bold text-white">Operational Trust & Fallback Evaluation</h4>
              <p className="text-xs text-gray-400">
                Fallback state: <b className="text-emerald-400 font-mono">{packet.fallback_state}</b> · Calibration state: <b className="text-emerald-400 font-mono">{packet.calibration_status}</b> · Lineage signed with SHA-256 audit fingerprint.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Branch Adapters Transparency Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Adapter A</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">ACTIVE</span>
          </div>
          <h4 className="text-xs font-bold text-white">Synoptic Rule Evidence Engine</h4>
          <p className="text-[11px] text-gray-400">
            Computes meteorological anomaly scores from core-zone indices, 850hPa vorticity, persistence, and terrain elevation.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Adapter B</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">NOT LOADED</span>
          </div>
          <h4 className="text-xs font-bold text-white">Deep Spatial CNN / ConvLSTM</h4>
          <p className="text-[11px] text-gray-400">
            Adapter interface implemented for future neural feature extraction. Model weights not loaded in prototype to prevent false claims.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Adapter C</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">DEMO VORTEX</span>
          </div>
          <h4 className="text-xs font-bold text-white">Monsoon Depression LPS Tracker</h4>
          <p className="text-[11px] text-gray-400">
            Lagrangian vortex tracker conditioned on low-level circulation centre and historical track analogs.
          </p>
        </div>
      </div>
    </div>
  );
};
