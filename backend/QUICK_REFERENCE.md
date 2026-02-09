# Quick Reference: Enhanced Scraper

## 🚀 Quick Start

```bash
# Test the scraper
node test-scraper.js https://example.com

# View results
cat test-output/scrape-*.json | jq .
```

## 📦 What You Get

```javascript
const { combinedScrape } = require('./src/services/scraper/combinedScraper');
const artifact = await combinedScrape('https://example.com');

// Performance
artifact.performance.lcp_s      // Largest Contentful Paint (seconds)
artifact.performance.cls        // Cumulative Layout Shift
artifact.performance.ttfb_s     // Time to First Byte (seconds)
artifact.performance.tbt_ms     // Total Blocking Time (ms)

// Resources
artifact.resources.total_js_kb      // Total JavaScript (KB)
artifact.resources.total_css_kb     // Total CSS (KB)
artifact.resources.total_images_kb  // Total Images (KB)
artifact.resources.total_count      // Total requests

// SEO
artifact.seo.title                      // Page title
artifact.seo.title_length               // Title length
artifact.seo.meta_description_length    // Meta desc length
artifact.seo.heading_counts.h1          // H1 count
artifact.seo.images_missing_alt_count   // Images without alt
artifact.seo.structured_data            // JSON-LD data
artifact.seo.open_graph                 // OG tags
artifact.seo.canonical                  // Canonical URL

// UX / Accessibility
artifact.ux.violations_count    // Axe violations
artifact.ux.violations          // Violation details
artifact.ux.ctas                // Call-to-action buttons
artifact.ux.ctas_above_fold     // CTAs above fold

// Content
artifact.content.visible_text   // Main content text
artifact.content.word_count     // Word count
artifact.content.char_count     // Character count
```

## 🤖 AI Features

```javascript
const { 
  summarize, 
  embed, 
  extractEntities, 
  generateRecommendations 
} = require('./services/ai/llmAdapter');

// Summarize content
const summary = await summarize(longText, { maxLength: 150 });

// Get embeddings for similarity
const vec1 = await embed("Your page content");
const vec2 = await embed("Target keywords");
const similarity = cosineSimilarity(vec1, vec2);

// Extract named entities
const entities = await extractEntities(text);
// Returns: [{ text: "Google", type: "ORG", score: 0.99 }]

// Get AI recommendations
const recs = await generateRecommendations('seo', seoData);
```

## 📊 Content Analysis

```javascript
const { analyzeContentQuality } = require('./utils/contentAnalyzer');

const analysis = analyzeContentQuality(text);
// Returns:
// {
//   flesch_reading_ease: 65.2,
//   flesch_kincaid_grade: 8.5,
//   keywords: [{word: "example", score: 0.45}],
//   quality_score: 72,
//   stats: { word_count, sentence_count, ... }
// }
```

## 💾 MongoDB Storage

```javascript
const Report = require('./models/Report');

const report = new Report({
  request_id: 'unique-id',
  url: 'https://example.com',
  status: 'completed',
  raw_artifacts: {
    html: artifact.html,
    performance_raw: artifact.performance,
    axe_results: artifact.ux.axe_results,
    seo_raw: artifact.seo,
    content_raw: artifact.content
  },
  modules: {
    performance: { score: 85, ... },
    ux: { score: 72, ... },
    seo: { score: 90, ... },
    content: { score: 68, ... }
  }
});

await report.save();

// Find recent reports
const recent = await Report.findRecentByUrl('https://example.com', 24);
```

## 🔧 Environment Setup

```bash
# .env
HF_API_KEY=hf_your_api_key_here
MONGO_URI=mongodb+srv://...
```

## 📁 Files Created

- `src/services/scraper/combinedScraper.js` - Main scraper
- `src/services/ai/llmAdapter.js` - HuggingFace integration
- `src/utils/contentAnalyzer.js` - Content quality analysis
- `src/models/Report.js` - MongoDB schema
- `test-scraper.js` - Test script
- `SCRAPER_GUIDE.md` - Full documentation

## 🎯 Next: Implement Modules

Create these files:
1. `src/services/modules/performanceModule.js`
2. `src/services/modules/uxModule.js`
3. `src/services/modules/seoModule.js`
4. `src/services/modules/contentModule.js`
5. `src/aggregator/aggregator.js`
6. `src/services/jobRunner.js`

Each module should export:
```javascript
async function analyze(artifact) {
  return {
    score: 0-100,
    confidence: 'low|medium|high',
    issues: [...],
    fixes: [...],
    recommendation_flag: '...'
  };
}
```
