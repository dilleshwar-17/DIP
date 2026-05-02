import React, { useEffect, useRef } from 'react';
import { taskAPI } from '../services/api';

const NotificationManager = () => {
  const checkInterval = useRef(null);
  const notifiedTasks = useRef(new Set());
  const lastCheckedDate = useRef(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    // Request notification permission on mount if default
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Initial check
    checkUpcomingTasks();

    // Start checking for tasks every 30 seconds for better precision
    checkInterval.current = setInterval(checkUpcomingTasks, 30000);

    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
    };
  }, []);

  const checkUpcomingTasks = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Clear notified tasks if date changed
      if (today !== lastCheckedDate.current) {
        notifiedTasks.current.clear();
        lastCheckedDate.current = today;
      }

      const response = await taskAPI.getTasks(today);
      const tasks = response.data;
      const now = new Date();
      
      tasks.forEach(task => {
        // Only notify for PENDING tasks that have a startTime
        if (task.startTime && task.status === 'PENDING' && !notifiedTasks.current.has(task.id)) {
          const taskTime = new Date(task.startTime);
          const timeDiff = (taskTime.getTime() - now.getTime()) / (1000 * 60); // Difference in minutes

          // Wider window (6 mins) to account for background throttling
          // but ensure it's not too far in the past
          if (timeDiff <= 6 && timeDiff > -2) {
            sendNotification(task);
            notifiedTasks.current.add(task.id);
          }
        }
      });
    } catch (error) {
      console.error('Notification check failed:', error);
    }
  };

  const sendNotification = (task) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = 'DevTrack Reminder';
      const options = {
        body: `Your task "${task.category}" starts soon!`,
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: task.id, // Prevent duplicate notifications for same task
        renotify: true
      };

      // Browser Notification
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

