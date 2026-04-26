import { db } from '../config/firebase.js';
import { calculatePriority, TaskStatus, TaskCategory } from '../models/Task.js';

const TASKS_COLLECTION = 'tasks';

/**
 * Create a new task
 * Auto-calculates priority based on formula
 */
export const createTask = async (taskData, createdBy) => {
  const {
    title,
    description,
    category,
    severity,
    peopleAffected,
    urgency,
    location,
    requiredSkills,
    volunteersNeeded,
    ngoName,
  } = taskData;

  // Auto-calculate priority
  const priority = calculatePriority(severity, peopleAffected, urgency);

  const task = {
    title,
    description,
    category: category || TaskCategory.OTHER,
    ngoName: ngoName || 'Unknown Organization',
    status: TaskStatus.PENDING,
    priority,
    severity,
    peopleAffected,
    urgency,
    location: location || { lat: 0, lng: 0, address: '' },
    requiredSkills: requiredSkills || [],
    acceptedVolunteers: [],
    volunteersNeeded: volunteersNeeded || 1,
    maxVolunteers: taskData.maxVolunteers || volunteersNeeded || 10,
    assignedTo: null,
    createdBy,
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const docRef = await db.collection(TASKS_COLLECTION).add(task);
  return { id: docRef.id, ...task };
};

/**
 * Get all tasks
 */
export const getAllTasks = async () => {
  const snapshot = await db.collection(TASKS_COLLECTION)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get tasks sorted by priority (highest first)
 */
export const getTasksByPriority = async () => {
  const snapshot = await db.collection(TASKS_COLLECTION)
    .orderBy('priority', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get task by ID
 */
export const getTaskById = async (taskId) => {
  const taskDoc = await db.collection(TASKS_COLLECTION).doc(taskId).get();

  if (!taskDoc.exists) {
    throw new Error('Task not found');
  }

  return { id: taskDoc.id, ...taskDoc.data() };
};

/**
 * Update task details
 */
export const updateTask = async (taskId, updates) => {
  const allowedUpdates = ['title', 'description', 'category', 'location', 'requiredSkills', 'severity', 'peopleAffected', 'urgency'];
  const updateData = { updatedAt: new Date().toISOString() };

  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      updateData[key] = updates[key];
    }
  }

  // Recalculate priority if severity, peopleAffected, or urgency changed
  if (updates.severity !== undefined || updates.peopleAffected !== undefined || updates.urgency !== undefined) {
    const currentTask = await getTaskById(taskId);
    const newSeverity = updates.severity ?? currentTask.severity;
    const newPeople = updates.peopleAffected ?? currentTask.peopleAffected;
    const newUrgency = updates.urgency ?? currentTask.urgency;
    updateData.priority = calculatePriority(newSeverity, newPeople, newUrgency);
  }

  await db.collection(TASKS_COLLECTION).doc(taskId).update(updateData);
  return getTaskById(taskId);
};

/**
 * Delete task
 */
export const deleteTask = async (taskId) => {
  await db.collection(TASKS_COLLECTION).doc(taskId).delete();
  return { success: true, id: taskId };
};

/**
 * Update task status
 */
export const updateTaskStatus = async (taskId, status) => {
  const updateData = {
    status,
    updatedAt: new Date().toISOString(),
  };

  if (status === TaskStatus.COMPLETED) {
    updateData.completedAt = new Date().toISOString();
  }

  await db.collection(TASKS_COLLECTION).doc(taskId).update(updateData);
  return getTaskById(taskId);
};

/**
 * Assign task to volunteer
 */
export const assignTask = async (taskId, volunteerId) => {
  const updateData = {
    assignedTo: volunteerId,
    status: TaskStatus.ASSIGNED,
    updatedAt: new Date().toISOString(),
  };

  await db.collection(TASKS_COLLECTION).doc(taskId).update(updateData);
  return getTaskById(taskId);
};

/**
 * Accept a task (Volunteer adds themselves to accepted list)
 */
export const acceptVolunteer = async (taskId, volunteerId, volunteerDetails = {}) => {
  const task = await getTaskById(taskId);

  if (!task.acceptedVolunteers) {
    task.acceptedVolunteers = [];
  }

  // Check if volunteer already accepted
  const alreadyAccepted = task.acceptedVolunteers.some(v => 
    typeof v === 'object' ? v.id === volunteerId : v === volunteerId
  );
  
  if (alreadyAccepted) {
    throw new Error('You have already accepted this task');
  }

  const maxVolunteers = task.maxVolunteers || 10;
  if (task.acceptedVolunteers.length >= maxVolunteers) {
    throw new Error('This task is already full');
  }

  // Create volunteer acceptance record with timestamp and details
  const volunteerRecord = {
    id: volunteerId,
    name: volunteerDetails.name || 'Unknown Volunteer',
    email: volunteerDetails.email || '',
    phone: volunteerDetails.phone || '',
    acceptedAt: new Date().toISOString(),
  };

  const updateData = {
    acceptedVolunteers: [...task.acceptedVolunteers, volunteerRecord],
    assignedTo: volunteerId,
    assignedVolunteerName: volunteerDetails.name || 'Volunteer',
    assignedVolunteerEmail: volunteerDetails.email || '',
    status: TaskStatus.ASSIGNED,
    updatedAt: new Date().toISOString(),
  };

  await db.collection(TASKS_COLLECTION).doc(taskId).update(updateData);

  return getTaskById(taskId);
};

/**
 * Unassign task (reset to pending)
 */
export const unassignTask = async (taskId) => {
  const updateData = {
    assignedTo: null,
    status: TaskStatus.PENDING,
    updatedAt: new Date().toISOString(),
  };

  await db.collection(TASKS_COLLECTION).doc(taskId).update(updateData);
  return getTaskById(taskId);
};

/**
 * Get high priority tasks (priority > 7)
 */
export const getHighPriorityTasks = async () => {
  const snapshot = await db.collection(TASKS_COLLECTION)
    .where('priority', '>', 7)
    .orderBy('priority', 'desc')
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get tasks accepted by a specific volunteer
 * Queries tasks collection where acceptedVolunteers array contains volunteerId
 */
export const getMyTasks = async (volunteerId) => {
  const snapshot = await db.collection(TASKS_COLLECTION)
    .get();

  const tasks = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(task =>
      task.acceptedVolunteers &&
      task.acceptedVolunteers.some(v =>
        typeof v === 'object' ? v.id === volunteerId : v === volunteerId
      )
    );

  return tasks;
};

/**
 * Get task statistics for dashboard
 */
export const getTaskStats = async () => {
  const tasks = await getAllTasks();

  return {
    total: tasks.length,
    completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
    pending: tasks.filter(t => t.status === TaskStatus.PENDING).length,
    assigned: tasks.filter(t => t.status === TaskStatus.ASSIGNED).length,
    highPriority: tasks.filter(t => t.priority > 7).length,
  };
};
