import React, { useState } from 'react';
import { FileCode2, Copy, Check, Fingerprint, ShieldCheck } from 'lucide-react';
import { AuditPacketResponse } from '../types';

interface AuditPageProps {
  auditData?: AuditPacketResponse;
}

export const AuditPage: React.FC<AuditPageProps> = ({ auditData }) => {
  const [copied, setCopied] = useState(false);

  if (!auditData) {
    return <div className="p-8 text-center text-gray-400">Loading audit packet...</div>;
  }

  const jsonString = JSON.stringify(auditData, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="p-6 rounded-3xl bg-[#111827] border border-gray-800 space-y-2">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
          <FileCode2 className="w-4 h-4" />
          <span>Proof-Carrying Forecast Audit</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Deterministic Audit & Provenance Packet
            </h1>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl">
              Complete provenance snapshot binding input telemetry, regime posterior weights, correction coefficients, quantile credible bounds, and operational trust signatures.
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-cyan-950 shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Audit JSON'}</span>
          </button>
        </div>
      </div>

      {/* Metadata Pill Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-[#111827] border border-gray-800 space-y-1">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Forecast ID</span>
          <div className="font-mono text-cyan-300 font-bold truncate">{auditData.forecast_id}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#111827] border border-gray-800 space-y-1">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">SHA-256 Provenance Hash</span>
          <div className="font-mono text-emerald-400 font-bold truncate">{auditData.provenance_hash}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#111827] border border-gray-800 space-y-1">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Model Version</span>
          <div className="font-mono text-gray-200 font-bold">{auditData.model_version}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#111827] border border-gray-800 space-y-1">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Data Quality Flag</span>
          <div className="font-mono text-cyan-400 font-bold">{auditData.data_quality}</div>
        </div>
      </div>

      {/* JSON Viewer */}
      <div className="rounded-2xl bg-[#090D16] border border-gray-800 overflow-hidden shadow-2xl">
        <div className="px-4 py-3 bg-[#0E1524] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="text-xs font-mono text-gray-400 ml-2">forecast_audit_packet.json</span>
          </div>
          <span className="text-[11px] text-gray-500 font-mono">UTF-8 · JSON Formatted</span>
        </div>

        <pre className="p-6 text-xs font-mono text-cyan-300/90 overflow-x-auto leading-relaxed max-h-[550px] selection:bg-cyan-800">
          <code>{jsonString}</code>
        </pre>
      </div>
    </div>
  );
};
