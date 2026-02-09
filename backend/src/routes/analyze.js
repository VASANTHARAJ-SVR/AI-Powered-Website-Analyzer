const express = require('express');
const router = express.Router();
const { runAnalysisJob } = require('../services/jobRunner');

/**
 * POST /api/analyze
 * Analyze a website and return complete report
 */
router.post('/analyze', async (req, res) => {
  try {
    const { url, emulateMobile = false } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'URL is required' });
    try { new URL(url); } catch (err) { return res.status(400).json({ success: false, error: 'Invalid URL format' }); }

    console.log(`[API] Starting full analysis for: ${url} (mobile=${emulateMobile})`);
    const result = await runAnalysisJob(url, { emulateMobile });
    console.log(`[API] Analysis completed: ${result.reportId}`);
    res.json(result);
  } catch (error) {
    console.error('[API] Analysis error:', error);
    res.status(500).json({ success: false, error: error.message || 'Analysis failed' });
  }
});

/**
 * POST /api/analyze/mobile
 * Analyze a website in mobile mode (mobile Axe + mobile viewport)
 */
router.post('/analyze/mobile', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'URL is required' });
    try { new URL(url); } catch (err) { return res.status(400).json({ success: false, error: 'Invalid URL format' }); }

    console.log(`[API] Starting MOBILE analysis for: ${url}`);
    const result = await runAnalysisJob(url, { emulateMobile: true });
    console.log(`[API] Mobile analysis completed: ${result.reportId}`);
    res.json(result);
  } catch (error) {
    console.error('[API] Mobile analysis error:', error);
    res.status(500).json({ success: false, error: error.message || 'Mobile analysis failed' });
  }
});

/**
 * POST /api/analyze/:module
 * Run specific analysis module (seo, performance, ux, content)
 */
router.post('/analyze/:module', async (req, res) => {
  try {
    const { module } = req.params;
    const { url, emulateMobile = false } = req.body;
    const validModules = ['seo', 'performance', 'ux', 'content'];

    if (!validModules.includes(module)) {
      return res.status(400).json({ success: false, error: 'Invalid module name' });
    }
    if (!url) return res.status(400).json({ success: false, error: 'URL is required' });

    console.log(`[API] Starting ${module} analysis for: ${url}`);

    // Use jobRunner's partial analysis
    const { runPartialAnalysis } = require('../services/jobRunner');
    const result = await runPartialAnalysis(url, [module], { emulateMobile });

    res.json(result);
  } catch (error) {
    console.error(`[API] ${req.params.module} analysis error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/report/:id/:module?
 * Get analysis report by ID, optionally filtered by module
 */
router.get('/report/:id/:module?', async (req, res) => {
  try {
    const { id, module } = req.params;
    const Report = require('../models/Report'); // Lazy load model

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    if (module) {
      if (report.modules && report.modules[module]) {
        return res.json({ success: true, [module]: report.modules[module] });
      } else {
        return res.status(404).json({ success: false, error: `Module data for ${module} not found` });
      }
    }

    res.json({ success: true, report });
  } catch (error) {
    console.error('[API] Get report error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'WebAudit AI Backend'
  });
});

module.exports = router;
