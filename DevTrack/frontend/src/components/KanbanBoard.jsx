import React from 'react';
import { MoreVertical, CheckCircle2, Circle, Clock, AlertCircle, Edit2, ChevronRight, ChevronLeft } from 'lucide-react';

const KanbanBoard = ({ tasks, onToggleStatus, onDeleteTask, onEditTask }) => {
  const STATUS_ORDER = ['PENDING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'];
  const columns = [
    { id: 'PENDING', title: 'To Do', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    { id: 'REVIEW', title: 'Review', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
    { id: 'COMPLETED', title: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  ];

  const getPriorityColor = (p) => {
    switch (p) {
      case 'URGENT': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
      case 'MEDIUM': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    }
  };


  const calculateProgress = (task) => {
    if (!task.subTasks || task.subTasks.length === 0) return task.status === 'COMPLETED' ? 100 : 0;
    const completed = task.subTasks.filter(st => st.completed).length;
    return Math.round((completed / task.subTasks.length) * 100);
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide min-h-[600px]">
      {columns.map(col => (
        <div key={col.id} className="flex-shrink-0 w-80">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${col.color}`}>
                {col.title}
              </span>
              <span className="text-sm font-medium text-gray-400">
                {tasks.filter(t => t.status === col.id).length}
              </span>
            </div>
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <MoreVertical size={18} />
            </button>
          </div>

          <div className="space-y-4">
            {tasks.filter(t => t.status === col.id).map(task => (
              <div 
                key={task.id} 
                className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <div className="flex gap-1">
                    {task.tags?.map(tag => (
                      <span key={tag} className="text-[10px] text-gray-400 dark:text-gray-500">#{tag}</span>
                    ))}
                  </div>
                </div>

                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                  {task.category}: {task.notes || 'No description'}
                </h4>

                {task.subTasks?.length > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1 text-[10px] font-medium text-gray-500">
                      <span>Progress</span>
                      <span>{calculateProgress(task)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${calculateProgress(task)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                    <Clock size={14} />
                    <span className="text-xs font-medium">
                      {task.startTime ? new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No time'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {task.status !== 'PENDING' && (
                      <button 
                        onClick={() => {
                          const currentIndex = STATUS_ORDER.indexOf(task.status);
                          onToggleStatus(task, STATUS_ORDER[currentIndex - 1]);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Move Back"
                      >
                        <ChevronLeft size={16} />
                      </button>
                    )}
                    
                    <button 
                      onClick={() => onEditTask(task)}
                      className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                      title="Edit Task"
                    >
                      <Edit2 size={14} />
                    </button>

                    <button 
                      onClick={() => onToggleStatus(task)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        task.status === 'COMPLETED' 
                          ? 'bg-green-50 text-green-600 dark:bg-green-900/30' 
                          : 'bg-gray-50 text-gray-400 hover:text-blue-600 dark:bg-gray-700'
                      }`}
                      title={task.status === 'COMPLETED' ? 'Completed' : 'Move Forward'}
                    >
                      {task.status === 'COMPLETED' ? <CheckCircle2 size={16} /> : <ChevronRight size={16} />}
                    </button>
                    
                    <button 
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                      title="Delete Task"
                    >
                      <AlertCircle size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {tasks.filter(t => t.status === col.id).length === 0 && (
              <div className="border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl p-8 text-center">
                <span className="text-xs text-gray-300 dark:text-gray-600 font-medium">Empty column</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
