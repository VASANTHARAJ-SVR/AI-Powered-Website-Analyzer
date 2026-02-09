/**
 * Test Analysis Modules (No MongoDB Required)
 * Run: node test-modules-only.js [url]
 */

require('dotenv').config();
const { combinedScrape } = require('./src/services/scraper/combinedScraper');
const performanceModule = require('./src/services/modules/performanceModule');
const uxModule = require('./src/services/modules/uxModule');
const seoModule = require('./src/services/modules/seoModule');
const contentModule = require('./src/services/modules/contentModule');
const { aggregate } = require('./src/aggregator/aggregator');

async function testModules() {
  console.log('🚀 Starting Module Analysis Test (No Database)...\n');

  const testUrl = process.argv[2] || 'https://example.com';
  console.log(`📍 Target URL: ${testUrl}\n`);

  try {
    const startTime = Date.now();

    // Step 1: Scrape
    console.log('[10%] Scraping website...');
    const artifact = await combinedScrape(testUrl);
    console.log('[30%] Scraping completed\n');

    // Step 2: Run modules
    console.log('[40%] Running Performance Module...');
    const performanceResult = await performanceModule.analyze(artifact);
    
    console.log('[50%] Running UX Module...');
    const uxResult = await uxModule.analyze(artifact);
    
    console.log('[60%] Running SEO Module...');
    const seoResult = await seoModule.analyze(artifact);
    
    console.log('[70%] Running Content Module...');
    const contentResult = await contentModule.analyze(artifact);
    
    console.log('[80%] Aggregating results...\n');

    // Step 3: Aggregate
    const aggregatorResult = aggregate({
      performance: performanceResult,
      ux: uxResult,
      seo: seoResult,
      content: contentResult
    });

    const duration = Date.now() - startTime;

    console.log('✅ Analysis completed successfully!\n');
    console.log('═'.repeat(60));
    console.log('\n📊 OVERALL RESULTS');
    console.log('─'.repeat(60));
    console.log(`Website Health Score: ${aggregatorResult.website_health_score}/100 (Grade: ${aggregatorResult.health_grade})`);
    console.log(`Action Needed: ${aggregatorResult.action_recommendation_flag}`);
    console.log(`Risk Domains: ${aggregatorResult.dominant_risk_domains.join(', ') || 'None'}`);
    console.log(`Overall Risk Level: ${aggregatorResult.overall_risk_level}`);
    
    console.log('\n📈 MODULE SCORES');
    console.log('─'.repeat(60));
    console.log(`⚡ Performance: ${performanceResult.score}/100 (${performanceResult.confidence} confidence)`);
    console.log(`♿ UX: ${uxResult.score}/100 (${uxResult.accessibility_risk_level} risk)`);
    console.log(`🔍 SEO: ${seoResult.score}/100 (${seoResult.indexability_status})`);
    console.log(`📝 Content: ${contentResult.score}/100 (${contentResult.content_depth_status})`);

    // Performance details
    console.log('\n⚡ PERFORMANCE DETAILS');
    console.log('─'.repeat(60));
    console.log(`LCP: ${performanceResult.metrics.lcp_s ? performanceResult.metrics.lcp_s.toFixed(2) + 's' : 'N/A'}`);
    console.log(`CLS: ${performanceResult.metrics.cls.toFixed(3)}`);
    console.log(`FCP: ${performanceResult.metrics.fcp_s ? performanceResult.metrics.fcp_s.toFixed(2) + 's' : 'N/A'}`);
    console.log(`TTFB: ${performanceResult.metrics.ttfb_s.toFixed(2)}s`);
    console.log(`TBT: ${performanceResult.metrics.tbt_ms.toFixed(0)}ms`);
    console.log(`Total JS: ${performanceResult.metrics.total_js_kb.toFixed(1)} KB`);
    console.log(`Total Images: ${performanceResult.metrics.total_images_kb.toFixed(1)} KB`);
    console.log(`Issues Found: ${performanceResult.issues.length}`);
    console.log(`Fixes Suggested: ${performanceResult.fixes.length}`);

    // UX details
    console.log('\n♿ UX & ACCESSIBILITY DETAILS');
    console.log('─'.repeat(60));
    console.log(`Violations: ${uxResult.violations_count}`);
    console.log(`  Critical: ${uxResult.violations_by_impact.critical}`);
    console.log(`  Serious: ${uxResult.violations_by_impact.serious}`);
    console.log(`  Moderate: ${uxResult.violations_by_impact.moderate}`);
    console.log(`  Minor: ${uxResult.violations_by_impact.minor}`);
    console.log(`CTAs Detected: ${uxResult.ctas_count}`);
    console.log(`CTAs Above Fold: ${uxResult.ctas_above_fold}`);
    console.log(`Issues Found: ${uxResult.issues.length}`);

    // SEO details
    console.log('\n🔍 SEO DETAILS');
    console.log('─'.repeat(60));
    console.log(`Title: "${artifact.seo.title}" (${seoResult.title_length} chars)`);
    console.log(`Meta Description: ${seoResult.meta_description_length} chars`);
    console.log(`H1 Count: ${seoResult.h1_count}`);
    console.log(`Images Missing Alt: ${seoResult.images_missing_alt_count}`);
    console.log(`Internal Links: ${seoResult.internal_links_count}`);
    console.log(`External Links: ${seoResult.external_links_count}`);
    console.log(`Issues Found: ${seoResult.issues.length}`);

    // Content details
    console.log('\n📝 CONTENT DETAILS');
    console.log('─'.repeat(60));
    console.log(`Word Count: ${contentResult.word_count}`);
    console.log(`Flesch Reading Ease: ${contentResult.flesch_reading_ease.toFixed(1)}`);
    console.log(`Flesch-Kincaid Grade: ${contentResult.flesch_kincaid_grade.toFixed(1)}`);
    console.log(`Top Keywords: ${contentResult.keywords.slice(0, 5).map(k => k.word).join(', ')}`);
    console.log(`Issues Found: ${contentResult.issues.length}`);

    // Top priority fixes
    console.log('\n🔧 TOP PRIORITY FIXES');
    console.log('─'.repeat(60));
    const allFixes = [
      ...performanceResult.fixes.map(f => ({ ...f, module: 'Performance' })),
      ...uxResult.fixes.map(f => ({ ...f, module: 'UX' })),
      ...seoResult.fixes.map(f => ({ ...f, module: 'SEO' })),
      ...contentResult.fixes.map(f => ({ ...f, module: 'Content' }))
    ];
    
    allFixes.sort((a, b) => a.priority - b.priority || b.impact_pct - a.impact_pct);
    
    allFixes.slice(0, 5).forEach((fix, idx) => {
      console.log(`\n${idx + 1}. [${fix.module}] ${fix.title}`);
      console.log(`   Impact: ${fix.impact_pct}% | Effort: ${fix.effort_hours}h | Priority: ${fix.priority}`);
      console.log(`   ${fix.description.slice(0, 80)}${fix.description.length > 80 ? '...' : ''}`);
    });

    console.log('\n═'.repeat(60));
    console.log(`\n⏱️  Total Duration: ${duration}ms`);
    console.log(`🔗 Final URL: ${artifact.finalUrl}`);
    
    console.log('\n✨ Test completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Analysis failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testModules();
