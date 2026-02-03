/**
 * AI Assistant Routes
 */

const express = require('express');
const router = express.Router();

const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { aiRateLimiter } = require('../middlewares/rateLimiter');

// All routes require authentication
router.use(authenticate);
router.use(aiRateLimiter);

router.post('/chat', aiController.chat);
router.post('/suggest', aiController.suggest);
router.get('/conversations', aiController.getConversations);
router.get('/conversations/:id', aiController.getConversation);
router.delete('/conversations/:id', aiController.deleteConversation);

module.exports = router;
