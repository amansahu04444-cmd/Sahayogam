import { GoogleGenerativeAI } from '@google/generative-ai';
import { TaskCategory } from '../models/Task.js';

/**
 * AI Service for Task Classification — Powered by Gemini
 *
 * Architecture:
 *   1. Primary:  Gemini API (gemini-pro) with structured prompts
 *   2. Fallback: Keyword-based classification (always available, zero-cost)
 *
 * All public functions are safe to call even if GEMINI_API_KEY is missing —
 * they silently degrade to keyword classification.
 */

// ─────────────────────────────────────────────────────────────
// 1. GEMINI CLIENT INITIALIZATION
// ─────────────────────────────────────────────────────────────

let genAI = null;
let geminiModel = null;

/**
 * Lazily initialize the Gemini client.
 * Returns null if the API key is not configured.
 */
const getGeminiModel = () => {
  if (geminiModel) return geminiModel;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[AI] GEMINI_API_KEY not set — falling back to keyword classification');
    return null;
  }

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
    console.log('[AI] Gemini Pro model initialized successfully');
    return geminiModel;
  } catch (error) {
    console.error('[AI] Failed to initialize Gemini:', error.message);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────
// 2. KEYWORD-BASED FALLBACK (Always Available)
// ─────────────────────────────────────────────────────────────

const CATEGORY_KEYWORDS = {
  [TaskCategory.FIRST_AID]: ['first-aid', 'wound', 'injury', 'bleeding', 'cpr', 'bandage', 'dressing'],
  [TaskCategory.MEDICAL_HELP]: ['medical', 'doctor', 'nurse', 'hospital', 'health', 'medicine', 'clinic', 'surgery', 'patient'],
  [TaskCategory.FOOD_DISTRIBUTION]: ['food', 'hunger', 'meal', 'nutrition', 'groceries', 'ration', 'water', 'feeding'],
  [TaskCategory.RESCUE_SUPPORT]: ['rescue', 'emergency', 'disaster', 'evacuation', 'fire', 'flood', 'relief'],
  [TaskCategory.LOGISTICS]: ['logistics', 'transport', 'delivery', 'warehouse', 'stock', 'supply', 'inventory', 'distribution'],
  [TaskCategory.COUNSELING]: ['counseling', 'mental', 'psychological', 'support', 'therapy', 'trauma', 'emotional'],
  [TaskCategory.TRANSPORTATION]: ['transport', 'vehicle', 'drive', 'ambulance', 'bus', 'truck', 'shuttle'],
  [TaskCategory.SEARCH_AND_RESCUE]: ['search', 'missing', 'trapped', 'k9', 'rescue', 'emergency'],
  [TaskCategory.TEACHING]: ['teach', 'education', 'school', 'student', 'learning', 'classroom', 'workshop'],
  [TaskCategory.WILDLIFE_RESCUE]: ['wildlife', 'animal', 'rescue', 'vet', 'nature', 'conservation', 'forest'],
};

// Valid categories for Gemini response validation
const VALID_CATEGORIES = new Set(Object.values(TaskCategory));

/**
 * Classify task category using keyword matching.
 * This is the zero-cost, always-available fallback.
 */
export const classifyTaskCategory = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();

  let bestCategory = TaskCategory.OTHER;
  let highestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;

    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score += 1;
        // Bonus for exact word boundary match
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(text)) {
          score += 0.5;
        }
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestCategory = category;
    }
  }

  return {
    category: bestCategory,
    confidence: highestScore > 0 ? Math.min(highestScore / 5, 1) : 0,
    keywordsMatched: highestScore,
    source: 'keyword',
  };
};

// ─────────────────────────────────────────────────────────────
// 3. GEMINI-POWERED CLASSIFICATION
// ─────────────────────────────────────────────────────────────

/**
 * Safely parse a JSON string from Gemini's response.
 * Handles markdown code fences and malformed output gracefully.
 */
const safeJsonParse = (text) => {
  try {
    // Strip markdown code fences if present (```json ... ```)
    const cleaned = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    return JSON.parse(cleaned);
  } catch {
    return null;
  }
};

/**
 * Classify a task using Gemini AI.
 *
 * Returns JSON: { category, severity (1-10), urgency (1-10) }
 * Falls back to keyword classification on any failure.
 *
 * @param {string} title - Task title
 * @param {string} description - Task description
 * @returns {Promise<Object>} Classification result
 */
export const classifyTask = async (title, description) => {
  const model = getGeminiModel();

  // Fallback immediately if Gemini is unavailable
  if (!model) {
    return classifyTaskCategory(title, description);
  }

  try {
    const prompt = `You are an NGO task classification AI. Analyze this task and return ONLY valid JSON with no additional text.

Valid categories: ${Object.values(TaskCategory).join(', ')}

Return format:
{
  "category": "one of the valid categories listed above",
  "severity": number (1-10, where 10 is most severe),
  "urgency": number (1-10, where 10 is most urgent)
}

Task Title: ${title}
Task Description: ${description}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const parsed = safeJsonParse(text);

    if (!parsed || !parsed.category) {
      console.warn('[AI] Gemini returned invalid JSON, falling back to keywords');
      return classifyTaskCategory(title, description);
    }

    // Validate category against our known set
    if (!VALID_CATEGORIES.has(parsed.category)) {
      console.warn(`[AI] Gemini returned unknown category "${parsed.category}", falling back`);
      return classifyTaskCategory(title, description);
    }

    // Clamp numeric values to valid range
    const severity = Math.min(Math.max(Math.round(parsed.severity || 5), 1), 10);
    const urgency = Math.min(Math.max(Math.round(parsed.urgency || 5), 1), 10);

    console.log(`[AI] Gemini classification: ${parsed.category} (severity: ${severity}, urgency: ${urgency})`);

    return {
      category: parsed.category,
      severity,
      urgency,
      confidence: 0.9, // Gemini classifications are high confidence
      source: 'gemini',
    };
  } catch (error) {
    console.error('[AI] Gemini classification failed:', error.message);
    return classifyTaskCategory(title, description);
  }
};

// ─────────────────────────────────────────────────────────────
// 4. GEMINI-POWERED PRIORITY SUGGESTION
// ─────────────────────────────────────────────────────────────

/**
 * Use Gemini to suggest an improved priority score for a task.
 *
 * @param {Object} taskData - { title, description, category, severity, urgency, peopleAffected }
 * @returns {Promise<Object>} { suggestedPriority, reasoning }
 */
export const suggestPriority = async (taskData) => {
  const model = getGeminiModel();

  if (!model) {
    // Use the existing formula as fallback
    return {
      suggestedPriority: null,
      reasoning: 'Gemini unavailable — using formula-based priority',
      source: 'fallback',
    };
  }

  try {
    const prompt = `You are an NGO task prioritization AI. Given this task data, suggest an improved priority score. Return ONLY valid JSON.

Task:
- Title: ${taskData.title}
- Description: ${taskData.description}
- Category: ${taskData.category}
- Severity: ${taskData.severity}/10
- Urgency: ${taskData.urgency}/10
- People Affected: ${taskData.peopleAffected}

Return format:
{
  "suggestedPriority": number (0-10 scale, 2 decimal places),
  "reasoning": "brief explanation"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = safeJsonParse(text);

    if (!parsed || typeof parsed.suggestedPriority !== 'number') {
      return {
        suggestedPriority: null,
        reasoning: 'Gemini returned invalid response',
        source: 'fallback',
      };
    }

    // Clamp to valid range
    const priority = Math.min(Math.max(Math.round(parsed.suggestedPriority * 100) / 100, 0), 10);

    console.log(`[AI] Gemini priority suggestion: ${priority} — ${parsed.reasoning}`);

    return {
      suggestedPriority: priority,
      reasoning: parsed.reasoning || 'AI-generated priority',
      source: 'gemini',
    };
  } catch (error) {
    console.error('[AI] Gemini priority suggestion failed:', error.message);
    return {
      suggestedPriority: null,
      reasoning: `Gemini error: ${error.message}`,
      source: 'fallback',
    };
  }
};

// ─────────────────────────────────────────────────────────────
// 5. TASK ANALYSIS (Combined Intelligence)
// ─────────────────────────────────────────────────────────────

/**
 * Full task analysis using Gemini + recommendations engine.
 */
export const analyzeTask = async (title, description, severity, urgency) => {
  const classification = await classifyTask(title, description);

  return {
    ...classification,
    severity,
    urgency,
    recommendations: generateRecommendations(classification.category, severity, urgency),
  };
};

/**
 * Generate rule-based recommendations.
 * These are deterministic and always available.
 */
const generateRecommendations = (category, severity, urgency) => {
  const recommendations = [];

  if (severity >= 8) {
    recommendations.push('CRITICAL: Deploy immediately with maximum resources');
  } else if (severity >= 5) {
    recommendations.push('HIGH: Assign experienced volunteers');
  }

  if (urgency >= 8) {
    recommendations.push('URGENT: Requires immediate response');
  }

  if (category === TaskCategory.RESCUE_SUPPORT || category === TaskCategory.SEARCH_AND_RESCUE) {
    recommendations.push('Consider coordinating with local emergency services');
  }
  
  if (category === TaskCategory.MEDICAL_HELP || category === TaskCategory.FIRST_AID) {
    recommendations.push('Ensure medical professionals are assigned');
  }

  return recommendations;
};
