/**
 * Validation Middleware
 */

const { validationResult, body, param, query } = require('express-validator');
const { sendValidationError } = require('../utils/apiResponse');

/**
 * Middleware to check validation results
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendValidationError(res, errors.array());
  }
  next();
}

// ============================================
// AUTH VALIDATIONS
// ============================================

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name must be less than 50 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters'),
  validate,
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate,
];

// ============================================
// TASK VALIDATIONS
// ============================================

const createTaskValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title must be less than 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('category')
    .optional()
    .isIn(['WORK', 'STUDY', 'LEISURE', 'REST', 'SPORT', 'SOCIAL', 'HOUSEHOLD', 'PERSONAL'])
    .withMessage('Invalid category'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Invalid priority'),
  body('duration')
    .optional()
    .isInt({ min: 5, max: 480 })
    .withMessage('Duration must be between 5 and 480 minutes'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Invalid deadline date'),
  body('recurring')
    .optional()
    .isBoolean()
    .withMessage('Recurring must be a boolean'),
  body('recurrence')
    .optional()
    .isIn(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'])
    .withMessage('Invalid recurrence'),
  validate,
];

const updateTaskValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid task ID'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Title must be less than 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('category')
    .optional()
    .isIn(['WORK', 'STUDY', 'LEISURE', 'REST', 'SPORT', 'SOCIAL', 'HOUSEHOLD', 'PERSONAL'])
    .withMessage('Invalid category'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Invalid priority'),
  body('duration')
    .optional()
    .isInt({ min: 5, max: 480 })
    .withMessage('Duration must be between 5 and 480 minutes'),
  validate,
];

// ============================================
// PROFILE VALIDATIONS
// ============================================

const updateProfileValidation = [
  body('sleepHours')
    .optional()
    .isInt({ min: 4, max: 12 })
    .withMessage('Sleep hours must be between 4 and 12'),
  body('wakeUpTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid wake up time format (HH:mm)'),
  body('bedTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid bed time format (HH:mm)'),
  body('energyPeakTime')
    .optional()
    .isIn(['morning', 'afternoon', 'evening'])
    .withMessage('Invalid energy peak time'),
  body('timezone')
    .optional()
    .isString()
    .withMessage('Invalid timezone'),
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'system'])
    .withMessage('Invalid theme'),
  validate,
];

// ============================================
// SCHEDULE VALIDATIONS
// ============================================

const dateParamValidation = [
  param('date')
    .isISO8601()
    .withMessage('Invalid date format'),
  validate,
];

// ============================================
// PAGINATION VALIDATIONS
// ============================================

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validate,
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  createTaskValidation,
  updateTaskValidation,
  updateProfileValidation,
  dateParamValidation,
  paginationValidation,
};
