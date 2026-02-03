/**
 * Schedule Routes
 */

const express = require('express');
const router = express.Router();

const scheduleController = require('../controllers/schedule.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { dateParamValidation } = require('../middlewares/validate');

// All routes require authentication
router.use(authenticate);

// Schedule operations
router.get('/:date', dateParamValidation, scheduleController.getSchedule);
router.post('/optimize', scheduleController.optimizeSchedule);
router.put('/:date', dateParamValidation, scheduleController.updateSchedule);

// Schedule items
router.post('/:date/items', dateParamValidation, scheduleController.addScheduleItem);
router.put('/:date/items/:itemId', scheduleController.updateScheduleItem);
router.delete('/:date/items/:itemId', scheduleController.deleteScheduleItem);

// Mental load
router.get('/:date/mental-load', dateParamValidation, scheduleController.getMentalLoad);
router.get('/week/:startDate/mental-load', scheduleController.getWeekMentalLoad);

module.exports = router;
