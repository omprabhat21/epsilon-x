import express from 'express';
import cors from 'cors';
import { PORT, getSystemModeStatus } from './config.js';
import apiRouter from './routes/api.js';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Mount API routes
app.use('/api', apiRouter);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Epsilon X Backend — GeM AI Bid Compliance Verification',
    version: '1.0.0',
    system_status: getSystemModeStatus(),
    endpoints: [
      'GET  /api/system/status',
      'GET  /api/categories',
      'GET  /api/bidders',
      'POST /api/bidders',
      'GET  /api/bidders/:id',
      'POST /api/bidders/:id/documents',
      'POST /api/bidders/:id/verify',
      'GET  /api/bidders/:id/score',
      'POST /api/bidders/:id/decision',
    ],
  });
});

app.listen(PORT, async () => {
  const status = getSystemModeStatus();
  console.log('\n================================================================');
  console.log('       EPSILON X — GeM AI BID COMPLIANCE VERIFICATION');
  console.log('             (SIH 2026 Problem Statement 26100)');
  console.log('================================================================');
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
  console.log(`📡 System Mode: [${status.mode.toUpperCase()}]`);
  console.log(`🗄️  Supabase Database:  [${status.supabase.status.toUpperCase()}]`);
  console.log(`🤖 Google Gemini AI:    [${status.gemini.status.toUpperCase()}]`);
  console.log('----------------------------------------------------------------');
  if (status.is_live) {
    console.log('🟢 LIVE MODE: Connected to Supabase PostgreSQL & Gemini 1.5 Flash.');
  } else {
    console.log('🟡 LOCAL FALLBACK MODE: Running on simulated portal records and');
    console.log('   deterministic AI verification engine.');
    console.log('   💡 To activate LIVE mode, populate SUPABASE_URL,');
    console.log('      SUPABASE_SECRET_KEY, and GEMINI_API_KEY in .env file.');
  }
  console.log('================================================================\n');

  // Auto-seed demo data if local store is clean
  try {
    const { seedAllBidderProfiles } = await import('../scripts/seedData.js');
    await seedAllBidderProfiles();
  } catch (err) {
    console.warn('[Startup] Demo data load notice:', err.message);
  }
});
