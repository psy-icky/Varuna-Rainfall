import React from 'react';
import {
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Info,
  Clock,
  Fingerprint
} from 'lucide-react';
import { ForecastPacket, DemoCase, DistrictOverviewItem } from '../types';
import { RegimeCard } from '../components/forecast/RegimeCard';
import { ThresholdCards } from '../components/forecast/ThresholdCard';
import { DistributionChart } from '../components/forecast/DistributionChart';
import { FiveDayTable } from '../components/forecast/FiveDayTable';

interface DistrictForecastPageProps {
  packet?: ForecastPacket;
  cases: DemoCase[];
  districts: DistrictOverviewItem[];
  selectedCaseId: string;
  selectedDistrictId: string;
  onSelectCase: (caseId: string) => void;
  onSelectDistrict: (districtId: string) => void;
  onNavigateToAudit: () => void;
}

export const DistrictForecastPage: React.FC<DistrictForecastPageProps> = ({
  packet,
  cases,
  districts,
  selectedCaseId,
  selectedDistrictId,
  onSelectCase,
  onSelectDistrict,
  onNavigateToAudit
}) => {
  if (!packet) {
    return (
      <div className="p-12 text-center text-gray-400">
        Loading forecast packet...
      </div>
    );
  }

  const dominantRegime = (packet.regime_probabilities && Object.keys(packet.regime_probabilities).length > 0)
    ? Object.entries(packet.regime_probabilities).sort((a, b) => b[1] - a[1])[0][0]
    : 'depression';

  return (
    <div className="space-y-6">
      {/* Top Header & Selectors */}
      <div className="p-6 rounded-3xl bg-[#111827] border border-gray-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{packet.state}, India</span>
              <span>·</span>
              <span>Coordinates: {packet.lat}°N, {packet.lon}°E</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">
              {packet.district_name}
            </h1>
            <div className="flex items-center gap-4 text-xs text-gray-400 mt-2 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                Issue: <b className="text-gray-300 font-mono">{packet.issue_time}</b>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                Valid Window: <b className="text-gray-300 font-mono">{packet.valid_time} (24h accumulation)</b>
              </span>
            </div>
          </div>

          {/* Quick Selectors */}
          <div className="flex items-center gap-3">
            <select
              value={selectedCaseId}
              onChange={(e) => onSelectCase(e.target.value)}
              className="bg-gray-800 text-white text-xs font-medium px-3 py-2 rounded-xl border border-gray-700 cursor-pointer"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} {c.is_hero_case ? '★' : ''}
                </option>
              ))}
            </select>

            <select
              value={selectedDistrictId}
              onChange={(e) => onSelectDistrict(e.target.value)}
              className="bg-gray-800 text-white text-xs font-medium px-3 py-2 rounded-xl border border-gray-700 cursor-pointer"
            >
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Provenance pill strip */}
        <div className="pt-3 border-t border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-gray-800/80 text-gray-300 border border-gray-700 font-mono text-[11px]">
              Provenance: <b className="text-cyan-300">{packet.provenance}</b>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-gray-800/80 text-gray-300 border border-gray-700 font-mono text-[11px]">
              Correction Method: <b className="text-white">{packet.correction_method}</b>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-gray-800/80 text-gray-300 border border-gray-700 font-mono text-[11px]">
              Calibration: <b className={packet.calibration_status === 'GREEN' ? 'text-emerald-400' : 'text-amber-400'}>{packet.calibration_status}</b>
            </span>
          </div>

          <button
            onClick={onNavigateToAudit}
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>Audit Lineage ID: <code className="font-mono">{packet.forecast_id}</code></span>
          </button>
        </div>
      </div>

      {/* Raw NWP vs Corrected Headline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800 space-y-1">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Raw NWP Baseline</span>
          <div className="text-3xl font-extrabold font-mono text-gray-300">
            {packet.raw_rain_mm} <span className="text-sm font-sans text-gray-500">mm/day</span>
          </div>
          <p className="text-[11px] text-gray-500">Unprocessed numerical model grid value</p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-[#111827] border border-cyan-800/50 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-cyan-400 font-semibold uppercase tracking-wider">VARUNA Calibrated (q50)</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-200">
              {packet.q50_mm > packet.raw_rain_mm ? `+${Math.round((packet.q50_mm/packet.raw_rain_mm - 1)*100)}%` : `${Math.round((packet.q50_mm/packet.raw_rain_mm - 1)*100)}%`}
            </span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-cyan-300">
            {packet.q50_mm} <span className="text-sm font-sans text-cyan-500">mm/day</span>
          </div>
          <p className="text-[11px] text-cyan-400/80">Regime-conditioned median forecast with uncertainty</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800 space-y-1">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Uncertainty Envelope</span>
          <div className="text-3xl font-extrabold font-mono text-gray-100">
            {packet.uncertainty_mm} <span className="text-sm font-sans text-gray-500">mm (q90-q10)</span>
          </div>
          <p className="text-[11px] text-gray-400">q10: {packet.q10_mm}mm · q90: {packet.q90_mm}mm</p>
        </div>
      </div>

      {/* Threshold Exceedance Probability Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
            IMD Heavy Rainfall Exceedance Probabilities
          </h2>
          <span className="text-xs text-gray-500 font-mono">
            Monotonic Invariant: P(≥204.5) ≤ P(≥115.6) ≤ P(≥64.5)
          </span>
        </div>
        <ThresholdCards
          p64_5={packet.p64_5}
          p115_6={packet.p115_6}
          p204_5={packet.p204_5}
          calibrationStatus={packet.calibration_status}
        />
      </div>

      {/* Grid: Regime Card + Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <RegimeCard
            probabilities={packet.regime_probabilities}
            transition={packet.transition}
            confidence={packet.confidence}
            dominantRegime={dominantRegime}
          />
        </div>
        <div className="lg:col-span-3">
          <DistributionChart
            rawRainMm={packet.raw_rain_mm}
            expectedRainMm={packet.expected_rain_mm}
            observedRainMm={packet.observed_rain_mm}
            q10Mm={packet.q10_mm}
            q50Mm={packet.q50_mm}
            q90Mm={packet.q90_mm}
            uncertaintyMm={packet.uncertainty_mm}
            correctionMethod={packet.correction_method}
          />
        </div>
      </div>

      {/* 5-Day Forecast Outlook */}
      <FiveDayTable days={packet.five_day_forecast} />
    </div>
  );
};
