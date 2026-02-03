/**
 * Analytics Controller
 */

const { prisma } = require('../config/database');
const { asyncHandler, ApiError } = require('../middlewares/errorHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { cacheGet, cacheSet } = require('../config/redis');
const scheduleService = require('../services/schedule.service');

/**
 * Get daily analytics
 * GET /api/analytics/daily/:date
 */
const getDailyAnalytics = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // Check cache
  const cacheKey = `analytics:${req.userId}:daily:${date}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return sendSuccess(res, cached);
  }

  // Get schedule for the day
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

  // Get completed tasks for the day
  const completedTasks = await prisma.task.findMany({
    where: {
      userId: req.userId,
      completedAt: {
        gte: targetDate,
        lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
      },
    },
  });

  // Calculate metrics
  const analytics = calculateDailyMetrics(schedule, completedTasks);

  // Cache for 10 minutes
  await cacheSet(cacheKey, analytics, 600);

  sendSuccess(res, analytics);
});

/**
 * Get weekly analytics
 * GET /api/analytics/weekly
 */
const getWeeklyAnalytics = asyncHandler(async (req, res) => {
  const { startDate } = req.query;

  // Default to current week
  const start = startDate ? new Date(startDate) : getStartOfWeek(new Date());
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  // Get schedules for the week
  const schedules = await prisma.schedule.findMany({
    where: {
      userId: req.userId,
      date: {
        gte: start,
        lt: end,
      },
    },
    include: {
      items: {
        include: { task: true },
      },
    },
    orderBy: { date: 'asc' },
  });

  // Get completed tasks for the week
  const completedTasks = await prisma.task.findMany({
    where: {
      userId: req.userId,
      completedAt: {
        gte: start,
        lt: end,
      },
    },
  });

  // Calculate daily data
  const dailyData = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(start);
    dayDate.setDate(dayDate.getDate() + i);
    const dateStr = dayDate.toISOString().split('T')[0];

    const daySchedule = schedules.find(s =>
      s.date.toISOString().split('T')[0] === dateStr
    );

    const dayCompletedTasks = completedTasks.filter(t => {
      const completedDate = new Date(t.completedAt).toISOString().split('T')[0];
      return completedDate === dateStr;
    });

    dailyData.push({
      date: dateStr,
      dayOfWeek: getDayOfWeekFr(dayDate.getDay()),
      ...calculateDailyMetrics(daySchedule, dayCompletedTasks),
    });
  }

  // Calculate weekly summary
  const weeklySum = {
    totalTasksCompleted: dailyData.reduce((sum, d) => sum + d.tasksCompleted, 0),
    totalTasksPlanned: dailyData.reduce((sum, d) => sum + d.tasksPlanned, 0),
    averageProductivity: calculateAverage(dailyData.map(d => d.productivityScore)),
    averageMentalLoad: calculateAverage(dailyData.map(d => d.mentalLoadScore)),
    totalWorkTime: dailyData.reduce((sum, d) => sum + (d.timeByCategory.WORK?.minutes || 0), 0),
    totalStudyTime: dailyData.reduce((sum, d) => sum + (d.timeByCategory.STUDY?.minutes || 0), 0),
    totalRestTime: dailyData.reduce((sum, d) => sum + (d.timeByCategory.REST?.minutes || 0), 0),
  };

  sendSuccess(res, {
    period: {
      start: start.toISOString().split('T')[0],
      end: new Date(end.getTime() - 1).toISOString().split('T')[0],
    },
    days: dailyData,
    summary: weeklySum,
  });
});

/**
 * Get monthly analytics
 * GET /api/analytics/monthly
 */
const getMonthlyAnalytics = asyncHandler(async (req, res) => {
  const { month, year } = req.query;

  const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
  const targetYear = year ? parseInt(year) : new Date().getFullYear();

  const start = new Date(targetYear, targetMonth, 1);
  const end = new Date(targetYear, targetMonth + 1, 1);

  // Get analytics records for the month
  const analyticsRecords = await prisma.analytics.findMany({
    where: {
      userId: req.userId,
      date: {
        gte: start,
        lt: end,
      },
    },
    orderBy: { date: 'asc' },
  });

  // Get completed tasks count
  const completedTasks = await prisma.task.count({
    where: {
      userId: req.userId,
      completedAt: {
        gte: start,
        lt: end,
      },
    },
  });

  // Calculate monthly summary
  const summary = {
    totalTasksCompleted: completedTasks,
    averageProductivity: calculateAverage(analyticsRecords.map(a => a.productivityScore)),
    averageMentalLoad: calculateAverage(analyticsRecords.map(a => a.mentalLoadScore)),
    averageBalance: calculateAverage(analyticsRecords.map(a => a.balanceScore)),
    totalWorkTime: analyticsRecords.reduce((sum, a) => sum + a.workTime, 0),
    totalStudyTime: analyticsRecords.reduce((sum, a) => sum + a.studyTime, 0),
    totalRestTime: analyticsRecords.reduce((sum, a) => sum + a.restTime, 0),
    daysTracked: analyticsRecords.length,
  };

  // Weekly breakdown
  const weeks = [];
  let weekStart = new Date(start);
  while (weekStart < end) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekRecords = analyticsRecords.filter(a => {
      const recordDate = new Date(a.date);
      return recordDate >= weekStart && recordDate < weekEnd;
    });

    weeks.push({
      weekStart: weekStart.toISOString().split('T')[0],
      tasksCompleted: weekRecords.reduce((sum, a) => sum + a.tasksCompleted, 0),
      averageProductivity: calculateAverage(weekRecords.map(a => a.productivityScore)),
      averageMentalLoad: calculateAverage(weekRecords.map(a => a.mentalLoadScore)),
    });

    weekStart = weekEnd;
  }

  sendSuccess(res, {
    period: {
      month: targetMonth + 1,
      year: targetYear,
      monthName: getMonthNameFr(targetMonth),
    },
    summary,
    weeks,
    dailyRecords: analyticsRecords,
  });
});

/**
 * Get summary analytics
 * GET /api/analytics/summary
 */
const getSummary = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekStart = getStartOfWeek(today);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // Get today's data
  const todaySchedule = await prisma.schedule.findUnique({
    where: {
      userId_date: {
        userId: req.userId,
        date: today,
      },
    },
    include: {
      items: true,
    },
  });

  // Get task counts
  const [totalTasks, completedToday, completedWeek, completedMonth, pendingTasks] = await Promise.all([
    prisma.task.count({ where: { userId: req.userId } }),
    prisma.task.count({
      where: {
        userId: req.userId,
        completedAt: { gte: today },
      },
    }),
    prisma.task.count({
      where: {
        userId: req.userId,
        completedAt: { gte: weekStart },
      },
    }),
    prisma.task.count({
      where: {
        userId: req.userId,
        completedAt: { gte: monthStart },
      },
    }),
    prisma.task.count({
      where: {
        userId: req.userId,
        completed: false,
      },
    }),
  ]);

  // Calculate today's mental load
  const todayMentalLoad = todaySchedule
    ? scheduleService.calculateMentalLoad(todaySchedule.items)
    : 0;

  sendSuccess(res, {
    today: {
      date: today.toISOString().split('T')[0],
      mentalLoad: todayMentalLoad,
      mentalLoadLevel: scheduleService.getMentalLoadLevel(todayMentalLoad),
      tasksCompleted: completedToday,
      scheduledItems: todaySchedule?.items.length || 0,
    },
    week: {
      tasksCompleted: completedWeek,
    },
    month: {
      tasksCompleted: completedMonth,
    },
    overall: {
      totalTasks,
      pendingTasks,
      completionRate: totalTasks > 0
        ? Math.round((completedMonth / totalTasks) * 100)
        : 0,
    },
  });
});

// Helper functions

function calculateDailyMetrics(schedule, completedTasks) {
  const items = schedule?.items || [];

  const mentalLoadScore = scheduleService.calculateMentalLoad(items);
  const tasksPlanned = items.filter(i => i.type === 'TASK').length;
  const tasksCompleted = completedTasks.length;

  // Calculate productivity score (tasks completed / tasks planned)
  const productivityScore = tasksPlanned > 0
    ? Math.min(Math.round((tasksCompleted / tasksPlanned) * 100), 100)
    : 0;

  // Calculate time by category
  const timeByCategory = {};
  for (const item of items) {
    if (['BREAK', 'BUFFER', 'SLEEP'].includes(item.type)) continue;

    const category = item.task?.category || 'OTHER';
    const duration = (new Date(item.endTime) - new Date(item.startTime)) / (1000 * 60);

    if (!timeByCategory[category]) {
      timeByCategory[category] = { minutes: 0 };
    }
    timeByCategory[category].minutes += duration;
  }

  return {
    tasksPlanned,
    tasksCompleted,
    productivityScore,
    mentalLoadScore,
    mentalLoadLevel: scheduleService.getMentalLoadLevel(mentalLoadScore),
    timeByCategory,
  };
}

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function calculateAverage(numbers) {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((a, b) => a + b, 0);
  return Math.round((sum / numbers.length) * 10) / 10;
}

function getDayOfWeekFr(day) {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[day];
}

function getMonthNameFr(month) {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return months[month];
}

module.exports = {
  getDailyAnalytics,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getSummary,
};
