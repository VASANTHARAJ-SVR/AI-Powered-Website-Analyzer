/**
 * Content Analysis Utilities
 * Readability metrics, keyword extraction, and text analysis
 */

const natural = require('natural');
const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

/**
 * Calculate Flesch Reading Ease score
 * @param {string} text - Text to analyze
 * @returns {number} Flesch Reading Ease score (0-100, higher = easier)
 */
function calculateFleschReadingEase(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = tokenizer.tokenize(text) || [];
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

  if (sentences.length === 0 || words.length === 0) {
    return 0;
  }

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate Flesch-Kincaid Grade Level
 * @param {string} text - Text to analyze
 * @returns {number} Grade level (e.g., 8.5 = 8th-9th grade)
 */
function calculateFleschKincaidGrade(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = tokenizer.tokenize(text) || [];
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

  if (sentences.length === 0 || words.length === 0) {
    return 0;
  }

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  const grade = (0.39 * avgWordsPerSentence) + (11.8 * avgSyllablesPerWord) - 15.59;
  return Math.max(0, grade);
}

/**
 * Count syllables in a word (approximation)
 * @param {string} word - Word to analyze
 * @returns {number} Syllable count
 */
function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;

  const vowels = 'aeiouy';
  let count = 0;
  let previousWasVowel = false;

  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !previousWasVowel) {
      count++;
    }
    previousWasVowel = isVowel;
  }

  // Adjust for silent 'e'
  if (word.endsWith('e')) {
    count--;
  }

  return Math.max(1, count);
}

/**
 * Extract top keywords using TF-IDF
 * @param {string} text - Text to analyze
 * @param {number} topN - Number of top keywords to return
 * @returns {Object[]} Array of {word, score}
 */
function extractKeywords(text, topN = 10) {
  const tfidf = new TfIdf();
  tfidf.addDocument(text);

  const keywords = [];
  tfidf.listTerms(0).forEach(item => {
    if (item.term.length > 3) { // Filter out very short words
      keywords.push({
        word: item.term,
        score: item.tfidf
      });
    }
  });

  return keywords.slice(0, topN);
}

/**
 * Calculate text statistics
 * @param {string} text - Text to analyze
 * @returns {Object} Text statistics
 */
function calculateTextStats(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = tokenizer.tokenize(text) || [];
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

  const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / (sentences.length || 1);

  return {
    word_count: words.length,
    unique_word_count: uniqueWords.size,
    sentence_count: sentences.length,
    paragraph_count: paragraphs.length,
    char_count: text.length,
    avg_words_per_sentence: Math.round(avgWordsPerSentence * 10) / 10,
    avg_sentence_length: Math.round(avgSentenceLength * 10) / 10,
    lexical_diversity: words.length > 0 ? uniqueWords.size / words.length : 0
  };
}

/**
 * Estimate passive voice percentage (simple heuristic)
 * @param {string} text - Text to analyze
 * @returns {number} Estimated passive voice percentage (0-100)
 */
function estimatePassiveVoice(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Simple heuristic: look for "was/were/been/being" + past participle patterns
  const passivePatterns = [
    /\b(was|were|been|being)\s+\w+ed\b/gi,
    /\b(is|are|am)\s+being\s+\w+ed\b/gi
  ];

  let passiveCount = 0;
  sentences.forEach(sentence => {
    for (const pattern of passivePatterns) {
      if (pattern.test(sentence)) {
        passiveCount++;
        break;
      }
    }
  });

  return sentences.length > 0 ? (passiveCount / sentences.length) * 100 : 0;
}

/**
 * Analyze content quality
 * @param {string} text - Text to analyze
 * @returns {Object} Content quality metrics
 */
function analyzeContentQuality(text) {
  if (!text || text.trim().length === 0) {
    return {
      flesch_reading_ease: 0,
      flesch_kincaid_grade: 0,
      stats: calculateTextStats(''),
      keywords: [],
      passive_voice_pct: 0,
      quality_score: 0
    };
  }

  const fleschEase = calculateFleschReadingEase(text);
  const fleschGrade = calculateFleschKincaidGrade(text);
  const stats = calculateTextStats(text);
  const keywords = extractKeywords(text, 15);
  const passiveVoicePct = estimatePassiveVoice(text);

  // Calculate overall quality score (0-100)
  let qualityScore = 50; // Base score

  // Readability bonus (easier = better for web)
  if (fleschEase >= 60) qualityScore += 15;
  else if (fleschEase >= 50) qualityScore += 10;
  else if (fleschEase >= 40) qualityScore += 5;

  // Word count bonus
  if (stats.word_count >= 300) qualityScore += 15;
  else if (stats.word_count >= 150) qualityScore += 10;
  else if (stats.word_count >= 50) qualityScore += 5;
  else qualityScore -= 10; // Penalty for thin content

  // Sentence structure bonus
  if (stats.avg_words_per_sentence >= 15 && stats.avg_words_per_sentence <= 25) {
    qualityScore += 10;
  }

  // Passive voice penalty
  if (passiveVoicePct > 30) qualityScore -= 10;
  else if (passiveVoicePct > 20) qualityScore -= 5;

  // Lexical diversity bonus
  if (stats.lexical_diversity >= 0.6) qualityScore += 10;
  else if (stats.lexical_diversity >= 0.4) qualityScore += 5;

  qualityScore = Math.max(0, Math.min(100, qualityScore));

  return {
    flesch_reading_ease: Math.round(fleschEase * 10) / 10,
    flesch_kincaid_grade: Math.round(fleschGrade * 10) / 10,
    stats,
    keywords,
    passive_voice_pct: Math.round(passiveVoicePct * 10) / 10,
    quality_score: Math.round(qualityScore)
  };
}

module.exports = {
  calculateFleschReadingEase,
  calculateFleschKincaidGrade,
  extractKeywords,
  calculateTextStats,
  estimatePassiveVoice,
  analyzeContentQuality
};
