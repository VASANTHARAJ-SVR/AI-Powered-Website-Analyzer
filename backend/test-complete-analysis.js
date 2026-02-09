/**
 * Test Complete Analysis Workflow
 * Run: node test-complete-analysis.js [url]
 */

require('dotenv').config();
const { runAnalysisJob } = require('./src/services/jobRunner');
const mongoose = require('mongoose');

async function testCompleteAnalysis() {
  console.log('🚀 Starting Complete Analysis Test...\n');

  const testUrl = process.argv[2] || 'https://example.com';
  console.log(`📍 Target URL: ${testUrl}\n`);

  try {
    // Connect to MongoDB
    if (process.env.MONGO_URI) {
      console.log('📦 Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ MongoDB connected\n');
    } else {
      console.log('⚠️  No MONGO_URI found - skipping database save\n');
    }

    const startTime = Date.now();

    // Progress callback
    const progressCallback = (update) => {
      console.log(`[${update.progress}%] ${update.status}: ${update.message}`);
    };

    // Run analysis
    const result = await runAnalysisJob(testUrl, {}, progressCallback);

    const duration = Date.now() - startTime;

    console.log('\n✅ Analysis completed successfully!\n');
    console.log('═'.repeat(60));
    console.log('\n📊 OVERALL RESULTS');
    console.log('─'.repeat(60));
    console.log(`Website Health Score: ${result.website_health_score}/100 (Grade: ${result.health_grade})`);
    console.log(`Action Needed: ${result.action_recommendation}`);
    console.log(`Risk Level: ${result.dominant_risk_domains.join(', ') || 'None'}`);
    
    console.log('\n📈 MODULE SCORES');
    console.log('─'.repeat(60));
    console.log(`Performance: ${result.module_scores.performance}/100`);
    console.log(`UX: ${result.module_scores.ux}/100`);
    console.log(`SEO: ${result.module_scores.seo}/100`);
    console.log(`Content: ${result.module_scores.content}/100`);

    // Performance details
    console.log('\n⚡ PERFORMANCE DETAILS');
    console.log('─'.repeat(60));
    const perf = result.report.modules.performance;
    console.log(`Confidence: ${perf.confidence}`);
    console.log(`LCP: ${perf.metrics.lcp_s ? perf.metrics.lcp_s.toFixed(2) + 's' : 'N/A'}`);
    console.log(`CLS: ${perf.metrics.cls.toFixed(3)}`);
    console.log(`TTFB: ${perf.metrics.ttfb_s.toFixed(2)}s`);
    console.log(`Issues: ${perf.issues.length}`);
    console.log(`Fixes: ${perf.fixes.length}`);

    // UX details
    console.log('\n♿ UX & ACCESSIBILITY DETAILS');
    console.log('─'.repeat(60));
    const ux = result.report.modules.ux;
    console.log(`Risk Level: ${ux.accessibility_risk_level}`);
    console.log(`Violations: ${ux.violations_count}`);
    console.log(`  Critical: ${ux.violations_by_impact.critical}`);
    console.log(`  Serious: ${ux.violations_by_impact.serious}`);
    console.log(`  Moderate: ${ux.violations_by_impact.moderate}`);
    console.log(`CTAs Above Fold: ${ux.ctas_above_fold}`);
    console.log(`Issues: ${ux.issues.length}`);

    // SEO details
    console.log('\n🔍 SEO DETAILS');
    console.log('─'.repeat(60));
    const seo = result.report.modules.seo;
    console.log(`Indexability: ${seo.indexability_status}`);
    console.log(`Title Length: ${seo.title_length} chars`);
    console.log(`Meta Desc Length: ${seo.meta_description_length} chars`);
    console.log(`H1 Count: ${seo.h1_count}`);
    console.log(`Images Missing Alt: ${seo.images_missing_alt_count}`);
    console.log(`Issues: ${seo.issues.length}`);

    // Content details
    console.log('\n📝 CONTENT DETAILS');
    console.log('─'.repeat(60));
    const content = result.report.modules.content;
    console.log(`Depth Status: ${content.content_depth_status}`);
    console.log(`Intent Match: ${content.intent_match_level}`);
    console.log(`Word Count: ${content.word_count}`);
    console.log(`Flesch Reading Ease: ${content.flesch_reading_ease.toFixed(1)}`);
    console.log(`Flesch-Kincaid Grade: ${content.flesch_kincaid_grade.toFixed(1)}`);
    console.log(`Issues: ${content.issues.length}`);

    // Top fixes
    console.log('\n🔧 TOP PRIORITY FIXES');
    console.log('─'.repeat(60));
    const allFixes = [
      ...perf.fixes.map(f => ({ ...f, module: 'Performance' })),
      ...ux.fixes.map(f => ({ ...f, module: 'UX' })),
      ...seo.fixes.map(f => ({ ...f, module: 'SEO' })),
      ...content.fixes.map(f => ({ ...f, module: 'Content' }))
    ];
    
    allFixes.sort((a, b) => a.priority - b.priority || b.impact_pct - a.impact_pct);
    
    allFixes.slice(0, 5).forEach((fix, idx) => {
      console.log(`\n${idx + 1}. [${fix.module}] ${fix.title}`);
      console.log(`   Impact: ${fix.impact_pct}% | Effort: ${fix.effort_hours}h | Priority: ${fix.priority}`);
      console.log(`   ${fix.description}`);
    });

    console.log('\n═'.repeat(60));
    console.log(`\n⏱️  Total Duration: ${duration}ms`);
    console.log(`💾 Report ID: ${result.reportId}`);
    console.log(`🔗 Final URL: ${result.final_url}`);
    
    console.log('\n✨ Test completed successfully!\n');

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }

  } catch (error) {
    console.error('\n❌ Analysis failed:');
    console.error(error);
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    
    process.exit(1);
  }
}

// Run the test
testCompleteAnalysis();
