/**
 * Performance Module
 * Analyzes website performance using SLM estimator with optional Lighthouse validation
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
 * Performance thresholds (based on Core Web Vitals)
 */
const THRESHOLDS = {
  // LCP (Largest Contentful Paint)
  LCP_GOOD: 2.5,
  LCP_BAD: 4.0,
  
  // CLS (Cumulative Layout Shift)
  CLS_GOOD: 0.1,
  CLS_BAD: 0.25,
  
  // FCP (First Contentful Paint)
  FCP_GOOD: 1.8,
  FCP_BAD: 3.0,
  
  // TTFB (Time to First Byte)
  TTFB_GOOD: 0.8,
  TTFB_BAD: 1.8,
  
  // TBT (Total Blocking Time)
  TBT_GOOD: 200,
  TBT_BAD: 600,
  
  // Resource sizes
  JS_SIZE_GOOD: 200,    // KB
  JS_SIZE_BAD: 500,
  
  CSS_SIZE_GOOD: 50,
  CSS_SIZE_BAD: 150,
  
  IMAGE_SIZE_GOOD: 500,
  IMAGE_SIZE_BAD: 2000,
  
  // Request count
  REQUEST_COUNT_GOOD: 50,
  REQUEST_COUNT_BAD: 150,
  
  // Render blocking
  RENDER_BLOCKING_GOOD: 3,
  RENDER_BLOCKING_BAD: 10
};

/**
 * Calculate performance score using SLM estimator
 * @param {Object} metrics - Performance metrics from scraper
 * @returns {Object} Performance analysis result
 */
function calculatePerformanceScore(metrics) {
  const {
    lcp_s = null,
    cls = null,
    fcp_s = null,
    ttfb_s = null,
    tbt_ms = null,
    total_js_kb = 0,
    total_css_kb = 0,
    total_images_kb = 0,
    total_requests = 0,
    render_blocking_count = 0
  } = metrics;

  // Track dominant negative factors
  const factors = [];
  
  // ============================================
  // LOAD Component (45% weight)
  // ============================================
  let LOAD_penalty = 0;
  
  // LCP penalty (most important)
  if (lcp_s !== null) {
    const lcp_penalty = penaltyFromMetric(lcp_s, THRESHOLDS.LCP_GOOD, THRESHOLDS.LCP_BAD);
    LOAD_penalty += 0.45 * lcp_penalty;
    if (lcp_penalty > 0.3) {
      factors.push({ factor: 'LCP', value: lcp_s, penalty: lcp_penalty });
    }
  }
  
  // TTFB penalty
  if (ttfb_s !== null) {
    const ttfb_penalty = penaltyFromMetric(ttfb_s, THRESHOLDS.TTFB_GOOD, THRESHOLDS.TTFB_BAD);
    LOAD_penalty += 0.25 * ttfb_penalty;
    if (ttfb_penalty > 0.3) {
      factors.push({ factor: 'TTFB', value: ttfb_s, penalty: ttfb_penalty });
    }
  }
  
  // Image size penalty
  const image_penalty = penaltyFromMetric(total_images_kb, THRESHOLDS.IMAGE_SIZE_GOOD, THRESHOLDS.IMAGE_SIZE_BAD);
  LOAD_penalty += 0.15 * image_penalty;
  if (image_penalty > 0.3) {
    factors.push({ factor: 'Image Size', value: total_images_kb, penalty: image_penalty });
  }
  
  // Request count penalty
  const request_penalty = penaltyFromMetric(total_requests, THRESHOLDS.REQUEST_COUNT_GOOD, THRESHOLDS.REQUEST_COUNT_BAD);
  LOAD_penalty += 0.15 * request_penalty;
  if (request_penalty > 0.3) {
    factors.push({ factor: 'Request Count', value: total_requests, penalty: request_penalty });
  }

  // ============================================
  // INTERACT Component (30% weight)
  // ============================================
  let INTERACT_penalty = 0;
  
  // TBT penalty
  if (tbt_ms !== null) {
    const tbt_penalty = penaltyFromMetric(tbt_ms, THRESHOLDS.TBT_GOOD, THRESHOLDS.TBT_BAD);
    INTERACT_penalty += 0.5 * tbt_penalty;
    if (tbt_penalty > 0.3) {
      factors.push({ factor: 'TBT', value: tbt_ms, penalty: tbt_penalty });
    }
  }
  
  // FCP penalty
  if (fcp_s !== null) {
    const fcp_penalty = penaltyFromMetric(fcp_s, THRESHOLDS.FCP_GOOD, THRESHOLDS.FCP_BAD);
    INTERACT_penalty += 0.3 * fcp_penalty;
    if (fcp_penalty > 0.3) {
      factors.push({ factor: 'FCP', value: fcp_s, penalty: fcp_penalty });
    }
  }
  
  // JS size penalty (affects interactivity)
  const js_penalty = penaltyFromMetric(total_js_kb, THRESHOLDS.JS_SIZE_GOOD, THRESHOLDS.JS_SIZE_BAD);
  INTERACT_penalty += 0.2 * js_penalty;
  if (js_penalty > 0.3) {
    factors.push({ factor: 'JavaScript Size', value: total_js_kb, penalty: js_penalty });
  }

  // ============================================
  // STABILITY Component (20% weight)
  // ============================================
  let STABILITY_penalty = 0;
  
  if (cls !== null) {
    const cls_penalty = penaltyFromMetric(cls, THRESHOLDS.CLS_GOOD, THRESHOLDS.CLS_BAD);
    STABILITY_penalty = cls_penalty;
    if (cls_penalty > 0.3) {
      factors.push({ factor: 'CLS', value: cls, penalty: cls_penalty });
    }
  }

  // ============================================
  // COMPLEXITY Component (10% weight)
  // ============================================
  let COMPLEXITY_penalty = 0;
  
  // CSS size
  const css_penalty = penaltyFromMetric(total_css_kb, THRESHOLDS.CSS_SIZE_GOOD, THRESHOLDS.CSS_SIZE_BAD);
  COMPLEXITY_penalty += 0.5 * css_penalty;
  
  // Render blocking resources
  const rb_penalty = penaltyFromMetric(render_blocking_count, THRESHOLDS.RENDER_BLOCKING_GOOD, THRESHOLDS.RENDER_BLOCKING_BAD);
  COMPLEXITY_penalty += 0.5 * rb_penalty;
  if (rb_penalty > 0.3) {
    factors.push({ factor: 'Render Blocking', value: render_blocking_count, penalty: rb_penalty });
  }

  // ============================================
  // Combine penalties with weights
  // ============================================
  let RAW_PENALTY = 
    0.40 * LOAD_penalty +
    0.30 * INTERACT_penalty +
    0.20 * STABILITY_penalty +
    0.10 * COMPLEXITY_penalty;

  // ============================================
  // Apply boost multipliers
  // ============================================
  let boost = 1.0;
  
  // Critical LCP
  if (lcp_s && lcp_s > 4.0) {
    boost *= 1.15;
  }
  
  // Critical CLS
  if (cls && cls > 0.25) {
    boost *= 1.10;
  }
  
  // Critical TTFB
  if (ttfb_s && ttfb_s > 1.8) {
    boost *= 1.10;
  }
  
  // Heavy JavaScript
  if (total_js_kb > 500) {
    boost *= 1.12;
  }
  
  RAW_PENALTY *= boost;
  RAW_PENALTY = clamp(RAW_PENALTY, 0, 1);

  // ============================================
  // Calculate final score
  // ============================================
  const score = Math.round(100 * (1 - RAW_PENALTY));

  // ============================================
  // Determine confidence level
  // ============================================
  let confidence = 'medium';
  const hasAllCoreMetrics = lcp_s !== null && cls !== null && ttfb_s !== null;
  
  if (hasAllCoreMetrics && tbt_ms !== null && fcp_s !== null) {
    confidence = 'high';
  } else if (!hasAllCoreMetrics) {
    confidence = 'low';
  }

  // ============================================
  // Recommendation flag
  // ============================================
  let recommendation_flag = 'use_as_final';
  
  if (confidence === 'low' || score < 40) {
    recommendation_flag = 'run_lighthouse';
  } else if (score >= 40 && score < 70) {
    recommendation_flag = 'skip_lighthouse'; // SLM is good enough
  }

  // Sort factors by penalty (highest first)
  factors.sort((a, b) => b.penalty - a.penalty);

  return {
    score,
    confidence,
    dominant_negative_factors: factors.slice(0, 5),
    recommendation_flag,
    boost_applied: boost > 1.0 ? boost : null
  };
}

/**
 * Generate performance issues and fixes
 * @param {Object} metrics - Performance metrics
 * @param {Object} analysis - Analysis result
 * @returns {Object} Issues and fixes
 */
function generateIssuesAndFixes(metrics, analysis) {
  const issues = [];
  const fixes = [];

  // LCP issues
  if (metrics.lcp_s && metrics.lcp_s > THRESHOLDS.LCP_GOOD) {
    const severity = metrics.lcp_s > THRESHOLDS.LCP_BAD ? 'critical' : 'high';
    issues.push({
      id: 'lcp_slow',
      severity,
      metric: 'LCP',
      value: metrics.lcp_s,
      threshold: THRESHOLDS.LCP_GOOD,
      description: `Largest Contentful Paint is ${metrics.lcp_s.toFixed(2)}s (should be < ${THRESHOLDS.LCP_GOOD}s)`
    });
    
    fixes.push({
      id: 'optimize_lcp',
      issue_id: 'lcp_slow',
      title: 'Optimize Largest Contentful Paint',
      description: 'Improve server response time, optimize images, and preload critical resources',
      effort_hours: 4,
      impact_pct: 25,
      priority: severity === 'critical' ? 1 : 2
    });
  }

  // CLS issues
  if (metrics.cls && metrics.cls > THRESHOLDS.CLS_GOOD) {
    const severity = metrics.cls > THRESHOLDS.CLS_BAD ? 'critical' : 'medium';
    issues.push({
      id: 'cls_high',
      severity,
      metric: 'CLS',
      value: metrics.cls,
      threshold: THRESHOLDS.CLS_GOOD,
      description: `Cumulative Layout Shift is ${metrics.cls.toFixed(3)} (should be < ${THRESHOLDS.CLS_GOOD})`
    });
    
    fixes.push({
      id: 'fix_cls',
      issue_id: 'cls_high',
      title: 'Fix Layout Shifts',
      description: 'Add explicit dimensions to images and embeds, reserve space for dynamic content',
      effort_hours: 3,
      impact_pct: 15,
      priority: severity === 'critical' ? 1 : 3
    });
  }

  // JavaScript size issues
  if (metrics.total_js_kb > THRESHOLDS.JS_SIZE_GOOD) {
    const severity = metrics.total_js_kb > THRESHOLDS.JS_SIZE_BAD ? 'high' : 'medium';
    issues.push({
      id: 'js_heavy',
      severity,
      metric: 'JavaScript Size',
      value: metrics.total_js_kb,
      threshold: THRESHOLDS.JS_SIZE_GOOD,
      description: `Total JavaScript is ${metrics.total_js_kb.toFixed(1)} KB (should be < ${THRESHOLDS.JS_SIZE_GOOD} KB)`
    });
    
    fixes.push({
      id: 'reduce_js',
      issue_id: 'js_heavy',
      title: 'Reduce JavaScript Bundle Size',
      description: 'Code split, tree shake, and minify JavaScript. Remove unused libraries.',
      effort_hours: 6,
      impact_pct: 20,
      priority: 2
    });
  }

  // Image size issues
  if (metrics.total_images_kb > THRESHOLDS.IMAGE_SIZE_GOOD) {
    const severity = metrics.total_images_kb > THRESHOLDS.IMAGE_SIZE_BAD ? 'high' : 'medium';
    issues.push({
      id: 'images_heavy',
      severity,
      metric: 'Image Size',
      value: metrics.total_images_kb,
      threshold: THRESHOLDS.IMAGE_SIZE_GOOD,
      description: `Total images are ${metrics.total_images_kb.toFixed(1)} KB (should be < ${THRESHOLDS.IMAGE_SIZE_GOOD} KB)`
    });
    
    fixes.push({
      id: 'optimize_images',
      issue_id: 'images_heavy',
      title: 'Optimize Images',
      description: 'Use modern formats (WebP/AVIF), compress images, implement lazy loading',
      effort_hours: 3,
      impact_pct: 18,
      priority: 2
    });
  }

  // TTFB issues
  if (metrics.ttfb_s && metrics.ttfb_s > THRESHOLDS.TTFB_GOOD) {
    const severity = metrics.ttfb_s > THRESHOLDS.TTFB_BAD ? 'high' : 'medium';
    issues.push({
      id: 'ttfb_slow',
      severity,
      metric: 'TTFB',
      value: metrics.ttfb_s,
      threshold: THRESHOLDS.TTFB_GOOD,
      description: `Time to First Byte is ${metrics.ttfb_s.toFixed(2)}s (should be < ${THRESHOLDS.TTFB_GOOD}s)`
    });
    
    fixes.push({
      id: 'improve_ttfb',
      issue_id: 'ttfb_slow',
      title: 'Improve Server Response Time',
      description: 'Optimize backend queries, use CDN, enable caching, upgrade hosting',
      effort_hours: 8,
      impact_pct: 22,
      priority: 1
    });
  }

  // Render blocking issues
  if (metrics.render_blocking_count > THRESHOLDS.RENDER_BLOCKING_GOOD) {
    issues.push({
      id: 'render_blocking',
      severity: 'medium',
      metric: 'Render Blocking Resources',
      value: metrics.render_blocking_count,
      threshold: THRESHOLDS.RENDER_BLOCKING_GOOD,
      description: `${metrics.render_blocking_count} render-blocking resources detected`
    });
    
    fixes.push({
      id: 'eliminate_render_blocking',
      issue_id: 'render_blocking',
      title: 'Eliminate Render-Blocking Resources',
      description: 'Inline critical CSS, defer non-critical CSS and JS, use async/defer attributes',
      effort_hours: 4,
      impact_pct: 12,
      priority: 3
    });
  }

  return { issues, fixes };
}

/**
 * Main analyze function
 * @param {Object} artifact - Scraper artifact
 * @returns {Promise<Object>} Performance module result
 */
async function analyze(artifact) {
  // Extract metrics from artifact
  const metrics = {
    lcp_s: artifact.performance.lcp_s,
    cls: artifact.performance.cls,
    fcp_s: artifact.performance.fcp_s,
    ttfb_s: artifact.performance.ttfb_s,
    tbt_ms: artifact.performance.tbt_ms,
    total_js_kb: artifact.resources.total_js_kb,
    total_css_kb: artifact.resources.total_css_kb,
    total_images_kb: artifact.resources.total_images_kb,
    total_requests: artifact.resources.total_count,
    render_blocking_count: artifact.resources.render_blocking_count
  };

  // Calculate performance score
  const analysis = calculatePerformanceScore(metrics);
  
  // Generate issues and fixes
  const { issues, fixes } = generateIssuesAndFixes(metrics, analysis);

  return {
    score: analysis.score,
    confidence: analysis.confidence,
    dominant_negative_factors: analysis.dominant_negative_factors,
    recommendation_flag: analysis.recommendation_flag,
    metrics: {
      lcp_s: metrics.lcp_s,
      cls: metrics.cls,
      fcp_s: metrics.fcp_s,
      ttfb_s: metrics.ttfb_s,
      tbt_ms: metrics.tbt_ms,
      total_js_kb: metrics.total_js_kb,
      total_css_kb: metrics.total_css_kb,
      total_images_kb: metrics.total_images_kb,
      total_requests: metrics.total_requests,
      render_blocking_count: metrics.render_blocking_count
    },
    issues,
    fixes,
    boost_applied: analysis.boost_applied
  };
}

module.exports = {
  analyze,
  calculatePerformanceScore,
  THRESHOLDS
};
