import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, MinusCircle, Clock } from 'lucide-react';

export default function StatusBadge({ status, label }) {
  if (label) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-[#FFF4E5] text-[#B45309] border border-[#FFD8A8]">
        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 stroke-[2.5]" />
        {label}
      </span>
    );
  }

  switch (status?.toLowerCase()) {
    case 'profile_not_found':
    case 'no_data':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 stroke-[2.5]" />
          UNCLEAR — PROFILE NOT FOUND
        </span>
      );
    case 'pass':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-[#EBF8EC] text-[#138808] border-2 border-[#138808]">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 stroke-[2.5] text-[#138808]" />
          PASS
        </span>
      );
    case 'fail':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-[#FDE8E8] text-[#D32F2F] border border-[#F8B4B4]">
          <XCircle className="w-3.5 h-3.5 flex-shrink-0 stroke-[2.5]" />
          FAIL
        </span>
      );
    case 'unclear':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-[#FFF4E5] text-[#FF9933] border border-[#FFD8A8]">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 stroke-[2.5]" />
          UNCLEAR
        </span>
      );
    case 'not_applicable':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
          <MinusCircle className="w-3.5 h-3.5 flex-shrink-0" />
          N/A
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          PENDING
        </span>
      );
  }
}
