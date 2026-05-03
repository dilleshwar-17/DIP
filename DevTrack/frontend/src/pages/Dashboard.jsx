import React, { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import TaskForm from '../components/TaskForm';
import AnalyticsCharts from '../components/AnalyticsCharts';
import KanbanBoard from '../components/KanbanBoard';
import { aiAPI } from '../services/api';
import NotificationService from '../services/NotificationService';
import { Clock, CheckCircle, TrendingUp, Trash2, LayoutGrid, Calendar as CalendarIcon, ChevronRight, ChevronDown, Sparkles, Loader2, Bell, Activity, Edit2, Mic, MicOff } from 'lucide-react';
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
  const [editingTask, setEditingTask] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const [dailyTip, setDailyTip] = useState('');
  const [scheduleOptimization, setScheduleOptimization] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const init = async () => {
      const status = await NotificationService.checkPermission();
      setNotificationsEnabled(status === 'granted');
      
      try {
        const res = await aiAPI.getMotivation();
        setDailyTip(res.data.tip);
      } catch (e) {}
    };
    init();

    // Sync on focus
    const handleFocus = () => {
      console.log('App focused, syncing data...');
      fetchData();
    };
    window.addEventListener('focus', handleFocus);

    // Periodic sync (every 60 seconds)
    const interval = setInterval(() => {
      console.log('Periodic sync...');
      fetchData();
    }, 60000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
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

  const handleOptimizeSchedule = async () => {
    setIsOptimizing(true);
    try {
      const res = await aiAPI.optimizeSchedule(tasks, timeframe);
      setScheduleOptimization(res.data.suggestions);
    } catch (error) {
      console.error('Optimization failed', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleVoiceCommand = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice commands are not supported in your browser.");
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      setVoiceStatus('Listening...');
    };

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setVoiceStatus(`Parsing: "${text}"`);
      
      try {
        const res = await aiAPI.parseTask(text);
        const taskData = res.data;
        
        // Map the AI response to the actual task creation
        await taskAPI.createTask({
          ...taskData,
          date: taskData.date || new Date().toISOString().split('T')[0],
          status: 'PENDING'
        });
        
        fetchData();
        setVoiceStatus('Task added successfully!');
        setTimeout(() => setVoiceStatus(''), 3000);
      } catch (error) {
        console.error('Failed to parse voice command', error);
        setVoiceStatus('Failed to understand command.');
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
      setVoiceStatus('');
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(59,130,246,0.1),transparent)] pointer-events-none"></div>
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
                  {dailyTip && (
                    <p className="mt-1 text-sm font-medium text-blue-600 dark:text-blue-400 animate-in fade-in slide-in-from-bottom-2">
                      “{dailyTip}”
                    </p>
                  )}
                </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 glass p-2 rounded-2xl shadow-lg border border-white/20">
                <div className="flex bg-gray-100/50 dark:bg-gray-800/50 rounded-xl p-1 backdrop-blur-sm">
                  <button 
                    onClick={() => setView('timetable')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'timetable' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500'}`}
                  >
                    <CalendarIcon size={14} />
                    Timetable
                  </button>
                  <button 
                    onClick={() => setView('kanban')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'kanban' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500'}`}
                  >
                    <LayoutGrid size={14} />
                    Kanban
                  </button>
                </div>

                <div className="flex items-center gap-3 px-2">
                  <div className={`p-1.5 rounded-lg ${notificationsEnabled ? 'text-green-600 bg-green-50 dark:bg-green-900/30' : 'text-amber-600 bg-amber-50 dark:bg-amber-900/30'}`}>
                    <Bell size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-tight text-gray-500">
                      {notificationsEnabled ? 'Reminders Active' : 'Notifications Off'}
                    </span>
                    {!notificationsEnabled ? (
                      <button 
                        onClick={async () => {
                          const granted = await NotificationService.requestPermission();
                          setNotificationsEnabled(granted);
                        }}
                        className="text-[9px] font-bold text-blue-600 hover:underline text-left"
                      >
                        Enable Notifications
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          const testTask = {
                            id: 'test-' + Date.now(),
                            category: 'Test Alert',
                            notes: 'System is ready!',
                            startTime: new Date(Date.now() + 6000).toISOString(), 
                            status: 'PENDING'
                          };
                          NotificationService.scheduleTaskReminder(testTask);
                          alert('Test scheduled for 6 seconds from now. Close the app to test background support.');
                        }}
                        className="text-[9px] font-bold text-blue-600 hover:underline text-left"
                      >
                        Test System
                      </button>
                    )}
                  </div>
                </div>

                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-xl border border-white/10">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="border-none bg-transparent text-sm font-bold text-gray-900 dark:text-white focus:ring-0 cursor-pointer"
                    />
                  </div>
                  <div className="glass px-3 py-1.5 rounded-xl border border-white/10">
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

                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>

                <div className="flex items-center gap-2 px-2">
                  <button
                    onClick={handleVoiceCommand}
                    className={`p-2 rounded-full transition-all ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                    title="Voice Command"
                  >
                    {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                  {voiceStatus && (
                    <span className="text-[10px] font-bold text-blue-600 animate-fade-in truncate max-w-[100px]">
                      {voiceStatus}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </header>




          {/* Stats Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <div className="glass-card p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100/50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Study Hours</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentStats ? formatDuration(currentStats.totalHours) : '0:00'}</p>
              </div>
            </div>

            <div className="glass-card p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100/50 text-green-600 dark:bg-green-900/30 dark:text-green-400 group-hover:scale-110 transition-transform">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentStats?.completedTasks || 0}</p>
              </div>
            </div>

            <div className="glass-card p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100/50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 group-hover:scale-110 transition-transform">
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

          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            <div className="glass-card p-8 text-white bg-gradient-to-br from-indigo-600/90 to-purple-700/90 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles size={120} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                    <Sparkles className="text-yellow-300" />
                  </div>
                  <h3 className="text-xl font-bold">Productivity Coach</h3>
                </div>
                <div className="text-indigo-50 text-sm leading-relaxed mb-6 min-h-[80px]">
                  {aiInsights ? (
                    <ul className="space-y-2">
                      {aiInsights.split('\n').filter(line => line.trim()).map((line, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-yellow-300 shrink-0">•</span>
                          <span>{line.replace(/^•\s*/, '')}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "Get personalized AI feedback on your performance and learn how to optimize your workflow."
                  )}
                </div>
                <button 
                  onClick={handleGetInsights}
                  disabled={isLoadingInsights}
                  className="w-full flex items-center justify-center gap-2 bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-50 transition-all disabled:opacity-50 active:scale-95"
                >
                  {isLoadingInsights ? <Loader2 className="animate-spin" size={18} /> : <TrendingUp size={18} />}
                  {aiInsights ? 'Refresh Analysis' : 'Get Analysis'}
                </button>
              </div>
            </div>

            <div className="glass-card p-8 text-white bg-gradient-to-br from-blue-600/90 to-cyan-700/90 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity size={120} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                    <Activity className="text-cyan-300" />
                  </div>
                  <h3 className="text-xl font-bold">Schedule Optimizer</h3>
                </div>
                <div className="text-cyan-50 text-sm leading-relaxed mb-6 min-h-[80px]">
                  {scheduleOptimization ? (
                    <ul className="space-y-2">
                      {scheduleOptimization.split('\n').filter(line => line.trim()).map((line, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-cyan-300 shrink-0">•</span>
                          <span>{line.replace(/^•\s*/, '')}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "Let AI analyze your timetable and suggest improvements for better time management."
                  )}
                </div>
                <button 
                  onClick={handleOptimizeSchedule}
                  disabled={isOptimizing}
                  className="w-full flex items-center justify-center gap-2 bg-white text-cyan-700 px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-cyan-50 transition-all disabled:opacity-50 active:scale-95"
                >
                  {isOptimizing ? <Loader2 className="animate-spin" size={18} /> : <LayoutGrid size={18} />}
                  {scheduleOptimization ? 'Re-optimize' : 'Optimize Schedule'}
                </button>
              </div>
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
            <div className="mb-8 glass-card overflow-hidden">
              <div className="p-4 md:p-6 border-b border-white/10 dark:border-white/5 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Daily Timetable</h3>
                <span className="px-3 py-1 bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-full text-[10px] font-black uppercase">
                  {tasks.length} Tasks
                </span>
              </div>
              
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 dark:bg-gray-900/30 text-[10px] uppercase font-bold text-gray-400 tracking-widest">
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
