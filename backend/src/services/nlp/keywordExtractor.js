/**
 * Keyword Extractor (Enhanced)
 * Uses Natural.js TF-IDF with additional relevance scoring
 */

const natural = require('natural');
const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

// Common stop-words to filter out
const STOP_WORDS = new Set([
    'the', 'and', 'for', 'that', 'this', 'with', 'are', 'was', 'were', 'been',
    'have', 'has', 'had', 'not', 'but', 'all', 'can', 'her', 'his', 'him',
    'how', 'its', 'may', 'our', 'out', 'own', 'say', 'she', 'too', 'use',
    'will', 'you', 'your', 'about', 'also', 'been', 'come', 'could', 'each',
    'find', 'from', 'get', 'give', 'going', 'here', 'into', 'just', 'know',
    'like', 'look', 'make', 'many', 'more', 'most', 'much', 'need', 'new',
    'only', 'other', 'over', 'some', 'such', 'take', 'than', 'them', 'then',
    'there', 'these', 'they', 'time', 'very', 'want', 'well', 'what', 'when',
    'which', 'who', 'why', 'would', 'page', 'click', 'http', 'https', 'www',
    'com', 'html', 'div', 'span', 'class', 'style', 'script', 'link',
]);

/**
 * Extract keywords with enhanced scoring
 * @param {string} text - Text to analyze
 * @param {number} topN - Number of keywords to return
 * @returns {Object[]} Array of { word, score, relevance, frequency }
 */
function extractKeywords(text, topN = 15) {
    if (!text || text.trim().length < 20) {
        return [];
    }

    const tfidf = new TfIdf();
    tfidf.addDocument(text.toLowerCase());

    const words = tokenizer.tokenize(text.toLowerCase()) || [];
    const totalWords = words.length || 1;

    // Frequency map
    const freq = {};
    for (const w of words) {
        if (w.length > 2 && !STOP_WORDS.has(w)) {
            freq[w] = (freq[w] || 0) + 1;
        }
    }

    const keywords = [];

    tfidf.listTerms(0).forEach((item) => {
        const term = item.term;
        if (term.length > 3 && !STOP_WORDS.has(term) && !/^\d+$/.test(term)) {
            const frequency = freq[term] || 1;
            const tfIdfScore = item.tfidf;

            // Relevance = combination of TF-IDF and raw frequency
            const relevance = Math.round(
                (tfIdfScore * 0.7 + (frequency / totalWords) * 100 * 0.3) * 100
            ) / 100;

            keywords.push({
                word: term,
                score: Math.round(tfIdfScore * 100) / 100,
                relevance,
                frequency,
            });
        }
    });

    // Sort by relevance
    keywords.sort((a, b) => b.relevance - a.relevance);

    return keywords.slice(0, topN);
}

/**
 * Extract bi-grams (2-word phrases)
 * @param {string} text - Text to analyze
 * @param {number} topN - Number of phrases
 * @returns {Object[]} Array of { phrase, frequency }
 */
function extractPhrases(text, topN = 10) {
    const words = tokenizer.tokenize(text.toLowerCase()) || [];
    const phrases = {};

    for (let i = 0; i < words.length - 1; i++) {
        const w1 = words[i];
        const w2 = words[i + 1];
        if (
            w1.length > 2 && w2.length > 2 &&
            !STOP_WORDS.has(w1) && !STOP_WORDS.has(w2) &&
            !/^\d+$/.test(w1) && !/^\d+$/.test(w2)
        ) {
            const phrase = `${w1} ${w2}`;
            phrases[phrase] = (phrases[phrase] || 0) + 1;
        }
    }

    return Object.entries(phrases)
        .filter(([, count]) => count >= 2) // At least 2 occurrences
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(([phrase, frequency]) => ({ phrase, frequency }));
}

module.exports = { extractKeywords, extractPhrases };
