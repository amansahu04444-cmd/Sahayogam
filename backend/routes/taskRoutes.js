import express from 'express';
import { body } from 'express-validator';
import * as taskController from '../controllers/taskController.js';
import { authenticate, ngoOrAdmin, ngoOnly } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * IMPORTANT: Static routes MUST come before parameterized /:id routes.
 * Express matches top-down; /stats would otherwise be treated as an :id.
 */

/**
 * GET /api/tasks/priority
 * Get tasks sorted by priority
 */
router.get('/priority', taskController.getTasksByPriority);

/**
 * GET /api/tasks/high-priority
 * Get high priority tasks (priority > 7)
 */
router.get('/high-priority', taskController.getHighPriorityTasks);

/**
 * GET /api/tasks/stats
 * Get task statistics for dashboard
 */
router.get('/stats', taskController.getTaskStats);

/**
 * GET /api/tasks/my-tasks
 * Get tasks accepted by current volunteer
 */
router.get('/my-tasks', taskController.getMyTasks);

/**
 * POST /api/tasks/create
 * Create new task (NGO only)
 */
router.post(
  '/create',
  ngoOrAdmin,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('severity')
      .isInt({ min: 1, max: 10 })
      .withMessage('Severity must be between 1 and 10'),
    body('peopleAffected')
      .isInt({ min: 0 })
      .withMessage('People affected must be a positive number'),
    body('urgency')
      .isInt({ min: 1, max: 10 })
      .withMessage('Urgency must be between 1 and 10'),
    body('category').optional().isString(),
    body('location').optional().isObject(),
    body('requiredSkills').optional().isArray(),
  ],
  taskController.createTask
);

/**
 * GET /api/tasks
 * Get all tasks (with filtering & pagination)
 */
router.get('/', taskController.getTasks);

/**
 * GET /api/tasks/matches/:id
 * Get volunteer matches for a task
 */
router.get('/matches/:id', taskController.getTaskMatches);

/**
 * POST /api/tasks/assign/:id
 * Auto-assign best volunteer to task
 */
router.post('/assign/:id', ngoOrAdmin, taskController.assignTask);

/**
 * PATCH /api/tasks/:id/accept
 * Volunteer accepts a task (sets assignedTo = current user)
 */
router.patch('/:id/accept', taskController.acceptTask);

/**
 * GET /api/tasks/:id
 * Get single task by ID
 */
router.get('/:id', taskController.getTaskById);

/**
 * PUT /api/tasks/:id
 * Update task details
 */
router.put('/:id', ngoOrAdmin, taskController.updateTask);

/**
 * DELETE /api/tasks/:id
 * Delete task
 */
router.delete('/:id', ngoOrAdmin, taskController.deleteTask);

/**
 * PATCH /api/tasks/:id/status
 * Update task status (NGO, Admin, or Assigned Volunteer)
 */
router.patch('/:id/status', taskController.updateTaskStatus);

export default router;
