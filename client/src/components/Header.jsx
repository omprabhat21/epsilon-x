import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserCheck } from 'lucide-react';
import { getStoredOfficer } from '../utils/officerAuth';

export default function Header() {
  const location = useLocation();
  const [officer, setOfficer] = useState(getStoredOfficer());

  useEffect(() => {
    const handleOfficerChange = () => {
      setOfficer(getStoredOfficer());
    };
    window.addEventListener('officer_profile_changed', handleOfficerChange);
    window.addEventListener('storage', handleOfficerChange);
    return () => {
      window.removeEventListener('officer_profile_changed', handleOfficerChange);
      window.removeEventListener('storage', handleOfficerChange);
    };
  }, []);

  const isDashboard = location.pathname === '/dashboard';
  const isLoginPage = location.pathname === '/' || location.pathname === '/login';

  return (
    <header className="border-b border-[#CBD5E1] bg-white sticky top-0 z-40 shadow-xs">
      {/* Top Sovereign Band */}
      <div className="bg-[#000080] text-white py-1 px-4 sm:px-6 lg:px-8 text-xs border-b border-[#000066]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* National Emblem of India */}
            <img
              src="/indemb.png"
              alt="State Emblem of India"
              className="h-6 sm:h-7 w-auto object-contain flex-shrink-0"
            />
            {/* Updated National Flag Favicon directly before Bharat Sarkar */}
            <img
              src="/favicon.ico"
              alt="National Flag of India"
              className="h-3.5 w-3.5 object-contain flex-shrink-0 shadow-2xs"
            />
            <span className="font-semibold tracking-wide">भारत सरकार | Government of India</span>
            <span className="hidden sm:inline text-white/70">|</span>
            <span className="hidden sm:inline text-white/90">
              Ministry of Petroleum & Natural Gas | Chennai Petroleum Corporation Limited (CPCL)
            </span>
          </div>
          <div className="text-[11px] text-white/80 font-medium">
            Procurement Portal
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          {/* Brand & Epsilon X Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 group focus:outline-none flex-shrink-0">
            {/* epx.png Logo (36px height maintaining aspect ratio) */}
            <img
              src="/epx.png"
              alt="EPSILON X Logo"
              className="h-9 w-auto max-h-10 object-contain flex-shrink-0"
            />

            <div>
              <span className="font-headline text-lg font-bold tracking-tight text-[#000080] group-hover:text-[#FF9933] transition-colors block">
                EPSILON X
              </span>
              <p className="text-[11px] text-[#475569] -mt-0.5 font-medium hidden xs:block">
                Statutory Bid Compliance Verification System
              </p>
            </div>
          </Link>

          {/* Navigation links */}
          {!isLoginPage && (
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-[#E2E8F0] h-8">
              <Link
                to="/dashboard"
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  isDashboard
                    ? 'text-[#0F172A] bg-[#FFF4E5] border border-[#FF9933] font-bold'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-slate-50'
                }`}
              >
                Dashboard
              </Link>
            </nav>
          )}
        </div>

        {/* Header Right Area: Officer Attribution & Register Action */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Officer Attribution Pill */}
          {!isLoginPage && officer && officer.name && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs shadow-2xs">
              <UserCheck className="w-3.5 h-3.5 text-[#138808] flex-shrink-0" />
              <span className="text-slate-500 hidden sm:inline">Reviewing as:</span>
              <span className="font-bold text-[#0F172A] max-w-[130px] sm:max-w-[180px] truncate" title={`${officer.name} (${officer.designation})`}>
                {officer.name}
              </span>
              <span className="text-slate-300 mx-0.5">|</span>
              <Link
                to="/"
                className="text-xs font-bold text-[#FF9933] hover:text-[#E67E00] hover:underline"
                title="Switch active officer"
              >
                Switch Officer
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
