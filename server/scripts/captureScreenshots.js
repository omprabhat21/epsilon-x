import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const WORKSPACE_DIR = path.resolve(__dirname, '../..');
const SCREENSHOT_DIR = path.join(WORKSPACE_DIR, 'screenshots');
const ARTIFACT_DIR = 'C:\\Users\\OM PRABHAT\\.gemini\\antigravity-ide\\brain\\dbc3c945-468b-4a69-bc38-0f4b7c84b9c0';
const SAMPLE_PDF = path.join(WORKSPACE_DIR, 'samples/compliant/oem_auth.pdf');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

function saveToBoth(filename, buffer) {
  fs.writeFileSync(path.join(SCREENSHOT_DIR, filename), buffer);
  fs.writeFileSync(path.join(ARTIFACT_DIR, filename), buffer);
  console.log(`Saved ${filename} to screenshots and artifact directory.`);
}

async function run() {
  console.log('Launching Chrome for high-res PPT screenshot capture...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: {
      width: 1400,
      height: 900,
      deviceScaleFactor: 2, // 2x high-resolution crispness for PowerPoint
    },
  });

  const page = await browser.newPage();

  // Set officer in localStorage
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.setItem(
      'gem_compliance_officer',
      JSON.stringify({
        id: 'off-1',
        name: 'Rajesh Kumar',
        designation: 'Assistant Manager (Procurement)',
        org: 'Chennai Petroleum Corporation Limited (CPCL)',
        emp_id: 'CPCL-PROC-2024-089',
        role: 'Evaluation Officer',
        pin: '1234',
        logged_in_at: new Date().toISOString(),
      })
    );
  });

  const bidderId = 'b3333333-3333-3333-3333-333333333333';
  const bidderUrl = `http://localhost:5173/bidder/${bidderId}`;

  // ========================================================
  // 1. STAGE 01: DOCUMENT INGESTION
  // ========================================================
  console.log('Capturing Stage 01: Document Ingestion...');
  await page.goto(bidderUrl, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1200));

  // Open upload modal by clicking the Tender-Specific Document upload button
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const uploadBtn = buttons.find((b) => b.textContent.includes('Upload'));
    if (uploadBtn) uploadBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // Upload the sample PDF file into the file input
  const fileInput = await page.$('input[type="file"]');
  if (fileInput && fs.existsSync(SAMPLE_PDF)) {
    await fileInput.uploadFile(SAMPLE_PDF);
    console.log('Attached sample PDF to file input.');
  }
  await new Promise((r) => setTimeout(r, 600));

  const shot1Buffer = await page.screenshot({ fullPage: false });
  saveToBoth('01_document_ingestion.png', shot1Buffer);

  // Also take a tighter crop focused on the Ingestion Modal
  const modalElem = await page.$('.bg-white.border.border-\\[\\#CBD5E1\\].rounded-xl.max-w-md');
  if (modalElem) {
    const modalBuffer = await modalElem.screenshot();
    saveToBoth('01_document_ingestion_card.png', modalBuffer);
  }

  // ========================================================
  // 2. STAGE 02: COMPLIANCE VERIFICATION
  // ========================================================
  console.log('Capturing Stage 02: Compliance Verification...');
  await page.goto(bidderUrl, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));

  // Expand the first technical details drawer (GSTIN or EPFO)
  await page.evaluate(() => {
    const detailButtons = Array.from(
      document.querySelectorAll('button[title="Technical Details"]')
    );
    if (detailButtons.length > 0) {
      detailButtons[0].click();
    }
  });
  await new Promise((r) => setTimeout(r, 600));

  // Position page so compliance header, 3 metric cards, and regulatory checks are displayed
  await page.evaluate(() => {
    window.scrollTo({ top: 30, behavior: 'instant' });
  });
  await new Promise((r) => setTimeout(r, 400));

  const shot2Buffer = await page.screenshot({ fullPage: false });
  saveToBoth('02_compliance_verification.png', shot2Buffer);

  // Also take a focused crop of the Compliance Metric Header Card
  const complianceCardElem = await page.$('.bg-white.border.border-\\[\\#CBD5E1\\].rounded-xl.p-5');
  if (complianceCardElem) {
    const cardBuffer = await complianceCardElem.screenshot();
    saveToBoth('02_compliance_verification_card.png', cardBuffer);
  }

  // ========================================================
  // 3. STAGE 03: DECISION SUPPORT
  // ========================================================
  console.log('Capturing Stage 03: Decision Support...');
  
  // Select "QUALIFY BIDDER" and enter justification note
  await page.evaluate(() => {
    const radioQualify = document.querySelector('input[value="qualified"]');
    if (radioQualify) radioQualify.click();

    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.value =
        'Statutory compliance validated under GFR 2017 Rule 149. EPFO treasury delay reconciled via authentic monthly ECR challan. Bidder cleared across all 9 statutory and MSE thresholds. Approved for financial bid opening.';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise((r) => setTimeout(r, 500));

  // Scroll into view of the Officer Statutory Determination and Report Export sections
  await page.evaluate(() => {
    const section = document.querySelector('form')?.closest('section');
    if (section) {
      section.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  });
  await new Promise((r) => setTimeout(r, 600));

  const shot3Buffer = await page.screenshot({ fullPage: false });
  saveToBoth('03_decision_support.png', shot3Buffer);

  // Also take a focused crop of the Decision Support Section
  const decisionSection = await page.$('section.bg-\\[\\#F8FAFC\\].border.border-\\[\\#CBD5E1\\]');
  if (decisionSection) {
    const decisionBuffer = await decisionSection.screenshot();
    saveToBoth('03_decision_support_card.png', decisionBuffer);
  }

  await browser.close();
  console.log('All PPT screenshots generated and saved successfully!');
}

run().catch((err) => {
  console.error('Screenshot generation failed:', err);
  process.exit(1);
});
