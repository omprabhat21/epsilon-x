import React, { useState } from 'react';
import { Shield, Info, Server, Database, Bot } from 'lucide-react';

export default function Footer() {
  const [showDevModal, setShowDevModal] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/system/status');
      const data = await res.json();
      setSystemStatus(data);
      setShowDevModal(true);
    } catch {
      // ignore
    }
  };

  return (
    <footer className="border-t border-[#E2E8F0] bg-white py-6 mt-auto text-xs text-[#64748B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="font-semibold text-[#000080] flex items-center justify-center sm:justify-start gap-1.5">
              <img
                src="/indianflagfavicon.png"
                alt="National Flag of India"
                className="h-3.5 w-auto object-contain inline-block flex-shrink-0 rounded-[1px] border border-slate-300"
              />
              <span>Statutory Bid Compliance Verification System</span>
            </p>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Conforms to GFR 2017 Rule 149 and Public Procurement Policy for MSEs & Make in India.
            </p>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Official Procurement Portal</span>
            <span>•</span>
            {/* Unobtrusive dev panel link */}
            <button
              onClick={fetchStatus}
              className="text-[#94A3B8] hover:text-[#64748B] text-[10px] underline underline-offset-2 cursor-pointer transition-colors"
              title="System Diagnostics (Restricted)"
            >
              System Health
            </button>
          </div>
        </div>
      </div>

      {/* Unobtrusive Hidden System Diagnostics Modal */}
      {showDevModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#CBD5E1] rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl text-left">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
              <div className="flex items-center gap-2 text-[#000080]">
                <Server className="w-4 h-4" />
                <h4 className="font-headline font-bold text-sm text-[#0F172A]">System Diagnostics</h4>
              </div>
              <button
                onClick={() => setShowDevModal(false)}
                className="text-[#64748B] hover:text-[#0F172A] text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Operational Mode</div>
                <div className="font-semibold text-slate-800 mt-0.5">{systemStatus?.mode || 'Active'}</div>
                <div className="text-[11px] text-slate-600 mt-1">{systemStatus?.message}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <Database className="w-3.5 h-3.5 text-[#000080]" /> Database
                  </div>
                  <div className="text-slate-600 text-[11px] mt-0.5">
                    {systemStatus?.supabase?.status || 'Active'}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <Bot className="w-3.5 h-3.5 text-[#000080]" /> Verification Model
                  </div>
                  <div className="text-slate-600 text-[11px] mt-0.5">
                    {systemStatus?.gemini?.status || 'Active'}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowDevModal(false)}
              className="w-full py-2 rounded-lg text-xs font-bold bg-[#000080] text-white hover:bg-[#000066] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}
