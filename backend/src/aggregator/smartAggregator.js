const { aggregate } = require('./aggregator');
const insightGenerator = require('../services/ai/insightGenerator');

/**
 * Smart Aggregator
 * Combines traditional heuristic scoring with AI-powered insights
 * @param {Object} modules - Module results {performance, ux, seo, content}
 * @returns {Promise<Object>} Final smart report
 */
async function smartAggregate(modules) {
  // 1. Run traditional aggregation
  const baseResult = aggregate(modules);

  // 2. Generate AI Insights
  let aiInsights = {
    executiveSummary: "AI analysis pending...",
    topPriorities: [],
    quickWins: [],
    longTermGoals: []
  };

  try {
    if (process.env.GROQ_API_KEY || process.env.HF_API_KEY) {
      aiInsights = await insightGenerator.generateInsights(baseResult, modules);
    } else {
      console.log('[SmartAggregator] No AI API key found (GROQ_API_KEY or HF_API_KEY), skipping AI insights');
      aiInsights.executiveSummary = "AI insights disabled. Add GROQ_API_KEY or HF_API_KEY to enable.";
    }
  } catch (error) {
    console.error('[SmartAggregator] AI insight generation failed:', error);
  }

  // 3. Structure Final Output
  return {
    aggregator: baseResult,
    aiInsights: aiInsights,
    modules: modules
  };
}

module.exports = {
  smartAggregate
};
