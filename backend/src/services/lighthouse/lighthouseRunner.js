/**
 * Lighthouse Runner
 * Runs Google Lighthouse audits using Playwright's Chromium
 * Triggered when SLM confidence is low or performance score < 40
 */

const { chromium } = require('playwright');

/**
 * Run Lighthouse audit on a URL
 * @param {string} url - Target URL
 * @param {Object} opts - Options
 * @returns {Promise<Object>} Lighthouse results: { score, metrics, opportunities }
 */
async function runLighthouse(url, opts = {}) {
    const {
        emulateMobile = false,
        timeout = 60000,
    } = opts;

    let browser = null;

    try {
        // Launch Chromium with remote-debugging for Lighthouse
        browser = await chromium.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--remote-debugging-port=0', // random port
            ],
            headless: true,
        });

        // Get the WS endpoint for Lighthouse connection
        const wsEndpoint = browser.wsEndpoint();
        // Extract port from ws://127.0.0.1:<port>/...
        const portMatch = wsEndpoint.match(/:(\d+)\//);
        const port = portMatch ? parseInt(portMatch[1]) : 9222;

        // Dynamic import for lighthouse (ESM module)
        const lighthouse = (await import('lighthouse')).default;

        const config = emulateMobile
            ? undefined // default Lighthouse config is mobile
            : {
                extends: 'lighthouse:default',
                settings: {
                    formFactor: 'desktop',
                    screenEmulation: {
                        mobile: false,
                        width: 1350,
                        height: 940,
                        deviceScaleFactor: 1,
                        disabled: false,
                    },
                    throttling: {
                        rttMs: 40,
                        throughputKbps: 10240,
                        cpuSlowdownMultiplier: 1,
                        requestLatencyMs: 0,
                        downloadThroughputKbps: 0,
                        uploadThroughputKbps: 0,
                    },
                    emulatedUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
            };

        const runnerResult = await lighthouse(
            url,
            {
                port,
                output: 'json',
                logLevel: 'error',
                onlyCategories: ['performance'],
            },
            config
        );

        if (!runnerResult || !runnerResult.lhr) {
            throw new Error('Lighthouse returned no results');
        }

        const lhr = runnerResult.lhr;
        const perfCategory = lhr.categories?.performance;

        // Extract Core Web Vitals from audits
        const audits = lhr.audits || {};

        const metrics = {
            fcp: audits['first-contentful-paint']?.numericValue
                ? audits['first-contentful-paint'].numericValue / 1000
                : null,
            lcp: audits['largest-contentful-paint']?.numericValue
                ? audits['largest-contentful-paint'].numericValue / 1000
                : null,
            cls: audits['cumulative-layout-shift']?.numericValue ?? null,
            tbt: audits['total-blocking-time']?.numericValue ?? null, // in ms
            si: audits['speed-index']?.numericValue
                ? audits['speed-index'].numericValue / 1000
                : null,
            tti: audits['interactive']?.numericValue
                ? audits['interactive'].numericValue / 1000
                : null,
        };

        // Extract top opportunities (actionable suggestions)
        const opportunities = [];
        const opportunityAudits = [
            'render-blocking-resources',
            'unused-javascript',
            'unused-css-rules',
            'unminified-javascript',
            'unminified-css',
            'uses-optimized-images',
            'uses-webp-images',
            'uses-text-compression',
            'uses-responsive-images',
            'efficient-animated-content',
            'offscreen-images',
            'uses-long-cache-ttl',
            'server-response-time',
            'redirects',
            'uses-rel-preconnect',
            'uses-rel-preload',
            'font-display',
            'dom-size',
        ];

        for (const auditId of opportunityAudits) {
            const audit = audits[auditId];
            if (audit && audit.score !== null && audit.score < 1) {
                opportunities.push({
                    id: auditId,
                    title: audit.title,
                    description: audit.description?.replace(/<[^>]+>/g, '').slice(0, 200),
                    score: audit.score,
                    savings_ms: audit.numericValue || null,
                    displayValue: audit.displayValue || null,
                });
            }
        }

        // Sort opportunities by potential savings
        opportunities.sort((a, b) => (b.savings_ms || 0) - (a.savings_ms || 0));

        const score = Math.round((perfCategory?.score ?? 0) * 100);

        console.log(`[Lighthouse] Audit complete for ${url}: score=${score}, ` +
            `fcp=${metrics.fcp?.toFixed(2)}s, lcp=${metrics.lcp?.toFixed(2)}s, cls=${metrics.cls?.toFixed(3)}`);

        return {
            score,
            metrics,
            opportunities: opportunities.slice(0, 10), // top 10
            raw_categories: {
                performance: perfCategory?.score ?? null,
            },
        };
    } catch (error) {
        console.error('[Lighthouse] Audit failed:', error.message);

        // Return null so caller can fall back to SLM-only
        return null;
    } finally {
        if (browser) {
            try {
                await browser.close();
            } catch (_) { }
        }
    }
}

module.exports = { runLighthouse };
