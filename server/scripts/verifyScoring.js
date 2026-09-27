import { computeComplianceScore } from '../src/services/scoringService.js';
import * as db from '../src/services/dbService.js';

async function testProfiles() {
  console.log('Testing 3 baseline profiles with updated scoringService...');
  const bidders = await db.getBidders();
  for (const b of bidders) {
    if (!b.profile_key) continue;
    const results = await db.getVerificationResults(b.id);
    const score = computeComplianceScore(results);
    console.log(`Profile: ${b.profile_key.padEnd(14)} | Name: ${b.name.padEnd(45)} | Score: ${score.overall_score} / 100 | Risk: ${score.risk_level.toUpperCase()}`);
  }

  // Also test the specific Hard-Gate edge case: Blacklist = FAIL, everything else = PASS
  console.log('\nTesting Blacklist Hard-Gate Edge Case:');
  const blacklistFailAllElsePass = [
    { category: 'blacklist', status: 'fail', reason: 'Active GeM / CVC Blacklist debarment' }, // 0
    { category: 'gst', status: 'pass', reason: 'Active' }, // 15
    { category: 'pan_it', status: 'pass', reason: 'Valid' }, // 15
    { category: 'udyam', status: 'pass', reason: 'Valid' }, // 10
    { category: 'mii', status: 'pass', reason: 'Valid' }, // 10
    { category: 'epfo_esic', status: 'pass', reason: 'Valid' }, // 10
    { category: 'startup_nsic', status: 'pass', reason: 'Valid' }, // 5
    { category: 'oem_auth', status: 'pass', reason: 'Valid' }, // 5
    { category: 'digilocker', status: 'pass', reason: 'Valid' }, // 5
  ];
  const hardGateScore = computeComplianceScore(blacklistFailAllElsePass);
  console.log(`Blacklist-only fail: Numerical Score = ${hardGateScore.overall_score} / 100 | Risk Level = ${hardGateScore.risk_level.toUpperCase()}`);
}

testProfiles().catch(console.error);
