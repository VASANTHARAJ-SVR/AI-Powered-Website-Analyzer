/**
 * SEO Module
 * Analyzes SEO health using meta tags, headings, and structured data
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
 * SEO thresholds
 */
const THRESHOLDS = {
  TITLE_MIN: 30,
  TITLE_MAX: 60,
  META_DESC_MIN: 120,
  META_DESC_MAX: 160,
  H1_IDEAL: 1,
  IMAGES_MISSING_ALT_GOOD: 0,
  IMAGES_MISSING_ALT_BAD: 10,
  INTERNAL_LINKS_MIN: 5,
  EXTERNAL_LINKS_MAX: 50
};

/**
 * Calculate SEO score
 */
function calculateSEOScore(data) {
  const {
    title = '',
    title_length = 0,
    meta_description = '',
    meta_description_length = 0,
    h1_count = 0,
    canonical = null,
    robots_meta = null,
    viewport_meta = null,
    images_missing_alt_count = 0,
    internal_links_count = 0,
    external_links_count = 0,
    structured_data = [],
    open_graph = {}
  } = data;

  const factors = [];

  // ============================================
  // ON-PAGE Component (50% weight)
  // ============================================
  let ONPAGE_penalty = 0;

  // Title tag penalty
  let title_penalty = 0;
  if (!title || title_length === 0) {
    title_penalty = 1.0;
    factors.push({ factor: 'Missing Title', value: 0, penalty: 1.0 });
  } else if (title_length < THRESHOLDS.TITLE_MIN) {
    title_penalty = 0.6;
    factors.push({ factor: 'Title Too Short', value: title_length, penalty: 0.6 });
  } else if (title_length > THRESHOLDS.TITLE_MAX) {
    title_penalty = 0.3;
    factors.push({ factor: 'Title Too Long', value: title_length, penalty: 0.3 });
  }
  ONPAGE_penalty += 0.35 * title_penalty;

  // Meta description penalty
  let meta_penalty = 0;
  if (!meta_description || meta_description_length === 0) {
    meta_penalty = 0.8;
    factors.push({ factor: 'Missing Meta Description', value: 0, penalty: 0.8 });
  } else if (meta_description_length < THRESHOLDS.META_DESC_MIN) {
    meta_penalty = 0.5;
    factors.push({ factor: 'Meta Description Too Short', value: meta_description_length, penalty: 0.5 });
  } else if (meta_description_length > THRESHOLDS.META_DESC_MAX) {
    meta_penalty = 0.2;
  }
  ONPAGE_penalty += 0.25 * meta_penalty;

  // H1 penalty
  let h1_penalty = 0;
  if (h1_count === 0) {
    h1_penalty = 0.9;
    factors.push({ factor: 'Missing H1', value: 0, penalty: 0.9 });
  } else if (h1_count > 1) {
    h1_penalty = 0.4;
    factors.push({ factor: 'Multiple H1s', value: h1_count, penalty: 0.4 });
  }
  ONPAGE_penalty += 0.20 * h1_penalty;

  // Images missing alt
  const alt_penalty = penaltyFromMetric(
    images_missing_alt_count,
    THRESHOLDS.IMAGES_MISSING_ALT_GOOD,
    THRESHOLDS.IMAGES_MISSING_ALT_BAD
  );
  ONPAGE_penalty += 0.20 * alt_penalty;
  if (alt_penalty > 0.3) {
    factors.push({
      factor: 'Images Missing Alt',
      value: images_missing_alt_count,
      penalty: alt_penalty
    });
  }

  // ============================================
  // TECHNICAL Component (30% weight)
  // ============================================
  let TECHNICAL_penalty = 0;

  // Missing canonical
  if (!canonical) {
    TECHNICAL_penalty += 0.3;
    factors.push({ factor: 'Missing Canonical', value: 0, penalty: 0.3 });
  }

  // Robots meta check
  if (robots_meta && (robots_meta.includes('noindex') || robots_meta.includes('nofollow'))) {
    TECHNICAL_penalty += 0.5;
    factors.push({ factor: 'Blocking Robots Meta', value: robots_meta, penalty: 0.5 });
  }

  // Missing viewport (mobile-friendliness)
  if (!viewport_meta) {
    TECHNICAL_penalty += 0.2;
    factors.push({ factor: 'Missing Viewport Meta', value: 0, penalty: 0.2 });
  }

  // ============================================
  // CONTENT Component (20% weight)
  // ============================================
  let CONTENT_penalty = 0;

  // Internal links
  if (internal_links_count < THRESHOLDS.INTERNAL_LINKS_MIN) {
    const link_penalty = 0.6;
    CONTENT_penalty += link_penalty;
    factors.push({
      factor: 'Few Internal Links',
      value: internal_links_count,
      penalty: link_penalty
    });
  }

  // Structured data bonus (reduces penalty)
  if (structured_data.length === 0) {
    CONTENT_penalty += 0.4;
    factors.push({ factor: 'No Structured Data', value: 0, penalty: 0.4 });
  }

  // ============================================
  // Combine penalties
  // ============================================
  let RAW_PENALTY =
    0.50 * ONPAGE_penalty +
    0.30 * TECHNICAL_penalty +
    0.20 * CONTENT_penalty;

  RAW_PENALTY = clamp(RAW_PENALTY, 0, 1);

  const score = Math.round(100 * (1 - RAW_PENALTY));

  // ============================================
  // Determine indexability status
  // ============================================
  let indexability_status = 'good';
  if (robots_meta && robots_meta.includes('noindex')) {
    indexability_status = 'blocked';
  } else if (!title || !meta_description || h1_count === 0) {
    indexability_status = 'partial';
  }

  // ============================================
  // Crawl health indicator
  // ============================================
  let crawl_health_indicator = 'low';
  if (TECHNICAL_penalty > 0.5) {
    crawl_health_indicator = 'high';
  } else if (TECHNICAL_penalty > 0.2) {
    crawl_health_indicator = 'medium';
  }

  // ============================================
  // Recommendation flag
  // ============================================
  let recommendation_flag = 'minor_optimizations';
  if (score < 50 || indexability_status === 'blocked') {
    recommendation_flag = 'critical_seo_fixes';
  } else if (score < 70) {
    recommendation_flag = 'priority_fixes';
  }

  // Sort factors
  factors.sort((a, b) => b.penalty - a.penalty);

  return {
    score,
    indexability_status,
    primary_seo_risks: factors.slice(0, 5).map(f => f.factor),
    crawl_health_indicator,
    recommendation_flag,
    factors
  };
}

/**
 * Generate SEO issues and fixes
 */
function generateIssuesAndFixes(data, analysis) {
  const issues = [];
  const fixes = [];

  const {
    title,
    title_length,
    meta_description,
    meta_description_length,
    h1_count,
    canonical,
    robots_meta,
    images_missing_alt_count,
    structured_data
  } = data;

  // Missing or bad title
  if (!title || title_length === 0) {
    issues.push({
      id: 'missing_title',
      severity: 'critical',
      category: 'On-Page SEO',
      description: 'Page is missing a title tag'
    });

    fixes.push({
      id: 'add_title',
      issue_id: 'missing_title',
      title: 'Add Title Tag',
      description: 'Add a descriptive, keyword-rich title tag (30-60 characters)',
      effort_hours: 0.5,
      impact_pct: 20,
      priority: 1
    });
  } else if (title_length < THRESHOLDS.TITLE_MIN) {
    issues.push({
      id: 'title_too_short',
      severity: 'high',
      category: 'On-Page SEO',
      description: `Title is too short (${title_length} chars, should be 30-60)`
    });

    fixes.push({
      id: 'expand_title',
      issue_id: 'title_too_short',
      title: 'Expand Title Tag',
      description: 'Expand title to 30-60 characters with relevant keywords',
      effort_hours: 0.5,
      impact_pct: 12,
      priority: 2
    });
  }

  // Missing or bad meta description
  if (!meta_description || meta_description_length === 0) {
    issues.push({
      id: 'missing_meta_desc',
      severity: 'high',
      category: 'On-Page SEO',
      description: 'Page is missing a meta description'
    });

    fixes.push({
      id: 'add_meta_desc',
      issue_id: 'missing_meta_desc',
      title: 'Add Meta Description',
      description: 'Add a compelling meta description (120-160 characters)',
      effort_hours: 0.5,
      impact_pct: 15,
      priority: 1
    });
  }

  // H1 issues
  if (h1_count === 0) {
    issues.push({
      id: 'missing_h1',
      severity: 'high',
      category: 'On-Page SEO',
      description: 'Page is missing an H1 heading'
    });

    fixes.push({
      id: 'add_h1',
      issue_id: 'missing_h1',
      title: 'Add H1 Heading',
      description: 'Add a single, descriptive H1 heading with primary keyword',
      effort_hours: 0.5,
      impact_pct: 14,
      priority: 1
    });
  } else if (h1_count > 1) {
    issues.push({
      id: 'multiple_h1',
      severity: 'medium',
      category: 'On-Page SEO',
      description: `Page has ${h1_count} H1 headings (should have exactly 1)`
    });

    fixes.push({
      id: 'fix_h1',
      issue_id: 'multiple_h1',
      title: 'Use Single H1',
      description: 'Keep only one H1 heading, convert others to H2 or H3',
      effort_hours: 0.5,
      impact_pct: 8,
      priority: 3
    });
  }

  // Missing canonical
  if (!canonical) {
    issues.push({
      id: 'missing_canonical',
      severity: 'medium',
      category: 'Technical SEO',
      description: 'Page is missing a canonical URL'
    });

    fixes.push({
      id: 'add_canonical',
      issue_id: 'missing_canonical',
      title: 'Add Canonical Tag',
      description: 'Add <link rel="canonical"> to prevent duplicate content issues',
      effort_hours: 0.5,
      impact_pct: 10,
      priority: 2
    });
  }

  // Blocking robots
  if (robots_meta && robots_meta.includes('noindex')) {
    issues.push({
      id: 'noindex_meta',
      severity: 'critical',
      category: 'Technical SEO',
      description: 'Page has noindex meta tag - will not be indexed by search engines'
    });

    fixes.push({
      id: 'remove_noindex',
      issue_id: 'noindex_meta',
      title: 'Remove Noindex Meta Tag',
      description: 'Remove or modify robots meta tag to allow indexing',
      effort_hours: 0.5,
      impact_pct: 25,
      priority: 1
    });
  }

  // Images missing alt
  if (images_missing_alt_count > 0) {
    issues.push({
      id: 'images_missing_alt',
      severity: 'medium',
      category: 'On-Page SEO',
      description: `${images_missing_alt_count} images are missing alt text`
    });

    fixes.push({
      id: 'add_alt_text',
      issue_id: 'images_missing_alt',
      title: 'Add Alt Text to Images',
      description: 'Add descriptive alt text to all images for accessibility and SEO',
      effort_hours: 1,
      impact_pct: 8,
      priority: 2
    });
  }

  // No structured data
  if (structured_data.length === 0) {
    issues.push({
      id: 'no_structured_data',
      severity: 'low',
      category: 'Technical SEO',
      description: 'Page has no structured data (JSON-LD)'
    });

    fixes.push({
      id: 'add_structured_data',
      issue_id: 'no_structured_data',
      title: 'Add Structured Data',
      description: 'Add JSON-LD structured data (Organization, WebPage, etc.) for rich snippets',
      effort_hours: 2,
      impact_pct: 12,
      priority: 3
    });
  }

  return { issues, fixes };
}

/**
 * Main analyze function
 */
async function analyze(artifact) {
  const data = {
    title: artifact.seo.title,
    title_length: artifact.seo.title_length,
    meta_description: artifact.seo.meta_description,
    meta_description_length: artifact.seo.meta_description_length,
    h1_count: artifact.seo.heading_counts.h1,
    canonical: artifact.seo.canonical,
    robots_meta: artifact.seo.robots_meta,
    viewport_meta: artifact.seo.viewport_meta,
    images_missing_alt_count: artifact.seo.images_missing_alt_count,
    internal_links_count: artifact.seo.internal_links_count,
    external_links_count: artifact.seo.external_links_count,
    structured_data: artifact.seo.structured_data,
    open_graph: artifact.seo.open_graph
  };

  const analysis = calculateSEOScore(data);
  const { issues, fixes } = generateIssuesAndFixes(data, analysis);

  return {
    score: analysis.score,
    indexability_status: analysis.indexability_status,
    primary_seo_risks: analysis.primary_seo_risks,
    crawl_health_indicator: analysis.crawl_health_indicator,
    recommendation_flag: analysis.recommendation_flag,
    title_length: data.title_length,
    meta_description_length: data.meta_description_length,
    h1_count: data.h1_count,
    images_missing_alt_count: data.images_missing_alt_count,
    internal_links_count: data.internal_links_count,
    external_links_count: data.external_links_count,
    issues,
    fixes
  };
}

module.exports = {
  analyze,
  calculateSEOScore,
  THRESHOLDS
};
