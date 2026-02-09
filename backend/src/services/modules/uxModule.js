/**
 * UX & Accessibility Module
 * Analyzes user experience and accessibility using Axe results and heuristics
 */

/**
 * Clamp value between 0 and 1
 */
function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate penalty from metric value
 */
function penaltyFromMetric(value, good, bad) {
  if (value <= good) return 0;
  if (value >= bad) return 1;
  return clamp((value - good) / (bad - good));
}

/**
 * UX thresholds
 */
const THRESHOLDS = {
  VIOLATIONS_CRITICAL_GOOD: 0,
  VIOLATIONS_CRITICAL_BAD: 3,
  
  VIOLATIONS_SERIOUS_GOOD: 0,
  VIOLATIONS_SERIOUS_BAD: 5,
  
  VIOLATIONS_MODERATE_GOOD: 0,
  VIOLATIONS_MODERATE_BAD: 10,
  
  CTA_ABOVE_FOLD_MIN: 1,
  DOM_NODES_GOOD: 800,
  DOM_NODES_BAD: 1500
};

/**
 * Calculate UX score
 * @param {Object} data - UX data from artifact
 * @returns {Object} UX analysis result
 */
function calculateUXScore(data) {
  const {
    violations = [],
    violations_count = 0,
    ctas = [],
    ctas_above_fold = 0,
    dom_node_count = 0,
    viewport_meta_present = false
  } = data;

  // Group violations by impact
  const violationsByImpact = {
    critical: violations.filter(v => v.impact === 'critical').length,
    serious: violations.filter(v => v.impact === 'serious').length,
    moderate: violations.filter(v => v.impact === 'moderate').length,
    minor: violations.filter(v => v.impact === 'minor').length
  };

  const factors = [];

  // ============================================
  // ACCESSIBILITY Component (50% weight)
  // ============================================
  let ACCESSIBILITY_penalty = 0;

  // Critical violations (highest weight)
  const critical_penalty = penaltyFromMetric(
    violationsByImpact.critical,
    THRESHOLDS.VIOLATIONS_CRITICAL_GOOD,
    THRESHOLDS.VIOLATIONS_CRITICAL_BAD
  );
  ACCESSIBILITY_penalty += 0.5 * critical_penalty;
  if (critical_penalty > 0) {
    factors.push({
      factor: 'Critical A11y Violations',
      value: violationsByImpact.critical,
      penalty: critical_penalty
    });
  }

  // Serious violations
  const serious_penalty = penaltyFromMetric(
    violationsByImpact.serious,
    THRESHOLDS.VIOLATIONS_SERIOUS_GOOD,
    THRESHOLDS.VIOLATIONS_SERIOUS_BAD
  );
  ACCESSIBILITY_penalty += 0.3 * serious_penalty;
  if (serious_penalty > 0) {
    factors.push({
      factor: 'Serious A11y Violations',
      value: violationsByImpact.serious,
      penalty: serious_penalty
    });
  }

  // Moderate violations
  const moderate_penalty = penaltyFromMetric(
    violationsByImpact.moderate,
    THRESHOLDS.VIOLATIONS_MODERATE_GOOD,
    THRESHOLDS.VIOLATIONS_MODERATE_BAD
  );
  ACCESSIBILITY_penalty += 0.2 * moderate_penalty;
  if (moderate_penalty > 0) {
    factors.push({
      factor: 'Moderate A11y Violations',
      value: violationsByImpact.moderate,
      penalty: moderate_penalty
    });
  }

  // ============================================
  // USABILITY Component (30% weight)
  // ============================================
  let USABILITY_penalty = 0;

  // CTA above fold check
  if (ctas_above_fold < THRESHOLDS.CTA_ABOVE_FOLD_MIN) {
    USABILITY_penalty += 0.4;
    factors.push({
      factor: 'No CTA Above Fold',
      value: ctas_above_fold,
      penalty: 0.4
    });
  }

  // Viewport meta check (mobile-friendly)
  if (!viewport_meta_present) {
    USABILITY_penalty += 0.3;
    factors.push({
      factor: 'Missing Viewport Meta',
      value: 0,
      penalty: 0.3
    });
  }

  // DOM complexity
  const dom_penalty = penaltyFromMetric(
    dom_node_count,
    THRESHOLDS.DOM_NODES_GOOD,
    THRESHOLDS.DOM_NODES_BAD
  );
  USABILITY_penalty += 0.3 * dom_penalty;
  if (dom_penalty > 0.3) {
    factors.push({
      factor: 'DOM Complexity',
      value: dom_node_count,
      penalty: dom_penalty
    });
  }

  // ============================================
  // TRUST Component (20% weight)
  // ============================================
  let TRUST_penalty = 0;

  // Missing alt text on images (from violations)
  const altViolations = violations.filter(v => 
    v.id === 'image-alt' || v.id === 'image-redundant-alt'
  );
  if (altViolations.length > 0) {
    const alt_penalty = Math.min(1, altViolations.length / 10);
    TRUST_penalty += alt_penalty;
    factors.push({
      factor: 'Missing Image Alt Text',
      value: altViolations.length,
      penalty: alt_penalty
    });
  }

  // ============================================
  // Combine penalties
  // ============================================
  let RAW_PENALTY =
    0.50 * ACCESSIBILITY_penalty +
    0.30 * USABILITY_penalty +
    0.20 * TRUST_penalty;

  RAW_PENALTY = clamp(RAW_PENALTY, 0, 1);

  // Calculate score
  const score = Math.round(100 * (1 - RAW_PENALTY));

  // ============================================
  // Determine risk levels
  // ============================================
  let accessibility_risk_level = 'low';
  if (violationsByImpact.critical > 0 || violationsByImpact.serious > 2) {
    accessibility_risk_level = 'high';
  } else if (violationsByImpact.serious > 0 || violationsByImpact.moderate > 5) {
    accessibility_risk_level = 'medium';
  }

  let trust_impact_indicator = 'low';
  if (TRUST_penalty > 0.5) {
    trust_impact_indicator = 'high';
  } else if (TRUST_penalty > 0.2) {
    trust_impact_indicator = 'medium';
  }

  // ============================================
  // Recommendation flag
  // ============================================
  let recommendation_flag = 'minor_fixes';
  if (score < 50 || violationsByImpact.critical > 0) {
    recommendation_flag = 'critical_fixes';
  } else if (score < 70 || violationsByImpact.serious > 2) {
    recommendation_flag = 'priority_fixes';
  }

  // Sort factors by penalty
  factors.sort((a, b) => b.penalty - a.penalty);

  return {
    score,
    accessibility_risk_level,
    primary_friction_sources: factors.slice(0, 5).map(f => f.factor),
    trust_impact_indicator,
    recommendation_flag,
    violations_by_impact: violationsByImpact,
    factors
  };
}

/**
 * Generate UX issues and fixes
 */
function generateIssuesAndFixes(data, analysis) {
  const issues = [];
  const fixes = [];

  const { violations = [], viewport_meta_present, ctas_above_fold } = data;

  // Critical accessibility violations
  const criticalViolations = violations.filter(v => v.impact === 'critical');
  if (criticalViolations.length > 0) {
    criticalViolations.forEach((violation, idx) => {
      issues.push({
        id: `a11y_critical_${idx}`,
        severity: 'critical',
        category: 'Accessibility',
        description: violation.description,
        help: violation.help,
        nodes_affected: violation.nodes.length
      });

      fixes.push({
        id: `fix_a11y_critical_${idx}`,
        issue_id: `a11y_critical_${idx}`,
        title: `Fix: ${violation.help}`,
        description: violation.helpUrl || 'See Axe documentation for details',
        effort_hours: 2,
        impact_pct: 15,
        priority: 1
      });
    });
  }

  // Serious accessibility violations
  const seriousViolations = violations.filter(v => v.impact === 'serious').slice(0, 3);
  seriousViolations.forEach((violation, idx) => {
    issues.push({
      id: `a11y_serious_${idx}`,
      severity: 'high',
      category: 'Accessibility',
      description: violation.description,
      help: violation.help,
      nodes_affected: violation.nodes.length
    });

    fixes.push({
      id: `fix_a11y_serious_${idx}`,
      issue_id: `a11y_serious_${idx}`,
      title: `Fix: ${violation.help}`,
      description: violation.helpUrl || 'See Axe documentation for details',
      effort_hours: 1.5,
      impact_pct: 10,
      priority: 2
    });
  });

  // Missing viewport meta
  if (!viewport_meta_present) {
    issues.push({
      id: 'missing_viewport',
      severity: 'high',
      category: 'Mobile Usability',
      description: 'Viewport meta tag is missing - page may not be mobile-friendly'
    });

    fixes.push({
      id: 'add_viewport',
      issue_id: 'missing_viewport',
      title: 'Add Viewport Meta Tag',
      description: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to <head>',
      effort_hours: 0.5,
      impact_pct: 12,
      priority: 2
    });
  }

  // No CTA above fold
  if (ctas_above_fold === 0) {
    issues.push({
      id: 'no_cta_above_fold',
      severity: 'medium',
      category: 'Conversion',
      description: 'No clear call-to-action above the fold - may reduce conversions'
    });

    fixes.push({
      id: 'add_cta_above_fold',
      issue_id: 'no_cta_above_fold',
      title: 'Add CTA Above the Fold',
      description: 'Place a prominent call-to-action button in the hero section',
      effort_hours: 2,
      impact_pct: 18,
      priority: 2
    });
  }

  return { issues, fixes };
}

/**
 * Main analyze function
 */
async function analyze(artifact) {
  const data = {
    violations: artifact.ux.violations,
    violations_count: artifact.ux.violations_count,
    ctas: artifact.ux.ctas,
    ctas_above_fold: artifact.ux.ctas_above_fold,
    dom_node_count: artifact.ux.dom_node_count,
    viewport_meta_present: artifact.ux.viewport_meta_present
  };

  const analysis = calculateUXScore(data);
  const { issues, fixes } = generateIssuesAndFixes(data, analysis);

  return {
    score: analysis.score,
    accessibility_risk_level: analysis.accessibility_risk_level,
    primary_friction_sources: analysis.primary_friction_sources,
    trust_impact_indicator: analysis.trust_impact_indicator,
    recommendation_flag: analysis.recommendation_flag,
    violations_count: data.violations_count,
    violations_by_impact: analysis.violations_by_impact,
    ctas_count: data.ctas.length,
    ctas_above_fold: data.ctas_above_fold,
    issues,
    fixes
  };
}

module.exports = {
  analyze,
  calculateUXScore,
  THRESHOLDS
};
