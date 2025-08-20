'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { optimizedSupabase } from '@/lib/performance';
import { cacheManager } from '@/lib/cache';
import { useToast } from '@/hooks/use-toast';

// Types
interface Notification {
  id: string;
  user_id: string;
  type: 'attendance' | 'session' | 'announcement' | 'grade' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  expires_at?: string;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  sendNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => Promise<void>;
  subscribeToUserNotifications: (userId: string) => void;
  unsubscribeFromNotifications: () => void;
}

// Context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Hook
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Provider Component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const client = optimizedSupabase.getClient();

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Load initial notifications
  const loadNotifications = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      
      // Try cache first
      const cached = cacheManager.get(`notifications_${userId}`);
      if (cached) {
        setNotifications(cached);
        setLoading(false);
        return;
      }

      const { data, error } = await client
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setNotifications(data || []);
      
      // Cache the results
      cacheManager.set(`notifications_${userId}`, data || [], {
        ttl: 2 * 60 * 1000, // 2 minutes
        tags: ['notifications', `user_${userId}`],
      });

    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [client, toast]);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await client
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );

      // Invalidate cache
      const userId = notifications.find(n => n.id === id)?.user_id;
      if (userId) {
        cacheManager.remove(`notifications_${userId}`);
      }

    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  }, [client, notifications, toast]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      
      if (unreadIds.length === 0) return;

      const { error } = await client
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );

      // Invalidate cache
      const userId = notifications[0]?.user_id;
      if (userId) {
        cacheManager.remove(`notifications_${userId}`);
      }

    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  }, [client, notifications, toast]);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      const { error } = await client
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== id));

      // Invalidate cache
      const userId = notifications.find(n => n.id === id)?.user_id;
      if (userId) {
        cacheManager.remove(`notifications_${userId}`);
      }

    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  }, [client, notifications, toast]);

  // Send notification
  const sendNotification = useCallback(async (notification: Omit<Notification, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await client
        .from('notifications')
        .insert([notification])
        .select()
        .single();

      if (error) throw error;

      // If it's for the current user, add to local state
      if (data && notifications.some(n => n.user_id === data.user_id)) {
        setNotifications(prev => [data, ...prev]);
      }

      // Invalidate cache
      cacheManager.remove(`notifications_${notification.user_id}`);

      return data;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }, [client, notifications]);

  // Subscribe to real-time notifications
  const subscribeToUserNotifications = useCallback((userId: string) => {
    console.log('Subscribing to notifications for user:', userId);
    
    // Load initial notifications
    loadNotifications(userId);

    // Setup real-time subscription
    const channel = client
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Notification change received:', payload);
          
          const { eventType, new: newRecord, old: oldRecord } = payload;

          switch (eventType) {
            case 'INSERT':
              if (newRecord) {
                setNotifications(prev => [newRecord as Notification, ...prev]);
                
                // Show toast for new notifications
                const notification = newRecord as Notification;
                if (notification.priority === 'high' || notification.priority === 'urgent') {
                  toast({
                    title: notification.title,
                    description: notification.message,
                    variant: notification.priority === 'urgent' ? 'destructive' : 'default',
                  });
                }
              }
              break;

            case 'UPDATE':
              if (newRecord) {
                setNotifications(prev =>
                  prev.map(n => n.id === newRecord.id ? newRecord as Notification : n)
                );
              }
              break;

            case 'DELETE':
              if (oldRecord) {
                setNotifications(prev => prev.filter(n => n.id !== oldRecord.id));
              }
              break;
          }

          // Invalidate cache
          cacheManager.remove(`notifications_${userId}`);
        }
      )
      .subscribe((status) => {
        console.log('Notification subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('Unsubscribing from notifications');
      channel.unsubscribe();
      setIsConnected(false);
    };
  }, [client, loadNotifications, toast]);

  // Unsubscribe from notifications
  const unsubscribeFromNotifications = useCallback(() => {
    client.removeAllChannels();
    setIsConnected(false);
    setNotifications([]);
  }, [client]);

  // Auto-cleanup expired notifications
  useEffect(() => {
    const cleanup = () => {
      const now = new Date();
      setNotifications(prev => 
        prev.filter(n => !n.expires_at || new Date(n.expires_at) > now)
      );
    };

    // Run cleanup every minute
    const interval = setInterval(cleanup, 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isConnected,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendNotification,
    subscribeToUserNotifications,
    unsubscribeFromNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Notification utility functions
export const NotificationUtils = {
  // Send attendance reminder
  sendAttendanceReminder: async (userId: string, sessionDetails: any) => {
    const notification: Omit<Notification, 'id' | 'created_at'> = {
      user_id: userId,
      type: 'attendance',
      title: 'Attendance Reminder',
      message: `Don't forget to mark your attendance for ${sessionDetails.course_name}`,
      data: { session_id: sessionDetails.id },
      is_read: false,
      priority: 'normal',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };

    return await optimizedSupabase.getClient()
      .from('notifications')
      .insert([notification]);
  },

  // Send low attendance warning
  sendLowAttendanceWarning: async (userId: string, attendancePercentage: number) => {
    const notification: Omit<Notification, 'id' | 'created_at'> = {
      user_id: userId,
      type: 'attendance',
      title: 'Low Attendance Warning',
      message: `Your attendance is ${attendancePercentage}%. Please attend classes regularly.`,
      data: { attendance_percentage: attendancePercentage },
      is_read: false,
      priority: 'high',
    };

    return await optimizedSupabase.getClient()
      .from('notifications')
      .insert([notification]);
  },

  // Send session cancellation
  sendSessionCancellation: async (userIds: string[], sessionDetails: any) => {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type: 'session' as const,
      title: 'Class Cancelled',
      message: `${sessionDetails.course_name} class scheduled for ${sessionDetails.scheduled_date} has been cancelled.`,
      data: { session_id: sessionDetails.id },
      is_read: false,
      priority: 'high' as const,
    }));

    return await optimizedSupabase.getClient()
      .from('notifications')
      .insert(notifications);
  },

  // Send grade update
  sendGradeUpdate: async (userId: string, gradeDetails: any) => {
    const notification: Omit<Notification, 'id' | 'created_at'> = {
      user_id: userId,
      type: 'grade',
      title: 'Grade Updated',
      message: `Your grade for ${gradeDetails.course_name} has been updated.`,
      data: { grade_id: gradeDetails.id },
      is_read: false,
      priority: 'normal',
    };

    return await optimizedSupabase.getClient()
      .from('notifications')
      .insert([notification]);
  },

  // Send system announcement
  sendSystemAnnouncement: async (userIds: string[], title: string, message: string) => {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type: 'announcement' as const,
      title,
      message,
      is_read: false,
      priority: 'normal' as const,
    }));

    return await optimizedSupabase.getClient()
      .from('notifications')
      .insert(notifications);
  },

  // Send browser notification
  sendBrowserNotification: (title: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      return new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    }
    return null;
  },
};

export default NotificationProvider;
