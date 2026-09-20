import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Clock } from 'lucide-react';

export default function RiskBadge({ risk }) {
  switch (risk?.toLowerCase()) {
    case 'low':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-[#EBF8EC] text-[#138808] border border-[#A7F3D0]">
          <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 stroke-[2.5]" />
          LOW RISK
        </span>
      );
    case 'medium':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-[#FFF4E5] text-[#FF9933] border border-[#FFD8A8]">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 stroke-[2.5]" />
          MEDIUM RISK
        </span>
      );
    case 'high':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-[#FDE8E8] text-[#D32F2F] border border-[#FCA5A5]">
          <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 stroke-[2.5]" />
          HIGH RISK
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-300">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          EVALUATING
        </span>
      );
  }
}
