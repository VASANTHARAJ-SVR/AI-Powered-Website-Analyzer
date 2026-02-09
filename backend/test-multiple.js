const { scrapeWebsite } = require('./src/services/scraper');

async function testMultipleWebsites() {
  console.log('🧪 Testing Playwright Scraper with Multiple Websites...\n');
  
  const testUrls = [
    'https://example.com',
    'https://github.com',
    'https://stackoverflow.com'
  ];
  
  for (const url of testUrls) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${url}`);
    console.log('='.repeat(60));
    
    const result = await scrapeWebsite(url);
    
    if (result.success) {
      console.log('✅ Scrape successful!');
      console.log(`  - Final URL: ${result.finalUrl}`);
      console.log(`  - Status: ${result.status}`);
      console.log(`  - Load Time: ${result.loadTime}ms`);
      console.log(`  - Title: ${result.metadata.title}`);
      console.log(`  - Description: ${result.metadata.description.substring(0, 80)}...`);
      console.log(`  - H1 Tags: ${result.metadata.h1Tags.length}`);
      console.log(`  - Images: ${result.metadata.images.length}`);
      console.log(`  - Links: ${result.metadata.links.length}`);
      console.log(`  - Screenshot: ${(result.screenshot.length / 1024).toFixed(2)} KB`);
      console.log(`  - HTML: ${(result.html.length / 1024).toFixed(2)} KB`);
    } else {
      console.log('❌ Scrape failed!');
      console.log(`  Error: ${result.error}`);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ All tests completed!');
}

testMultipleWebsites().catch(console.error);
