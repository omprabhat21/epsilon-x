import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAMPLES_DIR = path.resolve(__dirname, '../../samples');

const PROFILES = [
  {
    key: 'compliant',
    name: 'Bharat Tech Solutions Pvt Ltd',
    gstin: '29AAACB1234F1Z5',
    pan: 'AAACB1234F',
    udyam: 'UDYAM-KA-03-0012345',
    mii_ref: 'MII-BTS-2026-09',
    epfo: 'KNBLR0098765000',
    startup: 'DPIIT-STAR-2022-77890',
    oem: 'MAF-DELL-2026-88192',
    digilocker: 'DL-IN-KA-DOC-2026-44910',
    categoryData: {
      blacklist: {
        title: 'GeM Debarment / Non-Suspension Affidavit & CVC Clearance',
        ref: '29AAACB1234F1Z5',
        status: 'Active / Non-Debarred',
        dates: '2026-08-15',
        text: 'This is to formally declare that Bharat Tech Solutions Pvt Ltd (PAN: AAACB1234F, GSTIN: 29AAACB1234F1Z5) has never been debarred or suspended by the Government e-Marketplace (GeM), Central Vigilance Commission (CVC), or any State/Central Ministry. The entity maintains zero recorded incidents and clean procurement clearance.'
      },
      gst: {
        title: 'Form GST REG-06 - Government of India GST Certificate',
        ref: '29AAACB1234F1Z5',
        status: 'Active',
        dates: '2026-08-20',
        text: 'Registration Certificate issued under Central Goods and Services Tax Act, 2017. Legal Name: Bharat Tech Solutions Pvt Ltd. GSTIN: 29AAACB1234F1Z5. Status: Active. Taxpayer Type: Regular. Last Return Filed: 2026-08-20 for period July 2026. GSTR-3B and GSTR-1 are completely up to date with zero outstanding statutory tax liabilities.'
      },
      pan_it: {
        title: 'Income Tax Department - PAN & Return Verification',
        ref: 'AAACB1234F',
        status: 'Valid and Operative',
        dates: '2025-10-30',
        text: 'Income Tax Permanent Account Number Allotment Record. Entity Name: Bharat Tech Solutions Private Limited. PAN: AAACB1234F. Status: Valid and Operative. Income Tax Returns for Assessment Years AY 2023-24, AY 2024-25, and AY 2025-26 have been duly filed under Section 139(1). Statutory tax audit report filed under Section 44AB.'
      },
      udyam: {
        title: 'Ministry of MSME - Udyam Registration Certificate',
        ref: 'UDYAM-KA-03-0012345',
        status: 'Active & Verified',
        dates: '2022-05-10',
        text: 'Udyam Registration Certificate. Enterprise Name: Bharat Tech Solutions Pvt Ltd. Udyam Registration Number: UDYAM-KA-03-0012345. Classification: Small Enterprise. Major Activity: Services and Manufacturing. Date of Incorporation: 2018-07-01. Date of Udyam Registration: 2022-05-10. Verified with CBDT and GSTN databases.'
      },
      mii: {
        title: 'Statutory Auditor Certificate for Make in India',
        ref: 'MII-BTS-2026-09',
        status: 'Compliant (Class-I Local Supplier)',
        dates: '2026-09-01',
        text: 'Declaration under DPIIT Public Procurement (Preference to Make in India) Order. Reference Number: MII-BTS-2026-09. Tender Ref: GEM/2026/B/891234. We certify that Bharat Tech Solutions Pvt Ltd meets 68.5% local content value addition, exceeding the statutory 50% Class-I threshold. Manufacturing site: Electronic City Phase 1, Bengaluru. UDIN: 26038472AAAAAF1234.'
      },
      epfo_esic: {
        title: 'Employees Provident Fund Organisation - Monthly ECR Return',
        ref: 'KNBLR0098765000',
        status: 'Active & Regular',
        dates: '2026-08-15',
        text: 'EPFO Monthly Compliance Statement. Establishment Code: KNBLR0098765000. Entity Name: Bharat Tech Solutions Pvt Ltd. Wage Month: July 2026. ECR TRRN: 3102608192837. Number of Active Contributing Employees: 142. ESIC Code: 53000987650001001. All dues deposited on time with zero pending default notices.'
      },
      startup_nsic: {
        title: 'DPIIT - Certificate of Recognition as Startup',
        ref: 'DPIIT-STAR-2022-77890',
        status: 'Valid & Active',
        dates: '2022-05-15',
        text: 'Certificate of Recognition as Startup. Certificate Number: DPIIT-STAR-2022-77890. Issued to: Bharat Tech Solutions Pvt Ltd. Valid Until: 2028-05-15. Sector: IT Software & IoT Hardware. Eligible for GeM public procurement exemptions on prior experience and minimum annual turnover under Rule 149.'
      },
      oem_auth: {
        title: 'Manufacturer Authorization Form (MAF) - GeM Tender',
        ref: 'MAF-DELL-2026-88192',
        status: 'Authentic & Verified',
        dates: '2026-08-01',
        text: 'OEM Direct Authorization Letter. OEM: Dell India Private Limited. Bidder: Bharat Tech Solutions Pvt Ltd. Authorization Ref: MAF-DELL-2026-88192. We hereby authorize Bharat Tech Solutions Pvt Ltd to bid our enterprise server, storage, and networking hardware under GeM Bid GEM/2026/B/891234. Full comprehensive OEM warranty backed through 2027-12-31.'
      },
      digilocker: {
        title: 'DigiLocker Digital Document Verification Certificate',
        ref: 'DL-IN-KA-DOC-2026-44910',
        status: 'Authentic',
        dates: '2026-09-10',
        text: 'DigiLocker Digital Document Verification Certificate. Document Reference: DL-IN-KA-DOC-2026-44910. Entity: Bharat Tech Solutions Pvt Ltd. Document Type: Certificate of Incorporation & GSTIN. Verified Issuer: Ministry of Corporate Affairs. SHA-256 Digest: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855. Cryptographic signature validated.'
      }
    }
  },
  {
    key: 'non_compliant',
    name: 'Apex Global Traders LLP',
    gstin: '27BBBPG5678G2H3',
    pan: 'BBBPG5678G',
    udyam: 'UDYAM-MH-12-0098765',
    categoryData: {
      blacklist: {
        title: 'Notice of Debarment / Debarment Record (GeM Incident)',
        ref: '27BBBPG5678G2H3',
        status: 'Debarred',
        dates: '2025-04-10',
        text: 'Central Vigilance Commission and GeM Debarment Order. Reference: 27BBBPG5678G2H3. Debarred Entity: Apex Global Traders LLP (PAN: BBBPG5678G). Reason: Collusive bidding and non-delivery of critical supplies under Contract GEMC-5116877. Debarment Period: 2025-04-10 to 2027-04-09. Prohibited from participating in any GeM bids during this period.'
      },
      gst: {
        title: 'GST Notice of Cancellation of Registration',
        ref: '27BBBPG5678G2H3',
        status: 'Cancelled',
        dates: '2025-11-15',
        text: 'Order for Cancellation of GST Registration under Section 29(2)(c). Legal Name: Apex Global Traders LLP. GSTIN: 27BBBPG5678G2H3. Status: Cancelled Suo-motu by Tax Officer due to failure to furnish returns for more than six continuous months. Last filed return: 2025-05-10. Substantial tax defaults pending.'
      },
      pan_it: {
        title: 'Income Tax Department - PAN Inoperative & Defective Notice',
        ref: 'BBBPG5678G',
        status: 'Inoperative / Mismatch Detected',
        dates: '2025-09-01',
        text: 'Income Tax Allotment Verification. PAN: BBBPG5678G. Status: Inoperative / Non-Compliant. Name on PAN portal reflects Apex Poly Products (partnership dissolution discrepancy). Assessment Year 2024-25 and 2025-26 returns have not been filed. Notice under Section 139(9) issued.'
      },
      udyam: {
        title: 'Ministry of MSME - Udyam Registration Certificate',
        ref: 'UDYAM-MH-12-0098765',
        status: 'Active & Verified',
        dates: '2020-08-14',
        text: 'Ministry of Micro, Small and Medium Enterprises. Udyam Registration Certificate. Enterprise Name: Apex Global Traders LLP. Number: UDYAM-MH-12-0098765. Type: Small Enterprise. Major Activity: Wholesale Trade & Distribution. Status: Active & Verified. Verified against MSME portal database.'
      },
      mii: {
        title: 'Make in India Local Content Declaration Certificate',
        ref: 'MII-AGT-2026-11',
        status: 'Compliant',
        dates: '2026-08-01',
        text: 'Make in India Self-Certification under Public Procurement Order 2017. Reference: MII-AGT-2026-11. Entity: Apex Global Traders LLP. Tender: GEM/2026/B/891234. Claimed Local Content: 58.0%. Classification: Class-I Local Supplier. Meets minimum statutory threshold of 50.0%.'
      },
      epfo_esic: {
        title: 'EPFO & ESIC Electronic Challan Return (ECR) Receipt',
        ref: 'MHBAN0012345000',
        status: 'Active & Regular',
        dates: '2026-08-15',
        text: 'Employees Provident Fund Organisation. ECR Confirmation Slip. Establishment ID: MHBAN0012345000. Entity: Apex Global Traders LLP. ESIC Code: 31000123450001002. Wage Month: 2026-08. Total Contributing Members: 35. Payment Status: Remitted in full. No defaults pending.'
      },
      startup_nsic: {
        title: 'NSIC Government Purchase Enlistment Certificate',
        ref: 'NSIC-MUM-GP-2019-1122',
        status: 'Valid & Active',
        dates: '2024-04-01',
        text: 'National Small Industries Corporation (NSIC) Single Point Registration Scheme. Ref: NSIC-MUM-GP-2019-1122. Certificate Number: NSIC-GP-99182. Entity: Apex Global Traders LLP. Category: Commercial Trade & Supplies. Validity extended through 2027-03-31. Status: Valid & Active.'
      },
      oem_auth: {
        title: 'Manufacturer Authorization Form (MAF) - Commercial Desktop',
        ref: 'MAF-HPE-2025-00412',
        status: 'Authentic & Verified',
        dates: '2026-07-01',
        text: 'Hewlett Packard Enterprise Partner Authorization Letter. Ref: MAF-HPE-2025-00412. OEM: Hewlett Packard Enterprise India. Authorized Reseller: Apex Global Traders LLP. Authorized Scope: Commercial Desktops and Workstations under GeM Tender GEM/2026/B/891234. Validity: 2027-06-30 with direct warranty commitment.'
      },
      digilocker: {
        title: 'DigiLocker Digital Document Verification Certificate',
        ref: 'DL-IN-MH-DOC-2025-99211',
        status: 'Authentic',
        dates: '2025-10-10',
        text: 'National DigiLocker Verification Record. URI: in.gov.mca/cert/2015/004567. Entity: Apex Global Traders LLP. Document: LLP Agreement & Incorporation Certificate. Issued by: Ministry of Corporate Affairs. SHA-256 Hash verified authentic against central repository archive.'
      }
    }
  },
  {
    key: 'ambiguous',
    name: 'Vanguard Systems India',
    gstin: '07CCCAV9012H1ZK',
    pan: 'CCCAV9012H',
    udyam: 'UDYAM-DL-01-0034567',
    categoryData: {
      blacklist: {
        title: 'GeM Non-Debarment Certificate',
        ref: '07CCCAV9012H1ZK',
        status: 'Clear',
        dates: '2026-08-01',
        text: 'Statutory Declaration. Vanguard Systems India Private Limited (PAN: CCCAV9012H, GSTIN: 07CCCAV9012H1ZK) confirms no active debarment or suspension by GeM or CVC. Status is clear.'
      },
      gst: {
        title: 'Goods and Services Tax Registration Certificate',
        ref: '07CCCAV9012H1ZK',
        status: 'Active',
        dates: '2026-07-20',
        text: 'GST Registration Form GST REG-06. Entity: Vanguard Systems India. GSTIN: 07CCCAV9012H1ZK. Status: Active. Last return filed: 2026-07-20. Return filed with a 1-month reporting delay pending reconciliation of input tax credit with vendor invoices.'
      },
      pan_it: {
        title: 'PAN Card & Corporate Income Tax Record',
        ref: 'CCCAV9012H',
        status: 'Valid and Operative',
        dates: '2025-11-15',
        text: 'Income Tax Return Acknowledgement. Entity: Vanguard Systems India Private Limited. PAN: CCCAV9012H. Status: Valid and Operative. AY 2025-26 filed on time with tax audit report.'
      },
      udyam: {
        title: 'Udyam Registration Certificate (Parent Entity Name)',
        ref: 'UDYAM-DL-01-0034567',
        status: 'Active (Parent Enterprise)',
        dates: '2021-06-20',
        text: 'Udyam Certificate Number: UDYAM-DL-01-0034567. Registered Enterprise: Vanguard Holdings Corporation (Parent Enterprise). Bidding subsidiary: Vanguard Systems India (51% subsidiary). Status: Active. Note: Certificate is issued in parent entity name; officer determination required under OM No. 1(2)(1)/2020-P&G to evaluate MSME benefit transfer to subsidiary.'
      },
      mii: {
        title: 'Make in India Local Content Self-Declaration Affidavit',
        ref: 'MII-VSI-2026-03',
        status: 'Pending Audit Clarification',
        dates: '2026-08-25',
        text: 'Self-Declaration Affidavit for Local Content. Ref: MII-VSI-2026-03. Tender: GEM/2026/B/891234. Entity: Vanguard Systems India. Claimed Local Content: 52.0%. Note: The bid value exceeds INR 10 Crores requiring statutory auditor certification, but only self-declaration affidavit is submitted. Officer dispensation required.'
      },
      epfo_esic: {
        title: 'EPFO Challan Receipt & Portal Synchronization Note',
        ref: 'DLCPM0045678000',
        status: 'Pending Data Sync',
        dates: '2026-06-30',
        text: 'EPFO Establishment Statement. Code: DLCPM0045678000. Entity: Vanguard Systems India. Subscribers: 48. June 2026 dues paid via physical treasury challan. Portal reflects status "Pending Data Sync" due to regional office server migration. Reconciliation pending.'
      },
      startup_nsic: {
        title: 'Procurement Exemption Clarification Letter (Not Applicable)',
        ref: 'NOT-APPLICABLE-VSI',
        status: 'Not Applicable',
        dates: '2026-07-15',
        text: 'Declaration Regarding Startup/MSME Purchase Preference. Vanguard Systems India is participating as an established corporate entity without claiming startup or MSE turnover exemptions under Rule 149. Category is Not Applicable.'
      },
      oem_auth: {
        title: 'Manufacturer Authorization via Tier-1 Distributor (Sub-Agency)',
        ref: 'MAF-CISCO-2026-3391',
        status: 'Conditional Sub-Agent Authorization',
        dates: '2026-08-10',
        text: 'Authorization Letter Ref: MAF-CISCO-2026-3391. OEM: Cisco Systems India Pvt Ltd. Issued through: Ingram Micro India (Tier-1 Distributor). Authorized Partner: Vanguard Systems India. GeM standard tender clause requires direct OEM authorization letter; sub-distribution authorization requires buyer procurement officer approval.'
      },
      digilocker: {
        title: 'DigiLocker Incorporation Certificate Verification',
        ref: 'DL-IN-DL-DOC-2026-11843',
        status: 'Authentic',
        dates: '2026-08-01',
        text: 'DigiLocker Verification Receipt. Ref: DL-IN-DL-DOC-2026-11843. Entity: Vanguard Systems India. Certificate of Incorporation verified with Ministry of Corporate Affairs repository. Status: Authentic.'
      }
    }
  }
];

function wrapText(text, maxChars = 75) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxChars) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

async function createPdf(filePath, docData, entityName) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  let y = 780;

  // Header Title
  page.drawText(docData.title, {
    x: 40,
    y,
    size: 14,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.3),
  });
  y -= 22;

  page.drawText('GOVERNMENT e-MARKETPLACE (GeM) STATUTORY COMPLIANCE DOCUMENT', {
    x: 40,
    y,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
  });
  y -= 15;

  // Separator
  page.drawLine({
    start: { x: 40, y },
    end: { x: 550, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 25;

  // Metadata block
  page.drawText(`Entity Name: ${entityName}`, {
    x: 40,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 20;

  page.drawText(`Reference ID: ${docData.ref}`, {
    x: 40,
    y,
    size: 10,
    font: fontRegular,
    color: rgb(0.15, 0.15, 0.15),
  });
  y -= 18;

  page.drawText(`Claimed Status: ${docData.status}`, {
    x: 40,
    y,
    size: 10,
    font: fontRegular,
    color: rgb(0.15, 0.15, 0.15),
  });
  y -= 18;

  page.drawText(`Document Date: ${docData.dates}`, {
    x: 40,
    y,
    size: 10,
    font: fontRegular,
    color: rgb(0.15, 0.15, 0.15),
  });
  y -= 25;

  // Separator
  page.drawLine({
    start: { x: 40, y },
    end: { x: 550, y },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 25;

  // Section Header
  page.drawText('Statutory Declaration & Verification Text:', {
    x: 40,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.3),
  });
  y -= 20;

  // Wrapped Body text
  const lines = wrapText(docData.text, 75);
  for (const line of lines) {
    page.drawText(line, {
      x: 40,
      y,
      size: 10,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
      lineHeight: 14,
    });
    y -= 16;
  }

  // Footer
  page.drawText('Digitally archived for Epsilon X AI Bid Compliance Verification (SIH 2026 Problem Statement 26100)', {
    x: 60,
    y: 50,
    size: 8,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await doc.save({ useObjectStreams: false });
  fs.writeFileSync(filePath, Buffer.from(pdfBytes));
}

export async function generateAllSamplePdfs() {
  console.log('[Sample Generator] Generating 100% pdf-parse compatible text-based PDF documents...');

  for (const profile of PROFILES) {
    const profileDir = path.join(SAMPLES_DIR, profile.key);
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }

    for (const [category, data] of Object.entries(profile.categoryData)) {
      const filePath = path.join(profileDir, `${category}.pdf`);
      await createPdf(filePath, data, profile.name);
      console.log(`  ✓ Generated ${profile.key}/${category}.pdf`);
    }
  }

  console.log('[Sample Generator] Successfully generated all 27 PDF sample documents.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateAllSamplePdfs()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Failed to generate sample PDFs:', err);
      process.exit(1);
    });
}
