import React, { useState } from 'react';
import { Plus } from 'lucide-react';

const TaskForm = ({ onSubmit }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [hours, setHours] = useState('');
  const [category, setCategory] = useState('DSA');
  const [notes, setNotes] = useState('');
  const [isRoutine, setIsRoutine] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const taskDate = new Date(date);
    let fullStartTime = null;
    
    if (startTime) {
      const [hoursPart, minutesPart] = startTime.split(':');
      fullStartTime = new Date(date);
      fullStartTime.setHours(parseInt(hoursPart), parseInt(minutesPart), 0, 0);
    }

    onSubmit({ 
      date, 
      startTime: fullStartTime, 
      hours: parseFloat(hours), 
      category, 
      notes,
      isRoutine
    });
    setHours('');
    setNotes('');
    setStartTime('');
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Schedule New Task</h3>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6 items-end">
        
        <div className="lg:col-span-1">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="lg:col-span-1">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="lg:col-span-1">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (Hrs)</label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            required
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="e.g. 2.5"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="lg:col-span-1">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="DSA">DSA</option>
            <option value="Python">Python</option>
            <option value="Project">Project</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="lg:col-span-1">
          <label className="flex items-center gap-2 cursor-pointer mb-2">
            <input
              type="checkbox"
              checked={isRoutine}
              onChange={(e) => setIsRoutine(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Daily Routine</span>
          </label>
        </div>

        <div className="lg:col-span-1">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-blue-50 dark:hover:bg-blue-600"
          >
            <Plus size={16} />
            Schedule
          </button>
        </div>

        <div className="lg:col-span-6">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (Optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What did you learn?"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

      </form>
    </div>
  );
};

export default TaskForm;
