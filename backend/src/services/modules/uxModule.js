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
 * Mobile-specific UX thresholds (more lenient DOM, stricter touch/viewport)
 */
const MOBILE_THRESHOLDS = {
  ...THRESHOLDS,
  DOM_NODES_GOOD: 1200,
  DOM_NODES_BAD: 2500,
  TOUCH_TARGETS_TOO_SMALL_GOOD: 0,
  TOUCH_TARGETS_TOO_SMALL_BAD: 10,
  TEXT_TOO_SMALL_GOOD: 0,
  TEXT_TOO_SMALL_BAD: 8,
};

/**
 * Calculate UX score
 * @param {Object} data - UX data from artifact
 * @param {boolean} isMobile - Whether this is a mobile scan
 * @returns {Object} UX analysis result
 */
function calculateUXScore(data, isMobile = false) {
  const {
    violations = [],
    violations_count = 0,
    ctas = [],
    ctas_above_fold = 0,
    dom_node_count = 0,
    viewport_meta_present = false,
    touch_targets = null,
    text_size_issues = null,
  } = data;

  const T = isMobile ? MOBILE_THRESHOLDS : THRESHOLDS;

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
    T.VIOLATIONS_CRITICAL_GOOD,
    T.VIOLATIONS_CRITICAL_BAD
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
    T.VIOLATIONS_SERIOUS_GOOD,
    T.VIOLATIONS_SERIOUS_BAD
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
    T.VIOLATIONS_MODERATE_GOOD,
    T.VIOLATIONS_MODERATE_BAD
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
  if (ctas_above_fold < T.CTA_ABOVE_FOLD_MIN) {
    USABILITY_penalty += 0.4;
    factors.push({
      factor: 'No CTA Above Fold',
      value: ctas_above_fold,
      penalty: 0.4
    });
  }

  // Viewport meta check (mobile-friendly)
  if (!viewport_meta_present) {
    USABILITY_penalty += isMobile ? 0.5 : 0.3; // Stricter for mobile
    factors.push({
      factor: 'Missing Viewport Meta',
      value: 0,
      penalty: isMobile ? 0.5 : 0.3
    });
  }

  // DOM complexity
  const dom_penalty = penaltyFromMetric(
    dom_node_count,
    T.DOM_NODES_GOOD,
    T.DOM_NODES_BAD
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
  // MOBILE-SPECIFIC Component (extra penalty for mobile scans)
  // ============================================
  let MOBILE_penalty = 0;

  if (isMobile) {
    // Touch target size penalty
    if (touch_targets && touch_targets.too_small_count > 0) {
      const touch_penalty = penaltyFromMetric(
        touch_targets.too_small_count,
        MOBILE_THRESHOLDS.TOUCH_TARGETS_TOO_SMALL_GOOD,
        MOBILE_THRESHOLDS.TOUCH_TARGETS_TOO_SMALL_BAD
      );
      MOBILE_penalty += 0.5 * touch_penalty;
      if (touch_penalty > 0) {
        factors.push({
          factor: 'Touch Targets Too Small',
          value: touch_targets.too_small_count,
          penalty: touch_penalty
        });
      }
    }

    // Text too small penalty
    if (text_size_issues && text_size_issues.too_small_text_count > 0) {
      const text_penalty = penaltyFromMetric(
        text_size_issues.too_small_text_count,
        MOBILE_THRESHOLDS.TEXT_TOO_SMALL_GOOD,
        MOBILE_THRESHOLDS.TEXT_TOO_SMALL_BAD
      );
      MOBILE_penalty += 0.5 * text_penalty;
      if (text_penalty > 0) {
        factors.push({
          factor: 'Text Too Small for Mobile',
          value: text_size_issues.too_small_text_count,
          penalty: text_penalty
        });
      }
    }
  }

  // ============================================
  // Combine penalties
  // ============================================
  let RAW_PENALTY;
  if (isMobile) {
    // Mobile: Accessibility 40%, Usability 25%, Trust 15%, Mobile-specific 20%
    RAW_PENALTY =
      0.40 * ACCESSIBILITY_penalty +
      0.25 * USABILITY_penalty +
      0.15 * TRUST_penalty +
      0.20 * MOBILE_penalty;
  } else {
    RAW_PENALTY =
      0.50 * ACCESSIBILITY_penalty +
      0.30 * USABILITY_penalty +
      0.20 * TRUST_penalty;
  }

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
function generateIssuesAndFixes(data, analysis, isMobile = false) {
  const issues = [];
  const fixes = [];

  const { violations = [], viewport_meta_present, ctas_above_fold, touch_targets, text_size_issues } = data;

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

  // ============================================
  // Mobile-specific issues
  // ============================================
  if (isMobile) {
    // Touch targets too small
    if (touch_targets && touch_targets.too_small_count > 0) {
      issues.push({
        id: 'touch_targets_small',
        severity: touch_targets.too_small_count > 5 ? 'high' : 'medium',
        category: 'Mobile Usability',
        description: `${touch_targets.too_small_count} touch targets are smaller than ${touch_targets.min_size_threshold}px — difficult to tap on mobile`,
        source: 'mobile-axe'
      });

      fixes.push({
        id: 'fix_touch_targets',
        issue_id: 'touch_targets_small',
        title: 'Increase Touch Target Sizes',
        description: 'Ensure all interactive elements are at least 48×48px for comfortable mobile tapping (WCAG 2.5.5)',
        effort_hours: 3,
        impact_pct: 15,
        priority: 1,
        source: 'mobile-axe'
      });
    }

    // Text too small for mobile
    if (text_size_issues && text_size_issues.too_small_text_count > 0) {
      issues.push({
        id: 'text_too_small',
        severity: text_size_issues.too_small_text_count > 5 ? 'high' : 'medium',
        category: 'Mobile Usability',
        description: `${text_size_issues.too_small_text_count} text elements have font-size below ${text_size_issues.min_font_threshold}px — hard to read on mobile`,
        source: 'mobile-axe'
      });

      fixes.push({
        id: 'fix_text_size',
        issue_id: 'text_too_small',
        title: 'Increase Font Sizes for Mobile',
        description: 'Use a minimum font-size of 12px (16px recommended) for body text on mobile devices',
        effort_hours: 2,
        impact_pct: 12,
        priority: 2,
        source: 'mobile-axe'
      });
    }
  }

  return { issues, fixes };
}

/**
 * Main analyze function
 * @param {Object} artifact - Scraper artifact
 * @param {boolean} isMobile - Whether this is a mobile scan
 */
async function analyze(artifact, isMobile = false) {
  const data = {
    violations: artifact.ux.violations,
    violations_count: artifact.ux.violations_count,
    ctas: artifact.ux.ctas,
    ctas_above_fold: artifact.ux.ctas_above_fold,
    dom_node_count: artifact.ux.dom_node_count,
    viewport_meta_present: artifact.ux.viewport_meta_present,
    touch_targets: artifact.ux.touch_targets || null,
    text_size_issues: artifact.ux.text_size_issues || null,
  };

  const analysis = calculateUXScore(data, isMobile);
  const { issues, fixes } = generateIssuesAndFixes(data, analysis, isMobile);

  return {
    score: analysis.score,
    scan_mode: isMobile ? 'mobile' : 'desktop',
    accessibility_risk_level: analysis.accessibility_risk_level,
    primary_friction_sources: analysis.primary_friction_sources,
    trust_impact_indicator: analysis.trust_impact_indicator,
    recommendation_flag: analysis.recommendation_flag,
    violations_count: data.violations_count,
    violations_by_impact: analysis.violations_by_impact,
    ctas_count: data.ctas.length,
    ctas_above_fold: data.ctas_above_fold,
    // Mobile-specific data
    touch_targets_too_small: data.touch_targets?.too_small_count ?? null,
    text_too_small_count: data.text_size_issues?.too_small_text_count ?? null,
    issues,
    fixes
  };
}

module.exports = {
  analyze,
  calculateUXScore,
  THRESHOLDS,
  MOBILE_THRESHOLDS
};
