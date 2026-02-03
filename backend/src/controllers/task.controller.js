/**
 * Task Controller
 */

const { prisma } = require('../config/database');
const { asyncHandler, ApiError } = require('../middlewares/errorHandler');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/apiResponse');
const { emitTaskUpdate } = require('../config/socket');
const { cacheDel, cacheDelPattern } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Get all tasks for current user
 * GET /api/tasks
 */
const getTasks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category, priority, completed, search, sortBy = 'createdAt', order = 'desc' } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build where clause
  const where = {
    userId: req.userId,
  };

  if (category) {
    where.category = category.toUpperCase();
  }

  if (priority) {
    where.priority = priority.toUpperCase();
  }

  if (completed !== undefined) {
    where.completed = completed === 'true';
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Get tasks with pagination
  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { [sortBy]: order },
    }),
    prisma.task.count({ where }),
  ]);

  sendPaginated(res, tasks, parseInt(page), parseInt(limit), total);
});

/**
 * Get task by ID
 * GET /api/tasks/:id
 */
const getTaskById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await prisma.task.findFirst({
    where: {
      id,
      userId: req.userId,
    },
  });

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  sendSuccess(res, task);
});

/**
 * Create a new task
 * POST /api/tasks
 */
const createTask = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category = 'WORK',
    priority = 'MEDIUM',
    duration = 60,
    deadline,
    preferredTime,
    recurring = false,
    recurrence,
  } = req.body;

  const task = await prisma.task.create({
    data: {
      userId: req.userId,
      title,
      description,
      category: category.toUpperCase(),
      priority: priority.toUpperCase(),
      duration,
      deadline: deadline ? new Date(deadline) : null,
      preferredTime,
      recurring,
      recurrence: recurring ? recurrence : null,
    },
  });

  // Invalidate cache
  await cacheDelPattern(`schedule:${req.userId}:*`);

  // Emit real-time update
  emitTaskUpdate(req.userId, task, 'created');

  logger.info(`Task created: ${task.id} by user ${req.userId}`);

  sendCreated(res, task, 'Task created successfully');
});

/**
 * Update a task
 * PUT /api/tasks/:id
 */
const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Verify task belongs to user
  const existingTask = await prisma.task.findFirst({
    where: { id, userId: req.userId },
  });

  if (!existingTask) {
    throw ApiError.notFound('Task not found');
  }

  // Normalize enum values
  if (updates.category) {
    updates.category = updates.category.toUpperCase();
  }
  if (updates.priority) {
    updates.priority = updates.priority.toUpperCase();
  }
  if (updates.deadline) {
    updates.deadline = new Date(updates.deadline);
  }

  const task = await prisma.task.update({
    where: { id },
    data: updates,
  });

  // Invalidate cache
  await cacheDelPattern(`schedule:${req.userId}:*`);

  // Emit real-time update
  emitTaskUpdate(req.userId, task, 'updated');

  sendSuccess(res, task, 'Task updated successfully');
});

/**
 * Delete a task
 * DELETE /api/tasks/:id
 */
const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify task belongs to user
  const task = await prisma.task.findFirst({
    where: { id, userId: req.userId },
  });

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  await prisma.task.delete({
    where: { id },
  });

  // Invalidate cache
  await cacheDelPattern(`schedule:${req.userId}:*`);

  // Emit real-time update
  emitTaskUpdate(req.userId, { id }, 'deleted');

  logger.info(`Task deleted: ${id} by user ${req.userId}`);

  sendSuccess(res, null, 'Task deleted successfully');
});

/**
 * Mark task as complete
 * PATCH /api/tasks/:id/complete
 */
const completeTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await prisma.task.findFirst({
    where: { id, userId: req.userId },
  });

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      completed: true,
      completedAt: new Date(),
    },
  });

  // Invalidate cache
  await cacheDelPattern(`schedule:${req.userId}:*`);
  await cacheDelPattern(`analytics:${req.userId}:*`);

  // Emit real-time update
  emitTaskUpdate(req.userId, updatedTask, 'completed');

  sendSuccess(res, updatedTask, 'Task marked as complete');
});

/**
 * Mark task as incomplete
 * PATCH /api/tasks/:id/uncomplete
 */
const uncompleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await prisma.task.findFirst({
    where: { id, userId: req.userId },
  });

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      completed: false,
      completedAt: null,
    },
  });

  // Invalidate cache
  await cacheDelPattern(`schedule:${req.userId}:*`);
  await cacheDelPattern(`analytics:${req.userId}:*`);

  // Emit real-time update
  emitTaskUpdate(req.userId, updatedTask, 'updated');

  sendSuccess(res, updatedTask, 'Task marked as incomplete');
});

/**
 * Bulk complete tasks
 * POST /api/tasks/bulk-complete
 */
const bulkCompleteTasks = asyncHandler(async (req, res) => {
  const { taskIds } = req.body;

  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    throw ApiError.badRequest('Task IDs array is required');
  }

  const result = await prisma.task.updateMany({
    where: {
      id: { in: taskIds },
      userId: req.userId,
    },
    data: {
      completed: true,
      completedAt: new Date(),
    },
  });

  // Invalidate cache
  await cacheDelPattern(`schedule:${req.userId}:*`);
  await cacheDelPattern(`analytics:${req.userId}:*`);

  sendSuccess(res, { count: result.count }, `${result.count} tasks marked as complete`);
});

/**
 * Bulk delete tasks
 * DELETE /api/tasks/bulk-delete
 */
const bulkDeleteTasks = asyncHandler(async (req, res) => {
  const { taskIds } = req.body;

  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    throw ApiError.badRequest('Task IDs array is required');
  }

  const result = await prisma.task.deleteMany({
    where: {
      id: { in: taskIds },
      userId: req.userId,
    },
  });

  // Invalidate cache
  await cacheDelPattern(`schedule:${req.userId}:*`);

  sendSuccess(res, { count: result.count }, `${result.count} tasks deleted`);
});

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  uncompleteTask,
  bulkCompleteTasks,
  bulkDeleteTasks,
};
