/**
 * Schedule Controller
 * Core scheduling and optimization logic
 */

const { prisma } = require('../config/database');
const { asyncHandler, ApiError } = require('../middlewares/errorHandler');
const { sendSuccess, sendCreated } = require('../utils/apiResponse');
const { emitScheduleUpdate } = require('../config/socket');
const { cacheGet, cacheSet, cacheDel } = require('../config/redis');
const scheduleService = require('../services/schedule.service');
const logger = require('../utils/logger');

/**
 * Get schedule for a specific date
 * GET /api/schedules/:date
 */
const getSchedule = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // Check cache
  const cacheKey = `schedule:${req.userId}:${date}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return sendSuccess(res, cached);
  }

  // Find or create schedule
  let schedule = await prisma.schedule.findUnique({
    where: {
      userId_date: {
        userId: req.userId,
        date: targetDate,
      },
    },
    include: {
      items: {
        orderBy: { startTime: 'asc' },
        include: {
          task: true,
        },
      },
    },
  });

  if (!schedule) {
    // Create empty schedule
    schedule = await prisma.schedule.create({
      data: {
        userId: req.userId,
        date: targetDate,
        optimized: false,
        mentalLoadScore: 0,
      },
      include: {
        items: true,
      },
    });
  }

  // Calculate mental load
  const mentalLoad = scheduleService.calculateMentalLoad(schedule.items);
  schedule.mentalLoadScore = mentalLoad;

  // Cache for 5 minutes
  await cacheSet(cacheKey, schedule, 300);

  sendSuccess(res, schedule);
});

/**
 * Optimize schedule for a date
 * POST /api/schedules/optimize
 */
const optimizeSchedule = asyncHandler(async (req, res) => {
  const { date } = req.body;

  if (!date) {
    throw ApiError.badRequest('Date is required');
  }

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // Get user profile
  const profile = await prisma.userProfile.findUnique({
    where: { userId: req.userId },
  });

  if (!profile) {
    throw ApiError.notFound('User profile not found');
  }

  // Get incomplete tasks
  const tasks = await prisma.task.findMany({
    where: {
      userId: req.userId,
      completed: false,
      OR: [
        { deadline: null },
        { deadline: { gte: targetDate } },
      ],
    },
    orderBy: [
      { priority: 'desc' },
      { deadline: 'asc' },
    ],
  });

  // Optimize schedule
  const optimizedItems = scheduleService.optimizeSchedule(tasks, profile, targetDate);

  // Calculate mental load
  const mentalLoad = scheduleService.calculateMentalLoad(optimizedItems);

  // Check for overload
  const overloadWarning = mentalLoad > 7
    ? scheduleService.generateOverloadSuggestions(mentalLoad, optimizedItems)
    : null;

  // Save schedule
  const schedule = await prisma.schedule.upsert({
    where: {
      userId_date: {
        userId: req.userId,
        date: targetDate,
      },
    },
    update: {
      optimized: true,
      mentalLoadScore: mentalLoad,
      items: {
        deleteMany: {},
        create: optimizedItems.map(item => ({
          title: item.title,
          type: item.type,
          startTime: item.startTime,
          endTime: item.endTime,
          taskId: item.taskId || null,
        })),
      },
    },
    create: {
      userId: req.userId,
      date: targetDate,
      optimized: true,
      mentalLoadScore: mentalLoad,
      items: {
        create: optimizedItems.map(item => ({
          title: item.title,
          type: item.type,
          startTime: item.startTime,
          endTime: item.endTime,
          taskId: item.taskId || null,
        })),
      },
    },
    include: {
      items: {
        orderBy: { startTime: 'asc' },
        include: { task: true },
      },
    },
  });

  // Invalidate cache
  await cacheDel(`schedule:${req.userId}:${date}`);

  // Emit real-time update
  emitScheduleUpdate(req.userId, schedule);

  logger.info(`Schedule optimized for user ${req.userId} on ${date}`);

  sendSuccess(res, {
    schedule,
    mentalLoad,
    overloadWarning,
  }, 'Schedule optimized successfully');
});

/**
 * Update schedule
 * PUT /api/schedules/:date
 */
const updateSchedule = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const { items } = req.body;

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // Update schedule
  const schedule = await prisma.schedule.upsert({
    where: {
      userId_date: {
        userId: req.userId,
        date: targetDate,
      },
    },
    update: {
      optimized: false,
      items: {
        deleteMany: {},
        create: items.map(item => ({
          title: item.title,
          type: item.type || 'TASK',
          startTime: new Date(item.startTime),
          endTime: new Date(item.endTime),
          taskId: item.taskId || null,
        })),
      },
    },
    create: {
      userId: req.userId,
      date: targetDate,
      items: {
        create: items.map(item => ({
          title: item.title,
          type: item.type || 'TASK',
          startTime: new Date(item.startTime),
          endTime: new Date(item.endTime),
          taskId: item.taskId || null,
        })),
      },
    },
    include: {
      items: {
        orderBy: { startTime: 'asc' },
      },
    },
  });

  // Recalculate mental load
  const mentalLoad = scheduleService.calculateMentalLoad(schedule.items);
  await prisma.schedule.update({
    where: { id: schedule.id },
    data: { mentalLoadScore: mentalLoad },
  });

  // Invalidate cache
  await cacheDel(`schedule:${req.userId}:${date}`);

  // Emit real-time update
  emitScheduleUpdate(req.userId, schedule);

  sendSuccess(res, schedule, 'Schedule updated successfully');
});

/**
 * Add item to schedule
 * POST /api/schedules/:date/items
 */
const addScheduleItem = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const { title, type = 'TASK', startTime, endTime, taskId } = req.body;

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // Get or create schedule
  let schedule = await prisma.schedule.findUnique({
    where: {
      userId_date: {
        userId: req.userId,
        date: targetDate,
      },
    },
  });

  if (!schedule) {
    schedule = await prisma.schedule.create({
      data: {
        userId: req.userId,
        date: targetDate,
      },
    });
  }

  // Create item
  const item = await prisma.scheduleItem.create({
    data: {
      scheduleId: schedule.id,
      title,
      type,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      taskId,
    },
    include: { task: true },
  });

  // Invalidate cache
  await cacheDel(`schedule:${req.userId}:${date}`);

  sendCreated(res, item, 'Schedule item added');
});

/**
 * Update schedule item
 * PUT /api/schedules/:date/items/:itemId
 */
const updateScheduleItem = asyncHandler(async (req, res) => {
  const { date, itemId } = req.params;
  const updates = req.body;

  // Verify item belongs to user's schedule
  const item = await prisma.scheduleItem.findFirst({
    where: {
      id: itemId,
      schedule: {
        userId: req.userId,
      },
    },
  });

  if (!item) {
    throw ApiError.notFound('Schedule item not found');
  }

  // Update item
  const updatedItem = await prisma.scheduleItem.update({
    where: { id: itemId },
    data: {
      ...updates,
      startTime: updates.startTime ? new Date(updates.startTime) : undefined,
      endTime: updates.endTime ? new Date(updates.endTime) : undefined,
    },
    include: { task: true },
  });

  // Invalidate cache
  await cacheDel(`schedule:${req.userId}:${date}`);

  sendSuccess(res, updatedItem, 'Schedule item updated');
});

/**
 * Delete schedule item
 * DELETE /api/schedules/:date/items/:itemId
 */
const deleteScheduleItem = asyncHandler(async (req, res) => {
  const { date, itemId } = req.params;

  // Verify item belongs to user's schedule
  const item = await prisma.scheduleItem.findFirst({
    where: {
      id: itemId,
      schedule: {
        userId: req.userId,
      },
    },
  });

  if (!item) {
    throw ApiError.notFound('Schedule item not found');
  }

  await prisma.scheduleItem.delete({
    where: { id: itemId },
  });

  // Invalidate cache
  await cacheDel(`schedule:${req.userId}:${date}`);

  sendSuccess(res, null, 'Schedule item deleted');
});

/**
 * Get mental load for a date
 * GET /api/schedules/:date/mental-load
 */
const getMentalLoad = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const schedule = await prisma.schedule.findUnique({
    where: {
      userId_date: {
        userId: req.userId,
        date: targetDate,
      },
    },
    include: {
      items: {
        include: { task: true },
      },
    },
  });

  if (!schedule) {
    return sendSuccess(res, {
      score: 0,
      level: 'light',
      message: 'No schedule for this date',
    });
  }

  const score = scheduleService.calculateMentalLoad(schedule.items);
  const analysis = scheduleService.analyzeMentalLoad(score, schedule.items);

  sendSuccess(res, {
    score,
    ...analysis,
  });
});

/**
 * Get mental load for a week
 * GET /api/schedules/week/:startDate/mental-load
 */
const getWeekMentalLoad = asyncHandler(async (req, res) => {
  const { startDate } = req.params;
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const schedules = await prisma.schedule.findMany({
    where: {
      userId: req.userId,
      date: {
        gte: start,
        lt: end,
      },
    },
    include: {
      items: true,
    },
    orderBy: { date: 'asc' },
  });

  const weekData = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(start);
    dayDate.setDate(dayDate.getDate() + i);
    const dateStr = dayDate.toISOString().split('T')[0];

    const schedule = schedules.find(s =>
      s.date.toISOString().split('T')[0] === dateStr
    );

    const score = schedule
      ? scheduleService.calculateMentalLoad(schedule.items)
      : 0;

    weekData.push({
      date: dateStr,
      score,
      level: scheduleService.getMentalLoadLevel(score),
    });
  }

  const averageScore = weekData.reduce((sum, d) => sum + d.score, 0) / 7;

  sendSuccess(res, {
    days: weekData,
    average: Math.round(averageScore * 10) / 10,
    averageLevel: scheduleService.getMentalLoadLevel(averageScore),
  });
});

module.exports = {
  getSchedule,
  optimizeSchedule,
  updateSchedule,
  addScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
  getMentalLoad,
  getWeekMentalLoad,
};
