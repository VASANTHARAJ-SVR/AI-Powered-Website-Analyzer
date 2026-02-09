/**
 * Content Module
 * Analyzes content quality, readability, and intent match
 */

const { analyzeContentQuality } = require('../../utils/contentAnalyzer');

/**
 * Clamp value between 0 and 1
 */
function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Content thresholds
 */
const THRESHOLDS = {
  WORD_COUNT_MIN: 300,
  WORD_COUNT_IDEAL: 800,
  FLESCH_EASE_MIN: 40,
  FLESCH_EASE_IDEAL: 60,
  QUALITY_SCORE_GOOD: 70,
  QUALITY_SCORE_BAD: 40,
  KEYWORD_DIVERSITY_MIN: 5
};

/**
 * Calculate content score
 */
function calculateContentScore(data) {
  const {
    word_count = 0,
    flesch_reading_ease = 0,
    flesch_kincaid_grade = 0,
    quality_score = 0,
    keywords = [],
    stats = {}
  } = data;

  const factors = [];

  // ============================================
  // DEPTH Component (40% weight)
  // ============================================
  let DEPTH_penalty = 0;

  // Word count penalty
  let word_penalty = 0;
  if (word_count < 50) {
    word_penalty = 1.0;
    factors.push({ factor: 'Very Thin Content', value: word_count, penalty: 1.0 });
  } else if (word_count < THRESHOLDS.WORD_COUNT_MIN) {
    word_penalty = 0.7;
    factors.push({ factor: 'Thin Content', value: word_count, penalty: 0.7 });
  } else if (word_count < THRESHOLDS.WORD_COUNT_IDEAL) {
    word_penalty = 0.3;
  }
  DEPTH_penalty += word_penalty;

  // ============================================
  // READABILITY Component (30% weight)
  // ============================================
  let READABILITY_penalty = 0;

  // Flesch Reading Ease penalty (lower = harder to read)
  if (flesch_reading_ease < THRESHOLDS.FLESCH_EASE_MIN) {
    const readability_penalty = 0.8;
    READABILITY_penalty += readability_penalty;
    factors.push({
      factor: 'Difficult to Read',
      value: flesch_reading_ease,
      penalty: readability_penalty
    });
  } else if (flesch_reading_ease < THRESHOLDS.FLESCH_EASE_IDEAL) {
    READABILITY_penalty += 0.4;
  }

  // ============================================
  // QUALITY Component (30% weight)
  // ============================================
  let QUALITY_penalty = 0;

  // Quality score penalty (from content analyzer)
  if (quality_score < THRESHOLDS.QUALITY_SCORE_BAD) {
    QUALITY_penalty = 0.9;
    factors.push({ factor: 'Low Quality Score', value: quality_score, penalty: 0.9 });
  } else if (quality_score < THRESHOLDS.QUALITY_SCORE_GOOD) {
    QUALITY_penalty = 0.5;
  }

  // Keyword diversity
  if (keywords.length < THRESHOLDS.KEYWORD_DIVERSITY_MIN) {
    const diversity_penalty = 0.4;
    QUALITY_penalty += diversity_penalty;
    factors.push({
      factor: 'Low Keyword Diversity',
      value: keywords.length,
      penalty: diversity_penalty
    });
  }

  // ============================================
  // Combine penalties
  // ============================================
  let RAW_PENALTY =
    0.40 * DEPTH_penalty +
    0.30 * READABILITY_penalty +
    0.30 * QUALITY_penalty;

  RAW_PENALTY = clamp(RAW_PENALTY, 0, 1);

  const score = Math.round(100 * (1 - RAW_PENALTY));

  // ============================================
  // Determine content depth status
  // ============================================
  let content_depth_status = 'adequate';
  if (word_count < 50) {
    content_depth_status = 'thin';
  } else if (word_count >= THRESHOLDS.WORD_COUNT_IDEAL) {
    content_depth_status = 'comprehensive';
  }

  // ============================================
  // Intent match level (placeholder - can be enhanced with embeddings)
  // ============================================
  let intent_match_level = 'medium';
  if (score >= 70 && word_count >= THRESHOLDS.WORD_COUNT_MIN) {
    intent_match_level = 'high';
  } else if (score < 50 || word_count < 100) {
    intent_match_level = 'low';
  }

  // ============================================
  // Recommendation flag
  // ============================================
  let recommendation_flag = 'minor_improvements';
  if (score < 40 || word_count < 50) {
    recommendation_flag = 'critical_content_revision';
  } else if (score < 60 || word_count < THRESHOLDS.WORD_COUNT_MIN) {
    recommendation_flag = 'content_expansion_needed';
  }

  // Sort factors
  factors.sort((a, b) => b.penalty - a.penalty);

  return {
    score,
    intent_match_level,
    content_depth_status,
    primary_content_gaps: factors.slice(0, 5).map(f => f.factor),
    recommendation_flag,
    factors
  };
}

/**
 * Generate content issues and fixes
 */
function generateIssuesAndFixes(data, analysis) {
  const issues = [];
  const fixes = [];

  const {
    word_count,
    flesch_reading_ease,
    quality_score,
    keywords
  } = data;

  // Thin content
  if (word_count < 50) {
    issues.push({
      id: 'very_thin_content',
      severity: 'critical',
      category: 'Content Depth',
      description: `Page has only ${word_count} words - extremely thin content`
    });

    fixes.push({
      id: 'expand_content_critical',
      issue_id: 'very_thin_content',
      title: 'Add Substantial Content',
      description: 'Expand content to at least 300 words with valuable, relevant information',
      effort_hours: 4,
      impact_pct: 30,
      priority: 1
    });
  } else if (word_count < THRESHOLDS.WORD_COUNT_MIN) {
    issues.push({
      id: 'thin_content',
      severity: 'high',
      category: 'Content Depth',
      description: `Page has only ${word_count} words (recommended: 300+)`
    });

    fixes.push({
      id: 'expand_content',
      issue_id: 'thin_content',
      title: 'Expand Content',
      description: 'Add more detailed information, examples, and context to reach 300+ words',
      effort_hours: 3,
      impact_pct: 22,
      priority: 1
    });
  }

  // Readability issues
  if (flesch_reading_ease < THRESHOLDS.FLESCH_EASE_MIN) {
    issues.push({
      id: 'difficult_readability',
      severity: 'medium',
      category: 'Readability',
      description: `Content is difficult to read (Flesch score: ${flesch_reading_ease.toFixed(1)})`
    });

    fixes.push({
      id: 'improve_readability',
      issue_id: 'difficult_readability',
      title: 'Improve Readability',
      description: 'Use shorter sentences, simpler words, and break up long paragraphs',
      effort_hours: 2,
      impact_pct: 15,
      priority: 2
    });
  }

  // Low quality score
  if (quality_score < THRESHOLDS.QUALITY_SCORE_BAD) {
    issues.push({
      id: 'low_quality',
      severity: 'high',
      category: 'Content Quality',
      description: `Content quality score is low (${quality_score}/100)`
    });

    fixes.push({
      id: 'improve_quality',
      issue_id: 'low_quality',
      title: 'Improve Content Quality',
      description: 'Enhance content with better structure, varied vocabulary, and engaging writing',
      effort_hours: 4,
      impact_pct: 20,
      priority: 1
    });
  }

  // Low keyword diversity
  if (keywords.length < THRESHOLDS.KEYWORD_DIVERSITY_MIN) {
    issues.push({
      id: 'low_keyword_diversity',
      severity: 'medium',
      category: 'Content Quality',
      description: `Low keyword diversity (${keywords.length} unique keywords)`
    });

    fixes.push({
      id: 'add_keywords',
      issue_id: 'low_keyword_diversity',
      title: 'Increase Keyword Diversity',
      description: 'Cover more topics and use varied terminology related to your subject',
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
  // Use content analyzer utility
  const contentAnalysis = analyzeContentQuality(artifact.content.visible_text);

  const data = {
    word_count: contentAnalysis.stats.word_count,
    flesch_reading_ease: contentAnalysis.flesch_reading_ease,
    flesch_kincaid_grade: contentAnalysis.flesch_kincaid_grade,
    quality_score: contentAnalysis.quality_score,
    keywords: contentAnalysis.keywords,
    stats: contentAnalysis.stats,
    passive_voice_pct: contentAnalysis.passive_voice_pct
  };

  const analysis = calculateContentScore(data);
  const { issues, fixes } = generateIssuesAndFixes(data, analysis);

  return {
    score: analysis.score,
    intent_match_level: analysis.intent_match_level,
    content_depth_status: analysis.content_depth_status,
    primary_content_gaps: analysis.primary_content_gaps,
    recommendation_flag: analysis.recommendation_flag,
    word_count: data.word_count,
    flesch_reading_ease: data.flesch_reading_ease,
    flesch_kincaid_grade: data.flesch_kincaid_grade,
    keywords: data.keywords.slice(0, 10),
    entities: [], // Can be populated with HF NER later
    issues,
    fixes
  };
}

module.exports = {
  analyze,
  calculateContentScore,
  THRESHOLDS
};
