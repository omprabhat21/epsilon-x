import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  FileDown,
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Building2,
  FileText,
  Layers,
  Sparkles,
  ExternalLink,
  Info,
  Lock,
  Clock,
  AlertCircle,
  History,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import RiskBadge from '../components/RiskBadge';
import ReliabilityBadge from '../components/ReliabilityBadge';
import UploadModal from '../components/UploadModal';
import { getStoredOfficer } from '../utils/officerAuth';
import { generateAiAuditSummary, determineOfficerOverride } from '../utils/auditSummary';

const CATEGORY_ICONS = {
  blacklist: ShieldAlert,
  gst: FileText,
  pan_it: Building2,
  udyam: Layers,
  mii: CheckCircle2,
  epfo_esic: UserCheck,
  startup_nsic: Sparkles,
  oem_auth: ShieldCheck,
  digilocker: ExternalLink,
};

// 3 Realistic Document Source Groups
const GROUP_A_KEYS = ['udyam', 'gst', 'pan_it', 'mii', 'epfo_esic'];
const GROUP_B_KEYS = ['oem_auth', 'startup_nsic', 'digilocker'];
const GROUP_C_KEYS = ['blacklist'];

export default function BidderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [bidderData, setBidderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [activeTab, setActiveTab] = useState({}); // { [category]: 'claim' | 'portal' }
  const [copiedKey, setCopiedKey] = useState(null);

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedUploadCategory, setSelectedUploadCategory] = useState('oem_auth');

  // Officer decision state
  const [decision, setDecision] = useState('');
  const [note, setNote] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [decisionSuccessMsg, setDecisionSuccessMsg] = useState('');

  const loadBidderDetails = async (bidderId) => {
    try {
      const res = await fetch(`/api/bidders/${bidderId}`);
      if (!res.ok) throw new Error('Bidder not found');
      const json = await res.json();
      setBidderData(json);
      setDecision(json.score?.officer_decision || '');
      setNote(json.score?.officer_note || '');
      setAiSummary(json.score?.ai_audit_summary || generateAiAuditSummary(json.categories || []));
    } catch (err) {
      console.error('Failed to load bidder details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      loadBidderDetails(id);
    }
  }, [id]);

  const runVerification = async () => {
    if (!id) return;
    setVerifying(true);
    try {
      const res = await fetch(`/api/bidders/${id}/verify`, { method: 'POST' });
      await res.json();
      await loadBidderDetails(id);
    } catch (err) {
      console.error('Verification failed:', err);
    } finally {
      setVerifying(false);
    }
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!id || !decision) return;
    setDecisionSubmitting(true);
    setDecisionSuccessMsg('');
    try {
      const activeOfficer = getStoredOfficer();
      const officerAttribution = activeOfficer?.name
        ? `${activeOfficer.name} (${activeOfficer.designation || 'Procurement Officer'})`
        : 'Procurement Officer';

      let fullNote = note || '';
      if (officerAttribution && !fullNote.includes('[Adjudicated by:')) {
        fullNote = `[Adjudicated by: ${officerAttribution}] ${fullNote}`.trim();
      }

      const summaryToSave = aiSummary || generateAiAuditSummary(bidderData?.categories || []);
      const overrideToSave = determineOfficerOverride(
        decision,
        bidderData?.score?.risk_level,
        bidderData?.categories || []
      );

      const res = await fetch(`/api/bidders/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officer_decision: decision,
          officer_note: fullNote,
          officer_name: officerAttribution,
          ai_audit_summary: summaryToSave,
          officer_override: overrideToSave,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save officer decision.');
      }
      const updated = await res.json();

      // Immediately update local UI state for instant visual feedback
      setBidderData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          score: {
            ...prev.score,
            officer_decision: decision,
            officer_note: note,
            officer_name: officerAttribution,
            ai_audit_summary: summaryToSave,
            officer_override: overrideToSave,
          },
        };
      });

      setDecisionSuccessMsg(`Statutory determination recorded under ${activeOfficer?.name || 'Officer'}.`);
      await loadBidderDetails(id);
      setTimeout(() => setDecisionSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Decision submission error:', err);
      alert(`Decision submission failed: ${err.message}`);
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const openUploadForCategory = (catKey) => {
    setSelectedUploadCategory(catKey);
    setUploadModalOpen(true);
  };

  const handleExportPdf = () => {
    if (!id) return;
    window.open(`/api/bidders/${id}/export/pdf`, '_blank');
  };

  const handleExportCsv = () => {
    if (!id) return;
    window.open(`/api/bidders/${id}/export/csv`, '_blank');
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#CBD5E1] rounded-xl p-16 text-center shadow-xs">
        <RefreshCw className="w-8 h-8 text-[#000080] animate-spin mx-auto mb-3" />
        <p className="text-[#475569] text-xs font-semibold">
          Loading Bidder Compliance Dossier...
        </p>
      </div>
    );
  }

  if (!bidderData || !bidderData.bidder) {
    return (
      <div className="bg-white border border-[#CBD5E1] rounded-xl p-12 text-center shadow-xs space-y-3">
        <p className="text-sm font-bold text-slate-700">Bidder not found</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF9933] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  const scoreVal = bidderData.score?.overall_score || 0;
  const scoreDetails = bidderData.score?.details;

  // Authoritative statutory check count (strictly 0 to 9) derived from the 9 statutory categories
  const categoriesList = bidderData.categories || [];
  const applicableCount = categoriesList.length > 0
    ? categoriesList.filter((c) => c.status !== 'not_applicable').length
    : Math.min(Math.max(scoreDetails?.applicable_count ?? 9, 0), 9);

  const notApplicableCount = categoriesList.length > 0
    ? categoriesList.filter((c) => c.status === 'not_applicable').length
    : Math.min(Math.max(scoreDetails?.not_applicable_count ?? 0, 0), 9);

  // Unclear categories count for AI recommendation
  const unclearCount = categoriesList.length > 0
    ? categoriesList.filter((c) => c.status === 'unclear').length
    : Math.min(Math.max(scoreDetails?.unclear_count ?? 0, 0), 9);

  // Explicit AI Recommendation mapping logic (purely advisory display)
  const riskLevel = (bidderData.score?.risk_level || '').toLowerCase();
  let aiRecommendation = null;
  if (riskLevel === 'low') {
    aiRecommendation = {
      action: 'Qualify',
      detail: 'no statutory concerns flagged',
      textColor: 'text-[#138808]',
      containerBg: 'bg-[#F0FDF4] border-[#BBF7D0]',
    };
  } else if (riskLevel === 'medium') {
    const categoryWord = unclearCount === 1 ? 'category needs' : 'categories need';
    aiRecommendation = {
      action: 'Manual Review Required',
      detail: `${unclearCount} unclear ${categoryWord} officer verification`,
      textColor: 'text-[#D97706]',
      containerBg: 'bg-[#FFFBEB] border-[#FDE68A]',
    };
  } else if (riskLevel === 'high') {
    aiRecommendation = {
      action: 'Reject / Disqualify',
      detail: 'statutory disqualification criteria met (e.g. blacklisting, cancelled GST)',
      textColor: 'text-[#D32F2F]',
      containerBg: 'bg-[#FEF2F2] border-[#FECACA]',
    };
  }

  // Filter categories by the 3 realistic groups
  const groupACategories = (bidderData.categories || []).filter((c) =>
    GROUP_A_KEYS.includes(c.category)
  );
  const groupBCategories = (bidderData.categories || []).filter((c) =>
    GROUP_B_KEYS.includes(c.category)
  );
  const groupCCategories = (bidderData.categories || []).filter((c) =>
    GROUP_C_KEYS.includes(c.category)
  );

  const renderCategoryRow = (cat, sourceGroup) => {
    const Icon = CATEGORY_ICONS[cat.category] || FileText;
    const isExpanded = expandedCategory === cat.category;
    const currentTab = activeTab[cat.category] || 'claim';

    return (
      <div
        key={cat.category}
        className="bg-white border border-[#CBD5E1] rounded-lg overflow-hidden transition-colors"
      >
        {/* Main Row */}
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-md bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#000080] flex-shrink-0">
              <Icon className="w-4 h-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs text-[#0F172A]">
                  {cat.name}
                </span>

                {/* Source Label */}
                {sourceGroup === 'A' && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    Source: Seller Profile
                  </span>
                )}
                {sourceGroup === 'B' && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FFF4E5] text-[#FF9933] border border-[#FFD8A8]">
                    Tender-Specific Document
                  </span>
                )}
                {sourceGroup === 'C' && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    System Check — verified against GeM/CVC records
                  </span>
                )}

                <span className="text-[10px] text-slate-500 font-medium">
                  Weight: {cat.weight}%
                </span>
              </div>

              {/* Plain reason explanation */}
              <p className="text-xs text-[#334155] mt-1 leading-relaxed">
                {cat.reason}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 justify-between md:justify-end flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            <StatusBadge 
              status={cat.status} 
              label={cat.reason?.includes('No Seller Profile Data Available') ? 'UNCLEAR — PROFILE NOT FOUND' : null}
            />

            {/* Upload Button ONLY for Tender-Specific Documents (Group B) */}
            {sourceGroup === 'B' && (
              <button
                onClick={() => openUploadForCategory(cat.category)}
                className="btn-saffron px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs"
                title="Upload tender certificate"
              >
                <Upload className="w-3 h-3 text-white" />
                <span>Upload</span>
              </button>
            )}

            {/* Expand technical drawer */}
            <button
              onClick={() => setExpandedCategory(isExpanded ? null : cat.category)}
              className="p-1 rounded text-slate-500 hover:text-[#0F172A] hover:bg-slate-100 transition cursor-pointer"
              title="Technical Details"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Technical Drawer (Hidden by default) */}
        {isExpanded && (
          <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab({ ...activeTab, [cat.category]: 'claim' })}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                    currentTab === 'claim'
                      ? 'bg-[#000080] text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  Extracted Document Claim
                </button>
                <button
                  onClick={() => setActiveTab({ ...activeTab, [cat.category]: 'portal' })}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                    currentTab === 'portal'
                      ? 'bg-[#000080] text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  Government Portal Match
                </button>
              </div>

              <span className="text-[10px] text-slate-500 font-mono">
                Key: <strong>{cat.category}</strong> | Ref: {cat.reference_field}
              </span>
            </div>

            {currentTab === 'claim' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Extracted Structured Claim Record:</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(cat.extracted_claim, null, 2),
                        `claim-${cat.category}`
                      )
                    }
                    className="text-[11px] font-semibold text-[#FF9933] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === `claim-${cat.category}` ? (
                      <>
                        <Check className="w-3 h-3 text-[#138808]" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy JSON
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-white border border-[#CBD5E1] rounded text-[11px] font-mono text-[#0F172A] overflow-x-auto">
                  {cat.extracted_claim
                    ? JSON.stringify(cat.extracted_claim, null, 2)
                    : 'No structured claim on file.'}
                </pre>
              </div>
            )}

            {currentTab === 'portal' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Statutory Portal Record Matched:</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(cat.matched_record, null, 2),
                        `portal-${cat.category}`
                      )
                    }
                    className="text-[11px] font-semibold text-[#FF9933] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === `portal-${cat.category}` ? (
                      <>
                        <Check className="w-3 h-3 text-[#138808]" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy JSON
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-white border border-[#CBD5E1] rounded text-[11px] font-mono text-[#0F172A] overflow-x-auto">
                  {cat.matched_record
                    ? JSON.stringify(cat.matched_record, null, 2)
                    : 'No statutory portal record matched.'}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Back Link */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF9933] hover:text-[#E67E00] hover:underline transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Back to Compliance Dashboard</span>
        </Link>
      </div>

      {/* Bidder Header Summary */}
      <div className="bg-white border border-[#CBD5E1] rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                Compliance Report
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Ref: {bidderData.bidder?.id?.slice(0, 12)}
              </span>
            </div>
            <h1 className="text-headline text-[#0F172A] mt-0.5">
              {bidderData.bidder?.name}
            </h1>
            <p className="text-xs text-[#475569] mt-1 font-medium">
              {bidderData.bidder?.description ||
                'Statutory verification against Indian regulatory standards and procurement guidelines.'}
            </p>

            {/* Prominent Bidder Reliability Score Badge (Informational under GFR Rule 149) */}
            <div className="mt-3.5 flex items-center gap-2.5 flex-wrap">
              <ReliabilityBadge
                reliability={bidderData.reliability}
                variant="full"
                showNotice={true}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runVerification}
              disabled={verifying}
              className="btn-saffron px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
              <span>{verifying ? 'Verifying...' : 'Re-Run Verification'}</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Summary Blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-5 items-stretch">
          {/* 1. Score Dial & AI Recommendation */}
          <div className="flex flex-col items-center justify-between p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-center">
            <div className="flex flex-col items-center w-full">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                Compliance Score
              </span>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-score-metric"
                  style={{
                    color:
                      scoreVal >= 80
                        ? '#138808'
                        : scoreVal >= 50
                        ? '#D97706'
                        : '#D32F2F',
                  }}
                >
                  {scoreVal}
                </span>
                <span className="text-sm font-bold text-[#64748B]">/ 100</span>
              </div>

              {/* Clean Progress Bar */}
              <div className="w-40 bg-[#E2E8F0] h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full transition-all duration-700 rounded-full"
                  style={{
                    width: `${Math.max(scoreVal, 5)}%`,
                    backgroundColor:
                      scoreVal >= 80
                        ? '#138808'
                        : scoreVal >= 50
                        ? '#FF9933'
                        : '#D32F2F',
                  }}
                />
              </div>

              <div className="mt-3">
                <RiskBadge risk={bidderData.score?.risk_level} />
              </div>
            </div>

            {/* Explicit AI Recommendation Line (Purely Advisory) */}
            {aiRecommendation && (
              <div
                className={`mt-4 w-full p-2.5 rounded-lg border text-left ${aiRecommendation.containerBg}`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#000080]">
                    <Sparkles className="w-3 h-3 text-[#FF9933]" />
                    AI Recommendation
                  </span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-white/85 border border-slate-200 text-slate-500 uppercase tracking-wider">
                    Advisory Only
                  </span>
                </div>
                <div className="text-xs leading-snug text-slate-800">
                  <strong className={aiRecommendation.textColor}>
                    {aiRecommendation.action}
                  </strong>
                  <span className="text-slate-600 font-normal">
                    {' '}— {aiRecommendation.detail}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Statutory Coverage Summary */}
          <div className="flex flex-col justify-center p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Statutory Coverage
              </span>
              <span className="text-[11px] font-bold text-[#000080]">
                9 Mandatory Checks
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white border border-[#E2E8F0] rounded">
                <div className="text-[10px] text-[#64748B]">Applicable</div>
                <div className="text-base font-bold text-[#0F172A] mt-0.5">
                  {applicableCount} / 9
                </div>
              </div>
              <div className="p-2.5 bg-white border border-[#E2E8F0] rounded">
                <div className="text-[10px] text-[#64748B]">Exempted (N/A)</div>
                <div className="text-base font-bold text-[#64748B] mt-0.5">
                  {notApplicableCount}
                </div>
              </div>
            </div>

            {scoreDetails?.renormalized && (
              <p className="text-[11px] text-[#9A3412] font-medium flex items-center gap-1.5 bg-[#FFF4E5] p-2 rounded border border-[#FFD8A8]">
                <Info className="w-3.5 h-3.5 flex-shrink-0 text-[#FF9933]" />
                Weights renormalized for MSE statutory exemptions.
              </p>
            )}
          </div>

          {/* 3. Determination Call Summary */}
          <div className="flex flex-col justify-center p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Officer Determination
            </span>

            <div className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${
              bidderData.score?.officer_decision === 'qualified'
                ? 'bg-[#F0FDF4] border-2 border-[#138808]'
                : bidderData.score?.officer_decision === 'disqualified'
                ? 'bg-[#FEF2F2] border-2 border-[#D32F2F]'
                : 'bg-white border-[#E2E8F0]'
            }`}>
              {bidderData.score?.officer_decision === 'qualified' ? (
                <div className="w-8 h-8 rounded-full bg-[#EBF8EC] text-[#138808] border border-[#138808]/40 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                </div>
              ) : bidderData.score?.officer_decision === 'disqualified' ? (
                <div className="w-8 h-8 rounded-full bg-[#FDE8E8] text-[#D32F2F] border border-[#D32F2F]/40 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-5 h-5 stroke-[2.5]" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#FFF4E5] text-[#FF9933] flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
              )}

              <div>
                <div className="text-xs font-bold uppercase text-[#0F172A] flex items-center gap-2">
                  <span>
                    {bidderData.score?.officer_decision
                      ? `BIDDER ${bidderData.score.officer_decision}`
                      : 'Pending Determination'}
                  </span>
                  {bidderData.score?.officer_override && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]">
                      <AlertTriangle className="w-3 h-3 text-[#D97706]" /> Override
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#64748B] mt-0.5">
                  {bidderData.score?.officer_decision
                    ? 'Officer adjudication legally recorded'
                    : 'Awaiting officer sign-off'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 9 STATUTORY CATEGORIES GROUPED BY DOCUMENT SOURCE MODEL  */}
      {/* ========================================================= */}
      <section className="space-y-6">
        <div>
          <h2 className="text-section-title">
            Statutory Regulatory Categories
          </h2>
          <p className="text-xs text-[#475569] mt-0.5">
            Categorized by regulatory data origin per GeM procurement rules.
          </p>
        </div>

        {/* GROUP A: Seller Profile Data */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#000080]" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#0F172A]">
                Seller Profile Data
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Auto-pulled from GeM Seller Registration (No upload required)
            </span>
          </div>
          <div className="space-y-2.5">
            {groupACategories.map((cat) => renderCategoryRow(cat, 'A'))}
          </div>
        </div>

        {/* GROUP B: Tender-Specific Documents */}
        <div className="space-y-3 pt-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF9933]" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#0F172A]">
                Tender-Specific Documents
              </h3>
            </div>
            <span className="text-[11px] text-[#B45309] font-medium">
              Bid-Specific Document Verification (Upload Available)
            </span>
          </div>
          <div className="space-y-2.5">
            {groupBCategories.map((cat) => renderCategoryRow(cat, 'B'))}
          </div>
        </div>

        {/* GROUP C: System Check */}
        <div className="space-y-3 pt-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D32F2F]" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#0F172A]">
                System Check
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Automated Check against GeM Suspensions & CVC Central Debarment
            </span>
          </div>
          <div className="space-y-2.5">
            {groupCCategories.map((cat) => renderCategoryRow(cat, 'C'))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* PAST BID HISTORY & RELIABILITY TRACK RECORD (GFR RULE 149) */}
      {/* ========================================================= */}
      <section className="bg-white border border-[#CBD5E1] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#EEF2FF] text-[#000080] border border-[#C7D2FE] flex items-center justify-center flex-shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-headline font-bold text-sm text-[#0F172A]">
                  Past Bid History & Reliability Track Record
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  GFR Rule 149 Historical Reference
                </span>
              </div>
              <p className="text-[11px] text-[#475569] mt-0.5">
                Past tender bids and officer adjudications on record for this vendor.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ReliabilityBadge
              reliability={bidderData.reliability}
              variant="compact"
            />
          </div>
        </div>

        {/* Informational Officer Advisory Note */}
        <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-2.5 text-xs text-[#475569]">
          <Info className="w-4 h-4 text-[#000080] flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed text-[11px]">
            <strong className="text-[#0F172A] font-bold">Informational Reference Only: </strong>
            Historical reliability provides procurement officers with longitudinal vendor performance context. This score is advisory only — it does not alter the current statutory compliance score, risk classification, or any of the 9 statutory category verifications.
          </div>
        </div>

        {/* Past Bids Table */}
        {!bidderData.bid_history || bidderData.bid_history.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#64748B] bg-[#F8FAFC] rounded-lg border border-dashed border-[#CBD5E1]">
            <p className="font-semibold text-slate-700">No prior bids on record</p>
            <p className="text-[11px] text-slate-500 mt-1">This vendor has no recorded prior tenders in the GeM statutory registry.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#E2E8F0]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#CBD5E1] text-[#475569] font-bold text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3.5">Tender Reference</th>
                  <th className="py-2.5 px-3.5">Date</th>
                  <th className="py-2.5 px-3.5 text-center">Historical Score</th>
                  <th className="py-2.5 px-3.5">Risk Level</th>
                  <th className="py-2.5 px-3.5 text-right">Officer Determination</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {bidderData.bid_history.map((item) => {
                  const isQualified = (item.officer_decision || '').toLowerCase() === 'qualified';
                  return (
                    <tr key={item.id} className="hover:bg-[#FFFDF5] transition-colors">
                      <td className="py-2.5 px-3.5 font-bold font-mono text-[11px] text-[#000080]">
                        {item.tender_ref}
                      </td>
                      <td className="py-2.5 px-3.5 text-[11px] text-[#64748B]">
                        {item.date
                          ? new Date(item.date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span className="font-bold text-[12px] text-[#0F172A]">{item.score}</span>
                        <span className="text-[10px] text-slate-400">/100</span>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <RiskBadge risk={item.risk_level} />
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        {isQualified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#EBF8EC] text-[#138808] border border-[#138808]/30">
                            <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                            <span>QUALIFIED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#FDE8E8] text-[#D32F2F] border border-[#D32F2F]/30">
                            <XCircle className="w-3 h-3 stroke-[2.5]" />
                            <span>DISQUALIFIED</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* OFFICER STATUTORY DETERMINATION CONSOLE                   */}
      {/* ========================================================= */}
      <section className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#CBD5E1]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#000080] text-white flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-[#FF9933]" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-sm text-[#0F172A]">
                Procurement Officer Statutory Determination
              </h3>
              <p className="text-[11px] text-[#475569]">
                Authorized Sovereign Action — Reviewing as <strong className="text-[#0F172A]">{getStoredOfficer().name}</strong> ({getStoredOfficer().designation})
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-white text-[#000080] border border-[#CBD5E1]">
            <Lock className="w-3 h-3" /> GFR Rule 149
          </span>
        </div>

        <form onSubmit={handleDecisionSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
              Select Official Determination Call
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Qualify Option */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-lg border-2 cursor-pointer transition ${
                  decision === 'qualified'
                    ? 'bg-[#EBF8EC] border-[#138808] shadow-xs'
                    : 'bg-white border-[#CBD5E1] hover:border-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="officer_decision"
                  value="qualified"
                  checked={decision === 'qualified'}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDecision(val);
                    const generated = generateAiAuditSummary(bidderData?.categories || []);
                    setAiSummary(generated);
                  }}
                  className="mt-0.5 h-4 w-4 text-[#138808] focus:ring-[#138808]"
                />
                <div>
                  <div className="font-bold text-xs text-[#0F172A]">
                    QUALIFY BIDDER
                  </div>
                  <div className="text-[11px] text-[#475569] mt-0.5">
                    Bidder clears statutory compliance and meets all mandatory criteria. Progress to financial opening.
                  </div>
                </div>
              </label>

              {/* Disqualify Option */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-lg border-2 cursor-pointer transition ${
                  decision === 'disqualified'
                    ? 'bg-[#FDE8E8] border-[#D32F2F] shadow-xs'
                    : 'bg-white border-[#CBD5E1] hover:border-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="officer_decision"
                  value="disqualified"
                  checked={decision === 'disqualified'}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDecision(val);
                    const generated = generateAiAuditSummary(bidderData?.categories || []);
                    setAiSummary(generated);
                  }}
                  className="mt-0.5 h-4 w-4 text-[#D32F2F] focus:ring-[#D32F2F]"
                />
                <div>
                  <div className="font-bold text-xs text-[#0F172A]">
                    DISQUALIFY BIDDER
                  </div>
                  <div className="text-[11px] text-[#475569] mt-0.5">
                    Bidder fails mandatory statutory verification or maintains active debarment. Reject bid under Rule 149.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* AI-Generated Audit Summary Block (auto-compiled when officer makes determination) */}
          {decision && (
            <div className="space-y-2 p-4 rounded-lg bg-[#EEF2FF] border border-[#C7D2FE] shadow-2xs transition-all">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#000080] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF9933]" />
                  AI-Generated Audit Summary
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-[#000080] border border-[#C7D2FE]">
                  Statutory Findings (Auto-Compiled)
                </span>
              </div>

              <div className="p-3 bg-white rounded border border-[#CBD5E1] text-xs text-[#0F172A] font-mono leading-relaxed select-all">
                {aiSummary || generateAiAuditSummary(bidderData?.categories || [])}
              </div>

              <p className="text-[10px] text-[#475569]">
                Auto-compiled from actual verification results. This summary is permanently stored and included on the signed Audit Certificate alongside your justification note below.
              </p>

              {/* Live Override Warning Banner */}
              {determineOfficerOverride(decision, bidderData?.score?.risk_level, bidderData?.categories || []) && (
                <div className="p-3 rounded-md bg-[#FFF4E5] border border-[#FFD8A8] text-[#B45309] text-xs font-medium flex items-start gap-2.5 mt-2">
                  <AlertTriangle className="w-4 h-4 text-[#D97706] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-[#9A3412]">Statutory Override Warning: </strong>
                    Your determination (<span className="font-bold uppercase text-[#9A3412]">{decision}</span>) disagrees with the AI Recommendation (<span className="font-bold">{aiRecommendation?.action || 'Disqualify'}</span>).
                    An <code className="px-1 py-0.5 rounded bg-amber-100 font-mono text-[10px] font-bold text-[#9A3412]">officer_override: true</code> flag will be stored and badged on the reviewed dashboard for audit oversight.
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
              Official Justification & Audit Trail Note
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter formal justification for audit trail (e.g. 'Evaluated pursuant to GFR Rule 149; cleared statutory checks and verified active MSME Udyam status')."
              className="w-full bg-white border border-[#CBD5E1] rounded-lg p-3 text-xs text-[#0F172A] focus:outline-none focus:border-[#FF9933] shadow-xs"
            />
            <p className="text-[10px] text-[#64748B] mt-1">
              Your free-text justification is stored alongside the AI-Generated Audit Summary above. Both are captured on the official audit certificate.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-[#64748B]">
              Logged to immutable audit table for GFR compliance.
            </span>

            <div className="flex items-center gap-3">
              {decisionSuccessMsg && (
                <span className="text-xs font-bold text-[#138808] flex items-center gap-1.5 bg-[#EBF8EC] px-3 py-1.5 rounded border border-[#A7F3D0]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {decisionSuccessMsg}
                </span>
              )}
              <button
                type="submit"
                disabled={decisionSubmitting || !decision}
                className="btn-saffron px-5 py-2 rounded-lg text-xs disabled:opacity-40 shadow-xs cursor-pointer"
              >
                {decisionSubmitting ? 'Recording...' : 'Record Determination'}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* ========================================================= */}
      {/* EXPORT & AUDIT ACTIONS SECTION                            */}
      {/* ========================================================= */}
      <section className="bg-white border border-[#CBD5E1] rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-xs text-[#0F172A] uppercase tracking-wider">
              Official Dossier & Report Export
            </h4>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Download verification certificates for audit records.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCsv}
              className="btn-gov-outline px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="btn-green px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Audit Certificate (PDF)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        bidderId={id}
        initialCategory={selectedUploadCategory}
        onUploadSuccess={() => runVerification()}
      />
    </div>
  );
}
