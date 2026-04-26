// Task Model
export const TaskStatus = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  COMPLETED: 'completed',
};

export const TaskCategory = {
  FIRST_AID: 'First Aid',
  MEDICAL_HELP: 'Medical Help',
  FOOD_DISTRIBUTION: 'Food Distribution',
  RESCUE_SUPPORT: 'Rescue Support',
  LOGISTICS: 'Logistics',
  COUNSELING: 'Counseling',
  TRANSPORTATION: 'Transportation',
  SEARCH_AND_RESCUE: 'Search & Rescue',
  TEACHING: 'Teaching',
  WILDLIFE_RESCUE: 'Wildlife Rescue',
  OTHER: 'Other',
};

export const TaskSchema = {
  title: { type: 'string', required: true },
  description: { type: 'string', required: true },
  category: { type: 'string', enum: Object.values(TaskCategory), default: TaskCategory.OTHER },
  status: { type: 'string', enum: Object.values(TaskStatus), default: TaskStatus.PENDING },
  priority: { type: 'number', default: 0 },
  severity: { type: 'number', min: 1, max: 10, required: true },
  peopleAffected: { type: 'number', min: 0, required: true },
  urgency: { type: 'number', min: 1, max: 10, required: true },
  location: { type: 'object', default: { lat: 0, lng: 0, address: '' } },
  requiredSkills: { type: 'array', default: [] },
  acceptedVolunteers: { type: 'array', default: [] },   // array of {id, name, email, phone, acceptedAt}
  maxVolunteers: { type: 'number', default: 10 },
  assignedTo: { type: 'string', default: null },
  createdBy: { type: 'string', required: true },
  attachments: { type: 'array', default: [] },
  createdAt: { type: 'timestamp', default: 'now' },
  updatedAt: { type: 'timestamp', default: 'now' },
};

/**
 * Calculate Priority Score
 * Formula: (Severity × 0.5) + (People × 0.3) + (Urgency × 0.2)
 * @param {number} severity - 1-10 scale
 * @param {number} peopleAffected - Number of people affected
 * @param {number} urgency - 1-10 scale
 * @returns {number} Priority score
 */
export function calculatePriority(severity, peopleAffected, urgency) {
  // Normalize peopleAffected to 0-10 scale (assuming max 10000 people)
  // Handle 0 affected people correctly (0 should stay 0, not become 1)
  const normalizedPeople = peopleAffected === 0
    ? 0
    : Math.min(Math.max(peopleAffected / 1000, 1), 10);

  const score = (severity * 0.5) + (normalizedPeople * 0.3) + (urgency * 0.2);
  return Math.round(score * 100) / 100; // Round to 2 decimal places
}
