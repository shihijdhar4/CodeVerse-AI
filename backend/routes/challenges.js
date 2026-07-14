const express = require('express');
const router = express.Router();
const controller = require('../controllers/challengeController');
const { authMiddleware, adminRequired } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');

// Student challenge view + submission routes
router.get('/', authMiddleware, controller.getAllChallenges);
router.get('/submissions', authMiddleware, controller.getSubmissions);
router.get('/leaderboard', authMiddleware, controller.getLeaderboard);
router.get('/:id', authMiddleware, controller.getChallengeById);

// Submit route with a rate limiter (max 10 compilations/runs per minute to keep processes sane)
router.post('/:id/submit', authMiddleware, rateLimiter({ max: 10, windowMs: 60000 }), controller.submitChallenge);

// Admin-only challenge alterations
router.post('/', authMiddleware, adminRequired, controller.createChallenge);
router.delete('/:id', authMiddleware, adminRequired, controller.deleteChallenge);

module.exports = router;
