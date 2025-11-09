const API_BASE = "https://villagelink.site/backend/api";

class NotificationsService {
  constructor() {
    if (NotificationsService.instance) {
      return NotificationsService.instance;
    }
    NotificationsService.instance = this;
  }

  async getNotifications(userId) {
    try {
      const response = await fetch(`${API_BASE}/notifications/get_notifications.php?user_id=${userId}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch notifications');
      }

      return result.data.map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        read: notification.read_status === '1' || notification.read_status === true,
        timestamp: new Date(notification.timestamp),
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async addNotification(userId, title, message) {
    try {
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('title', title);
      formData.append('message', message);

      const response = await fetch(`${API_BASE}/notifications/add_notification.php`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to add notification');
      }

      return result.data;
    } catch (error) {
      console.error('Error adding notification:', error);
      throw error;
    }
  }

  async markAsRead(notificationId) {
    try {
      const formData = new FormData();
      formData.append('notification_id', notificationId);

      const response = await fetch(`${API_BASE}/notifications/mark_read.php`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to mark notification as read');
      }

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId) {
    try {
      const formData = new FormData();
      formData.append('user_id', userId);

      const response = await fetch(`${API_BASE}/notifications/mark_all_read.php`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to mark all notifications as read');
      }

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async clearNotifications(userId) {
    try {
      const formData = new FormData();
      formData.append('user_id', userId);

      const response = await fetch(`${API_BASE}/notifications/clear_notifications.php`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to clear notifications');
      }

      return true;
    } catch (error) {
      console.error('Error clearing notifications:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const notificationsService = new NotificationsService();
