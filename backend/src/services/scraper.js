const { chromium } = require('playwright');

/**
 * Scrapes a website using Playwright
 * @param {string} url - The URL to scrape
 * @param {object} options - Scraping options
 * @returns {Promise<object>} Scraped data
 */
async function scrapeWebsite(url, options = {}) {
  const {
    timeout = 30000,
    waitUntil = 'load',
    viewport = { width: 1920, height: 1080 },
    userAgent = 'WebAudit-Bot/1.0'
  } = options;

  let browser;
  const startTime = Date.now();

  try {
    console.log(`🔍 Starting scrape for: ${url}`);
    
    // Launch browser
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      viewport,
      userAgent
    });
    
    const page = await context.newPage();
    
    // Navigate to URL
    const response = await page.goto(url, { 
      waitUntil, 
      timeout 
    });
    
    if (!response) {
      throw new Error('Failed to load page');
    }
    
    const status = response.status();
    const finalUrl = page.url();
    
    // Wait a bit for dynamic content
    await page.waitForTimeout(2000);
    
    // Extract HTML
    const html = await page.content();
    
    // Capture screenshot
    const screenshot = await page.screenshot({ 
      fullPage: true,
      type: 'png'
    });
    const screenshotBase64 = screenshot.toString('base64');
    
    // Extract metadata
    const metadata = await page.evaluate(() => {
      // Title
      const title = document.title || '';
      
      // Meta description
      const metaDesc = document.querySelector('meta[name="description"]');
      const description = metaDesc ? metaDesc.getAttribute('content') : '';
      
      // H1 tags
      const h1Elements = Array.from(document.querySelectorAll('h1'));
      const h1Tags = h1Elements.map(h1 => h1.textContent.trim());
      
      // Images
      const imgElements = Array.from(document.querySelectorAll('img'));
      const images = imgElements.map(img => ({
        src: img.src,
        alt: img.alt || ''
      })).slice(0, 50); // Limit to 50 images
      
      // Links
      const linkElements = Array.from(document.querySelectorAll('a[href]'));
      const links = linkElements
        .map(a => a.href)
        .filter(href => href.startsWith('http'))
        .slice(0, 100); // Limit to 100 links
      
      return {
        title,
        description,
        h1Tags,
        images,
        links,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
    });
    
    const loadTime = Date.now() - startTime;
    metadata.loadTime = loadTime;
    
    await browser.close();
    
    console.log(`✅ Scrape completed in ${loadTime}ms`);
    
    return {
      success: true,
      url,
      finalUrl,
      status,
      html,
      screenshot: screenshotBase64,
      metadata,
      loadTime
    };
    
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    
    console.error(`❌ Scrape failed: ${error.message}`);
    
    return {
      success: false,
      url,
      error: error.message,
      errorType: error.name
    };
  }
}

module.exports = { scrapeWebsite };
