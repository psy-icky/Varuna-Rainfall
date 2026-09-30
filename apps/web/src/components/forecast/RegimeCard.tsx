import React from 'react';
import { AlertCircle, Compass, Layers } from 'lucide-react';

interface RegimeCardProps {
  probabilities: Record<string, number>;
  transition: boolean;
  confidence: number;
  dominantRegime: string;
}

export const RegimeCard: React.FC<RegimeCardProps> = ({
  probabilities,
  transition,
  confidence,
  dominantRegime
}) => {
  const regimeLabels: Record<string, { label: string; color: string; desc: string }> = {
    active: { label: 'Active Monsoon', color: 'bg-emerald-500', desc: 'Sustained positive core-zone anomaly' },
    break: { label: 'Break Monsoon', color: 'bg-indigo-500', desc: 'Negative anomaly; leakage to foothills' },
    depression: { label: 'LPS / Depression', color: 'bg-cyan-500', desc: 'Vortex core & strong 850hPa vorticity' },
    orographic: { label: 'Western Ghats Orographic', color: 'bg-amber-500', desc: 'Steep terrain uplift enhancement' },
    coastal: { label: 'Coastal Convergence', color: 'bg-teal-500', desc: 'Offshore trough / coastal analog' },
    western_disturbance: { label: 'Western Disturbance', color: 'bg-purple-500', desc: 'Mid-latitude upper-tropospheric trough' }
  };

  // Sort regimes descending by probability
  const sortedRegimes = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-100">Weather-Regime Posterior</h3>
            <p className="text-xs text-gray-400">Soft mixture distribution across synoptic states</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {transition ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60 flex items-center gap-1.5 animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" />
              Transition / Uncertain
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-950 text-cyan-300 border border-cyan-800/50">
              Confidence: {Math.round(confidence * 100)}%
            </span>
          )}
        </div>
      </div>

      {/* Probability bars */}
      <div className="space-y-2.5 pt-1">
        {sortedRegimes.map(([regimeKey, prob]) => {
          const info = regimeLabels[regimeKey] || { label: regimeKey, color: 'bg-gray-500', desc: '' };
          const percent = Math.round(prob * 100);
          const isTop = regimeKey === dominantRegime;

          return (
            <div key={regimeKey} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${info.color}`} />
                  <span className={`font-medium ${isTop ? 'text-cyan-300 font-semibold' : 'text-gray-300'}`}>
                    {info.label}
                  </span>
                </div>
                <span className="font-mono text-gray-300 font-semibold">{percent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-800/80 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${info.color}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Transition explainer */}
      {transition && (
        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300/90 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <span className="font-semibold text-amber-200">Probability Blending Active:</span> No single regime is dominant above threshold. VARUNA applies a posterior mixture over correction banks rather than hard-switching, widening the uncertainty envelope.
          </div>
        </div>
      )}
    </div>
  );
};
