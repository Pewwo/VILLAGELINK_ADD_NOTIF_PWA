import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { pollingService } from '../services/polling';
import { requestPollingService } from '../services/requestPolling';
import { officialsPollingService } from '../services/officialsPolling';
import { faqsPollingService } from '../services/faqsPolling';
import { notificationsService } from '../services/notificationsService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Load notifications from backend
  useEffect(() => {
    isMounted.current = true;

    const loadNotifications = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      try {
        const dbNotifications = await notificationsService.getNotifications(userId);

        const sorted = dbNotifications
          .map(n => ({
            ...n,
            timestamp: new Date(n.timestamp || Date.now()),
            read: n.read === 1 || n.read === true,
            type: n.type || 'announcement',
          }))
          .sort((a, b) => b.timestamp - a.timestamp);

        if (isMounted.current) setNotifications(sorted);
      } catch (error) {
        console.error('❌ Failed to load notifications:', error);
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, []);

  // Add notification (avoid duplicates)
  const addNotification = async (notification) => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const newNotification = {
      id: Date.now(),
      title: notification.title,
      message: notification.message,
      read: false,
      timestamp: new Date(),
      type: notification.type || 'announcement',
    };

    setNotifications(prev => {
      const exists = prev.find(n =>
        n.type === newNotification.type && n.message === newNotification.message
      );
      if (exists) return prev;
      return [newNotification, ...prev];
    });

    try {
      await notificationsService.addNotification(userId, newNotification.title, newNotification.message);
    } catch (error) {
      console.error('❌ Failed to add notification to backend:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await notificationsService.markAsRead(id);
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
    } finally {
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    }
  };

  const markAllAsRead = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
      await notificationsService.markAllAsRead(userId);
    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error);
    } finally {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const clearNotifications = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
      await notificationsService.clearNotifications(userId);
    } catch (error) {
      console.error('❌ Failed to clear notifications:', error);
    } finally {
      setNotifications([]);
    }
  };

  // Polling listeners
  useEffect(() => {
    pollingService.startPolling();
    requestPollingService.startPolling();
    officialsPollingService.startPolling();
    faqsPollingService.startPolling();

    const handleNewAnnouncement = (announcement) => {
      addNotification({
        title: '📢 New Announcement',
        message: announcement.title || 'A new announcement has been posted.',
        type: 'announcement',
      });
    };

    const handleRequestUpdate = (request) => {
      const userId = localStorage.getItem('userId');
      if (request.user_id == userId) {
        addNotification({
          title: '📩 Request Update',
          message: `Your request "${request.complaint || 'Request'}" has been updated.`,
          type: 'request',
        });
      }
    };

    const handleNewOfficial = (official) => {
      addNotification({
        title: '🏛️ New Official',
        message: `New official added: ${official.name || 'Unnamed official'}.`,
        type: 'official',
      });
    };

    const handleNewFaq = (faq) => {
      addNotification({
        title: '❓ New FAQ Added',
        message: faq.question || 'A new FAQ has been published.',
        type: 'faq',
      });
    };

    pollingService.addListener('new_announcement', handleNewAnnouncement);
    requestPollingService.addListener('updated_request', handleRequestUpdate);
    officialsPollingService.addListener('new_official', handleNewOfficial);
    faqsPollingService.addListener('new_faq', handleNewFaq);

    return () => {
      pollingService.removeListener('new_announcement', handleNewAnnouncement);
      requestPollingService.removeListener('updated_request', handleRequestUpdate);
      officialsPollingService.removeListener('new_official', handleNewOfficial);
      faqsPollingService.removeListener('new_faq', handleNewFaq);
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        isLoading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
