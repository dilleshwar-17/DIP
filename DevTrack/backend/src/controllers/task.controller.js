const prisma = require('../prismaClient');

const getTasks = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date } = req.query;
    
    const where = { userId };
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.date = {
        gte: start,
        lte: end
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
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

    const totalHours = tasks.filter(t => t.status === 'COMPLETED').reduce((sum, task) => sum + task.hours, 0);
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const pendingTasks = tasks.filter(t => t.status === 'PENDING').length;

    // Category breakdown (for completed tasks)
    const categoryBreakdown = {};
    tasks.filter(t => t.status === 'COMPLETED').forEach(t => {
      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.hours;
    });

    const categoryData = Object.keys(categoryBreakdown).map(key => ({
      name: key,
      value: categoryBreakdown[key]
    }));

    // Daily trend (last 14 days)
    const dailyData = {};
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyData[dateStr] = { date: dateStr, hours: 0, completed: 0 };
    }

    tasks.forEach(t => {
      const dateStr = new Date(t.date).toISOString().split('T')[0];
      if (dailyData[dateStr]) {
        if (t.status === 'COMPLETED') {
          dailyData[dateStr].hours += t.hours;
          dailyData[dateStr].completed += 1;
        }
      }
    });

    const historyTrend = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));

    res.status(200).json({
      totalHours,
      completedTasks,
      pendingTasks,
      categoryData,
      historyTrend
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createTask = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date, startTime, hours, category, notes, isRoutine } = req.body;

    if (!date || hours === undefined || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const task = await prisma.task.create({
      data: {
        userId,
        date: new Date(date),
        startTime: startTime ? new Date(startTime) : null,
        hours: parseFloat(hours),
        category,
        notes,
        isRoutine: !!isRoutine,
        status: 'PENDING'
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
    const { date, startTime, hours, category, notes, status, isRoutine } = req.body;

    const existingTask = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existingTask || existingTask.userId !== userId) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        date: date ? new Date(date) : existingTask.date,
        startTime: startTime !== undefined ? (startTime ? new Date(startTime) : null) : existingTask.startTime,
        hours: hours !== undefined ? parseFloat(hours) : existingTask.hours,
        category: category || existingTask.category,
        notes: notes !== undefined ? notes : existingTask.notes,
        status: status || existingTask.status,
        isRoutine: isRoutine !== undefined ? !!isRoutine : existingTask.isRoutine
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
