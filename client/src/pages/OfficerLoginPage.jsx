import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, UserCheck, Lock, User } from 'lucide-react';
import { PRESET_OFFICERS, getStoredOfficer, setStoredOfficer } from '../utils/officerAuth';

export default function OfficerLoginPage() {
  const navigate = useNavigate();
  const current = getStoredOfficer();

  // Find if current officer matches a preset, or default to preset #0
  const initialIndex = Math.max(
    0,
    PRESET_OFFICERS.findIndex((p) => p.name === current.name)
  );

  const [selectedIdx, setSelectedIdx] = useState(initialIndex);
  const [password, setPassword] = useState('••••••••');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const chosen = PRESET_OFFICERS[selectedIdx] || PRESET_OFFICERS[0];
    setStoredOfficer(chosen);
    navigate('/dashboard');
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 overflow-hidden bg-[#000080]">
      {/* Background monument image with auto fallback for login-bg.jpg and login-bg.png */}
      <img
        src="/login-bg.jpg"
        onError={(e) => {
          if (!e.currentTarget.dataset.fallbackTried) {
            e.currentTarget.dataset.fallbackTried = 'true';
            e.currentTarget.src = '/login-bg.png';
          } else {
            e.currentTarget.style.display = 'none';
          }
        }}
        alt="National Monument Background"
        className="absolute inset-0 w-full h-full object-cover object-center scale-105 filter saturate-90"
      />

      {/* Dark Navy Tint Overlay Gradient (navy #000080 at 75% fading to deeper navy/indigo at edges) */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(0, 0, 128, 0.72) 0%, rgba(4, 13, 44, 0.85) 60%, rgba(2, 6, 23, 0.94) 100%)',
        }}
      />

      {/* Subtle national tricolor ambient light flare at top/bottom border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#138808] opacity-80" />

      {/* Foreground Login Card */}
      <div className="relative z-10 max-w-md w-full bg-white/98 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl p-8 sm:p-9 space-y-6">
        {/* Emblem & Title */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <img
              src="/indemb.png"
              alt="State Emblem of India"
              className="h-16 w-auto object-contain mx-auto"
            />
          </div>
          <div>
            <div className="inline-flex items-center justify-center gap-1.5 mb-1">
              <img
                src="/favicon.ico"
                alt="National Flag of India"
                className="h-3.5 w-3.5 object-contain flex-shrink-0"
              />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#000080]">
                भारत सरकार | Government of India
              </span>
            </div>
            <h1 className="font-headline text-2xl font-bold text-[#0F172A] mt-1">
              Officer Login
            </h1>
            <p className="text-xs text-[#475569] mt-1">
              Statutory Procurement Adjudication Console — GeM Portal
            </p>
          </div>
        </div>

        {/* Audit Attribution Notice */}
        <div className="bg-[#FFF4E5] border border-[#FFD8A8] rounded-lg p-3 text-xs text-[#B45309] flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-[#FF9933] flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Statutory determinations recorded during this session will be officially attributed to the selected officer profile under GFR Rule 149.
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-[#FDE8E8] border border-[#FCA5A5] text-[#D32F2F] text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
              Select Officer Profile <span className="text-[#D32F2F]">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedIdx}
                onChange={(e) => setSelectedIdx(Number(e.target.value))}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-xs font-medium text-[#0F172A] focus:outline-none focus:border-[#FF9933] focus:bg-white transition shadow-2xs appearance-none cursor-pointer"
              >
                {PRESET_OFFICERS.map((officer, idx) => (
                  <option key={officer.id} value={idx}>
                    {officer.name} — {officer.designation}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <User className="w-4 h-4 text-slate-400" />
              </div>
            </div>
            <p className="text-[11px] text-[#64748B] mt-1">
              Choose from pre-authorized procurement evaluation officials.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
              Officer PIN / Authorization Password <span className="text-[#D32F2F]">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter officer security PIN"
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#FF9933] focus:bg-white transition shadow-2xs"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
            </div>
            <p className="text-[10.5px] text-[#64748B] mt-1">
              Demo realistic field: any password is accepted for audit attribution.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full btn-saffron py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md transition"
            >
              <UserCheck className="w-4 h-4 text-white" />
              <span>Enter Adjudication Console</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
