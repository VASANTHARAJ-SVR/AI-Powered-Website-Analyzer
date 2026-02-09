/**
 * NLP Service — Orchestrator
 * Runs all NLP tasks in parallel and returns combined results.
 * Handles caching, timeouts, and graceful fallbacks per task.
 */

const { analyzeSentiment } = require('./sentimentAnalyzer');
const { extractEntities } = require('./entityExtractor');
const { extractKeywords, extractPhrases } = require('./keywordExtractor');
const { summarize } = require('./summarizer');
const { classifyTopics } = require('./topicClassifier');
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();

// Simple in-memory cache (key = first 200 chars of text, TTL = 1 hour)
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function cacheKey(text) {
    return text.slice(0, 200).replace(/\s+/g, ' ').trim();
}

/**
 * Advanced readability metrics beyond Flesch
 * @param {string} text
 * @returns {Object}
 */
function computeAdvancedReadability(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = tokenizer.tokenize(text) || [];
    const totalWords = words.length || 1;
    const totalSentences = sentences.length || 1;

    // Average sentence length
    const avgSentenceLength = Math.round((totalWords / totalSentences) * 10) / 10;

    // Complex word ratio (words with 3+ syllables)
    let complexCount = 0;
    for (const w of words) {
        if (countSyllables(w) >= 3) complexCount++;
    }
    const complexWordRatio = Math.round((complexCount / totalWords) * 100) / 100;

    // Passive voice ratio (simple heuristic)
    let passiveCount = 0;
    const passivePatterns = [
        /\b(was|were|been|being)\s+\w+ed\b/gi,
        /\b(is|are|am)\s+being\s+\w+ed\b/gi,
        /\b(was|were|has been|have been|had been)\s+\w+(en|ed)\b/gi,
    ];
    for (const s of sentences) {
        for (const pat of passivePatterns) {
            pat.lastIndex = 0;
            if (pat.test(s)) {
                passiveCount++;
                break;
            }
        }
    }
    const passiveVoiceRatio = Math.round((passiveCount / totalSentences) * 100) / 100;

    // Jargon density — words > 10 chars as proxy for jargon/technical terms
    let jargonCount = 0;
    for (const w of words) {
        if (w.length > 10) jargonCount++;
    }
    const jargonDensity = Math.round((jargonCount / totalWords) * 100) / 100;

    // Question count
    const questionCount = (text.match(/\?/g) || []).length;

    // Paragraph count
    const paragraphCount = text.split(/\n\n+/).filter(p => p.trim().length > 0).length || 1;

    return {
        avg_sentence_length: avgSentenceLength,
        complex_word_ratio: complexWordRatio,
        passive_voice_ratio: passiveVoiceRatio,
        jargon_density: jargonDensity,
        question_count: questionCount,
        paragraph_count: paragraphCount,
    };
}

function countSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;
    const vowels = 'aeiouy';
    let count = 0;
    let prev = false;
    for (let i = 0; i < word.length; i++) {
        const isV = vowels.includes(word[i]);
        if (isV && !prev) count++;
        prev = isV;
    }
    if (word.endsWith('e')) count--;
    return Math.max(1, count);
}

/**
 * Run complete NLP analysis pipeline
 * @param {string} text - Visible text content from the page
 * @returns {Promise<Object>} Complete NLP analysis result
 */
async function runNLPAnalysis(text) {
    if (!text || text.trim().length < 20) {
        return getEmptyResult();
    }

    // Check cache
    const key = cacheKey(text);
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
        console.log('[NLPService] Cache hit');
        return cached.data;
    }

    console.log('[NLPService] Running full NLP pipeline in parallel...');
    const start = Date.now();

    // Run all NLP tasks in parallel with individual error isolation
    const [sentiment, entities, summary, topics] = await Promise.all([
        analyzeSentiment(text).catch(e => {
            console.warn('[NLPService] Sentiment failed:', e.message);
            return { label: 'NEUTRAL', score: 0.5, confidence: 50 };
        }),
        extractEntities(text).catch(e => {
            console.warn('[NLPService] NER failed:', e.message);
            return [];
        }),
        summarize(text).catch(e => {
            console.warn('[NLPService] Summarization failed:', e.message);
            return text.split(/[.!?]+/).slice(0, 2).join('. ') + '.';
        }),
        classifyTopics(text).catch(e => {
            console.warn('[NLPService] Topic classification failed:', e.message);
            return [];
        }),
    ]);

    // These are fast local operations — run synchronously
    const keywords = extractKeywords(text, 15);
    const phrases = extractPhrases(text, 10);
    const advancedReadability = computeAdvancedReadability(text);

    const elapsed = Date.now() - start;
    console.log(`[NLPService] NLP pipeline completed in ${elapsed}ms`);

    const result = {
        sentiment,
        entities,
        keywords,
        phrases,
        summary,
        topics,
        advanced_readability: advancedReadability,
    };

    // Store in cache
    cache.set(key, { data: result, ts: Date.now() });

    // Prune old cache entries (keep max 50)
    if (cache.size > 50) {
        const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts);
        for (let i = 0; i < oldest.length - 50; i++) {
            cache.delete(oldest[i][0]);
        }
    }

    return result;
}

function getEmptyResult() {
    return {
        sentiment: { label: 'NEUTRAL', score: 0.5, confidence: 50 },
        entities: [],
        keywords: [],
        phrases: [],
        summary: '',
        topics: [],
        advanced_readability: {
            avg_sentence_length: 0,
            complex_word_ratio: 0,
            passive_voice_ratio: 0,
            jargon_density: 0,
            question_count: 0,
            paragraph_count: 0,
        },
    };
}

module.exports = { runNLPAnalysis };
