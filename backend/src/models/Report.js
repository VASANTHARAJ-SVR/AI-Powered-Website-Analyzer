/**
 * MongoDB Report Schema
 * Comprehensive schema for storing website analysis results
 */

const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  // Request Metadata
  request_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  url: {
    type: String,
    required: true
  },
  
  final_url: String,
  
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  finished_at: Date,
  
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending'
  },
  
  // Raw Artifacts
  raw_artifacts: {
    html: String,
    screenshot_full_path: String,
    screenshot_viewport_path: String,
    screenshot_full_base64: String, // Optional: store inline for small sites
    screenshot_viewport_base64: String,
    
    // Network data
    resources: [{
      url: String,
      status: Number,
      contentType: String,
      size: Number,
      timing: mongoose.Schema.Types.Mixed
    }],
    
    redirect_chain: [{
      from: String,
      to: String,
      status: Number
    }],
    
    // Performance raw data
    performance_raw: {
      lcp_ms: Number,
      cls: Number,
      fcp_ms: Number,
      ttfb_ms: Number,
      tbt_ms: Number,
      dom_content_loaded_ms: Number,
      page_load_ms: Number,
      long_tasks: [mongoose.Schema.Types.Mixed],
      layout_shifts: [mongoose.Schema.Types.Mixed]
    },
    
    // Accessibility raw data
    axe_results: {
      violations: [mongoose.Schema.Types.Mixed],
      passes: [mongoose.Schema.Types.Mixed],
      incomplete: [mongoose.Schema.Types.Mixed]
    },
    
    // SEO raw data
    seo_raw: {
      title: String,
      meta_description: String,
      meta_keywords: String,
      canonical: String,
      robots_meta: String,
      viewport_meta: String,
      h1s: [String],
      h2s: [String],
      heading_counts: mongoose.Schema.Types.Mixed,
      open_graph: mongoose.Schema.Types.Mixed,
      twitter_card: mongoose.Schema.Types.Mixed,
      structured_data: [mongoose.Schema.Types.Mixed]
    },
    
    // Content raw data
    content_raw: {
      visible_text: String,
      word_count: Number,
      char_count: Number
    }
  },
  
  // Module Analysis Results
  modules: {
    performance: {
      score: Number,
      confidence: String,
      dominant_negative_factors: [mongoose.Schema.Types.Mixed],
      recommendation_flag: String,
      metrics: {
        lcp_s: Number,
        cls: Number,
        fcp_s: Number,
        ttfb_s: Number,
        tbt_ms: Number,
        total_js_kb: Number,
        total_css_kb: Number,
        total_images_kb: Number,
        total_requests: Number
      },
      issues: [mongoose.Schema.Types.Mixed],
      fixes: [mongoose.Schema.Types.Mixed]
    },
    
    ux: {
      score: Number,
      accessibility_risk_level: String,
      primary_friction_sources: [String],
      trust_impact_indicator: String,
      recommendation_flag: String,
      violations_count: Number,
      violations_by_impact: mongoose.Schema.Types.Mixed,
      ctas_count: Number,
      ctas_above_fold: Number,
      issues: [mongoose.Schema.Types.Mixed],
      fixes: [mongoose.Schema.Types.Mixed]
    },
    
    seo: {
      score: Number,
      indexability_status: String,
      primary_seo_risks: [String],
      crawl_health_indicator: String,
      recommendation_flag: String,
      title_length: Number,
      meta_description_length: Number,
      h1_count: Number,
      images_missing_alt_count: Number,
      internal_links_count: Number,
      external_links_count: Number,
      issues: [mongoose.Schema.Types.Mixed],
      fixes: [mongoose.Schema.Types.Mixed]
    },
    
    content: {
      score: Number,
      intent_match_level: String,
      content_depth_status: String,
      primary_content_gaps: [String],
      recommendation_flag: String,
      word_count: Number,
      flesch_reading_ease: Number,
      flesch_kincaid_grade: Number,
      keywords: [mongoose.Schema.Types.Mixed],
      entities: [mongoose.Schema.Types.Mixed],
      issues: [mongoose.Schema.Types.Mixed],
      fixes: [mongoose.Schema.Types.Mixed]
    }
  },
  
  // Aggregated Results
  aggregator: {
    website_health_score: Number,
    health_grade: String,
    dominant_risk_domains: [String],
    fix_priority_order: [mongoose.Schema.Types.Mixed],
    overall_risk_level: String,
    action_recommendation_flag: String,
    confidence_overall: Number
  },
  
  // Warnings and Errors
  warnings: [String],
  errors: [String],
  
  // Metadata
  user_agent: String,
  viewport: mongoose.Schema.Types.Mixed,
  emulate_mobile: Boolean,
  load_time_ms: Number,
  http_status: Number
  
}, {
  timestamps: true
});

// Indexes for efficient querying
ReportSchema.index({ url: 1, created_at: -1 });
ReportSchema.index({ status: 1, created_at: -1 });
ReportSchema.index({ 'aggregator.website_health_score': -1 });

// Virtual for age
ReportSchema.virtual('age_hours').get(function() {
  return (Date.now() - this.created_at) / (1000 * 60 * 60);
});

// Method to check if report is stale (older than 24 hours)
ReportSchema.methods.isStale = function() {
  const STALE_HOURS = 24;
  return this.age_hours > STALE_HOURS;
};

// Static method to find recent reports for a URL
ReportSchema.statics.findRecentByUrl = function(url, maxAgeHours = 24) {
  const cutoffDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
  return this.find({
    url: url,
    status: 'completed',
    created_at: { $gte: cutoffDate }
  }).sort({ created_at: -1 }).limit(5);
};

const Report = mongoose.model('Report', ReportSchema);

module.exports = Report;
