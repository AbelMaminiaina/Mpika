/**
 * Profile Routes
 */

const express = require('express');
const router = express.Router();

const profileController = require('../controllers/profile.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { updateProfileValidation } = require('../middlewares/validate');

// All routes require authentication
router.use(authenticate);

router.get('/', profileController.getProfile);
router.put('/', updateProfileValidation, profileController.updateProfile);

module.exports = router;
