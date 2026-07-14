const express = require('express');
const router = express.Router();
const controller = require('../controllers/executionController');
const { authMiddleware } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');

// Rate limit editor compilations to maximum 15 per minute
router.post('/run', authMiddleware, rateLimiter({ max: 15, windowMs: 60000 }), controller.runCode);
router.get('/history', authMiddleware, controller.getExecutionHistory);

module.exports = router;
