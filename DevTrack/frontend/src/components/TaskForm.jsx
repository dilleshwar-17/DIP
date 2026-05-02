import React, { useState } from 'react';
import { Plus, X, ListTodo, Tag as TagIcon, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { aiAPI } from '../services/api';

const TaskForm = ({ onSubmit }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [hours, setHours] = useState('');
  const [category, setCategory] = useState('DSA');
  const [notes, setNotes] = useState('');
  const [isRoutine, setIsRoutine] = useState(false);
  const [priority, setPriority] = useState('MEDIUM');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [subTaskInput, setSubTaskInput] = useState('');
  const [subTasks, setSubTasks] = useState([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleAiSuggest = async () => {
    if (!notes && category === 'Other') return;
    
    setIsSuggesting(true);
    try {
      // Use notes if available, otherwise category
      const title = notes || category;
      const res = await aiAPI.suggestSubTasks(title, category);
      const suggestions = res.data.map(title => ({ title, completed: false }));
      setSubTasks([...subTasks, ...suggestions]);
    } catch (error) {
      console.error('AI Suggestion Failed:', error);
      alert(error.response?.data?.error || 'Failed to get suggestions. Make sure GEMINI_API_KEY is configured.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddSubTask = (e) => {
    if (e.key === 'Enter' && subTaskInput.trim()) {
      e.preventDefault();
      setSubTasks([...subTasks, { title: subTaskInput.trim(), completed: false }]);
      setSubTaskInput('');
    }
  };

  const removeSubTask = (index) => {
    setSubTasks(subTasks.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let fullStartTime = null;
    
    if (startTime) {
      const [hoursPart, minutesPart] = startTime.split(':');
      fullStartTime = new Date(date);
      fullStartTime.setHours(parseInt(hoursPart), parseInt(minutesPart), 0, 0);
    }

    let decimalHours = 0;
    if (hours) {
      const [h, m] = hours.split(':').map(Number);
      decimalHours = h + (m / 60);
    }

    onSubmit({ 
      date, 
      startTime: fullStartTime, 
      hours: decimalHours, 
      category, 
      notes,
      isRoutine,
      priority,
      tags,
      subTasks
    });
    
    // Reset fields
    setHours('');
    setNotes('');
    setStartTime('');
    setTags([]);
    setSubTasks([]);
    setIsRoutine(false);
    setPriority('MEDIUM');
  };

  const priorityColors = {
    URGENT: 'bg-red-500 text-white',
    HIGH: 'bg-orange-500 text-white',
    MEDIUM: 'bg-blue-500 text-white',
    LOW: 'bg-gray-500 text-white'
  };

  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl border border-gray-100 dark:bg-gray-800 dark:border-gray-700 mb-8 transition-all hover:shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
          <ListTodo size={24} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Plan Your Next Goal</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:bg-gray-700/50 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:bg-gray-700/50 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Duration (HH:mm)</label>
            <input
              type="time"
              required
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:bg-gray-700/50 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:bg-gray-700/50 dark:border-gray-600 dark:text-white"
            >
              <option value="DSA">DSA</option>
              <option value="Python">Python</option>
              <option value="Project">Project</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="Health">Health</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Priority Level</label>
            <div className="flex gap-2">
              {['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 px-1 rounded-lg text-[10px] font-bold transition-all ${
                    priority === p 
                      ? priorityColors[p] + ' ring-2 ring-offset-2 ring-gray-200 dark:ring-gray-900' 
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tags (Enter to add)</label>
            <div className="flex flex-wrap gap-2 p-2 min-h-[46px] rounded-xl border border-gray-200 bg-gray-50/50 dark:bg-gray-700/50 dark:border-gray-600">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-md text-xs font-medium">
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-900"><X size={12} /></button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Add tags..."
                className="flex-1 bg-transparent border-none outline-none text-sm min-w-[100px] dark:text-white"
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Sub-tasks (Enter to add)</label>
            <button
              type="button"
              onClick={handleAiSuggest}
              disabled={isSuggesting}
              className="flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-50 text-purple-600 text-xs font-bold hover:bg-purple-100 transition-colors disabled:opacity-50 dark:bg-purple-900/30 dark:text-purple-400"
            >
              {isSuggesting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isSuggesting ? 'Thinking...' : 'AI Suggest Steps'}
            </button>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={subTaskInput}
                onChange={(e) => setSubTaskInput(e.target.value)}
                onKeyDown={handleAddSubTask}
                placeholder="What are the steps?"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm pr-12 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:bg-gray-700/50 dark:border-gray-600 dark:text-white"
              />
              <button type="button" onClick={() => handleAddSubTask({ key: 'Enter', preventDefault: () => {} })} className="absolute right-3 top-2.5 p-1 text-gray-400 hover:text-blue-600">
                <Plus size={20} />
              </button>
            </div>
            {subTasks.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {subTasks.map((st, index) => (
                  <div key={index} className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800/50 rounded-lg group">
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{st.title}</span>
                    <button type="button" onClick={() => removeSubTask(index)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-10 h-6 rounded-full transition-all relative ${isRoutine ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isRoutine ? 'translate-x-4' : ''}`}></div>
            </div>
            <input
              type="checkbox"
              hidden
              checked={isRoutine}
              onChange={(e) => setIsRoutine(e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-blue-600">Repeat as Daily Routine</span>
          </label>

          <button
            type="submit"
            className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] focus:outline-none"
          >
            <Plus size={20} />
            Schedule Task
          </button>
        </div>

      </form>
    </div>
  );
};

export default TaskForm;
