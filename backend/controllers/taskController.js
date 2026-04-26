import { validationResult } from 'express-validator';
import * as taskService from '../services/taskService.js';
import * as volunteerMatchingService from '../services/volunteerMatchingService.js';
import * as notificationService from '../services/notificationService.js';
import * as authService from '../services/authService.js';
import { classifyTask } from '../services/aiService.js';

/**
 * Create a new task (NGO only)
 * POST /api/tasks/create
 */
export const createTask = async (req, res) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

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
    } = req.body;

    // Auto-classify using Gemini AI if category is not provided
    let finalCategory = category;
    let finalSeverity = severity;
    let finalUrgency = urgency;

    if (!finalCategory) {
      const classification = await classifyTask(title, description);
      finalCategory = classification.category;

      // Use Gemini-suggested severity/urgency as fallback if not provided by user
      if (!finalSeverity && classification.severity) finalSeverity = classification.severity;
      if (!finalUrgency && classification.urgency) finalUrgency = classification.urgency;

      console.log(`[AI] Classification: ${finalCategory} (source: ${classification.source}, confidence: ${classification.confidence})`);
    }

    const task = await taskService.createTask(
      {
        title,
        description,
        category: finalCategory,
        severity: finalSeverity,
        peopleAffected,
        urgency: finalUrgency,
        location,
        requiredSkills,
        volunteersNeeded,
        ngoName: req.user.name,
      },
      req.user.uid
    );

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create task',
    });
  }
};

/**
 * Get all tasks
 * GET /api/tasks
 */
export const getTasks = async (req, res) => {
  try {
    const { status, category, limit = 50, offset = 0 } = req.query;
    let tasks = await taskService.getAllTasks();

    // Filter by status
    if (status) {
      tasks = tasks.filter(t => t.status === status);
    }

    // Filter by category
    if (category) {
      tasks = tasks.filter(t => t.category === category);
    }

    // Pagination
    const total = tasks.length;
    tasks = tasks.slice(Number(offset), Number(offset) + Number(limit));

    res.json({
      success: true,
      count: tasks.length,
      total,
      offset: Number(offset),
      limit: Number(limit),
      data: tasks,
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get tasks',
    });
  }
};

/**
 * Get single task by ID
 * GET /api/tasks/:id
 */
export const getTaskById = async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id);

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(error.message === 'Task not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to get task',
    });
  }
};

/**
 * Update task
 * PUT /api/tasks/:id
 */
export const updateTask = async (req, res) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.body);

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task,
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(error.message === 'Task not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to update task',
    });
  }
};

/**
 * Delete task
 * DELETE /api/tasks/:id
 */
export const deleteTask = async (req, res) => {
  try {
    await taskService.deleteTask(req.params.id);

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(error.message === 'Task not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to delete task',
    });
  }
};

/**
 * Update task status
 * PATCH /api/tasks/:id/status
 */
export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!req.user || !req.user.uid) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const task = await taskService.getTaskById(id);

    // Authorization Logic:
    // 1. NGOs and Admins can update any task status
    // 2. Volunteers can ONLY update tasks they have accepted
    // 3. Volunteers can ONLY update status to 'completed'
    const isNgoOrAdmin = req.user.role === 'ngo' || req.user.role === 'admin';
    const isAssignedTo = task.assignedTo === req.user.uid;
    const isInAcceptedList = task.acceptedVolunteers?.some(v => 
      typeof v === 'object' ? v.id === req.user.uid : v === req.user.uid
    );

    console.log(`[StatusUpdate] User: ${req.user.uid}, Role: ${req.user.role}, Task: ${id}, assignedTo: ${task.assignedTo}`);

    if (!isNgoOrAdmin) {
      if (!isAssignedTo && !isInAcceptedList) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not assigned to this task.',
        });
      }

      if (status !== 'completed') {
        return res.status(403).json({
          success: false,
          message: 'Volunteers can only mark tasks as completed.',
        });
      }
    }

    const updatedTask = await taskService.updateTaskStatus(id, status);

    res.json({
      success: true,
      message: `Task status updated to ${status}`,
      data: updatedTask,
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(error.message === 'Task not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to update task status',
    });
  }
};

/**
 * Get tasks sorted by priority
 * GET /api/tasks/priority
 */
export const getTasksByPriority = async (req, res) => {
  try {
    const tasks = await taskService.getTasksByPriority();

    res.json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    console.error('Get priority tasks error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get priority tasks',
    });
  }
};

/**
 * Get high priority tasks
 * GET /api/tasks/high-priority
 */
export const getHighPriorityTasks = async (req, res) => {
  try {
    const tasks = await taskService.getHighPriorityTasks();

    res.json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    console.error('Get high priority tasks error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get high priority tasks',
    });
  }
};

/**
 * Auto-assign best volunteer to task
 * POST /api/tasks/assign/:id
 */
export const assignTask = async (req, res) => {
  try {
    const { id: taskId } = req.params;

    // Get best matching volunteer
    const match = await volunteerMatchingService.getBestVolunteerForTask(taskId);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'No suitable volunteer found for this task',
      });
    }

    const { volunteer, scores } = match;

    // Assign task to volunteer
    const updatedTask = await taskService.assignTask(taskId, volunteer.id);

    // Send notification
    await notificationService.sendAssignmentNotification(volunteer, updatedTask);

    res.json({
      success: true,
      message: `Task assigned to ${volunteer.name}`,
      data: {
        task: updatedTask,
        assignedVolunteer: {
          id: volunteer.id,
          name: volunteer.name,
          email: volunteer.email,
          skills: volunteer.skills,
        },
        matchScore: scores,
      },
    });
  } catch (error) {
    console.error('Assign task error:', error);
    res.status(error.message === 'Task not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to assign task',
    });
  }
};

/**
 * Get task matches (preview volunteer matches)
 * GET /api/tasks/matches/:id
 */
export const getTaskMatches = async (req, res) => {
  try {
    const { id: taskId } = req.params;

    const matches = await volunteerMatchingService.matchVolunteersToTask(taskId);

    res.json({
      success: true,
      count: matches.length,
      data: matches.slice(0, 10), // Return top 10 matches
    });
  } catch (error) {
    console.error('Get task matches error:', error);
    res.status(error.message === 'Task not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to get task matches',
    });
  }
};

/**
 * Get dashboard statistics
 * GET /api/tasks/stats
 */
export const getTaskStats = async (req, res) => {
  try {
    const stats = await taskService.getTaskStats();

    // Get volunteer count
    const volunteers = await authService.getAllVolunteers();

    res.json({
      success: true,
      data: {
        ...stats,
        activeVolunteers: volunteers.length,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get statistics',
    });
  }
};

/**
 * Get tasks accepted by current volunteer
 * GET /api/tasks/my-tasks
 */
export const getMyTasks = async (req, res) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const volunteerId = req.user.uid;
    console.log(`[getMyTasks] Fetching tasks for volunteer ${volunteerId}`);

    const tasks = await taskService.getMyTasks(volunteerId);

    res.json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get tasks',
    });
  }
};

/**
 * Accept a task (Volunteer)
 * PATCH /api/tasks/:id/accept
 * Body: { name?, email?, phone? }
 */
export const acceptTask = async (req, res) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { id } = req.params;
    const volunteerId = req.user.uid;

    // Extract volunteer details from request body (sent from frontend)
    const { name, email, phone } = req.body;

    // Fallback to user data if not provided in request
    const volunteerData = {
      name: name || req.user.displayName || 'Volunteer',
      email: email || req.user.email || '',
      phone: phone || req.user.phone || '',
    };

    console.log(`[acceptTask] Volunteer ${volunteerId} accepting task ${id}`, volunteerData);

    const updatedTask = await taskService.acceptVolunteer(id, volunteerId, volunteerData);

    res.json({
      success: true,
      message: 'Task accepted successfully',
      data: updatedTask,
    });
  } catch (error) {
    console.error('Accept task error:', error);
    const status = error.message === 'Task not found' ? 404 : 400;
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to accept task',
    });
  }
};
