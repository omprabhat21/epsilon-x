import { CATEGORIES } from '../config.js';

/**
 * Weighted scoring logic per specification
 * - Excludes 'not_applicable' results
 * - Renormalizes remaining weights proportionally
 * - Multipliers: pass = 1.0, unclear = 0.5, fail = 0.0
 * - Risk levels: >= 80 -> 'low', 50-79 -> 'medium', < 50 -> 'high'
 */
export function computeComplianceScore(verificationResults) {
  if (!verificationResults || verificationResults.length === 0) {
    return {
      overall_score: 0,
      risk_level: 'high',
      total_weight: 0,
      earned_weight: 0,
      renormalized: false,
      breakdown: [],
    };
  }

  // Deduplicate by category (taking the latest record for each statutory category)
  const categoryMap = new Map();
  for (const r of verificationResults) {
    if (r && r.category) {
      categoryMap.set(r.category, r);
    }
  }
  const uniqueResults = Array.from(categoryMap.values());

  const applicable = uniqueResults.filter(r => r.status !== 'not_applicable');
  const notApplicable = uniqueResults.filter(r => r.status === 'not_applicable');

  const totalWeight = applicable.reduce((sum, r) => {
    const w = CATEGORIES[r.category]?.weight || 0;
    return sum + w;
  }, 0);

  if (totalWeight === 0) {
    return {
      overall_score: 0,
      risk_level: 'high',
      total_weight: 0,
      earned_weight: 0,
      renormalized: true,
      breakdown: [],
    };
  }

  let earnedWeight = 0;
  const breakdown = [];

  for (const r of applicable) {
    const rawWeight = CATEGORIES[r.category]?.weight || 0;
    // Renormalized weight as a percentage of the applicable weight sum
    const normalizedWeightPct = Number(((rawWeight / totalWeight) * 100).toFixed(2));
    
    let multiplier = 0.0;
    if (r.status === 'pass') {
      multiplier = 1.0;
    } else if (r.status === 'unclear') {
      multiplier = 0.5;
    } else {
      multiplier = 0.0;
    }

    const itemEarnedWeight = rawWeight * multiplier;
    earnedWeight += itemEarnedWeight;

    breakdown.push({
      category: r.category,
      category_name: CATEGORIES[r.category]?.name || r.category,
      status: r.status,
      original_weight: rawWeight,
      normalized_weight_pct: normalizedWeightPct,
      multiplier,
      earned_weight: Number(itemEarnedWeight.toFixed(2)),
      reason: r.reason,
    });
  }

  for (const r of notApplicable) {
    breakdown.push({
      category: r.category,
      category_name: CATEGORIES[r.category]?.name || r.category,
      status: 'not_applicable',
      original_weight: CATEGORIES[r.category]?.weight || 0,
      normalized_weight_pct: 0,
      multiplier: 0,
      earned_weight: 0,
      reason: r.reason,
    });
  }

  const overallScore = Number(((earnedWeight / totalWeight) * 100).toFixed(1));

  let riskLevel = 'high';
  if (overallScore >= 80) {
    riskLevel = 'low';
  } else if (overallScore >= 50) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  // Risk floor rule: risk level cannot go below Medium if 3+ categories are Unclear, regardless of score
  const unclearCount = uniqueResults.filter(r => r.status === 'unclear').length;
  if (unclearCount >= 3 && riskLevel === 'low') {
    riskLevel = 'medium';
  }

  return {
    overall_score: overallScore,
    risk_level: riskLevel,
    total_applicable_weight: totalWeight,
    total_earned_weight: Number(earnedWeight.toFixed(2)),
    renormalized: notApplicable.length > 0,
    applicable_count: applicable.length,
    not_applicable_count: notApplicable.length,
    unclear_count: unclearCount,
    breakdown,
  };
}
