# 🇮🇳 EPSILON X — Statutory Bid Compliance Verification Platform
> **AI-Powered Procurement Compliance & Fraud Prevention Engine**  
> *Government e-Marketplace (GeM) | Smart India Hackathon (SIH 2026 — PS 26100)*  
> *Ministry of Petroleum & Natural Gas | Chennai Petroleum Corporation Limited (CPCL)*

---

## 📌 Overview

**Epsilon X** is an enterprise-grade statutory compliance verification engine engineered for sovereign public procurement under **GFR 2017 Rule 149** and the **Public Procurement Policy for Micro and Small Enterprises (MSEs) & Make in India**.

The system automates the verification of bidder eligibility, cross-referencing claims extracted from tender documents against simulated Central Government databases, watchdog blacklists, and statutory registries.

---

## 🏛️ Key Features

### 1. 9-Dimensional Statutory Evaluation Matrix
Each bidder is quantitatively scored using a weighted, renormalized compliance index:

| Category | Sponsoring Authority / Source | Weight | Evaluation Method |
|---|---|:---:|---|
| **GeM Debarment / CVC Blacklist** | Central Vigilance Commission / GeM | **25%** | Automated Watchlist Query |
| **GSTIN Registration & Filing** | GSTN Portal API | **15%** | Auto-Synced Seller Profile Data |
| **PAN & Income Tax Compliance** | CBDT / Income Tax Department | **15%** | Auto-Synced Seller Profile Data |
| **MSME / Udyam Registration** | Ministry of Micro, Small & Medium Enterprises | **10%** | Auto-Synced Seller Profile Data |
| **Make in India (Local Content %)** | DPIIT / GeM Self-Declaration Registry | **10%** | Auto-Synced Seller Profile Data |
| **EPFO & ESIC Compliance** | EPFO Unified Portal / ESIC Portal | **10%** | Auto-Synced Seller Profile Data |
| **Startup India / NSIC Recognition** | Startup India Hub / NSIC | **5%** | Tender Document Upload & Verify |
| **OEM Authorization (MAF)** | Original Equipment Manufacturer Registry | **5%** | Tender Document Upload & Verify |
| **DigiLocker Certificate Verification** | Ministry of Electronics & IT (MeitY) | **5%** | Cryptographic Hash Match |

---

### 2. Two-Stage AI Verification Pipeline
- **Prompt A (Structured Extraction)**: Deep non-OCR text parsing of certificates, balance sheets, and declarations into uniform JSON schemas (`reference_id`, `claimed_dates`, `claimed_status`).
- **Prompt B (Portal Ground-Truth Cross-Check)**: Semantic verification comparing extracted bidder claims against official central portal records to flag discrepancies, expired licenses, parent-company ownership ambiguities, and collusive bidding.

---

### 3. Dual Execution Engine (Live + Offline Fallback)
- **Live Mode**: Backed by **Supabase PostgreSQL** and **Google Gemini 1.5 Flash** for live document reasoning and persistent database storage.
- **Local Fallback Mode**: Ships with zero-dependency simulated portal datasets (`data/mock-portal-data.json`) and a deterministic AI simulation engine, ensuring uninterrupted live demonstrations even in low-connectivity or air-gapped environments.

---

### 4. Officer Adjudication Console (GFR Rule 149)
- Preset authorized procurement officer profiles (**Assistant Manager**, **Deputy Manager**, **Senior Manager**) with realistic credential authorization.
- Official statutory determinations (**Qualify** / **Disqualify** / **Pending Review**) with mandatory justification notes and officer signature attribution on all generated audit certificates.

---

### 5. Audit Export & Compliance Reporting
- Instant generation of signed **PDF Compliance Certificates** and structured **CSV Audit Reports** containing timestamped adjudication logs and complete statutory breakdowns.

---

## 🛠️ Architecture & Tech Stack

```
epsilon-x/
├── client/                     # Frontend SPA (React + Vite + Vanilla CSS / Tailwind)
│   ├── public/                 # Visual assets (epx.png, indemb.png, login-bg.png, flags)
│   ├── src/
│   │   ├── components/         # Header, Footer, StatusBadge, UploadModal, RiskBadge
│   │   ├── pages/              # OfficerLoginPage, DashboardPage, BidderDetailPage, NewBidderPage
│   │   └── utils/              # officerAuth.js (Session attribution)
├── server/                     # Backend API (Node.js + Express)
│   ├── scripts/                # seedData.js, generateSamplePdfs.js
│   ├── src/
│   │   ├── prompts/            # Prompt A (Extraction) & Prompt B (Verification)
│   │   ├── routes/             # api.js (REST endpoints)
│   │   └── services/           # geminiService, dbService, scoringService, exportService, pdfService
├── samples/                    # Pre-generated statutory PDFs for the 3 demo profiles
└── data/                       # mock-portal-data.json (simulated central portal database)
```

- **Frontend**: React 18, Vite, Lucide Icons, TailwindCSS.
- **Backend**: Node.js (ES Modules), Express, `@supabase/supabase-js`, `@google/generative-ai`.
- **Document Processing**: `pdf-parse`, `pdf-lib`, `pdfkit`.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

### 2. Installation
Clone the repository and install dependencies for both client and server:

```bash
# Clone the repository
git clone https://github.com/omprabhat21/epsilon-x.git
cd epsilon-x

# Install root, server, and client dependencies
npm install
npm --prefix server install
npm --prefix client install
```

### 3. Environment Configuration
Copy the sample environment file to `.env`:

```bash
cp .env.example .env
```

Edit `.env` to configure your credentials (optional — the platform runs automatically in local fallback mode if credentials are omitted):

```ini
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-supabase-secret-key
GEMINI_API_KEY=your-gemini-api-key
PORT=5000
```

### 4. Running the Application

Start both the backend server and frontend development server:

```bash
# Terminal 1: Backend Server (http://localhost:5000)
npm run server

# Terminal 2: Frontend Client (http://localhost:5173)
npm run client
```

Open your browser and navigate to **`http://localhost:5173`**.

---

## 🧪 Demo Profiles for Adjudication

The platform includes three pre-calibrated bidder profiles demonstrating the full compliance spectrum:

1. **Bharat Tech Solutions Pvt Ltd** (`compliant` — **100 / 100 | LOW RISK**)  
   *Exemplary vendor with 100% statutory clearance across all 9 statutory categories.*
2. **Apex Global Traders LLP** (`non_compliant` — **45 / 100 | HIGH RISK**)  
   *High-risk vendor with cancelled GSTIN under Section 29(2)(c), active GeM/CVC blacklist debarment, and inoperative PAN.*
3. **Vanguard Systems India** (`ambiguous` — **81.6 / 100 | MEDIUM RISK**)  
   *Borderline vendor requiring human officer adjudication due to parent company ownership ambiguity and EPFO treasury sync delays.*

Clicking **"Reset Profiles"** on the dashboard restores these three canonical baselines, cleans test data, and returns all decisions to **Pending Review**.

---

## 📜 Regulatory Reference

- **General Financial Rules (GFR) 2017 — Rule 149**: Common Use Goods and Services (Mandatory procurement through GeM).
- **Public Procurement Policy for MSEs Order 2012**: 25% mandatory procurement from Micro and Small Enterprises.
- **Public Procurement (Preference to Make in India) Order (PPP-MII) 2017**: Local content thresholds (Class-I: ≥50%, Class-II: ≥20%).
- **CVC Consolidated Debarment / Blacklisting Guidelines**.

---

## 📄 License

This project is developed for the **Smart India Hackathon (SIH 2026)**. All rights reserved.
