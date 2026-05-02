import React, { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import TaskForm from '../components/TaskForm';
import AnalyticsCharts from '../components/AnalyticsCharts';
import KanbanBoard from '../components/KanbanBoard';
import { Clock, CheckCircle, TrendingUp, Trash2, LayoutGrid, Calendar as CalendarIcon, ChevronRight, ChevronDown } from 'lucide-react';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [timeframe, setTimeframe] = useState('weekly');
  const [view, setView] = useState('timetable'); // timetable or kanban
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedTasks, setExpandedTasks] = useState([]);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

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

  const currentStats = analytics ? analytics[timeframe] : null;

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

  const handleToggleSubTask = async (task, subTaskId) => {
    try {
      const updatedSubTasks = task.subTasks.map(st => 
        st.id === subTaskId ? { ...st, completed: !st.completed } : st
      );
      await taskAPI.updateTask(task.id, { subTasks: updatedSubTasks });
      fetchData();
    } catch (error) {
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

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-hidden`}>
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage your daily routine and track progress.</p>
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
          </header>

          {/* Stats Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <div className="group rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex items-center gap-4 dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Study Hours</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentStats?.totalHours?.toFixed(1) || 0}h</p>
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

          <TaskForm onSubmit={handleAddTask} />

          <div className="mb-8">
            <AnalyticsCharts data={currentStats} title={timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} />
          </div>

          {view === 'kanban' ? (
            <KanbanBoard 
              tasks={tasks} 
              onToggleStatus={handleToggleStatus} 
              onDeleteTask={handleDeleteTask} 
            />
          ) : (
            <div className="rounded-2xl bg-white shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Daily Timetable</h3>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-bold">
                  {tasks.length} Tasks Scheduled
                </span>
              </div>
              <div className="overflow-x-auto">
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
                                <span className="text-gray-400 font-normal">({task.hours}h)</span>
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
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={18} />
                            </button>
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
                    {tasks.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full">
                              <LayoutGrid size={48} className="text-gray-300 dark:text-gray-600" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No tasks found for this date. Start planning!</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
