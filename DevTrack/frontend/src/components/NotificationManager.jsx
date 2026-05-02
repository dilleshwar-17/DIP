import React, { useEffect, useRef } from 'react';
import { taskAPI } from '../services/api';

const NotificationManager = () => {
  const checkInterval = useRef(null);
  const notifiedTasks = useRef(new Set());

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Start checking for tasks
    checkInterval.current = setInterval(checkUpcomingTasks, 60000); // Check every minute

    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
    };
  }, []);

  const checkUpcomingTasks = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await taskAPI.getTasks(today);
      const tasks = response.data;

      const now = new Date();
      
      tasks.forEach(task => {
        if (task.startTime && task.status === 'PENDING' && !notifiedTasks.current.has(task.id)) {
          const taskTime = new Date(task.startTime);
          const timeDiff = (taskTime.getTime() - now.getTime()) / (1000 * 60); // Difference in minutes

          // If task is within 5 minutes (but not already passed)
          if (timeDiff <= 5 && timeDiff > 0) {
            sendNotification(task);
            notifiedTasks.current.add(task.id);
          }
        }
      });
    } catch (error) {
      console.error('Notification check failed', error);
    }
  };

  const sendNotification = (task) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const n = new Notification('DevTrack Task Reminder', {
        body: `Your task "${task.category}" starts in 5 minutes!`,
        icon: '/pwa-192x192.png'
      });
      
      n.onclick = () => {
        window.focus();
        n.close();
      };
    }
  };

  return null; // This is a background manager
};

export default NotificationManager;
