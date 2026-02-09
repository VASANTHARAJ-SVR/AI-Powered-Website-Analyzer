const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

/**
 * GET /api/reports/:id
 * Get a report by ID
 */
router.get('/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    res.json(report);

  } catch (error) {
    console.error('[API] Get report error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch report'
    });
  }
});

/**
 * GET /api/reports
 * Get all reports (with pagination)
 */
router.get('/reports', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reports = await Report.find()
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-raw_artifacts.html -raw_artifacts.screenshot_full_base64 -raw_artifacts.screenshot_viewport_base64');

    const count = await Report.countDocuments();

    res.json({
      reports,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });

  } catch (error) {
    console.error('[API] Get reports error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch reports'
    });
  }
});

module.exports = router;
