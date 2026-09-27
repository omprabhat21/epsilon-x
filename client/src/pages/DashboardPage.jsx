import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlusCircle,
  Search,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Trash2,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import RiskBadge from '../components/RiskBadge';
import ReliabilityBadge from '../components/ReliabilityBadge';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [bidders, setBidders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'reviewed'
  const [searchQuery, setSearchQuery] = useState('');
  const [reloading, setReloading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/bidders');
      const biddersList = await res.json();

      // Fetch detail/scores for all bidders
      const detailedBidders = await Promise.all(
        biddersList.map(async (b) => {
          try {
            const detailRes = await fetch(`/api/bidders/${b.id}`);
            if (detailRes.ok) {
              const detail = await detailRes.json();
              return {
                ...b,
                score: detail.score,
                categories: detail.categories || [],
                verification_results: detail.verification_results || [],
                reliability: detail.reliability || b.reliability,
                bid_history: detail.bid_history || [],
              };
            }
          } catch {
            // fallback to basic record
          }
          return b;
        })
      );

      setBidders(detailedBidders);
    } catch (err) {
      console.error('Error loading bidders dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleReseed = async () => {
    if (!window.confirm('Reset sample bidder profiles to original baseline?')) return;
    setReloading(true);
    try {
      await fetch('/api/seed', { method: 'POST' });
      await fetchDashboardData();
    } catch (err) {
      console.error('Reseed error:', err);
    } finally {
      setReloading(false);
    }
  };

  const handleDeleteBidder = async (e, bidder) => {
    e.stopPropagation();
    const cleanName = bidder.name.split('(')[0].trim();
    const confirmed = window.confirm(
      `Remove bidder "${cleanName}"?\n\nThis will permanently remove this bidder and any attached compliance records from the portal.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/bidders/${bidder.id}`, { method: 'DELETE' });
      if (!res.ok) {
        let errMsg = 'Failed to remove bidder.';
        try {
          const err = await res.json();
          errMsg = err.error || errMsg;
        } catch (_) {
          errMsg = `Server returned status ${res.status}`;
        }
        throw new Error(errMsg);
      }
      await fetchDashboardData();
    } catch (err) {
      alert(`Error removing bidder: ${err.message}`);
    }
  };

  // Metric counts
  const pendingCount = bidders.filter(
    (b) => !b.score?.officer_decision
  ).length;
  const qualifiedCount = bidders.filter(
    (b) => b.score?.officer_decision === 'qualified'
  ).length;
  const disqualifiedCount = bidders.filter(
    (b) => b.score?.officer_decision === 'disqualified'
  ).length;

  // Filtered lists for tabs
  const pendingBidders = bidders.filter(
    (b) => !b.score?.officer_decision
  );
  const reviewedBidders = bidders.filter(
    (b) =>
      b.score?.officer_decision === 'qualified' ||
      b.score?.officer_decision === 'disqualified'
  );

  const currentTabList = activeTab === 'pending' ? pendingBidders : reviewedBidders;

  const filteredBidders = currentTabList.filter((b) => {
    const query = searchQuery.toLowerCase();
    return (
      b.name.toLowerCase().includes(query) ||
      (b.pan && b.pan.toLowerCase().includes(query)) ||
      (b.gstin && b.gstin.toLowerCase().includes(query)) ||
      (b.udyam && b.udyam.toLowerCase().includes(query))
    );
  });

  const getCategorySummary = (bidder) => {
    if (!bidder.categories || bidder.categories.length === 0) {
      return { text: 'Pending Verification', type: 'pending' };
    }

    const fails = bidder.categories.filter((c) => c.status === 'fail');
    const unclears = bidder.categories.filter((c) => c.status === 'unclear');

    if (fails.length > 0) {
      return {
        text: `${fails.length} ${fails.length === 1 ? 'flag' : 'flags'}`,
        subText: fails.map((f) => f.name.split('/')[0].trim()).slice(0, 2).join(', '),
        type: 'fail',
      };
    }

    if (unclears.length > 0) {
      return {
        text: `${unclears.length} unclear`,
        subText: unclears.map((u) => u.name.split('/')[0].trim()).slice(0, 2).join(', '),
        type: 'unclear',
      };
    }

    return { text: 'All Clear (9/9)', type: 'pass' };
  };

  const formatDate = (isoString) => {
    if (!isoString) return '2026-09-19';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '2026-09-19';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Heading & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-headline text-[#0F172A]">
            Bidder Compliance Evaluation
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleReseed}
            disabled={reloading}
            className="btn-gov-outline px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Reset to standard test profiles"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reloading ? 'animate-spin' : ''}`} />
            <span>{reloading ? 'Resetting...' : 'Reset Profiles'}</span>
          </button>
          <button
            onClick={() => navigate('/bidder/new')}
            className="btn-saffron px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Register New Bidder</span>
          </button>
        </div>
      </div>

      {/* Functional Government Stat Cards (Plain and Functional) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white border border-[#CBD5E1] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#475569]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Pending Review
            </span>
            <Clock className="w-4 h-4 text-[#FF9933]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-headline text-3xl font-bold text-[#0F172A]">
              {pendingCount}
            </span>
            <span className="text-xs text-[#64748B]">Bids awaiting determination</span>
          </div>
        </div>

        <div className="bg-[#F0FDF4] border-2 border-[#138808] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#138808]">
              Qualified
            </span>
            <div className="w-7 h-7 rounded-full bg-[#EBF8EC] border border-[#138808]/40 flex items-center justify-center text-[#138808]">
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-headline text-3xl font-bold text-[#138808]">
              {qualifiedCount}
            </span>
            <span className="text-xs font-medium text-[#138808]/85">Statutory cleared by officer</span>
          </div>
        </div>

        <div className="bg-white border border-[#CBD5E1] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#475569]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#D32F2F]">
              Disqualified
            </span>
            <XCircle className="w-4 h-4 text-[#D32F2F]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-headline text-3xl font-bold text-[#D32F2F]">
              {disqualifiedCount}
            </span>
            <span className="text-xs text-[#64748B]">Rejected under statutory rules</span>
          </div>
        </div>
      </div>

      {/* Main Table Section with Tabs */}
      <div className="bg-white border border-[#CBD5E1] rounded-xl shadow-xs overflow-hidden">
        {/* Navigation Tabs + Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 pt-3 pb-2 border-b border-[#E2E8F0]">
          {/* Two Distinct Tabs */}
          <div className="flex items-center gap-1 border-b-2 sm:border-b-0 border-transparent -mb-px">
            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-2.5 pt-1 px-3.5 text-xs font-bold transition-all cursor-pointer relative ${
                activeTab === 'pending'
                  ? 'text-[#0F172A] border-b-2 border-[#FF9933]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <span>Pending Review</span>
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'pending'
                  ? 'bg-[#FFF4E5] text-[#FF9933] font-bold border border-[#FFD8A8]'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('reviewed')}
              className={`pb-2.5 pt-1 px-3.5 text-xs font-bold transition-all cursor-pointer relative ${
                activeTab === 'reviewed'
                  ? 'text-[#0F172A] border-b-2 border-[#FF9933]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <span>Reviewed</span>
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'reviewed'
                  ? 'bg-[#EBF8EC] text-[#138808] font-bold'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {qualifiedCount + disqualifiedCount}
              </span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64 pb-2 sm:pb-0">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, GSTIN, PAN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#FF9933] transition"
            />
          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-6 h-6 text-[#000080] animate-spin mx-auto mb-2" />
            <p className="text-xs text-[#64748B] font-medium">Loading bidder records...</p>
          </div>
        ) : filteredBidders.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#64748B]">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No bidder records found</p>
            <p className="mt-1">
              {searchQuery
                ? 'Try refining your search query.'
                : activeTab === 'pending'
                ? 'All bidders currently evaluated.'
                : 'No bids marked as reviewed yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#CBD5E1] text-[#475569] font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Bidder Name</th>
                  <th className="py-3 px-4">Category Summary</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredBidders.map((b) => {
                  const summary = getCategorySummary(b);
                  const scoreVal = b.score?.overall_score ?? 0;
                  const hasDecision = Boolean(b.score?.officer_decision);

                  return (
                    <tr
                      key={b.id}
                      onClick={() => navigate(`/bidder/${b.id}`)}
                      className="hover:bg-[#FFFDF5] cursor-pointer transition-colors group"
                    >
                      {/* Bidder Name */}
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[#0F172A] group-hover:text-[#000080]">
                            {b.name.split('(')[0].trim()}
                          </span>
                          {b.score?.officer_override && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D] shadow-2xs" title="Officer determination diverged from AI Recommendation">
                              ⚠ Override
                            </span>
                          )}
                          {b.reliability && (
                            <ReliabilityBadge reliability={b.reliability} variant="compact" />
                          )}
                        </div>
                        <div className="text-[11px] text-[#64748B] line-clamp-1 mt-0.5">
                          {b.name.includes('(')
                            ? b.name.split('(')[1].replace(')', '')
                            : b.description || 'Statutory Bid Record'}
                        </div>
                      </td>

                      {/* Category Summary */}
                      <td className="py-3.5 px-4">
                        {summary.type === 'fail' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 font-bold text-[#D32F2F]">
                              <XCircle className="w-3.5 h-3.5" /> {summary.text}
                            </span>
                            {summary.subText && (
                              <div className="text-[10px] text-[#64748B] mt-0.5">
                                {summary.subText}
                              </div>
                            )}
                          </div>
                        ) : summary.type === 'unclear' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 font-bold text-[#FF9933]">
                              <AlertCircle className="w-3.5 h-3.5" /> {summary.text}
                            </span>
                            {summary.subText && (
                              <div className="text-[10px] text-[#64748B] mt-0.5">
                                {summary.subText}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-[#EBF8EC] text-[#138808] border border-[#138808]/30">
                            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" /> {summary.text}
                          </span>
                        )}
                      </td>

                      {/* Score */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className="font-headline font-bold text-base"
                          style={{
                            color:
                              scoreVal >= 80
                                ? '#138808'
                                : scoreVal >= 50
                                ? '#FF9933'
                                : '#D32F2F',
                          }}
                        >
                          {scoreVal}
                        </span>
                        <span className="text-[10px] text-[#64748B] ml-0.5">/100</span>
                      </td>

                      {/* Risk Badge */}
                      <td className="py-3.5 px-4">
                        <RiskBadge risk={b.score?.risk_level} />
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-[#64748B] whitespace-nowrap text-[11px]">
                        {formatDate(b.created_at)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/bidder/${b.id}`);
                            }}
                            className="btn-saffron px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer shadow-xs hover:shadow-sm"
                          >
                            <span>{hasDecision ? 'View Review' : 'Review Bidder'}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteBidder(e, b)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#D32F2F] hover:bg-rose-50 transition cursor-pointer border border-transparent hover:border-rose-200"
                            title={`Remove ${b.name.split('(')[0].trim()}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
