const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.post('/suggest-subtasks', aiController.suggestSubTasks);
router.post('/insights', aiController.getInsights);
router.post('/parse-task', aiController.parseTask);
router.get('/motivation', aiController.getDailyMotivation);
router.post('/smart-priority', aiController.getSmartPriority);
router.post('/optimize-schedule', aiController.optimizeSchedule);

module.exports = router;
