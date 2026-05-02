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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    // Check system preference or local storage for theme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    fetchData();
  }, [selectedDate]);

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
        taskAPI.getTasks(selectedDate),
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

  const handleToggleStatus = async (task) => {
    try {
      const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      await taskAPI.updateTask(task.id, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Failed to update task status', error);
    }
  };

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-hidden ${isDarkMode ? 'dark' : ''}`}>
      <Sidebar toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
      
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage your daily routine and track progress.</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">View Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </header>

          {/* Stats Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 flex items-center gap-4 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Study Hours</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics?.totalHours?.toFixed(1) || 0}h</p>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 flex items-center gap-4 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tasks Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics?.completedTasks || 0}</p>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 flex items-center gap-4 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Tasks</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics?.pendingTasks || 0}</p>
              </div>
            </div>
          </div>

          <TaskForm onSubmit={handleAddTask} />

          <AnalyticsCharts data={analytics} />

          {/* Timetable / Task List */}
          <div className="mt-8 rounded-xl bg-white shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedDate === new Date().toISOString().split('T')[0] ? "Today's Schedule" : `Schedule for ${selectedDate}`}
              </h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {tasks.length > 0 ? tasks.map((task) => (
                <div key={task.id} className={`flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${task.status === 'COMPLETED' ? 'bg-green-50/30 dark:bg-green-900/10' : ''}`}>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleToggleStatus(task)}
                      className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === 'COMPLETED' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}
                    >
                      {task.status === 'COMPLETED' && <CheckCircle size={14} />}
                    </button>
                    <div>
                      <div className="flex items-center gap-3">
                        {task.startTime && (
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {task.category}
                        </span>
                        {task.isRoutine && (
                          <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                            Routine
                          </span>
                        )}
                        <span className={`text-sm font-medium ${task.status === 'COMPLETED' ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                          {task.hours} hours
                        </span>
                      </div>
                      {task.notes && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{task.notes}</p>
                      )}
                    </div>
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
                  No tasks scheduled for this day.
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
