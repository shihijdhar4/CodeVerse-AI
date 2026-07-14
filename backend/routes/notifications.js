const express = require('express');
const router = express.Router();
const controller = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, controller.getNotifications);
router.put('/read-all', authMiddleware, controller.markAllAsRead);
router.put('/:id/read', authMiddleware, controller.markAsRead);

module.exports = router;
