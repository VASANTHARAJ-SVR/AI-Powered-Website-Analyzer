/**
 * Job Runner
 * Orchestrates the entire analysis workflow: scrape → modules → aggregate → save
 */

const { combinedScrape } = require('./scraper/combinedScraper');
const performanceModule = require('./modules/performanceModule');
const uxModule = require('./modules/uxModule');
const seoModule = require('./modules/seoModule');
const contentModule = require('./modules/contentModule');
const { aggregate } = require('../aggregator/aggregator');
const Report = require('../models/Report');
const { v4: uuidv4 } = require('uuid');

/**
 * Run complete analysis job
 * @param {string} url - URL to analyze
 * @param {Object} options - Analysis options
 * @param {Function} progressCallback - Optional callback for progress updates
 * @returns {Promise<Object>} Complete analysis result
 */
async function runAnalysisJob(url, options = {}, progressCallback = null) {
  const jobId = options.jobId || uuidv4();
  const startTime = Date.now();

  const updateProgress = (status, progress, message) => {
    if (progressCallback) {
      progressCallback({ jobId, status, progress, message });
    }
  };

  try {
    updateProgress('running', 10, 'Starting scraper...');

    // ============================================
    // Step 1: Scrape the website
    // ============================================
    const artifact = await combinedScrape(url, {
      emulateMobile: options.emulateMobile || false,
      timeout: options.timeout || 45000
    });

    updateProgress('running', 30, 'Scraping completed, analyzing performance...');

    // ============================================
    // Step 2: Run all modules in parallel
    // ============================================
    const [performanceResult, uxResult, seoResult, contentResult] = await Promise.all([
      performanceModule.analyze(artifact),
      uxModule.analyze(artifact),
      seoModule.analyze(artifact),
      contentModule.analyze(artifact)
    ]);

    updateProgress('running', 70, 'Module analysis completed, aggregating results...');

    // ============================================
    // Step 3: Aggregate results
    // ============================================
    const aggregatorResult = aggregate({
      performance: performanceResult,
      ux: uxResult,
      seo: seoResult,
      content: contentResult
    });

    updateProgress('running', 85, 'Saving report to database...');

    // ============================================
    // Step 4: Save to MongoDB
    // ============================================
    const report = new Report({
      request_id: jobId,
      url: url,
      final_url: artifact.finalUrl,
      status: 'completed',
      created_at: new Date(startTime),
      finished_at: new Date(),
      
      // Raw artifacts
      raw_artifacts: {
        html: artifact.html,
        screenshot_full_base64: artifact.screenshot_full,
        screenshot_viewport_base64: artifact.screenshot_viewport,
        resources: artifact.resources.all,
        redirect_chain: artifact.redirectChain,
        
        performance_raw: artifact.performance,
        axe_results: artifact.ux.axe_results,
        seo_raw: artifact.seo,
        content_raw: artifact.content
      },
      
      // Module results
      modules: {
        performance: performanceResult,
        ux: uxResult,
        seo: seoResult,
        content: contentResult
      },
      
      // Aggregated results
      aggregator: aggregatorResult,
      
      // Metadata
      user_agent: artifact.userAgent,
      viewport: artifact.viewport,
      emulate_mobile: options.emulateMobile || false,
      load_time_ms: artifact.loadTimeMs,
      http_status: artifact.httpStatus,
      
      warnings: [],
      errors: []
    });

    await report.save();

    updateProgress('completed', 100, 'Analysis completed successfully');

    const duration = Date.now() - startTime;

    // ============================================
    // Return complete result
    // ============================================
    return {
      success: true,
      jobId,
      reportId: report._id.toString(),
      url,
      final_url: artifact.finalUrl,
      duration_ms: duration,
      website_health_score: aggregatorResult.website_health_score,
      health_grade: aggregatorResult.health_grade,
      module_scores: aggregatorResult.module_scores,
      dominant_risk_domains: aggregatorResult.dominant_risk_domains,
      action_recommendation: aggregatorResult.action_recommendation_flag,
      report
    };

  } catch (error) {
    updateProgress('failed', 0, error.message);

    // Try to save failed report
    try {
      const failedReport = new Report({
        request_id: jobId,
        url: url,
        status: 'failed',
        created_at: new Date(startTime),
        finished_at: new Date(),
        errors: [error.message],
        warnings: [error.stack]
      });
      await failedReport.save();
    } catch (saveError) {
      console.error('Failed to save error report:', saveError);
    }

    throw error;
  }
}

/**
 * Run analysis for specific modules only
 * @param {string} url - URL to analyze
 * @param {string[]} moduleNames - Array of module names to run
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Partial analysis result
 */
async function runPartialAnalysis(url, moduleNames, options = {}) {
  const artifact = await combinedScrape(url, options);

  const results = {};

  if (moduleNames.includes('performance')) {
    results.performance = await performanceModule.analyze(artifact);
  }
  if (moduleNames.includes('ux')) {
    results.ux = await uxModule.analyze(artifact);
  }
  if (moduleNames.includes('seo')) {
    results.seo = await seoModule.analyze(artifact);
  }
  if (moduleNames.includes('content')) {
    results.content = await contentModule.analyze(artifact);
  }

  return {
    success: true,
    url,
    final_url: artifact.finalUrl,
    modules: results
  };
}

module.exports = {
  runAnalysisJob,
  runPartialAnalysis
};
