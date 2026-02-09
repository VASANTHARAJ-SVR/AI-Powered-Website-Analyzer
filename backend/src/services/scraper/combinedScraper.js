/**
 * Combined Playwright Scraper
 * Comprehensive data extraction for Performance, UX, SEO, and Content modules
 */

const { chromium } = require('playwright');
const path = require('path');

/**
 * Main scraper function - extracts all artifacts needed for analysis
 * @param {string} url - Target URL to scrape
 * @param {Object} opts - Options for scraping
 * @returns {Object} Complete artifact object with all extracted data
 */
async function combinedScrape(url, opts = {}) {
  const options = {
    emulateMobile: opts.emulateMobile || false,
    timeout: opts.timeout || 45000,
    saveArtifacts: opts.saveArtifacts || false,
    artifactPath: opts.artifactPath || null,
    ...opts
  };

  const browser = await chromium.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true
  });

  const viewport = options.emulateMobile 
    ? { width: 375, height: 812 } 
    : { width: 1200, height: 900 };

  const userAgent = options.emulateMobile
    ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  const context = await browser.newContext({ 
    viewport, 
    userAgent 
  });

  const page = await context.newPage();

  // ============================================
  // STEP 1: Inject Performance Observers
  // ============================================
  await page.addInitScript(() => {
    window.__perf = { 
      lcp: null, 
      cls: 0, 
      fcp: null,
      entries: [],
      layoutShifts: []
    };

    // LCP Observer
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            window.__perf.lcp = entry.startTime || entry.renderTime || entry.loadTime;
          }
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      console.warn('LCP observer failed:', e.message);
    }

    // CLS Observer
    try {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            window.__perf.cls += entry.value || 0;
            window.__perf.layoutShifts.push({
              value: entry.value,
              time: entry.startTime
            });
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.warn('CLS observer failed:', e.message);
    }

    // FCP Observer
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            window.__perf.fcp = entry.startTime;
          }
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
    } catch (e) {
      console.warn('FCP observer failed:', e.message);
    }

    // Long Task Observer (for INP/TBT approximation)
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            window.__perf.entries.push({
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime
            });
          }
        }
      });
      longTaskObserver.observe({ type: 'longtask', buffered: true });
    } catch (e) {
      console.warn('Long task observer failed:', e.message);
    }
  });

  // ============================================
  // STEP 2: Network Resource Tracking
  // ============================================
  const resources = [];
  const redirectChain = [];

  page.on('response', async (response) => {
    try {
      const url = response.url();
      const headers = response.headers();
      const status = response.status();
      const contentType = headers['content-type'] || '';

      // Track redirects
      if (status >= 300 && status < 400) {
        redirectChain.push({ from: url, to: headers['location'], status });
      }

      // Get resource size
      let size = parseInt(headers['content-length'] || '0');
      if (!size && status === 200) {
        try {
          const buffer = await response.body();
          size = buffer ? buffer.length : 0;
        } catch (e) {
          // Body not available (e.g., streaming, CORS)
          size = 0;
        }
      }

      resources.push({
        url,
        status,
        contentType,
        size,
        timing: response.timing()
      });
    } catch (e) {
      // Ignore errors for individual resources
    }
  });

  // ============================================
  // STEP 3: Navigate and Load Page
  // ============================================
  const startTime = Date.now();
  let navigationError = null;

  try {
    await page.goto(url, { 
      waitUntil: 'networkidle', 
      timeout: options.timeout 
    });
  } catch (error) {
    navigationError = error.message;
    console.warn('Navigation warning:', error.message);
  }

  const loadTimeMs = Date.now() - startTime;
  const finalUrl = page.url();
  const httpStatus = navigationError ? 0 : 200;

  // ============================================
  // STEP 4: Capture Screenshots
  // ============================================
  let screenshot_full = null;
  let screenshot_viewport = null;

  try {
    screenshot_full = (await page.screenshot({ fullPage: true })).toString('base64');
    screenshot_viewport = (await page.screenshot({ fullPage: false })).toString('base64');
  } catch (e) {
    console.warn('Screenshot capture failed:', e.message);
  }

  // ============================================
  // STEP 5: Get HTML Content
  // ============================================
  const html = await page.content();
  const title = await page.title();

  // ============================================
  // STEP 6: Extract Performance Metrics
  // ============================================
  const perfObj = await page.evaluate(() => {
    const perf = window.__perf || {};
    const nav = window.performance.getEntriesByType('navigation')[0] || {};
    const timing = window.performance.timing || {};

    return {
      lcp: perf.lcp,
      cls: perf.cls || 0,
      fcp: perf.fcp,
      longTasks: perf.entries || [],
      layoutShifts: perf.layoutShifts || [],
      navTiming: nav.toJSON ? nav.toJSON() : {},
      timing: {
        navigationStart: timing.navigationStart,
        requestStart: timing.requestStart,
        responseStart: timing.responseStart,
        responseEnd: timing.responseEnd,
        domContentLoadedEventEnd: timing.domContentLoadedEventEnd,
        loadEventEnd: timing.loadEventEnd
      },
      perfEntries: performance.getEntries().map(e => ({
        name: e.name,
        entryType: e.entryType,
        startTime: e.startTime,
        duration: e.duration
      }))
    };
  });

  // ============================================
  // STEP 7: DOM Analysis & SEO Data
  // ============================================
  const domSummary = await page.evaluate(() => {
    // Title and Meta
    const title = document.title || '';
    const metaDesc = (document.querySelector('meta[name="description"]') || {}).content || '';
    const metaKeywords = (document.querySelector('meta[name="keywords"]') || {}).content || '';
    const canonical = (document.querySelector('link[rel="canonical"]') || {}).href || null;
    const robotsMeta = (document.querySelector('meta[name="robots"]') || {}).content || null;
    const viewport = (document.querySelector('meta[name="viewport"]') || {}).content || null;

    // Headings
    const h1s = Array.from(document.querySelectorAll('h1')).map(e => e.innerText.trim()).slice(0, 10);
    const h2s = Array.from(document.querySelectorAll('h2')).map(e => e.innerText.trim()).slice(0, 20);
    const hCounts = {
      h1: document.querySelectorAll('h1').length,
      h2: document.querySelectorAll('h2').length,
      h3: document.querySelectorAll('h3').length,
      h4: document.querySelectorAll('h4').length,
      h5: document.querySelectorAll('h5').length,
      h6: document.querySelectorAll('h6').length
    };

    // Images
    const imgs = Array.from(document.querySelectorAll('img')).map(i => ({
      src: i.src,
      alt: i.alt || null,
      width: i.width,
      height: i.height,
      loading: i.loading || null
    }));
    const imgMissingAlt = imgs.filter(i => !i.alt || i.alt.trim() === '');

    // Links
    const links = Array.from(document.querySelectorAll('a')).map(a => ({
      href: a.href,
      text: a.innerText.trim().slice(0, 100),
      rel: a.rel || null,
      target: a.target || null
    }));

    const internalLinks = links.filter(l => l.href.startsWith(window.location.origin));
    const externalLinks = links.filter(l => !l.href.startsWith(window.location.origin) && l.href.startsWith('http'));

    // OpenGraph
    const og = {
      title: (document.querySelector('meta[property="og:title"]') || {}).content || null,
      description: (document.querySelector('meta[property="og:description"]') || {}).content || null,
      image: (document.querySelector('meta[property="og:image"]') || {}).content || null,
      url: (document.querySelector('meta[property="og:url"]') || {}).content || null,
      type: (document.querySelector('meta[property="og:type"]') || {}).content || null
    };

    // Twitter Card
    const twitter = {
      card: (document.querySelector('meta[name="twitter:card"]') || {}).content || null,
      title: (document.querySelector('meta[name="twitter:title"]') || {}).content || null,
      description: (document.querySelector('meta[name="twitter:description"]') || {}).content || null,
      image: (document.querySelector('meta[name="twitter:image"]') || {}).content || null
    };

    // Structured Data (JSON-LD)
    const structuredData = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map(s => {
        try {
          return JSON.parse(s.textContent);
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean)
      .slice(0, 10);

    // Visible Text (main content)
    const mainElement = document.querySelector('main') || 
                       document.querySelector('article') || 
                       document.querySelector('[role="main"]') ||
                       document.body;
    const visibleText = mainElement.innerText || '';

    // DOM Stats
    const domNodeCount = document.getElementsByTagName('*').length;

    return {
      title,
      metaDesc,
      metaKeywords,
      canonical,
      robotsMeta,
      viewport,
      h1s,
      h2s,
      hCounts,
      imgs: imgs.slice(0, 100),
      imgMissingAlt: imgMissingAlt.slice(0, 50),
      linksCount: links.length,
      internalLinksCount: internalLinks.length,
      externalLinksCount: externalLinks.length,
      links: links.slice(0, 200),
      og,
      twitter,
      structuredData,
      visibleText: visibleText.slice(0, 50000),
      domNodeCount
    };
  });

  // ============================================
  // STEP 8: CTA Detection & Positioning
  // ============================================
  const ctas = await page.$$eval('a, button, [role="button"], .btn, .cta, input[type="submit"]', els => {
    const viewportHeight = window.innerHeight;
    return els.map(el => {
      const rect = el.getBoundingClientRect();
      const text = el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || el.value || '';
      const computedStyle = window.getComputedStyle(el);
      
      return {
        text: text.trim().slice(0, 60),
        tagName: el.tagName.toLowerCase(),
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        area: rect.width * rect.height,
        aboveFold: (rect.top + rect.height) < (viewportHeight * 0.7),
        visible: rect.width > 0 && rect.height > 0,
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color
      };
    }).filter(cta => cta.visible && cta.area > 100).slice(0, 50);
  });

  // ============================================
  // STEP 9: Accessibility Scanning (Axe-core)
  // ============================================
  let axeResults = null;
  try {
    await page.addScriptTag({ 
      path: require.resolve('axe-core/axe.min.js') 
    });
    
    axeResults = await page.evaluate(async () => {
      return await axe.run(document, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
        }
      });
    });
  } catch (e) {
    console.warn('Axe-core scanning failed:', e.message);
    axeResults = { violations: [], passes: [], incomplete: [] };
  }

  // ============================================
  // STEP 10: Close Browser
  // ============================================
  await browser.close();

  // ============================================
  // STEP 11: Compute Resource Aggregates
  // ============================================
  const total_js_kb = resources
    .filter(r => /javascript|\.js/i.test(r.contentType + r.url))
    .reduce((sum, r) => sum + (r.size || 0), 0) / 1024;

  const total_css_kb = resources
    .filter(r => /css|\.css/i.test(r.contentType + r.url))
    .reduce((sum, r) => sum + (r.size || 0), 0) / 1024;

  const total_images_kb = resources
    .filter(r => /image|\.png|\.jpg|\.jpeg|\.webp|\.avif|\.gif|\.svg/i.test(r.contentType + r.url))
    .reduce((sum, r) => sum + (r.size || 0), 0) / 1024;

  const total_fonts_kb = resources
    .filter(r => /font|\.woff|\.woff2|\.ttf|\.otf/i.test(r.contentType + r.url))
    .reduce((sum, r) => sum + (r.size || 0), 0) / 1024;

  const renderBlockingResources = resources.filter(r => 
    (r.contentType.includes('css') || r.contentType.includes('javascript')) &&
    r.url.includes('http')
  );

  // ============================================
  // STEP 12: Compute Derived Metrics
  // ============================================
  const timing = perfObj.timing;
  const ttfb_ms = timing.responseStart - timing.requestStart;
  const domContentLoaded_ms = timing.domContentLoadedEventEnd - timing.navigationStart;
  const pageLoad_ms = timing.loadEventEnd - timing.navigationStart;

  // Total Blocking Time (TBT) approximation
  const tbt_ms = perfObj.longTasks.reduce((sum, task) => {
    return sum + Math.max(0, task.duration - 50);
  }, 0);

  // ============================================
  // STEP 13: Return Complete Artifact
  // ============================================
  return {
    // Metadata
    finalUrl,
    originalUrl: url,
    httpStatus,
    loadTimeMs,
    redirectChain,
    navigationError,
    userAgent,
    viewport,
    timestamp: new Date().toISOString(),

    // Content
    title,
    html,
    screenshot_full,
    screenshot_viewport,

    // Performance Metrics
    performance: {
      lcp_ms: perfObj.lcp,
      lcp_s: perfObj.lcp ? perfObj.lcp / 1000 : null,
      cls: perfObj.cls,
      fcp_ms: perfObj.fcp,
      fcp_s: perfObj.fcp ? perfObj.fcp / 1000 : null,
      ttfb_ms,
      ttfb_s: ttfb_ms / 1000,
      tbt_ms,
      domContentLoaded_ms,
      pageLoad_ms,
      longTasks: perfObj.longTasks,
      layoutShifts: perfObj.layoutShifts
    },

    // Resources
    resources: {
      all: resources,
      total_count: resources.length,
      total_js_kb: Math.round(total_js_kb * 100) / 100,
      total_css_kb: Math.round(total_css_kb * 100) / 100,
      total_images_kb: Math.round(total_images_kb * 100) / 100,
      total_fonts_kb: Math.round(total_fonts_kb * 100) / 100,
      render_blocking_count: renderBlockingResources.length,
      render_blocking_resources: renderBlockingResources.slice(0, 20)
    },

    // DOM & SEO
    seo: {
      title: domSummary.title,
      title_length: domSummary.title.length,
      meta_description: domSummary.metaDesc,
      meta_description_length: domSummary.metaDesc.length,
      meta_keywords: domSummary.metaKeywords,
      canonical: domSummary.canonical,
      robots_meta: domSummary.robotsMeta,
      viewport_meta: domSummary.viewport,
      h1s: domSummary.h1s,
      h2s: domSummary.h2s,
      heading_counts: domSummary.hCounts,
      images: domSummary.imgs,
      images_missing_alt: domSummary.imgMissingAlt,
      images_missing_alt_count: domSummary.imgMissingAlt.length,
      links: domSummary.links,
      links_count: domSummary.linksCount,
      internal_links_count: domSummary.internalLinksCount,
      external_links_count: domSummary.externalLinksCount,
      open_graph: domSummary.og,
      twitter_card: domSummary.twitter,
      structured_data: domSummary.structuredData
    },

    // UX & Accessibility
    ux: {
      axe_results: axeResults,
      violations_count: axeResults ? axeResults.violations.length : 0,
      violations: axeResults ? axeResults.violations : [],
      ctas,
      ctas_above_fold: ctas.filter(c => c.aboveFold).length,
      dom_node_count: domSummary.domNodeCount,
      viewport_meta_present: !!domSummary.viewport
    },

    // Content
    content: {
      visible_text: domSummary.visibleText,
      word_count: domSummary.visibleText.split(/\s+/).filter(w => w.length > 0).length,
      char_count: domSummary.visibleText.length
    }
  };
}

module.exports = { combinedScrape };
