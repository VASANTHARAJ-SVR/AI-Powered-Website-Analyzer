/**
 * Test script for the combined scraper
 * Run: node test-scraper.js
 */

require('dotenv').config();
const { combinedScrape } = require('./src/services/scraper/combinedScraper');
const fs = require('fs').promises;
const path = require('path');

async function testScraper() {
  console.log('🚀 Starting Combined Scraper Test...\n');

  const testUrl = process.argv[2] || 'https://example.com';
  console.log(`📍 Target URL: ${testUrl}\n`);

  try {
    const startTime = Date.now();
    
    // Run the scraper
    const artifact = await combinedScrape(testUrl, {
      emulateMobile: false,
      timeout: 45000
    });

    const duration = Date.now() - startTime;
    
    console.log('✅ Scraping completed successfully!\n');
    console.log('📊 Results Summary:');
    console.log('─'.repeat(60));
    
    // Metadata
    console.log('\n🔗 Metadata:');
    console.log(`  Final URL: ${artifact.finalUrl}`);
    console.log(`  HTTP Status: ${artifact.httpStatus}`);
    console.log(`  Load Time: ${artifact.loadTimeMs}ms`);
    console.log(`  Redirects: ${artifact.redirectChain.length}`);
    
    // Performance
    console.log('\n⚡ Performance Metrics:');
    console.log(`  LCP: ${artifact.performance.lcp_s ? artifact.performance.lcp_s.toFixed(2) + 's' : 'N/A'}`);
    console.log(`  CLS: ${artifact.performance.cls.toFixed(3)}`);
    console.log(`  FCP: ${artifact.performance.fcp_s ? artifact.performance.fcp_s.toFixed(2) + 's' : 'N/A'}`);
    console.log(`  TTFB: ${artifact.performance.ttfb_s.toFixed(2)}s`);
    console.log(`  TBT: ${artifact.performance.tbt_ms.toFixed(0)}ms`);
    console.log(`  Long Tasks: ${artifact.performance.longTasks.length}`);
    
    // Resources
    console.log('\n📦 Resources:');
    console.log(`  Total Requests: ${artifact.resources.total_count}`);
    console.log(`  JavaScript: ${artifact.resources.total_js_kb.toFixed(2)} KB`);
    console.log(`  CSS: ${artifact.resources.total_css_kb.toFixed(2)} KB`);
    console.log(`  Images: ${artifact.resources.total_images_kb.toFixed(2)} KB`);
    console.log(`  Fonts: ${artifact.resources.total_fonts_kb.toFixed(2)} KB`);
    console.log(`  Render Blocking: ${artifact.resources.render_blocking_count}`);
    
    // SEO
    console.log('\n🔍 SEO Data:');
    console.log(`  Title: "${artifact.seo.title}" (${artifact.seo.title_length} chars)`);
    console.log(`  Meta Desc: ${artifact.seo.meta_description_length} chars`);
    console.log(`  H1 Count: ${artifact.seo.heading_counts.h1}`);
    console.log(`  H2 Count: ${artifact.seo.heading_counts.h2}`);
    console.log(`  Images Missing Alt: ${artifact.seo.images_missing_alt_count}`);
    console.log(`  Internal Links: ${artifact.seo.internal_links_count}`);
    console.log(`  External Links: ${artifact.seo.external_links_count}`);
    console.log(`  Canonical: ${artifact.seo.canonical || 'None'}`);
    console.log(`  Structured Data: ${artifact.seo.structured_data.length} items`);
    
    // UX / Accessibility
    console.log('\n♿ UX & Accessibility:');
    console.log(`  Axe Violations: ${artifact.ux.violations_count}`);
    console.log(`  CTAs Detected: ${artifact.ux.ctas.length}`);
    console.log(`  CTAs Above Fold: ${artifact.ux.ctas_above_fold}`);
    console.log(`  DOM Nodes: ${artifact.ux.dom_node_count}`);
    console.log(`  Viewport Meta: ${artifact.ux.viewport_meta_present ? 'Yes' : 'No'}`);
    
    if (artifact.ux.violations_count > 0) {
      console.log('\n  Top Violations:');
      artifact.ux.violations.slice(0, 3).forEach((v, i) => {
        console.log(`    ${i + 1}. ${v.id}: ${v.description.slice(0, 60)}...`);
        console.log(`       Impact: ${v.impact}, Nodes: ${v.nodes.length}`);
      });
    }
    
    // Content
    console.log('\n📝 Content:');
    console.log(`  Word Count: ${artifact.content.word_count}`);
    console.log(`  Character Count: ${artifact.content.char_count}`);
    console.log(`  Visible Text Preview: "${artifact.content.visible_text.slice(0, 100)}..."`);
    
    console.log('\n─'.repeat(60));
    console.log(`\n⏱️  Total Duration: ${duration}ms`);
    
    // Save to file
    const outputDir = path.join(__dirname, 'test-output');
    await fs.mkdir(outputDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(outputDir, `scrape-${timestamp}.json`);
    
    // Remove base64 screenshots for file size (keep metadata)
    const artifactForFile = {
      ...artifact,
      screenshot_full: `<base64 data: ${artifact.screenshot_full ? artifact.screenshot_full.length : 0} chars>`,
      screenshot_viewport: `<base64 data: ${artifact.screenshot_viewport ? artifact.screenshot_viewport.length : 0} chars>`,
      html: `<HTML content: ${artifact.html.length} chars>`
    };
    
    await fs.writeFile(outputFile, JSON.stringify(artifactForFile, null, 2));
    console.log(`\n💾 Full results saved to: ${outputFile}`);
    
    // Save screenshots separately
    if (artifact.screenshot_full) {
      const screenshotFile = path.join(outputDir, `screenshot-full-${timestamp}.png`);
      await fs.writeFile(screenshotFile, Buffer.from(artifact.screenshot_full, 'base64'));
      console.log(`📸 Full screenshot saved to: ${screenshotFile}`);
    }
    
    if (artifact.screenshot_viewport) {
      const screenshotFile = path.join(outputDir, `screenshot-viewport-${timestamp}.png`);
      await fs.writeFile(screenshotFile, Buffer.from(artifact.screenshot_viewport, 'base64'));
      console.log(`📸 Viewport screenshot saved to: ${screenshotFile}`);
    }
    
    console.log('\n✨ Test completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Scraping failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testScraper();
