import React, { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import TaskForm from '../components/TaskForm';
import AnalyticsCharts from '../components/AnalyticsCharts';
import KanbanBoard from '../components/KanbanBoard';
import { aiAPI } from '../services/api';
import NotificationService from '../services/NotificationService';
import { Clock, CheckCircle, TrendingUp, Trash2, LayoutGrid, Calendar as CalendarIcon, ChevronRight, ChevronDown, Sparkles, Loader2, Bell, Activity, Edit2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const STATUS_ORDER = ['PENDING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'];

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [aiInsights, setAiInsights] = useState('');
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [timeframe, setTimeframe] = useState('weekly');
  const [view, setView] = useState('timetable'); // timetable or kanban
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedTasks, setExpandedTasks] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    const initNotifications = async () => {
      const granted = await NotificationService.requestPermission();
      setNotificationsEnabled(granted);
    };
    initNotifications();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      const [tasksRes, analyticsRes] = await Promise.all([
        taskAPI.getTasks(selectedDate),
        taskAPI.getAnalytics()
      ]);
      const fetchedTasks = tasksRes.data;
      setTasks(fetchedTasks);
      setAnalytics(analyticsRes.data);
      
      // Schedule reminders for fetched tasks
      NotificationService.scheduleAllReminders(fetchedTasks);
    } catch (error) {
      console.error('Failed to fetch data', error);
    }
  };

  const handleGetInsights = async () => {
    if (!analytics) return;
    setIsLoadingInsights(true);
    try {
      const res = await aiAPI.getInsights(analytics[timeframe]);
      setAiInsights(res.data.insights);
    } catch (error) {
      console.error('Failed to get insights', error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const currentStats = analytics ? analytics[timeframe] : null;

  const handleAddTask = async (taskData) => {
    try {
      if (editingTask) {
        await taskAPI.updateTask(editingTask.id, taskData);
        setEditingTask(null);
      } else {
        await taskAPI.createTask(taskData);
      }
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Failed to save task', error);
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

  const handleToggleStatus = async (task, forcedStatus = null) => {
    const currentIndex = STATUS_ORDER.indexOf(task.status);
    const nextStatus = forcedStatus || STATUS_ORDER[(currentIndex + 1) % STATUS_ORDER.length];
    
    // Optimistic Update
    const oldTasks = [...tasks];
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));

    try {
      await taskAPI.updateTask(task.id, { status: nextStatus });
      fetchData();
    } catch (error) {
      setTasks(oldTasks); // Rollback on error
      console.error('Failed to update task status', error);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleSubTask = async (task, subTaskId) => {
    // Optimistic Update
    const oldTasks = [...tasks];
    const updatedSubTasks = task.subTasks.map(st => 
      st.id === subTaskId ? { ...st, completed: !st.completed } : st
    );
    setTasks(tasks.map(t => t.id === task.id ? { ...t, subTasks: updatedSubTasks } : t));

    try {
      await taskAPI.updateTask(task.id, { subTasks: updatedSubTasks });
      fetchData();
    } catch (error) {
      setTasks(oldTasks); // Rollback
      console.error('Failed to update subtask', error);
    }
  };

  const toggleExpand = (taskId) => {
    setExpandedTasks(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const calculateTaskProgress = (task) => {
    if (!task.subTasks || task.subTasks.length === 0) return task.status === 'COMPLETED' ? 100 : 0;
    const completed = task.subTasks.filter(st => st.completed).length;
    return Math.round((completed / task.subTasks.length) * 100);
  };

  const formatDuration = (decimalHours) => {
    const h = Math.floor(decimalHours);
    const m = Math.round((decimalHours - h) * 60);
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 mx-auto max-w-7xl">
          <header className="mb-8">
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <div className="flex items-center gap-2 text-blue-600">
                <Activity size={24} />
                <span className="font-black tracking-tighter text-xl">DevTrack</span>
              </div>
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
              >
                <LayoutGrid size={20} />
              </button>
            </div>

            <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">Dashboard</h2>
                <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">Personalized productivity management suite.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button 
                    onClick={() => setView('timetable')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'timetable' ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' : 'text-gray-500'}`}
                  >
                    <CalendarIcon size={14} />
                    Timetable
                  </button>
                  <button 
                    onClick={() => setView('kanban')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'kanban' ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' : 'text-gray-500'}`}
                  >
                    <LayoutGrid size={14} />
                    Kanban
                  </button>
                </div>

                <div className="flex items-center gap-3 px-2">
                  <div className="p-1.5 rounded-lg text-green-600 bg-green-50 dark:bg-green-900/30">
                    <Bell size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-tight text-gray-500">
                      Reminders Active
                    </span>
                    <button 
                      onClick={() => {
                        new Notification('DevTrack System', { body: 'Notifications are active and monitoring your tasks.', icon: '/logo192.png' });
                      }}
                      className="text-[9px] font-bold text-blue-600 hover:underline text-left"
                    >
                      Test System
                    </button>
                  </div>
                </div>

                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="border-none bg-transparent text-sm font-bold text-gray-900 dark:text-white focus:ring-0 cursor-pointer"
                    />
                  </div>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold text-blue-600 dark:text-blue-400 focus:ring-0 cursor-pointer"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="fortnightly">Fortnightly</option>
                    <option value="monthly">Monthly</option>
                    <option value="overall">Overall</option>
                  </select>
                </div>
              </div>
            </div>
          </header>




          {/* Stats Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <div className="group rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex items-center gap-4 dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Study Hours</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentStats ? formatDuration(currentStats.totalHours) : '0:00'}</p>
              </div>
            </div>

            <div className="group rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex items-center gap-4 dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 group-hover:scale-110 transition-transform">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentStats?.completedTasks || 0}</p>
              </div>
            </div>

            <div className="group rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex items-center gap-4 dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 group-hover:scale-110 transition-transform">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Efficiency</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentStats?.historyTrend?.length > 0 ? Math.round((currentStats.completedTasks / (currentStats.completedTasks + currentStats.pendingTasks || 1)) * 100) : 0}%</p>
              </div>
            </div>
          </div>

          <TaskForm 
            onSubmit={handleAddTask} 
            editingTask={editingTask} 
            onCancelEdit={() => setEditingTask(null)} 
          />

          <div className="mb-8">
            <AnalyticsCharts data={currentStats} title={timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} />
          </div>

          <div className="mb-8 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-8 shadow-xl text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="text-yellow-300" />
                  <h3 className="text-xl font-bold">AI Productivity Coach</h3>
                </div>
                <p className="text-indigo-100 text-sm leading-relaxed">
                  {aiInsights || "Get personalized AI feedback on your performance and learn how to optimize your workflow."}
                </p>
              </div>
              <button 
                onClick={handleGetInsights}
                disabled={isLoadingInsights}
                className="flex-shrink-0 flex items-center gap-2 bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-50 transition-all disabled:opacity-50"
              >
                {isLoadingInsights ? <Loader2 className="animate-spin" size={18} /> : <TrendingUp size={18} />}
                {aiInsights ? 'Refresh Analysis' : 'Get AI Feedback'}
              </button>
            </div>
          </div>

          {view === 'kanban' ? (
            <KanbanBoard 
              tasks={tasks} 
              onToggleStatus={handleToggleStatus} 
              onDeleteTask={handleDeleteTask} 
              onEditTask={handleEditTask}
            />
          ) : (
            <div className="rounded-2xl bg-white shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Daily Timetable</h3>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-[10px] font-black uppercase">
                  {tasks.length} Tasks
                </span>
              </div>
              
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Task Details</th>
                      <th className="px-6 py-4">Time/Priority</th>
                      <th className="px-6 py-4">Progress</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                    {tasks.map((task) => (
                      <React.Fragment key={task.id}>
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleStatus(task)}
                              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                                task.status === 'COMPLETED'
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 shadow-sm'
                                  : 'bg-gray-100 text-gray-400 hover:text-blue-600 dark:bg-gray-700 dark:text-gray-500'
                              }`}
                            >
                              <CheckCircle size={20} />
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className={`font-bold text-gray-900 dark:text-white ${task.status === 'COMPLETED' ? 'line-through opacity-50' : ''}`}>
                                {task.category}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                                {task.notes || 'No notes added'}
                              </span>
                              <div className="flex gap-1 mt-1">
                                {task.tags?.map(tag => (
                                  <span key={tag} className="text-[10px] text-blue-500 font-medium">#{tag}</span>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                                <Clock size={14} className="text-gray-400" />
                                {task.startTime ? new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                <span className="text-gray-400 font-normal">({formatDuration(task.hours)})</span>
                              </div>
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded w-fit ${
                                task.priority === 'URGENT' ? 'bg-red-100 text-red-600 dark:bg-red-900/40' :
                                task.priority === 'HIGH' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40' :
                                task.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40' :
                                'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                              }`}>
                                {task.priority}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 w-24">
                              <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                                <span>{calculateTaskProgress(task)}%</span>
                                {task.subTasks?.length > 0 && (
                                  <button onClick={() => toggleExpand(task.id)} className="text-blue-500 hover:underline">
                                    {expandedTasks.includes(task.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                  </button>
                                )}
                              </div>
                              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                                  style={{ width: `${calculateTaskProgress(task)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditTask(task)}
                                className="p-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedTasks.includes(task.id) && task.subTasks?.length > 0 && (
                          <tr className="bg-gray-50/50 dark:bg-gray-900/30">
                            <td colSpan="5" className="px-12 py-4">
                              <div className="grid gap-3 sm:grid-cols-2">
                                {task.subTasks.map(st => (
                                  <div key={st.id} className="flex items-center gap-3">
                                    <input 
                                      type="checkbox" 
                                      checked={st.completed}
                                      onChange={() => handleToggleSubTask(task, st.id)}
                                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <span className={`text-sm ${st.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                      {st.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-50 dark:divide-gray-700">
                {tasks.map((task) => (
                  <div key={task.id} className="p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleToggleStatus(task)}
                          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                            task.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 shadow-sm'
                              : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                          }`}
                        >
                          <CheckCircle size={20} />
                        </button>
                        <div>
                          <h4 className={`font-bold text-gray-900 dark:text-white ${task.status === 'COMPLETED' ? 'line-through opacity-50' : ''}`}>
                            {task.category}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                              task.priority === 'URGENT' ? 'bg-red-100 text-red-600' :
                              task.priority === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {task.priority}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                              <Clock size={10} />
                              {task.startTime ? new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditTask(task)} className="text-gray-400 p-1">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteTask(task.id)} className="text-gray-400 p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {task.notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed px-1">
                        {task.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex-1 max-w-[150px]">
                        <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{calculateTaskProgress(task)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
                          <div className="bg-blue-600 h-1 rounded-full" style={{ width: `${calculateTaskProgress(task)}%` }}></div>
                        </div>
                      </div>
                      {task.subTasks?.length > 0 && (
                        <button 
                          onClick={() => toggleExpand(task.id)}
                          className="flex items-center gap-1 text-[10px] font-bold text-blue-600 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30"
                        >
                          {task.subTasks.length} Steps
                          {expandedTasks.includes(task.id) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                      )}
                    </div>

                    {expandedTasks.includes(task.id) && task.subTasks?.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 space-y-2">
                        {task.subTasks.map(st => (
                          <div key={st.id} className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              checked={st.completed}
                              onChange={() => handleToggleSubTask(task, st.id)}
                              className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className={`text-xs ${st.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                              {st.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {tasks.length === 0 && (
                <div className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-300 dark:text-gray-600">
                      <LayoutGrid size={48} />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No tasks found. Start planning!</p>
                  </div>
                </div>
              )}
            </div>
          )}


        </div>
      </main>
    </div>
  );
};

export default Dashboard;
