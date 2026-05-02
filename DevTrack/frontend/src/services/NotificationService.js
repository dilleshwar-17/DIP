import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

class NotificationService {
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
    if (!task.startTime) return;

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
            id: task.id.split('-').reduce((acc, char) => acc + char.charCodeAt(0), 0), // Numeric ID for Capacitor
            schedule: { at: reminderTime },
            sound: 'default',
            attachments: [],
            actionTypeId: '',
            extra: null,
          },
        ],
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      const timeout = reminderTime.getTime() - Date.now();
      // Ensure timeout is positive and reasonable
      if (timeout > 0 && timeout < 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          new Notification(title, { body, icon: '/logo192.png', badge: '/logo192.png' });
        }, timeout);
      }
    }

  }

  async scheduleAllReminders(tasks) {
    if (Capacitor.isNativePlatform()) {
      // Clear existing to avoid duplicates
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel(pending);
      }
    }

    tasks.forEach(task => {
      if (task.status !== 'COMPLETED') {
        this.scheduleTaskReminder(task);
      }
    });
  }
}

export default new NotificationService();
