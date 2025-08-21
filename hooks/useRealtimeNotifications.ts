import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'attendance_shortage' | 'timetable_update' | 'assignment' | 'exam';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  action_url?: string;
  expires_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface UseRealtimeNotificationsProps {
  userId?: string;
  enabled?: boolean;
  markAsReadOnReceive?: boolean;
}

export function useRealtimeNotifications({
  userId,
  enabled = true,
  markAsReadOnReceive = false
}: UseRealtimeNotificationsProps = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastNotification, setLastNotification] = useState<Notification | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    console.log('🔄 Setting up real-time notifications subscription');
    
    const channelName = `notifications-${userId || 'global'}-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          ...(userId && { filter: `user_id=eq.${userId}` })
        },
        (payload) => {
          console.log('🔔 New notification:', payload.new);
          const newNotification = payload.new as Notification;
          
          // Only add if it matches our user filter
          if (userId && newNotification.user_id !== userId) return;
          
          setNotifications(prev => {
            // Avoid duplicates
            if (prev.some(n => n.id === newNotification.id)) {
              return prev;
            }
            return [newNotification, ...prev];
          });
          
          setLastNotification(newNotification);
          
          // Update unread count
          if (!newNotification.is_read) {
            setUnreadCount(prev => prev + 1);
          }

          // Auto-mark as read if requested
          if (markAsReadOnReceive && !newNotification.is_read) {
            markAsRead(newNotification.id);
          }

          // Show browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/favicon.ico',
              tag: newNotification.id
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'notifications',
          ...(userId && { filter: `user_id=eq.${userId}` })
        },
        (payload) => {
          console.log('🔔 Notification updated:', payload.new);
          const updatedNotification = payload.new as Notification;
          
          // Only update if it matches our user filter
          if (userId && updatedNotification.user_id !== userId) return;
          
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
          
          // Update unread count if read status changed
          const oldNotification = notifications.find(n => n.id === updatedNotification.id);
          if (oldNotification && oldNotification.is_read !== updatedNotification.is_read) {
            setUnreadCount(prev => updatedNotification.is_read ? prev - 1 : prev + 1);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Notifications realtime status:', status);
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'CHANNEL_ERROR') {
          setError('Failed to connect to notification real-time updates');
        } else {
          setError(null);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('🔄 Cleaning up notifications real-time subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [userId, enabled, markAsReadOnReceive, notifications]);

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Helper functions
  const getNotificationsByType = (type: Notification['type']) => {
    return notifications.filter(n => n.type === type);
  };

  const getNotificationsByPriority = (priority: Notification['priority']) => {
    return notifications.filter(n => n.priority === priority);
  };

  const getUnreadNotifications = () => {
    return notifications.filter(n => !n.is_read);
  };

  const hasUnreadNotifications = () => {
    return unreadCount > 0;
  };

  return {
    // State
    notifications,
    unreadCount,
    lastNotification,
    isConnected,
    error,
    
    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    requestNotificationPermission,
    
    // Helpers
    getNotificationsByType,
    getNotificationsByPriority,
    getUnreadNotifications,
    hasUnreadNotifications,
    
    // Setter for manual updates
    setNotifications
  };
}
