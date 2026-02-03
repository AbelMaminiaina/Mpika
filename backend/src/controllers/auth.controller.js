/**
 * Authentication Controller
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const { generateToken, generateRefreshToken } = require('../middlewares/auth.middleware');
const { asyncHandler, ApiError } = require('../middlewares/errorHandler');
const { sendSuccess, sendCreated, sendError, sendUnauthorized } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw ApiError.conflict('Email already registered');
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user with default profile
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      profile: {
        create: {
          sleepHours: 8,
          wakeUpTime: '07:00',
          bedTime: '23:00',
          energyPeakTime: 'morning',
          preferredLanguage: 'fr',
          timezone: 'Europe/Paris',
        },
      },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      profile: true,
    },
  });

  // Generate tokens
  const accessToken = generateToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  logger.info(`New user registered: ${user.email}`);

  sendCreated(res, {
    user,
    tokens: {
      accessToken,
      refreshToken,
    },
  }, 'Registration successful');
});

/**
 * Login user
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      profile: true,
    },
  });

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Account is deactivated');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Generate tokens
  const accessToken = generateToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  logger.info(`User logged in: ${user.email}`);

  sendSuccess(res, {
    user: userWithoutPassword,
    tokens: {
      accessToken,
      refreshToken,
    },
  }, 'Login successful');
});

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  // In a more complete implementation, you would:
  // 1. Add the token to a blacklist in Redis
  // 2. Clear any server-side sessions

  logger.info(`User logged out: ${req.user.email}`);

  sendSuccess(res, null, 'Logout successful');
});

/**
 * Get current user
 * GET /api/auth/me
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      profile: true,
    },
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  sendSuccess(res, user);
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw ApiError.badRequest('Refresh token is required');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'refresh') {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User not found or inactive');
    }

    // Generate new tokens
    const accessToken = generateToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    sendSuccess(res, {
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    }, 'Token refreshed');
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Refresh token expired');
    }
    throw ApiError.unauthorized('Invalid refresh token');
  }
});

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  refreshToken,
};
