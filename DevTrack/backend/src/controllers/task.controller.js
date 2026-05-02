const prisma = require('../prismaClient');

const getTasks = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    });
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Get Tasks Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tasks = await prisma.task.findMany({
      where: { userId }
    });

    // Calculate total hours
    const totalHours = tasks.reduce((sum, task) => sum + task.hours, 0);
    const totalTasks = tasks.length;

    // Category breakdown
    const categoryBreakdown = {};
    tasks.forEach(t => {
      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.hours;
    });

    const categoryData = Object.keys(categoryBreakdown).map(key => ({
      name: key,
      value: categoryBreakdown[key]
    }));

    // Weekly trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const weeklyTasks = tasks.filter(t => new Date(t.date) >= sevenDaysAgo);
    const dailyHours = {};
    
    weeklyTasks.forEach(t => {
      const d = new Date(t.date).toISOString().split('T')[0];
      dailyHours[d] = (dailyHours[d] || 0) + t.hours;
    });

    const weeklyTrend = Object.keys(dailyHours).sort().map(date => ({
      date,
      hours: dailyHours[date]
    }));

    res.status(200).json({
      totalHours,
      totalTasks,
      categoryData,
      weeklyTrend
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createTask = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date, hours, category, notes } = req.body;

    if (!date || hours === undefined || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const task = await prisma.task.create({
      data: {
        userId,
        date: new Date(date),
        hours: parseFloat(hours),
        category,
        notes
      }
    });
    res.status(201).json(task);
  } catch (error) {
    console.error('Create Task Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateTask = async (req, res) => {
  try {
    const userId = req.user.userId;
    const taskId = req.params.id;
    const { date, hours, category, notes } = req.body;

    const existingTask = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existingTask || existingTask.userId !== userId) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        date: date ? new Date(date) : existingTask.date,
        hours: hours !== undefined ? parseFloat(hours) : existingTask.hours,
        category: category || existingTask.category,
        notes: notes !== undefined ? notes : existingTask.notes
      }
    });

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error('Update Task Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const userId = req.user.userId;
    const taskId = req.params.id;

    const existingTask = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existingTask || existingTask.userId !== userId) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    await prisma.task.delete({ where: { id: taskId } });
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete Task Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask, getAnalytics };
