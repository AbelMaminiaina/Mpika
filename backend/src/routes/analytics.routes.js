/**
 * Analytics Routes
 */

const express = require('express');
const router = express.Router();

const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(authenticate);

router.get('/daily/:date', analyticsController.getDailyAnalytics);
router.get('/weekly', analyticsController.getWeeklyAnalytics);
router.get('/monthly', analyticsController.getMonthlyAnalytics);
router.get('/summary', analyticsController.getSummary);

module.exports = router;
