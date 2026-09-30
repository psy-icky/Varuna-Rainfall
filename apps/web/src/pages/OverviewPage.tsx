import React, { useState } from 'react';
import {
  CloudRain,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Layers,
  Compass
} from 'lucide-react';
import { DemoCase, DistrictOverviewItem, ForecastPacket } from '../types';
import { IndiaMap } from '../components/map/IndiaMap';

interface OverviewPageProps {
  cases: DemoCase[];
  districts: DistrictOverviewItem[];
  selectedCaseId: string;
  selectedDistrictId: string;
  forecastPacket?: ForecastPacket;
  onSelectCase: (caseId: string) => void;
  onSelectDistrict: (districtId: string) => void;
  onNavigateToForecast: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  cases,
  districts,
  selectedCaseId,
  selectedDistrictId,
  forecastPacket,
  onSelectCase,
  onSelectDistrict,
  onNavigateToForecast
}) => {
  const [thresholdFilter, setThresholdFilter] = useState<'expected' | 'p64' | 'p115' | 'p204'>('p64');

  const selectedCase = cases.find((c) => c.id === selectedCaseId);
  const selectedDistrict = districts.find((d) => d.id === selectedDistrictId);

  // Compute summary metrics across districts
  const elevatedDistricts = districts.filter((d) => d.p64_5 >= 0.50);
  const currentDominantRegime = (forecastPacket?.regime_probabilities && Object.keys(forecastPacket.regime_probabilities).length > 0)
    ? Object.entries(forecastPacket.regime_probabilities).sort((a, b) => b[1] - a[1])[0][0]
    : 'depression';

  return (
    <div className="space-y-6">
      {/* Top Banner & Scenario Selectors */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-gray-900 via-[#111827] to-[#0F172A] border border-gray-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/50 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Decision-Support Prototype</span>
              <span>·</span>
              <span>SIH26080</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
              Regime-Aware NWP Rainfall Calibration
            </h1>
            <p className="text-sm text-gray-400 mt-1 max-w-2xl">
              Post-processes raw NWP ensemble rainfall into a calibrated, explainable probability field conditioned on prevailing synoptic weather regimes.
            </p>
          </div>

          {/* Quick Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Case selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Held-Out Demo Case
              </label>
              <select
                value={selectedCaseId}
                onChange={(e) => onSelectCase(e.target.value)}
                className="bg-gray-800/90 text-white text-xs font-medium px-3 py-2 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-sm"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} {c.is_hero_case ? '★ (Hero Demo)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* District selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Focus District
              </label>
              <select
                value={selectedDistrictId}
                onChange={(e) => onSelectDistrict(e.target.value)}
                className="bg-gray-800/90 text-white text-xs font-medium px-3 py-2 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-sm"
              >
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.state})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Data Trust Strip */}
        <div className="pt-3 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-gray-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> NWP: <b className="text-gray-100">FRESH</b>
            </span>
            <span className="flex items-center gap-1.5 text-gray-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Satellite: <b className="text-gray-100">FRESH</b>
            </span>
            <span className="flex items-center gap-1.5 text-gray-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Rain Gauge: <b className="text-gray-100">14h old</b>
            </span>
            <span className="flex items-center gap-1.5 text-gray-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Calibration: <b className="text-emerald-400">GREEN</b>
            </span>
          </div>
          <span className="text-[11px] text-gray-400 font-mono">
            Lineage: data-v1 · model-0.1.0 · synthetic_demo
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#111827] border border-gray-800 space-y-1">
          <span className="text-xs text-gray-400 font-medium">Demo Districts</span>
          <div className="text-2xl font-bold font-mono text-white">{districts.length}</div>
          <span className="text-[11px] text-gray-400">Representative Indian zones</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#111827] border border-gray-800 space-y-1">
          <span className="text-xs text-gray-400 font-medium">Elevated Heavy Risk (≥64.5)</span>
          <div className="text-2xl font-bold font-mono text-amber-400">{elevatedDistricts.length}</div>
          <span className="text-[11px] text-gray-400">&gt; 50% exceedance probability</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#111827] border border-gray-800 space-y-1">
          <span className="text-xs text-gray-400 font-medium">Dominant Synoptic Regime</span>
          <div className="text-2xl font-bold font-mono text-cyan-400 uppercase text-lg sm:text-xl truncate">
            {currentDominantRegime}
          </div>
          <span className="text-[11px] text-gray-400">Posterior confidence: {Math.round((forecastPacket?.confidence || 0.8) * 100)}%</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#111827] border border-gray-800 space-y-1">
          <span className="text-xs text-gray-400 font-medium">Trust / Fallback Status</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 text-lg sm:text-xl">
            {forecastPacket?.fallback_state || 'REGIME_AWARE'}
          </div>
          <span className="text-[11px] text-gray-400">All input SLAs nominal</span>
        </div>
      </div>

      {/* Map Section */}
      <div className="p-5 rounded-3xl bg-[#111827] border border-gray-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              Regional Risk & Exceedance Map
            </h2>
            <p className="text-xs text-gray-400">
              Click a district marker to inspect calibrated rainfall distribution and exceedance metrics.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-900 border border-gray-800 text-xs">
            <button
              onClick={() => setThresholdFilter('expected')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                thresholdFilter === 'expected' ? 'bg-cyan-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Expected Rain
            </button>
            <button
              onClick={() => setThresholdFilter('p64')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                thresholdFilter === 'p64' ? 'bg-amber-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              P(≥64.5 mm)
            </button>
            <button
              onClick={() => setThresholdFilter('p115')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                thresholdFilter === 'p115' ? 'bg-orange-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              P(≥115.6 mm)
            </button>
            <button
              onClick={() => setThresholdFilter('p204')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                thresholdFilter === 'p204' ? 'bg-red-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              P(≥204.5 mm)
            </button>
          </div>
        </div>

        <IndiaMap
          districts={districts}
          selectedDistrictId={selectedDistrictId}
          onSelectDistrict={onSelectDistrict}
          thresholdFilter={thresholdFilter}
          selectedCaseId={selectedCaseId}
        />
      </div>

      {/* Selected District Highlight strip */}
      {selectedDistrict && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-gray-900 to-gray-900 border border-cyan-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white">{selectedDistrict.name}</span>
                <span className="text-xs text-gray-400">({selectedDistrict.state})</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-800 text-cyan-300">
                  {selectedDistrict.dominant_regime.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-300 mt-1">
                <span>Expected: <b className="text-cyan-300 font-mono">{selectedDistrict.expected_rain_mm} mm</b></span>
                <span>q50: <b className="text-white font-mono">{selectedDistrict.q50_mm} mm</b></span>
                <span>P(≥64.5): <b className="text-amber-400 font-mono">{Math.round(selectedDistrict.p64_5 * 100)}%</b></span>
                <span>P(≥115.6): <b className="text-orange-400 font-mono">{Math.round(selectedDistrict.p115_6 * 100)}%</b></span>
              </div>
            </div>
          </div>

          <button
            onClick={onNavigateToForecast}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-cyan-950"
          >
            <span>Detailed Forecast & Probabilities</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
