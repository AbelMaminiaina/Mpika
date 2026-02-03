/**
 * Profile Controller
 */

const { prisma } = require('../config/database');
const { asyncHandler, ApiError } = require('../middlewares/errorHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { cacheDelPattern } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Get user profile
 * GET /api/profile
 */
const getProfile = asyncHandler(async (req, res) => {
  const profile = await prisma.userProfile.findUnique({
    where: { userId: req.userId },
  });

  if (!profile) {
    // Create default profile
    const newProfile = await prisma.userProfile.create({
      data: {
        userId: req.userId,
        sleepHours: 8,
        wakeUpTime: '07:00',
        bedTime: '23:00',
        energyPeakTime: 'morning',
        preferredLanguage: 'fr',
        timezone: 'Europe/Paris',
      },
    });
    return sendSuccess(res, newProfile);
  }

  sendSuccess(res, profile);
});

/**
 * Update user profile
 * PUT /api/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const {
    sleepHours,
    wakeUpTime,
    bedTime,
    energyPeakTime,
    notificationsEnabled,
    reminderMinutes,
    pauseReminders,
    preferredLanguage,
    timezone,
    theme,
  } = req.body;

  const profile = await prisma.userProfile.upsert({
    where: { userId: req.userId },
    update: {
      ...(sleepHours !== undefined && { sleepHours }),
      ...(wakeUpTime !== undefined && { wakeUpTime }),
      ...(bedTime !== undefined && { bedTime }),
      ...(energyPeakTime !== undefined && { energyPeakTime }),
      ...(notificationsEnabled !== undefined && { notificationsEnabled }),
      ...(reminderMinutes !== undefined && { reminderMinutes }),
      ...(pauseReminders !== undefined && { pauseReminders }),
      ...(preferredLanguage !== undefined && { preferredLanguage }),
      ...(timezone !== undefined && { timezone }),
      ...(theme !== undefined && { theme }),
    },
    create: {
      userId: req.userId,
      sleepHours: sleepHours || 8,
      wakeUpTime: wakeUpTime || '07:00',
      bedTime: bedTime || '23:00',
      energyPeakTime: energyPeakTime || 'morning',
      notificationsEnabled: notificationsEnabled !== false,
      reminderMinutes: reminderMinutes || 30,
      pauseReminders: pauseReminders !== false,
      preferredLanguage: preferredLanguage || 'fr',
      timezone: timezone || 'Europe/Paris',
      theme: theme || 'light',
    },
  });

  // Invalidate schedule cache when profile changes (affects optimization)
  await cacheDelPattern(`schedule:${req.userId}:*`);

  logger.info(`Profile updated for user ${req.userId}`);

  sendSuccess(res, profile, 'Profile updated successfully');
});

module.exports = {
  getProfile,
  updateProfile,
};
