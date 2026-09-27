import React from 'react';
import { ShieldCheck, History, AlertTriangle, AlertCircle, Sparkles, Info } from 'lucide-react';

/**
 * EPSILON X — BIDDER RELIABILITY BADGE
 *
 * Displays the Reliability Score based on historical tender bids.
 * Purely informational under GFR Rule 149 (advisory only for officer).
 */
export default function ReliabilityBadge({
  reliability,
  variant = 'full', // 'full' | 'compact' | 'pill'
  showNotice = false,
  className = '',
}) {
  if (!reliability) return null;

  const {
    reliability_score,
    total_bids = 0,
    qualified_bids = 0,
    badge_text,
    short_badge_text,
    tier = 'new',
  } = reliability;

  // Determine theme styles based on reliability tier
  let styleConfig = {
    bg: 'bg-[#F1F5F9]',
    text: 'text-[#475569]',
    border: 'border-[#CBD5E1]',
    iconColor: 'text-[#64748B]',
    Icon: Sparkles,
    label: 'New Bidder',
  };

  if (tier === 'high') {
    styleConfig = {
      bg: 'bg-[#EBF8EC]',
      text: 'text-[#138808]',
      border: 'border-[#138808]/30',
      iconColor: 'text-[#138808]',
      Icon: ShieldCheck,
      label: 'High Reliability',
    };
  } else if (tier === 'moderate') {
    styleConfig = {
      bg: 'bg-[#FFF4E5]',
      text: 'text-[#B45309]',
      border: 'border-[#FFD8A8]',
      iconColor: 'text-[#D97706]',
      Icon: History,
      label: 'Moderate Reliability',
    };
  } else if (tier === 'low') {
    styleConfig = {
      bg: 'bg-[#FEF2F2]',
      text: 'text-[#D32F2F]',
      border: 'border-[#FECACA]',
      iconColor: 'text-[#D32F2F]',
      Icon: AlertCircle,
      label: 'Low Reliability',
    };
  }

  const { bg, text, border, iconColor, Icon } = styleConfig;

  // Render variant
  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold border ${bg} ${text} ${border} shadow-2xs ${className}`}
        title={`Historical Track Record: ${badge_text} (Informational only — GFR Rule 149)`}
      >
        <Icon className={`w-3.5 h-3.5 ${iconColor} flex-shrink-0 stroke-[2.2]`} />
        <span>{short_badge_text || (reliability_score !== null ? `${reliability_score}% (${qualified_bids}/${total_bids})` : 'New Bidder')}</span>
      </span>
    );
  }

  if (variant === 'pill') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${bg} ${text} ${border} ${className}`}
        title={badge_text}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor:
              tier === 'high'
                ? '#138808'
                : tier === 'moderate'
                ? '#D97706'
                : tier === 'low'
                ? '#D32F2F'
                : '#64748B',
          }}
        />
        <span>{reliability_score !== null ? `${reliability_score}%` : 'N/A'}</span>
      </span>
    );
  }

  // Default 'full' badge format: "Reliability: 85% (17 of 20 past bids compliant)"
  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${bg} ${border} shadow-2xs`}
        title="Purely informational historical track record under GFR Rule 149. Does not affect current compliance score or override statutory checks."
      >
        <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center border border-black/5 shadow-2xs flex-shrink-0">
          <Icon className={`w-3.5 h-3.5 ${iconColor} stroke-[2.2]`} />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-xs font-bold ${text}`}>
            {badge_text || (reliability_score !== null ? `Reliability: ${reliability_score}% (${qualified_bids} of ${total_bids} past bids compliant)` : 'Reliability: N/A (New Bidder)')}
          </span>
          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 bg-white/70 px-1 py-0.2 rounded border border-slate-200/80">
            Advisory
          </span>
        </div>
      </div>

      {showNotice && (
        <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 pl-1">
          <Info className="w-3 h-3 text-slate-400 flex-shrink-0" />
          Purely informational — does not affect current statutory score
        </span>
      )}
    </div>
  );
}
