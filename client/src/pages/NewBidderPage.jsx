import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Building2, PlusCircle, CheckCircle2 } from 'lucide-react';

export default function NewBidderPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [profileTemplate, setProfileTemplate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please provide the bidder entity name.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/bidders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(),
          profile_template: profileTemplate || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create bidder record.');
      }

      const created = await res.json();
      // Navigate to the newly created bidder detail page
      navigate(`/bidder/${created.id}`);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF9933] hover:text-[#E67E00] hover:underline transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Back to Compliance Dashboard</span>
        </Link>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-[#CBD5E1] rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="pb-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-[#000080] text-white flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#FF9933]" />
            </div>
            <div>
              <h1 className="text-headline text-lg sm:text-xl text-[#0F172A]">
                Register New Bidder Entity
              </h1>
              <p className="text-xs text-[#475569] mt-0.5">
                Initiate a statutory procurement compliance review for this tender.
              </p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-[#FDE8E8] border border-[#FCA5A5] text-[#D32F2F] text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div>
            <label className="block font-bold text-xs uppercase tracking-wider text-[#0F172A] mb-1.5">
              Bidder Corporate / Registered Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bharat Heavy Electricals Limited (BHEL) or Larsen & Toubro"
              className="w-full bg-white border border-[#CBD5E1] rounded-lg p-3 text-xs text-[#0F172A] focus:outline-none focus:border-[#FF9933] shadow-xs"
              autoFocus
            />
            <p className="text-[11px] text-[#64748B] mt-1.5">
              Provide the legal entity name as registered on the Government e-Marketplace (GeM).
            </p>
          </div>

          <div>
            <label className="block font-bold text-xs uppercase tracking-wider text-[#0F172A] mb-1.5">
              GeM Seller Profile Baseline (Simulated)
            </label>
            <select
              value={profileTemplate}
              onChange={(e) => setProfileTemplate(e.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded-lg p-3 text-xs text-[#0F172A] focus:outline-none focus:border-[#FF9933] shadow-xs cursor-pointer"
            >
              <option value="">Genuinely New Vendor — No Pre-existing GeM Profile (Tests "Profile Not Found")</option>
              <option value="compliant">Simulate Fully Compliant Profile (Verified GST, PAN, Udyam, MII, EPFO)</option>
              <option value="non_compliant">Simulate Non-Compliant Profile (Cancelled GST, Debarred, Inoperative PAN)</option>
              <option value="ambiguous">Simulate Borderline Profile (Discrepant Udyam & Parent Entity)</option>
            </select>
            <p className="text-[11px] text-[#64748B] mt-1.5">
              Determines whether seller profile records exist in mock databases or require manual officer clarification.
            </p>
          </div>

          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2">
            <div className="text-xs font-bold text-[#000080]">
              Evaluation Workflow Upon Registration:
            </div>
            <ul className="text-[11px] text-[#475569] space-y-1 list-disc list-inside">
              <li>Automatic baseline check against GeM Debarment & CVC blacklist records.</li>
              <li>Pre-population of registered Seller Profile certificates on file.</li>
              <li>Officer console immediately activated for tender document uploads and statutory determination.</li>
            </ul>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-2.5 rounded-lg font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="flex-1 py-2.5 rounded-lg font-bold btn-saffron disabled:opacity-50 transition cursor-pointer shadow-xs"
            >
              {submitting ? 'Registering Entity...' : 'Register Bidder & Begin Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
