const prisma = require('../prismaClient');

const getTasks = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date } = req.query;
    
    const where = { userId };
    if (date) {
      const start = new Date(date);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setUTCHours(23, 59, 59, 999);
      where.date = {
        gte: start,
        lte: end
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: { subTasks: true },
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

    const calculateStats = (filteredTasks, days) => {
      const totalHours = filteredTasks
        .filter(t => ['COMPLETED', 'IN_PROGRESS', 'REVIEW'].includes(t.status))
        .reduce((sum, task) => sum + task.hours, 0);
      const completedTasks = filteredTasks.filter(t => t.status === 'COMPLETED').length;
      const pendingTasks = filteredTasks.filter(t => t.status === 'PENDING').length;
      const activeTasks = filteredTasks.filter(t => ['IN_PROGRESS', 'REVIEW'].includes(t.status)).length;

      const categoryBreakdown = {};
      filteredTasks.filter(t => t.status === 'COMPLETED').forEach(t => {
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.hours;
      });

      const categoryData = Object.keys(categoryBreakdown).map(key => ({
        name: key,
        value: categoryBreakdown[key]
      }));

      const dailyData = {};
      const now = new Date();
      for (let i = 0; i < days; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dailyData[dateStr] = { date: dateStr, hours: 0, completed: 0 };
      }

      filteredTasks.forEach(t => {
        const dateStr = new Date(t.date).toISOString().split('T')[0];
        if (dailyData[dateStr]) {
          if (['COMPLETED', 'IN_PROGRESS', 'REVIEW'].includes(t.status)) {
            dailyData[dateStr].hours += t.hours;
            if (t.status === 'COMPLETED') {
              dailyData[dateStr].completed += 1;
            }
          }
        }
      });

      const historyTrend = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));

      return { totalHours, completedTasks, pendingTasks, activeTasks, categoryData, historyTrend };
    };

    const now = new Date();
    
    const getTasksSince = (days) => {
      const since = new Date(now);
      since.setDate(since.getDate() - days);
      return tasks.filter(t => new Date(t.date) >= since);
    };

    res.status(200).json({
      weekly: calculateStats(getTasksSince(7), 7),
      fortnightly: calculateStats(getTasksSince(14), 14),
      monthly: calculateStats(getTasksSince(30), 30),
      overall: calculateStats(tasks, 90) // Using 90 days for trend in overall
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createTask = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date, startTime, hours, category, notes, isRoutine, priority, tags, subTasks } = req.body;

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
        priority: priority || 'MEDIUM',
        tags: tags || [],
        status: 'PENDING',
        subTasks: {
          create: subTasks?.map(st => ({ title: st.title })) || []
        }
      },
      include: { subTasks: true }
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
    const { date, startTime, hours, category, notes, status, isRoutine, priority, tags, subTasks } = req.body;

    const existingTask = await prisma.task.findUnique({ 
      where: { id: taskId },
      include: { subTasks: true }
    });
    
    if (!existingTask || existingTask.userId !== userId) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    // Automation: If status is set to COMPLETED, ensure all subtasks are COMPLETED too
    let finalStatus = status || existingTask.status;
    let finalSubTasks = subTasks;
    
    if (status === 'COMPLETED') {
      // Logic for automatic subtask completion could go here
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        date: date ? new Date(date) : existingTask.date,
        startTime: startTime !== undefined ? (startTime ? new Date(startTime) : null) : existingTask.startTime,
        hours: hours !== undefined ? parseFloat(hours) : existingTask.hours,
        category: category || existingTask.category,
        notes: notes !== undefined ? notes : existingTask.notes,
        status: finalStatus,
        isRoutine: isRoutine !== undefined ? !!isRoutine : existingTask.isRoutine,
        priority: priority || existingTask.priority,
        tags: tags !== undefined ? tags : existingTask.tags,
        // For subtasks, we use a slightly more complex update if they are provided
        subTasks: subTasks ? {
          deleteMany: {}, // Simplest way: clear and recreate, or we can map IDs
          create: subTasks.map(st => ({ title: st.title, completed: !!st.completed }))
        } : undefined
      },
      include: { subTasks: true }
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
