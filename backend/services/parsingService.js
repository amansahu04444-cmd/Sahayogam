/**
 * Smart Parsing Engine
 * Converts unstructured OCR text into structured JSON
 */

// Category keywords for auto-detection
const CATEGORY_KEYWORDS = {
  food: ['food', 'hunger', 'meal', 'starvation', 'hungry', 'feeding', 'ration'],
  health: ['health', 'medical', 'hospital', 'doctor', 'medicine', 'disease', 'illness', 'injury', 'wound', 'healthcare'],
  education: ['education', 'school', 'learning', 'teacher', 'student', 'books', 'classroom', 'study'],
  shelter: ['shelter', 'housing', 'home', 'homeless', 'evacuation', 'accommodation'],
  water: ['water', 'drinking', 'clean water', 'sanitation', 'drought', 'contamination'],
  clothing: ['clothing', 'clothes', 'warm', 'blanket', 'garment'],
  rescue: ['rescue', 'trapped', 'evacuation', 'emergency', 'danger', 'stranded'],
  infrastructure: ['road', 'bridge', 'building', 'damage', 'collapsed', 'infrastructure'],
};

// Location patterns
const LOCATION_PATTERNS = [
  /(?:location|place|area|city|district|state|address):\s*([A-Za-z\s,]+)/i,
  /(?:at|in|near)\s+([A-Za-z\s]+(?:\d{6})?)/,
  /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s*[-–]\s*(?:issue|report|problem)/i,
];

// People affected patterns
const PEOPLE_PATTERNS = [
  /(\d+)\s*(?:people|persons|individuals|families)\s*(?:affected|impacted|displaced)/i,
  /affected[:\s]+(\d+)/i,
  /(\d+)\s*(?:people|persons)/i,
  /(\d+)\s*(?:families|homes|houses)/i,
];

// Priority keywords
const PRIORITY_KEYWORDS = {
  high: ['urgent', 'critical', 'emergency', 'severe', 'critical situation', 'immediate'],
  medium: ['important', 'significant', 'moderate', 'needed'],
  low: ['minor', 'low priority', 'small', 'few'],
};

// Common Indian locations for coordinate lookup
const KNOWN_LOCATIONS = {
  'bhopal': { lat: 23.2599, lng: 77.4126 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'delhi': { lat: 28.7041, lng: 77.1025 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'ahmedabad': { lat: 22.2587, lng: 71.1924 },
  'lucknow': { lat: 26.8467, lng: 80.9462 },
  'kanpur': { lat: 26.4499, lng: 80.3319 },
  'nagpur': { lat: 21.1458, lng: 79.0882 },
  'indore': { lat: 22.7196, lng: 75.8577 },
  'surat': { lat: 21.1702, lng: 72.8311 },
  'kochi': { lat: 9.9312, lng: 76.2673 },
  'goa': { lat: 15.2993, lng: 74.1240 },
  'chandigarh': { lat: 30.7333, lng: 76.7794 },
  'bhubaneswar': { lat: 20.2961, lng: 85.8245 },
  'ranchi': { lat: 23.3441, lng: 85.3095 },
};

/**
 * Extract location from text using patterns
 */
const extractLocation = (text) => {
  for (const pattern of LOCATION_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Check for known locations
  const lowerText = text.toLowerCase();
  for (const [name, coords] of Object.entries(KNOWN_LOCATIONS)) {
    if (lowerText.includes(name)) {
      return { name, ...coords };
    }
  }

  return null;
};

/**
 * Detect category from text
 */
const detectCategory = (text) => {
  const lowerText = text.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return category;
      }
    }
  }

  return 'general'; // Default category
};

/**
 * Extract number of people affected
 */
const extractPeopleAffected = (text) => {
  for (const pattern of PEOPLE_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > 0 && num < 1000000) { // Sanity check
        return num;
      }
    }
  }
  return null;
};

/**
 * Extract title from text
 */
const extractTitle = (text) => {
  // Look for lines that look like titles
  const lines = text.split('\n').filter(l => l.trim().length > 5 && l.trim().length < 100);

  for (const line of lines) {
    // Skip lines that are mostly numbers or special chars
    const alphaCount = (line.match(/[a-zA-Z]/g) || []).length;
    if (alphaCount > line.length * 0.5) {
      // Clean up the title
      return line.trim().substring(0, 100);
    }
  }

  // Fallback: first meaningful line
  return lines[0]?.substring(0, 100) || 'Untitled Issue';
};

/**
 * Extract description from text
 */
const extractDescription = (text) => {
  // Try to get 2-3 sentences of meaningful content
  const sentences = text.split(/[.!?\n]+/).filter(s => s.trim().length > 20);
  return sentences.slice(0, 3).join('. ').trim() || text.substring(0, 300);
};

/**
 * Determine priority based on people affected and keywords
 */
const determinePriority = (peopleAffected, text) => {
  // Auto-priority based on people affected
  if (peopleAffected !== null) {
    if (peopleAffected > 50) return 'high';
    if (peopleAffected >= 20) return 'medium';
    return 'low';
  }

  // Keyword-based priority
  const lowerText = text.toLowerCase();
  for (const keyword of PRIORITY_KEYWORDS.high) {
    if (lowerText.includes(keyword)) return 'high';
  }
  for (const keyword of PRIORITY_KEYWORDS.medium) {
    if (lowerText.includes(keyword)) return 'medium';
  }

  return 'medium'; // Default
};

/**
 * Main parsing function - converts OCR text to structured JSON
 * @param {string} rawText - Raw text from OCR
 * @returns {Object} Structured data
 */
export const parseTextToStructuredData = (rawText) => {
  if (!rawText || rawText.trim().length < 10) {
    return {
      title: 'Unknown Issue',
      description: rawText || '',
      location: null,
      latitude: null,
      longitude: null,
      category: 'general',
      peopleAffected: null,
      priority: 'medium',
      hotspot: false,
    };
  }

  const locationResult = extractLocation(rawText);
  const locationName = typeof locationResult === 'object' ? locationResult.name : locationResult;
  const coords = typeof locationResult === 'object' ? locationResult : null;

  const peopleAffected = extractPeopleAffected(rawText);
  const category = detectCategory(rawText);

  return {
    title: extractTitle(rawText),
    description: extractDescription(rawText),
    location: locationName,
    latitude: coords?.lat || null,
    longitude: coords?.lng || null,
    category,
    peopleAffected,
    priority: determinePriority(peopleAffected, rawText),
    hotspot: false, // Will be set by collection controller if repeated
  };
};

/**
 * Parse CSV row to task object
 * @param {Object} row - CSV row object
 * @returns {Object} Structured task
 */
export const parseCSVRow = (row) => {
  const title = row.title || row.name || row.issue || 'Untitled';
  const description = row.description || row.details || row.issue_description || '';

  // Try to extract location
  const location = row.location || row.place || row.address || '';

  // Extract people affected
  const peopleStr = row.peopleAffected || row['people_affected'] || row.affected || row.families || '0';
  const peopleAffected = parseInt(peopleStr, 10) || 0;

  // Determine priority
  let priority = 'medium';
  if (peopleAffected > 50) priority = 'high';
  else if (peopleAffected < 20) priority = 'low';

  // Category
  const category = row.category || detectCategory(title + ' ' + description);

  return {
    title: String(title).substring(0, 100),
    description: String(description).substring(0, 500),
    location,
    latitude: row.latitude ? parseFloat(row.latitude) : null,
    longitude: row.longitude ? parseFloat(row.longitude) : null,
    category,
    peopleAffected,
    priority,
    hotspot: false,
  };
};

export default {
  parseTextToStructuredData,
  parseCSVRow,
};