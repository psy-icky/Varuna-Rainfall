import React from 'react';
import { CloudRain, ShieldAlert, Activity, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { DemoCase, FallbackState } from '../../types';

interface HeaderProps {
  currentCase?: DemoCase;
  fallbackState?: FallbackState;
  activeFault?: string | null;
}

export const Header: React.FC<HeaderProps> = ({ currentCase, fallbackState = 'REGIME_AWARE', activeFault }) => {
  const getFallbackBadge = () => {
    switch (fallbackState) {
      case 'REGIME_AWARE':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5" />
            REGIME-AWARE
          </span>
        );
      case 'QM':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/80 text-amber-400 border border-amber-800/60">
            <AlertTriangle className="w-3.5 h-3.5" />
            FALLBACK: QM
          </span>
        );
      case 'RAW_NWP':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-950/80 text-orange-400 border border-orange-800/60">
            <AlertTriangle className="w-3.5 h-3.5" />
            FALLBACK: RAW NWP
          </span>
        );
      case 'ABSTAIN':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-950/80 text-red-400 border border-red-800/60 animate-pulse">
            <AlertOctagon className="w-3.5 h-3.5" />
            STATE: ABSTAIN
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-950/80 text-blue-400 border border-blue-800/60">
            {fallbackState}
          </span>
        );
    }
  };

  return (
    <header className="border-b border-gray-800 bg-[#0F172A]/90 backdrop-blur sticky top-0 z-50 px-6 py-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-950/50">
            <CloudRain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-lg tracking-wider text-white">VARUNA<span className="text-cyan-400 font-medium">-RAINFALL</span></span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                SYNTHETIC DEMO
              </span>
              <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                SIH26080
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Regime-Aware Calibrated Risk Field Post-Processing
            </p>
          </div>
        </div>

        {/* Center / Status */}
        <div className="flex items-center gap-3 flex-wrap">
          {currentCase && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-800/80 border border-gray-700/80 text-xs">
              <span className="text-gray-400">Scenario:</span>
              <span className="font-semibold text-cyan-300">{currentCase.label}</span>
              <span className="font-mono text-gray-500">[{currentCase.date}]</span>
            </div>
          )}
          {getFallbackBadge()}
          {activeFault && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-950 text-red-300 border border-red-800 flex items-center gap-1.5 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              FAULT: {activeFault}
            </span>
          )}
        </div>

        {/* Right Mandatory Disclaimers */}
        <div className="flex flex-col items-start lg:items-end text-right">
          <div className="flex items-center gap-2 text-[11px] font-medium text-amber-400/90">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>Decision support — not an official warning authority</span>
          </div>
          <span className="text-[10px] text-gray-400">
            Synthetic prototype data — not operational forecast skill
          </span>
        </div>
      </div>
    </header>
  );
};
