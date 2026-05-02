import React, { useEffect, useRef } from 'react';
import { taskAPI } from '../services/api';

const NotificationManager = () => {
  const checkInterval = useRef(null);
  const notifiedTasks = useRef(new Set(JSON.parse(localStorage.getItem('devtrack_notified_tasks') || '[]')));
  const lastCheckedDate = useRef(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    // Request notification permission on mount
    const initNotifications = async () => {
      if ('Notification' in window) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      }
    };
    initNotifications();

    // Initial check
    checkUpcomingTasks();

    // Start checking for tasks every 20 seconds for high precision
    checkInterval.current = setInterval(checkUpcomingTasks, 20000);

    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
    };
  }, []);

  // Persist notified tasks to localStorage
  useEffect(() => {
    localStorage.setItem('devtrack_notified_tasks', JSON.stringify([...notifiedTasks.current]));
  }, [notifiedTasks.current.size]);

  const checkUpcomingTasks = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Clear notified tasks if date changed
      if (today !== lastCheckedDate.current) {
        notifiedTasks.current.clear();
        lastCheckedDate.current = today;
        localStorage.removeItem('devtrack_notified_tasks');
      }

      const response = await taskAPI.getTasks(today);
      const tasks = response.data;
      const now = new Date();
      
      tasks.forEach(task => {
        if (!task.startTime || task.status === 'COMPLETED') return;

        const taskTime = new Date(task.startTime);
        const timeDiff = (taskTime.getTime() - now.getTime()) / (1000 * 60); // Difference in minutes

        // 1. Upcoming Task (starts in next 10 mins)
        if (timeDiff <= 10 && timeDiff > 0 && !notifiedTasks.current.has(`${task.id}_upcoming`)) {
          sendNotification(task, 'Upcoming Task', `Your task "${task.category}" starts in ${Math.round(timeDiff)} minutes!`);
          notifiedTasks.current.add(`${task.id}_upcoming`);
        }

        // 2. Starting Now (starts in last 1 min)
        if (timeDiff <= 0 && timeDiff > -2 && !notifiedTasks.current.has(`${task.id}_now`)) {
          sendNotification(task, 'Task Starting Now', `It's time for "${task.category}"!`);
          notifiedTasks.current.add(`${task.id}_now`);
        }

        // 3. Overdue/Missed (started more than 15 mins ago and still PENDING)
        if (timeDiff <= -15 && task.status === 'PENDING' && !notifiedTasks.current.has(`${task.id}_missed`)) {
          sendNotification(task, 'Missed Task?', `"${task.category}" was scheduled to start at ${taskTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}. Is it still pending?`);
          notifiedTasks.current.add(`${task.id}_missed`);
        }
      });
    } catch (error) {
      console.error('Notification check failed:', error);
    }
  };

  const sendNotification = (task, title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const options = {
        body,
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: task.id, 
        requireInteraction: true, // Keep notification until user interacts
        silent: false,
        vibrate: [200, 100, 200]
      };

      const n = new Notification(title, options);
      
      n.onclick = () => {
        window.focus();
        n.close();
      };
    }
  };

  return null;
};

export default NotificationManager;

