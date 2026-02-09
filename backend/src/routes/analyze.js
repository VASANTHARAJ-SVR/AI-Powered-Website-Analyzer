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

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }

    console.log(`[API] Starting analysis for: ${url}`);

    // Run analysis
    const result = await runAnalysisJob(url, { emulateMobile });

    console.log(`[API] Analysis completed: ${result.reportId}`);

    res.json(result);

  } catch (error) {
    console.error('[API] Analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Analysis failed'
    });
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
