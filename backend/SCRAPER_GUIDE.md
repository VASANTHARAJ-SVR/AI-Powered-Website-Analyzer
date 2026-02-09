# Enhanced Scraper Implementation Guide

## 🎯 Overview

This guide explains how to use the comprehensive Playwright scraper for the AI-Powered Website Analyzer project.

## 📦 What's Been Implemented

### 1. Combined Scraper (`src/services/scraper/combinedScraper.js`)
- **Performance Observers**: Captures LCP, CLS, FCP, TTFB, TBT in real-time
- **Network Tracking**: Monitors all resources (JS, CSS, images, fonts) with sizes
- **Accessibility Scanning**: Integrates Axe-core for WCAG 2.0/2.1 AA compliance
- **SEO Extraction**: Meta tags, headings, structured data, OpenGraph, Twitter Cards
- **Content Analysis**: Visible text extraction, DOM statistics, CTA detection
- **Screenshots**: Full page and viewport captures (base64)

### 2. HuggingFace Adapter (`src/services/ai/llmAdapter.js`)
- **Summarization**: Text summarization for content recommendations
- **Embeddings**: Semantic similarity for intent matching
- **NER**: Named entity recognition for content analysis
- **LLM Recommendations**: Module-specific AI recommendations with fallback

### 3. Content Analyzer (`src/utils/contentAnalyzer.js`)
- **Readability Metrics**: Flesch Reading Ease, Flesch-Kincaid Grade
- **Keyword Extraction**: TF-IDF based keyword extraction
- **Text Statistics**: Word count, sentence analysis, lexical diversity
- **Quality Scoring**: Overall content quality assessment

### 4. MongoDB Schema (`src/models/Report.js`)
- Comprehensive schema for storing all analysis results
- Separate storage for raw artifacts and processed module results
- Indexes for efficient querying
- Helper methods for staleness checking

## 🚀 Quick Start

### Installation

```bash
cd backend
npm install natural node-fetch@2 axe-core
```

### Basic Usage

```javascript
const { combinedScrape } = require('./src/services/scraper/combinedScraper');

const artifact = await combinedScrape('https://example.com', {
  emulateMobile: false,
  timeout: 45000
});

console.log('Performance:', artifact.performance);
console.log('SEO:', artifact.seo);
console.log('UX:', artifact.ux);
console.log('Content:', artifact.content);
```

### Test the Scraper

```bash
node test-scraper.js https://example.com
```

Output files are saved to `test-output/`:
- `scrape-*.json` - Full artifact data
- `screenshot-full-*.png` - Full page screenshot
- `screenshot-viewport-*.png` - Viewport screenshot

## 📊 Data Structure

### Artifact Object

```javascript
{
  // Metadata
  finalUrl: "https://example.com/",
  httpStatus: 200,
  loadTimeMs: 1234,
  
  // Performance
  performance: {
    lcp_s: 2.5,
    cls: 0.05,
    fcp_s: 1.2,
    ttfb_s: 0.3,
    tbt_ms: 150,
    longTasks: [...]
  },
  
  // Resources
  resources: {
    total_count: 45,
    total_js_kb: 234.5,
    total_css_kb: 45.2,
    total_images_kb: 567.8,
    render_blocking_count: 3
  },
  
  // SEO
  seo: {
    title: "Example Domain",
    title_length: 14,
    meta_description: "...",
    h1s: ["Example Domain"],
    heading_counts: { h1: 1, h2: 0, ... },
    images_missing_alt_count: 0,
    internal_links_count: 1,
    external_links_count: 1,
    structured_data: [...],
    open_graph: {...},
    twitter_card: {...}
  },
  
  // UX
  ux: {
    axe_results: {...},
    violations_count: 2,
    violations: [...],
    ctas: [...],
    ctas_above_fold: 0,
    dom_node_count: 47
  },
  
  // Content
  content: {
    visible_text: "Example Domain...",
    word_count: 45,
    char_count: 289
  }
}
```

## 🔧 Integration with Modules

### Performance Module

```javascript
const performanceData = {
  lcp_s: artifact.performance.lcp_s,
  cls: artifact.performance.cls,
  ttfb_s: artifact.performance.ttfb_s,
  total_js_kb: artifact.resources.total_js_kb,
  total_images_kb: artifact.resources.total_images_kb,
  total_requests: artifact.resources.total_count
};

// Use SLM estimator or Lighthouse validation
```

### UX Module

```javascript
const uxData = {
  axeResults: artifact.ux.axe_results,
  violations: artifact.ux.violations,
  ctas: artifact.ux.ctas,
  viewport_meta_present: artifact.ux.viewport_meta_present
};

// Calculate UX score based on violations and heuristics
```

### SEO Module

```javascript
const seoData = {
  title: artifact.seo.title,
  title_length: artifact.seo.title_length,
  meta_description_length: artifact.seo.meta_description_length,
  h1_count: artifact.seo.heading_counts.h1,
  images_missing_alt_count: artifact.seo.images_missing_alt_count,
  canonical: artifact.seo.canonical,
  structured_data: artifact.seo.structured_data
};

// Calculate SEO score based on penalties
```

### Content Module

```javascript
const { analyzeContentQuality } = require('./utils/contentAnalyzer');
const { extractEntities, embed } = require('./services/ai/llmAdapter');

const contentAnalysis = analyzeContentQuality(artifact.content.visible_text);
const entities = await extractEntities(artifact.content.visible_text);
const embedding = await embed(artifact.content.visible_text);

// Use for intent matching and content scoring
```

## 🤖 HuggingFace Integration

### Setup

Add to `.env`:
```
HF_API_KEY=hf_your_api_key_here
```

### Usage Examples

#### Summarization
```javascript
const { summarize } = require('./services/ai/llmAdapter');
const summary = await summarize(longText, { maxLength: 150 });
```

#### Embeddings
```javascript
const { embed, cosineSimilarity } = require('./services/ai/llmAdapter');
const vec1 = await embed("Your page content");
const vec2 = await embed("Target keyword or competitor content");
const similarity = cosineSimilarity(vec1, vec2);
```

#### Named Entity Recognition
```javascript
const { extractEntities } = require('./services/ai/llmAdapter');
const entities = await extractEntities(text);
// Returns: [{ text: "Google", type: "ORG", score: 0.99 }, ...]
```

#### Module Recommendations
```javascript
const { generateRecommendations } = require('./services/ai/llmAdapter');
const recommendations = await generateRecommendations('seo', seoData);
```

## 💾 MongoDB Storage

### Save Report

```javascript
const Report = require('./models/Report');

const report = new Report({
  request_id: 'unique-id',
  url: 'https://example.com',
  final_url: artifact.finalUrl,
  status: 'completed',
  raw_artifacts: {
    html: artifact.html,
    screenshot_full_base64: artifact.screenshot_full,
    resources: artifact.resources.all,
    performance_raw: artifact.performance,
    axe_results: artifact.ux.axe_results,
    seo_raw: artifact.seo,
    content_raw: artifact.content
  },
  modules: {
    performance: performanceModuleResult,
    ux: uxModuleResult,
    seo: seoModuleResult,
    content: contentModuleResult
  },
  aggregator: aggregatorResult,
  load_time_ms: artifact.loadTimeMs,
  http_status: artifact.httpStatus
});

await report.save();
```

### Query Reports

```javascript
// Find recent reports for a URL
const reports = await Report.findRecentByUrl('https://example.com', 24);

// Check if report is stale
if (report.isStale()) {
  // Re-run analysis
}
```

## 📝 Next Steps

### 1. Implement Module Logic

Create the following files:
- `src/services/modules/performanceModule.js`
- `src/services/modules/uxModule.js`
- `src/services/modules/seoModule.js`
- `src/services/modules/contentModule.js`

Each should export an `analyze(artifact)` function that returns module-specific scores and recommendations.

### 2. Implement Aggregator

Create `src/aggregator/aggregator.js` that:
- Combines module scores
- Applies penalty weights (40% perf, 25% ux, 20% seo, 15% content)
- Calculates website health score
- Determines fix priority order

### 3. Create Job Runner

Create `src/services/jobRunner.js` that:
- Runs the scraper
- Calls all modules
- Runs aggregator
- Saves to MongoDB
- Updates job status

### 4. Wire Up API Routes

Update routes to use the new scraper:
- `POST /api/analyze` - Enqueue job
- `GET /api/job/:id/status` - Check job status
- `GET /api/reports/:id` - Get full report
- `GET /api/reports/:id/module/:name` - Get module-specific data

## 🎯 Key Features

✅ Real-time performance metrics (LCP, CLS, FCP, TTFB, TBT)
✅ Comprehensive accessibility scanning (Axe-core)
✅ Full SEO data extraction (meta, headings, structured data)
✅ Content quality analysis (readability, keywords, entities)
✅ AI-powered recommendations (HuggingFace)
✅ Network resource tracking with sizes
✅ Screenshot capture (full page + viewport)
✅ MongoDB schema for complete data storage

## 🔍 Debugging

### View Scraper Output
```bash
node test-scraper.js https://your-site.com
cat test-output/scrape-*.json | jq .
```

### Test Individual Components
```javascript
// Test content analyzer
const { analyzeContentQuality } = require('./src/utils/contentAnalyzer');
const result = analyzeContentQuality("Your text here");
console.log(result);

// Test HF adapter
const { summarize } = require('./src/services/ai/llmAdapter');
summarize("Long text...").then(console.log);
```

## 📚 Resources

- [Playwright Docs](https://playwright.dev/)
- [Axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [HuggingFace Inference API](https://huggingface.co/docs/api-inference/index)
- [Web Vitals](https://web.dev/vitals/)

---

**Ready to integrate!** The scraper is production-ready and extracts all data needed for your Performance, UX, SEO, and Content modules.
