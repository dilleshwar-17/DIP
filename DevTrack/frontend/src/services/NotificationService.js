import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

class NotificationService {
  constructor() {
    this.scheduledTimeouts = new Map();
  }

  async checkPermission() {
    if (Capacitor.isNativePlatform()) {
      const status = await LocalNotifications.checkPermissions();
      return status.display;
    } else if ('Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  }

  async requestPermission() {
    try {
      if (Capacitor.isNativePlatform()) {
        const status = await LocalNotifications.requestPermissions();
        return status.display === 'granted';
      } else if ('Notification' in window) {
        const status = await Notification.requestPermission();
        return status === 'granted';
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
    return false;
  }

  async scheduleTaskReminder(task) {
    if (!task.startTime || task.status === 'COMPLETED') return;

    const taskTime = new Date(task.startTime);
    const now = new Date();

    // 1. Reminder: 5 minutes before
    const reminderTime = new Date(taskTime.getTime() - 5 * 60 * 1000);
    if (reminderTime > now) {
      this._doSchedule(task.id + '_pre', `Upcoming: ${task.category}`, `Your task starts in 5 minutes.`, reminderTime);
    }

    // 2. Reminder: Exactly at start
    if (taskTime > now) {
      this._doSchedule(task.id + '_start', `Task Starting: ${task.category}`, `It's time to start: ${task.category}`, taskTime);
    }
  }

  async _doSchedule(id, title, body, date) {
    if (Capacitor.isNativePlatform()) {
      try {
        // Convert string ID to numeric for Capacitor (must be 32-bit int)
        const numericId = Math.abs(id.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)) | 0;
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: numericId,
              schedule: { at: date },
              sound: 'default',
              extra: { originalId: id }
            },
          ],
        });
      } catch (error) {
        console.error('Failed to schedule native notification:', error);
      }
    } else if ('Notification' in window && Notification.permission === 'granted') {
      const timeout = date.getTime() - Date.now();
      
      if (this.scheduledTimeouts.has(id)) {
        clearTimeout(this.scheduledTimeouts.get(id));
      }

      if (timeout > 0 && timeout < 48 * 60 * 60 * 1000) { 
        const timeoutId = setTimeout(async () => {
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            registration.showNotification(title, {
              body,
              icon: '/logo192.png',
              badge: '/logo192.png',
              vibrate: [200, 100, 200],
              tag: id
            });
          } else {
            new Notification(title, { body, icon: '/logo192.png' });
          }
          this.scheduledTimeouts.delete(id);
        }, timeout);
        
        this.scheduledTimeouts.set(id, timeoutId);
      }
    }
  }

  async scheduleAllReminders(tasks) {
    if (Capacitor.isNativePlatform()) {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel(pending);
      }
    } else {
      this.scheduledTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
      this.scheduledTimeouts.clear();
    }

    tasks.forEach(task => {
      this.scheduleTaskReminder(task);
    });
  }
}

export default new NotificationService();
