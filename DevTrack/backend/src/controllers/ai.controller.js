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

module.exports = { suggestSubTasks, getInsights };
