import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import OfficerLoginPage from './pages/OfficerLoginPage';
import DashboardPage from './pages/DashboardPage';
import BidderDetailPage from './pages/BidderDetailPage';
import NewBidderPage from './pages/NewBidderPage';

export default function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/' || location.pathname === '/login';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-body selection:bg-[#FF9933]/20 selection:text-[#0F172A]">
      {/* Official Government Header */}
      <Header />

      {/* Main Content Area */}
      <main className={isLoginPage ? "w-full flex-1 flex flex-col" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full"}>
        <Routes>
          <Route path="/" element={<OfficerLoginPage />} />
          <Route path="/login" element={<OfficerLoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/bidder/new" element={<NewBidderPage />} />
          <Route path="/bidder/:id" element={<BidderDetailPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      {/* Official Government Footer */}
      <Footer />
    </div>
  );
}
