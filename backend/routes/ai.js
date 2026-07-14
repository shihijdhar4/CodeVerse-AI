const express = require('express');
const router = express.Router();
const controller = require('../controllers/aiController');
const { authMiddleware } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');

// Rate limit AI functions to 12 calls per minute to throttle API costs
const aiLimiter = rateLimiter({ max: 12, windowMs: 60000 });

router.post('/explain', authMiddleware, aiLimiter, controller.explainError);
router.post('/review', authMiddleware, aiLimiter, controller.reviewCode);
router.post('/optimize', authMiddleware, aiLimiter, controller.optimizeCode);
router.post('/chat', authMiddleware, aiLimiter, controller.chatAssistant);
router.post('/challenge-gen', authMiddleware, aiLimiter, controller.generateChallenge);
router.get('/history', authMiddleware, controller.getAIHistory);

module.exports = router;
