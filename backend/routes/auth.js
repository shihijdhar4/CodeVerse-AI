const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const { authMiddleware, adminRequired } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');

// Public Auth routes (rate limited to avoid credential stuffing)
router.post('/register', rateLimiter({ max: 20 }), controller.register);
router.post('/login', rateLimiter({ max: 30 }), controller.login);
router.post('/forgot-password', rateLimiter({ max: 5 }), controller.forgotPassword);

// Shared Admin & Student Protected Dashboard routes
router.get('/profile', authMiddleware, controller.getProfile);
router.put('/profile', authMiddleware, controller.updateProfile);
router.get('/dashboard-stats', authMiddleware, controller.getDashboardStats);

// Admin-only metrics and user actions
router.get('/analytics', authMiddleware, adminRequired, controller.getAnalytics);
router.get('/users', authMiddleware, adminRequired, controller.getAllUsers);
router.delete('/users/:id', authMiddleware, adminRequired, controller.deleteUser);

module.exports = router;
