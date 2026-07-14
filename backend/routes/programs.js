const express = require('express');
const router = express.Router();
const controller = require('../controllers/programController');
const { authMiddleware } = require('../middleware/auth');

// Public shared workspace loading
router.get('/shared/:token', controller.getSharedProgram);

// User protected workspace routes
router.post('/', authMiddleware, controller.createProgram);
router.get('/', authMiddleware, controller.getAllPrograms);
router.get('/:id', authMiddleware, controller.getProgramById);
router.put('/:id', authMiddleware, controller.updateProgram);
router.delete('/:id', authMiddleware, controller.deleteProgram);
router.post('/:id/duplicate', authMiddleware, controller.duplicateProgram);
router.post('/:id/share', authMiddleware, controller.shareProgram);

module.exports = router;
