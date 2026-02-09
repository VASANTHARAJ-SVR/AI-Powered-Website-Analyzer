const mongoose = require('mongoose');

const scanResultSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    index: true
  },
  scrapedData: {
    html: String,
    screenshot: String, // base64
    metadata: {
      title: String,
      description: String,
      h1Tags: [String],
      images: [{
        src: String,
        alt: String
      }],
      links: [String],
      viewport: {
        width: Number,
        height: Number
      },
      loadTime: Number
    }
  },
  analysisResults: {
    seo: mongoose.Schema.Types.Mixed,
    performance: mongoose.Schema.Types.Mixed,
    ux: mongoose.Schema.Types.Mixed,
    content: mongoose.Schema.Types.Mixed
  },
  scores: {
    overall: { type: Number, default: 0 },
    seo: { type: Number, default: 0 },
    performance: { type: Number, default: 0 },
    ux: { type: Number, default: 0 },
    content: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ScanResult', scanResultSchema);
