const express = require('express');
const { getTasks, createTask, updateTask, deleteTask, getAnalytics } = require('../controllers/task.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticateToken); // Protect all task routes

router.get('/analytics', getAnalytics);
router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
