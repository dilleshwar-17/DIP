const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const authenticate = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/suggest-subtasks', aiController.suggestSubTasks);
router.post('/insights', aiController.getInsights);

module.exports = router;
