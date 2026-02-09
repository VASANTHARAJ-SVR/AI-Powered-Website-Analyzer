/**
 * Result Aggregator
 * Combines module scores into overall website health score
 */

/**
 * Clamp value between 0 and 1
 */
function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Module weights for aggregation
 */
const WEIGHTS = {
  performance: 0.40,
  ux: 0.25,
  seo: 0.20,
  content: 0.15
};

/**
 * Aggregate module results into overall health score
 * @param {Object} modules - Module results {performance, ux, seo, content}
 * @returns {Object} Aggregated result
 */
function aggregate(modules) {
  const { performance, ux, seo, content } = modules;

  // ============================================
  // Step 1: Convert scores to penalties
  // ============================================
  const perf_penalty = 1 - (performance.score / 100);
  const ux_penalty = 1 - (ux.score / 100);
  const seo_penalty = 1 - (seo.score / 100);
  const content_penalty = 1 - (content.score / 100);

  // ============================================
  // Step 2: Calculate weighted global penalty
  // ============================================
  let GLOBAL_PENALTY =
    WEIGHTS.performance * perf_penalty +
    WEIGHTS.ux * ux_penalty +
    WEIGHTS.seo * seo_penalty +
    WEIGHTS.content * content_penalty;

  // ============================================
  // Step 3: Apply boost multipliers
  // ============================================
  let boost = 1.0;

  // Critical performance + UX issues
  if (performance.score < 40 && ux.score < 50) {
    boost *= 1.20;
  }

  // Critical SEO + Content issues
  if (seo.score < 40 && content.score < 50) {
    boost *= 1.15;
  }

  // Low confidence in performance
  if (performance.confidence === 'low') {
    boost *= 1.10;
  }

  GLOBAL_PENALTY *= boost;
  GLOBAL_PENALTY = clamp(GLOBAL_PENALTY, 0, 1);

  // ============================================
  // Step 4: Calculate website health score
  // ============================================
  const website_health_score = Math.round(100 * (1 - GLOBAL_PENALTY));

  // ============================================
  // Step 5: Determine health grade
  // ============================================
  let health_grade = 'F';
  if (website_health_score > 85) health_grade = 'A';
  else if (website_health_score > 70) health_grade = 'B';
  else if (website_health_score > 50) health_grade = 'C';
  else if (website_health_score > 35) health_grade = 'D';

  // ============================================
  // Step 6: Identify dominant risk domains
  // ============================================
  const domain_penalties = [
    { domain: 'Performance', penalty: perf_penalty, weight: WEIGHTS.performance },
    { domain: 'UX', penalty: ux_penalty, weight: WEIGHTS.ux },
    { domain: 'SEO', penalty: seo_penalty, weight: WEIGHTS.seo },
    { domain: 'Content', penalty: content_penalty, weight: WEIGHTS.content }
  ];

  // Sort by weighted penalty (impact)
  domain_penalties.sort((a, b) => (b.penalty * b.weight) - (a.penalty * a.weight));

  const dominant_risk_domains = domain_penalties
    .filter(d => d.penalty > 0.3) // Only include significant risks
    .slice(0, 3)
    .map(d => d.domain);

  // ============================================
  // Step 7: Calculate fix priority order
  // ============================================
  const fix_priority_order = domain_penalties.map(d => ({
    domain: d.domain,
    impact_priority: d.penalty * d.weight,
    score: Math.round((1 - d.penalty) * 100),
    weight: d.weight
  }));

  // ============================================
  // Step 8: Determine overall risk level
  // ============================================
  let overall_risk_level = 'low';
  if (website_health_score < 40 || dominant_risk_domains.length >= 3) {
    overall_risk_level = 'high';
  } else if (website_health_score < 70 || dominant_risk_domains.length >= 2) {
    overall_risk_level = 'medium';
  }

  // ============================================
  // Step 9: Action recommendation flag
  // ============================================
  let action_recommendation_flag = 'monitor';
  if (website_health_score < 40) {
    action_recommendation_flag = 'urgent_intervention';
  } else if (website_health_score <= 70) {
    action_recommendation_flag = 'optimize';
  }

  // ============================================
  // Step 10: Calculate overall confidence
  // ============================================
  const confidence_map = { high: 0.9, medium: 0.7, low: 0.4 };
  const confidence_values = [
    confidence_map[performance.confidence] || 0.7,
    0.8, // UX (Axe is reliable)
    0.8, // SEO (rule-based is reliable)
    0.7  // Content (heuristic-based)
  ];
  const confidence_overall = confidence_values.reduce((sum, v) => sum + v, 0) / confidence_values.length;

  // ============================================
  // Return aggregated result
  // ============================================
  return {
    website_health_score,
    health_grade,
    dominant_risk_domains,
    fix_priority_order,
    overall_risk_level,
    action_recommendation_flag,
    confidence_overall: Math.round(confidence_overall * 100) / 100,
    boost_applied: boost > 1.0 ? boost : null,
    module_scores: {
      performance: performance.score,
      ux: ux.score,
      seo: seo.score,
      content: content.score
    }
  };
}

module.exports = {
  aggregate,
  WEIGHTS
};
