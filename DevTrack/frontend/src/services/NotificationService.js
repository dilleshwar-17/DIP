import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

class NotificationService {
  constructor() {
    this.scheduledTimeouts = new Map();
  }

  async requestPermission() {
    if (Capacitor.isNativePlatform()) {
      const status = await LocalNotifications.requestPermissions();
      return status.display === 'granted';
    } else if ('Notification' in window) {
      const status = await Notification.requestPermission();
      return status === 'granted';
    }
    return false;
  }

  async scheduleTaskReminder(task) {
    if (!task.startTime || task.status === 'COMPLETED') return;

    const taskTime = new Date(task.startTime);
    const reminderTime = new Date(taskTime.getTime() - 5 * 60 * 1000); // 5 minutes before

    // If reminder time has already passed, don't schedule
    if (reminderTime < new Date()) return;

    const title = `Upcoming Task: ${task.category}`;
    const body = task.notes ? `Reminder: ${task.notes}` : `Your task starts in 5 minutes.`;

    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: task.id.split('-').reduce((acc, char) => acc + char.charCodeAt(0), 0),
            schedule: { at: reminderTime },
            sound: 'default',
          },
        ],
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      const timeout = reminderTime.getTime() - Date.now();
      
      // Clear existing timeout for this task if any
      if (this.scheduledTimeouts.has(task.id)) {
        clearTimeout(this.scheduledTimeouts.get(task.id));
      }

      // Ensure timeout is positive and reasonable (within 24 hours)
      if (timeout > 0 && timeout < 24 * 60 * 60 * 1000) {
        const timeoutId = setTimeout(async () => {
          // Use Service Worker for better background support if available
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            registration.showNotification(title, {
              body,
              icon: '/logo192.png',
              badge: '/logo192.png',
              vibrate: [200, 100, 200],
              tag: task.id // Avoid duplicate notifications
            });
          } else {
            new Notification(title, { body, icon: '/logo192.png' });
          }
          this.scheduledTimeouts.delete(task.id);
        }, timeout);
        
        this.scheduledTimeouts.set(task.id, timeoutId);
      }
    }
  }

  async scheduleAllReminders(tasks) {
    // 1. Handle Native Platform
    if (Capacitor.isNativePlatform()) {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel(pending);
      }
    } else {
      // 2. Handle Web Platform: Clear all existing timeouts
      this.scheduledTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
      this.scheduledTimeouts.clear();
    }

    // 3. Schedule for all tasks
    tasks.forEach(task => {
      this.scheduleTaskReminder(task);
    });
  }
}

export default new NotificationService();
