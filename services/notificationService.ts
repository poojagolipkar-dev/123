import { Notification } from '../types';

const NOTIFICATIONS_KEY = 'shree_notifications';

export const getNotifications = (): Notification[] => {
  try {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading notifications', error);
    return [];
  }
};

export const saveNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
  try {
    const notifications = getNotifications();
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false,
    };
    
    // Keep only last 50 notifications
    const updated = [newNotification, ...notifications].slice(0, 50);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    return newNotification;
  } catch (error) {
    console.error('Error saving notification', error);
    return null;
  }
};

export const markAllAsRead = () => {
  try {
    const notifications = getNotifications();
    const updated = notifications.map(n => ({ ...n, read: true }));
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error marking notifications as read', error);
    return [];
  }
};

export const clearNotifications = () => {
    localStorage.removeItem(NOTIFICATIONS_KEY);
    return [];
};
