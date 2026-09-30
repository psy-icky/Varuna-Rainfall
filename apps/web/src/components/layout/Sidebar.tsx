import React from 'react';
import {
  Map,
  CloudRain,
  HelpCircle,
  BarChart3,
  ShieldCheck,
  FileCode2,
  AlertTriangle
} from 'lucide-react';

export type NavPage =
  | 'overview'
  | 'forecast'
  | 'explainability'
  | 'verification'
  | 'trust'
  | 'audit';

interface SidebarProps {
  currentPage: NavPage;
  onSelectPage: (page: NavPage) => void;
  humanReviewRequired?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  humanReviewRequired = false
}) => {
  const navItems: Array<{ id: NavPage; label: string; icon: React.ReactNode; badge?: string; badgeColor?: string }> = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Map className="w-4 h-4" />
    },
    {
      id: 'forecast',
      label: 'District Forecast',
      icon: <CloudRain className="w-4 h-4" />
    },
    {
      id: 'explainability',
      label: 'Explainability',
      icon: <HelpCircle className="w-4 h-4" />
    },
    {
      id: 'verification',
      label: 'Verification',
      icon: <BarChart3 className="w-4 h-4" />
    },
    {
      id: 'trust',
      label: 'Trust & Fallback',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: humanReviewRequired ? 'REVIEW' : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    },
    {
      id: 'audit',
      label: 'Audit Packet',
      icon: <FileCode2 className="w-4 h-4" />
    }
  ];

  return (
    <aside className="w-full md:w-64 border-r border-gray-800 bg-[#0B101D] flex flex-col justify-between shrink-0">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-cyan-400' : 'text-gray-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar footer: demo metadata */}
      <div className="p-4 m-3 rounded-xl bg-gray-900/60 border border-gray-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Model Version:</span>
          <span className="font-mono text-cyan-400 text-[11px]">demo-0.1.0</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Data Version:</span>
          <span className="font-mono text-gray-300 text-[11px]">demo-2026-09</span>
        </div>
        <div className="pt-2 border-t border-gray-800 text-[10px] text-gray-400 leading-tight">
          VARUNA-RAINFALL post-processes NWP into calibrated uncertainty without claiming operational warning status.
        </div>
      </div>
    </aside>
  );
};
