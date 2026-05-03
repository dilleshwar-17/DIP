const aiService = require('../services/ai.service');

const suggestSubTasks = async (req, res) => {
  try {
    const { title, category } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }
    const suggestions = await aiService.suggestSubTasks(title, category || 'Other');
    res.status(200).json(suggestions);
  } catch (error) {
    console.error('AI Controller Error:', error);
    res.status(500).json({ error: error.message || 'Failed to get AI suggestions' });
  }
};

const getInsights = async (req, res) => {
  try {
    const { stats } = req.body;
    const insights = await aiService.getProductivityInsights(stats);
    res.status(200).json({ insights });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get AI insights' });
  }
};

const parseTask = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text command is required' });
    }
    const taskData = await aiService.parseNaturalLanguageTask(text);
    res.status(200).json(taskData);
  } catch (error) {
    console.error('AI Parse Controller Error:', error);
    res.status(500).json({ error: 'Failed to parse task command' });
  }
};

const getDailyMotivation = async (req, res) => {
  try {
    const tip = await aiService.getDailyMotivation();
    res.status(200).json({ tip });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get motivation' });
  }
};

const getSmartPriority = async (req, res) => {
  try {
    const { title, notes } = req.body;
    const priority = await aiService.getSmartPriority(title, notes);
    res.status(200).json({ priority });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get smart priority' });
  }
};

const optimizeSchedule = async (req, res) => {
  try {
    const { tasks, timeframe } = req.body;
    const suggestions = await aiService.optimizeSchedule(tasks, timeframe);
    res.status(200).json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to optimize schedule' });
  }
};

module.exports = { suggestSubTasks, getInsights, parseTask, getDailyMotivation, getSmartPriority, optimizeSchedule };
