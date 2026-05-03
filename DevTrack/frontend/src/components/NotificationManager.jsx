import { useEffect } from 'react';
import NotificationService from '../services/NotificationService';
import { taskAPI } from '../services/api';

const NotificationManager = () => {
  useEffect(() => {
    // 1. Request permission on app start
    NotificationService.requestPermission();

    // 2. Initial sync for notifications
    const syncNotifications = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await taskAPI.getTasks(today);
        NotificationService.scheduleAllReminders(response.data);
      } catch (error) {
        console.error('Failed to sync notifications on start:', error);
      }
    };

    syncNotifications();
  }, []);

  return null;
};

export default NotificationManager;


