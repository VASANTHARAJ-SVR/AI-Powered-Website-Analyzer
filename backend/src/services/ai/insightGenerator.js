const llmService = require('./llmService');

class InsightGenerator {
  
  /**
   * Generate comprehensive AI insights from report data
   * @param {Object} reportData - Aggregated report data
   * @returns {Promise<Object>} Structured insights
   */
  /**
   * Generate comprehensive AI insights from report data
   * @param {Object} reportData - Aggregated report data
   * @param {Object} modules - Detailed module data
   * @returns {Promise<Object>} Structured insights
   */
  async generateInsights(reportData, modules) {
    console.log('[InsightGenerator] Generating insights...');
    try {
      if (!modules) console.warn('[InsightGenerator] Modules data is missing or undefined.');
      
      // Extract key metrics for context
      const metrics = {
        lcp: modules?.performance?.metrics?.lcp_s,
        cls: modules?.performance?.metrics?.cls,
        tbt: modules?.performance?.metrics?.tbt_ms,
        seoTitle: modules?.seo?.title_length,
        seoDesc: modules?.seo?.meta_description_length,
        h1Count: modules?.seo?.h1_count,
        uxIssues: modules?.ux?.axes_violations?.length,
        contentScore: modules?.content?.readability_score
      };

      const failingMetrics = [];
      if (metrics.lcp > 2.5) failingMetrics.push(`LCP is slow (${metrics.lcp}s)`);
      if (metrics.cls > 0.1) failingMetrics.push(`Layout is unstable (CLS: ${metrics.cls})`);
      if (metrics.tbt > 200) failingMetrics.push(`High interactivity delay (TBT: ${metrics.tbt}ms)`);
      if (metrics.h1Count !== 1) failingMetrics.push(`Headline structure issue (H1 count: ${metrics.h1Count})`);

      // Construct a focused prompt for JSON output
      const prompt = `
        As a Chief Digital Officer & Technical Architect, analyze this web audit report.
        
        WEBSITE HEALTH SCORE: ${reportData.website_health_score} / 100
        
        MODULE BREAKDOWN:
        - Performance: ${reportData.module_scores?.performance} (LCP: ${metrics.lcp}s, CLS: ${metrics.cls}, TBT: ${metrics.tbt}ms)
        - SEO: ${reportData.module_scores?.seo} (Title Len: ${metrics.seoTitle}, Desc Len: ${metrics.seoDesc}, H1: ${metrics.h1Count})
        - UX/Accessibility: ${reportData.module_scores?.ux} (${metrics.uxIssues} violations detected)
        - Content Quality: ${reportData.module_scores?.content} (Readability: ${metrics.contentScore})

        CRITICAL ISSUES IDENTIFIED:
        ${failingMetrics.join('\n- ')}
        - Risk Domains: ${JSON.stringify(reportData.dominant_risk_domains || [])}

        Provide a STRATEGIC and TECHNICAL roadmap. Recommendations must be specific to the metrics above.
        
        Return ONLY a JSON object with this exact structure (no markdown):
        {
          "executiveSummary": "2-3 sentences summary. Mention the single biggest bottleneck and the potential business impact of fixing it.",
          "topPriorities": [
            {
              "title": "Actionable Title (e.g., 'Optimize Hero Image for LCP')", 
              "impact": "High/Critical", 
              "description": "Specific technical advice based on the metrics provided.", 
              "estimatedROI": "High/Medium"
            }
          ],
          "quickWins": [
            "Specific, easy-to-implement fix 1",
            "Specific, easy-to-implement fix 2"
          ],
          "longTermGoals": [
            "Strategic goal 1 (e.g., 'Implement Server-Side Rendering')",
            "Strategic goal 2"
          ]
        }
      `;

      const systemPrompt = "You are an elite web performance consultant. You analyze raw metrics and provide specific, high-impact technical and strategic advice. Output strict JSON only.";
      
      const responseText = await llmService.generateCompletion(prompt, systemPrompt);
      
      // Attempt to parse JSON
      let data;
      try {
        // Clean potential markdown code blocks
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        data = JSON.parse(jsonStr);
      } catch (parseError) {
        console.warn('[InsightGenerator] Failed to parse LLM JSON response:', parseError);
        // Fallback structure
        data = {
          executiveSummary: "Analysis completed. Please review specific module scores for details.",
          topPriorities: [],
          quickWins: ["Review Performance metrics", "Check SEO tags"],
          longTermGoals: ["Continuous Monitoring"]
        };
      }

      // Validate structure
      if (!data || typeof data !== 'object') throw new Error('Invalid JSON structure');
      
      data.executiveSummary = data.executiveSummary || "Analysis completed.";
      data.topPriorities = Array.isArray(data.topPriorities) ? data.topPriorities : [];
      data.quickWins = Array.isArray(data.quickWins) ? data.quickWins : [];
      data.longTermGoals = Array.isArray(data.longTermGoals) ? data.longTermGoals : [];

      return data;

    } catch (error) {
      console.error('[InsightGenerator] Error generating insights:', error);
      return {
        executiveSummary: "Analysis unavailable due to service error.",
        topPriorities: [],
        quickWins: [],
        longTermGoals: []
      };
    }
  }
}

module.exports = new InsightGenerator();
