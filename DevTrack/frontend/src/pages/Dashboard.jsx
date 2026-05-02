import React, { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import TaskForm from '../components/TaskForm';
import AnalyticsCharts from '../components/AnalyticsCharts';
import { Clock, CheckCircle, TrendingUp, Trash2 } from 'lucide-react';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check system preference or local storage for theme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    fetchData();
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const fetchData = async () => {
    try {
      const [tasksRes, analyticsRes] = await Promise.all([
        taskAPI.getTasks(),
        taskAPI.getAnalytics()
      ]);
      setTasks(tasksRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    }
  };

  const handleAddTask = async (taskData) => {
    try {
      await taskAPI.createTask(taskData);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Failed to create task', error);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await taskAPI.deleteTask(id);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Failed to delete task', error);
    }
  };

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-hidden ${isDarkMode ? 'dark' : ''}`}>
      <Sidebar toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
      
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Track your learning and progress.</p>
          </header>

          {/* Stats Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 flex items-center gap-4 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics?.totalHours || 0}</p>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 flex items-center gap-4 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tasks Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics?.totalTasks || 0}</p>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 flex items-center gap-4 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">Active 🔥</p>
              </div>
            </div>
          </div>

          <TaskForm onSubmit={handleAddTask} />

          <AnalyticsCharts data={analytics} />

          {/* Recent Tasks List */}
          <div className="mt-8 rounded-xl bg-white shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Logs</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {tasks.length > 0 ? tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {task.category}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {task.hours} hours
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(task.date).toLocaleDateString()}
                      </span>
                    </div>
                    {task.notes && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{task.notes}</p>
                    )}
                  </div>
                  <button 
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )) : (
                <div className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No tasks logged yet. Start learning!
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
