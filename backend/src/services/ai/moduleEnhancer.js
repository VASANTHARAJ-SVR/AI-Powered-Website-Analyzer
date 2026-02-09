/**
 * AI Module Enhancer
 * Takes rule-based module results and enhances issues/fixes with real AI analysis via Groq.
 * Runs 4 parallel API calls — one per module — for speed (~2-3s total on Groq).
 */

const llmService = require('./llmService');

const SYSTEM_PROMPT =
    'You are an elite web auditor. You receive real scraped metrics from a website and must return ONLY valid JSON — no markdown, no explanation, no code fences. Be specific and technical.';

// ─── Per-module prompt builders ───

function perfPrompt(m) {
    return `Analyze these REAL performance metrics scraped from a live website and return specific, actionable issues and fixes.

METRICS:
- LCP: ${m.metrics?.lcp_s ?? 'N/A'} s
- CLS: ${m.metrics?.cls ?? 'N/A'}
- FCP: ${m.metrics?.fcp_s ?? 'N/A'} s
- TTFB: ${m.metrics?.ttfb_s ?? 'N/A'} s
- TBT: ${m.metrics?.tbt_ms ?? 'N/A'} ms
- JS size: ${m.metrics?.total_js_kb ?? 'N/A'} KB
- CSS size: ${m.metrics?.total_css_kb ?? 'N/A'} KB
- Images: ${m.metrics?.total_images_kb ?? 'N/A'} KB
- Requests: ${m.metrics?.total_requests ?? 'N/A'}
- Render-blocking: ${m.metrics?.render_blocking_count ?? 'N/A'}
- Score: ${m.score}/100

Return JSON:
{
  "issues": [
    {"severity":"critical|high|medium|low","category":"Performance","description":"Specific issue referencing actual metric values"}
  ],
  "fixes": [
    {"title":"Specific fix title","description":"Detailed technical fix referencing the real numbers","priority":1,"impact_pct":25}
  ]
}
Return 3-6 issues and 3-5 fixes. Reference actual metric values.`;
}

function seoPrompt(m) {
    return `Analyze these REAL SEO metrics scraped from a live website and return specific issues and fixes.

METRICS:
- Title length: ${m.title_length ?? 'N/A'} chars
- Meta desc length: ${m.meta_description_length ?? 'N/A'} chars
- H1 count: ${m.h1_count ?? 'N/A'}
- Images missing alt: ${m.images_missing_alt_count ?? 'N/A'}
- Internal links: ${m.internal_links_count ?? 'N/A'}
- External links: ${m.external_links_count ?? 'N/A'}
- Indexability: ${m.indexability_status ?? 'N/A'}
- Crawl health: ${m.crawl_health_indicator ?? 'N/A'}
- SEO risks: ${JSON.stringify(m.primary_seo_risks ?? [])}
- Score: ${m.score}/100

Return JSON:
{
  "issues": [
    {"severity":"critical|high|medium|low","category":"SEO","description":"Specific SEO issue referencing actual values"}
  ],
  "fixes": [
    {"title":"Specific fix title","description":"Detailed SEO fix with exact recommendations","priority":1,"impact_pct":20}
  ]
}
Return 3-6 issues and 3-5 fixes. Reference actual metric values.`;
}

function uxPrompt(m) {
    return `Analyze these REAL UX & accessibility metrics scraped from a live website and return specific issues and fixes.

METRICS:
- Viewport meta: ${m.viewport_meta_present ?? 'N/A'}
- CTAs above fold: ${m.ctas_above_fold ?? 'N/A'}
- Total CTAs: ${m.ctas_count ?? 'N/A'}
- A11y risk level: ${m.accessibility_risk_level ?? 'N/A'}
- Total violations: ${m.violations_count ?? 'N/A'}
- Critical violations: ${m.violations_by_impact?.critical ?? 'N/A'}
- Serious violations: ${m.violations_by_impact?.serious ?? 'N/A'}
- Friction sources: ${JSON.stringify(m.primary_friction_sources ?? [])}
- Trust impact: ${m.trust_impact_indicator ?? 'N/A'}
- Score: ${m.score}/100

Return JSON:
{
  "issues": [
    {"severity":"critical|high|medium|low","category":"UX","description":"Specific UX/a11y issue referencing actual values"}
  ],
  "fixes": [
    {"title":"Specific fix title","description":"Detailed UX/a11y fix with exact guidance","priority":1,"impact_pct":20}
  ]
}
Return 3-6 issues and 3-5 fixes. Reference actual metric values.`;
}

function contentPrompt(m) {
    return `Analyze these REAL content quality metrics scraped from a live website and return specific issues and fixes.

METRICS:
- Word count: ${m.word_count ?? 'N/A'}
- Flesch reading ease: ${m.flesch_reading_ease ?? 'N/A'}
- Flesch-Kincaid grade: ${m.flesch_kincaid_grade ?? 'N/A'}
- Content depth: ${m.content_depth_status ?? 'N/A'}
- Intent match: ${m.intent_match_level ?? 'N/A'}
- Keywords found: ${m.keywords?.length ?? 0}
- Top keywords: ${(m.keywords || []).slice(0, 5).map(k => typeof k === 'string' ? k : k.word || k.term || k).join(', ') || 'None'}
- Content gaps: ${JSON.stringify(m.primary_content_gaps ?? [])}
- Score: ${m.score}/100

Return JSON:
{
  "issues": [
    {"severity":"critical|high|medium|low","category":"Content","description":"Specific content issue referencing actual values"}
  ],
  "fixes": [
    {"title":"Specific fix title","description":"Detailed content fix with exact recommendations","priority":1,"impact_pct":15}
  ]
}
Return 3-6 issues and 3-5 fixes. Reference actual metric values.`;
}

// ─── Parse helper ───

function safeParse(text, moduleName) {
    try {
        const clean = (text || '').replace(/```json/g, '').replace(/```/g, '').trim();
        const match = clean.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('No JSON object found');
        const data = JSON.parse(match[0]);
        return {
            issues: Array.isArray(data.issues) ? data.issues : [],
            fixes: Array.isArray(data.fixes) ? data.fixes : []
        };
    } catch (err) {
        console.warn(`[ModuleEnhancer] Failed to parse ${moduleName} AI response:`, err.message);
        return { issues: [], fixes: [] };
    }
}

// ─── Main enhancer ───

/**
 * Enhance all 4 modules with AI-generated issues/fixes in parallel.
 * Merges AI results into existing rule-based results (AI items tagged with ai:true).
 * @param {Object} modules - { performance, ux, seo, content }
 * @returns {Promise<Object>} Same structure with enhanced issues/fixes
 */
async function enhanceModulesWithAI(modules) {
    const { performance, ux, seo, content } = modules;

    if (!process.env.GROQ_API_KEY && !process.env.HF_API_KEY) {
        console.log('[ModuleEnhancer] No AI key found, skipping enhancement');
        return modules;
    }

    console.log('[ModuleEnhancer] Running AI enhancement for all 4 modules in parallel...');
    const start = Date.now();

    // 4 parallel Groq calls
    const [perfAI, seoAI, uxAI, contentAI] = await Promise.all([
        llmService.generateCompletion(perfPrompt(performance), SYSTEM_PROMPT)
            .then(t => safeParse(t, 'performance'))
            .catch(e => { console.error('[ModuleEnhancer] Perf AI failed:', e.message); return { issues: [], fixes: [] }; }),

        llmService.generateCompletion(seoPrompt(seo), SYSTEM_PROMPT)
            .then(t => safeParse(t, 'seo'))
            .catch(e => { console.error('[ModuleEnhancer] SEO AI failed:', e.message); return { issues: [], fixes: [] }; }),

        llmService.generateCompletion(uxPrompt(ux), SYSTEM_PROMPT)
            .then(t => safeParse(t, 'ux'))
            .catch(e => { console.error('[ModuleEnhancer] UX AI failed:', e.message); return { issues: [], fixes: [] }; }),

        llmService.generateCompletion(contentPrompt(content), SYSTEM_PROMPT)
            .then(t => safeParse(t, 'content'))
            .catch(e => { console.error('[ModuleEnhancer] Content AI failed:', e.message); return { issues: [], fixes: [] }; }),
    ]);

    const elapsed = Date.now() - start;
    console.log(`[ModuleEnhancer] AI enhancement completed in ${elapsed}ms`);

    // Tag AI items and merge into existing results
    const tag = (arr) => arr.map(item => ({ ...item, ai: true }));

    return {
        performance: {
            ...performance,
            issues: [...(performance.issues || []), ...tag(perfAI.issues)],
            fixes: [...(performance.fixes || []), ...tag(perfAI.fixes)]
        },
        seo: {
            ...seo,
            issues: [...(seo.issues || []), ...tag(seoAI.issues)],
            fixes: [...(seo.fixes || []), ...tag(seoAI.fixes)]
        },
        ux: {
            ...ux,
            issues: [...(ux.issues || []), ...tag(uxAI.issues)],
            fixes: [...(ux.fixes || []), ...tag(uxAI.fixes)]
        },
        content: {
            ...content,
            issues: [...(content.issues || []), ...tag(contentAI.issues)],
            fixes: [...(content.fixes || []), ...tag(contentAI.fixes)]
        }
    };
}

module.exports = { enhanceModulesWithAI };
