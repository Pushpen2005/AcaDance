"use client"

import React, { useState } from 'react';
import { Bell, BellRing, X, Check, CheckCheck, AlertTriangle, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useRealtimeNotifications, Notification } from '@/hooks/useRealtimeNotifications';
import { formatDistanceToNow } from 'date-fns';

interface RealtimeNotificationsProps {
  userId?: string;
  className?: string;
  maxHeight?: string;
}

const NotificationIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
  const iconProps = { className: "w-4 h-4" };
  
  switch (type) {
    case 'error':
      return <AlertCircle {...iconProps} className="w-4 h-4 text-red-500" />;
    case 'warning':
    case 'attendance_shortage':
      return <AlertTriangle {...iconProps} className="w-4 h-4 text-yellow-500" />;
    case 'success':
      return <CheckCircle {...iconProps} className="w-4 h-4 text-green-500" />;
    case 'info':
    case 'timetable_update':
    case 'assignment':
    case 'exam':
    default:
      return <Info {...iconProps} className="w-4 h-4 text-blue-500" />;
  }
};

const NotificationItem: React.FC<{
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ notification, onMarkAsRead, onDelete }) => {
  return (
    <div className={`p-3 border rounded-lg ${notification.is_read ? 'bg-gray-50' : 'bg-white border-blue-200'}`}>
      <div className="flex items-start justify-between space-x-3">
        <div className="flex items-start space-x-3 flex-1">
          <NotificationIcon type={notification.type} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className={`text-sm font-medium ${notification.is_read ? 'text-gray-600' : 'text-gray-900'}`}>
                {notification.title}
              </h4>
              <Badge variant={notification.priority === 'urgent' ? 'destructive' : 
                             notification.priority === 'high' ? 'default' : 'secondary'}>
                {notification.priority}
              </Badge>
            </div>
            
            <p className={`text-sm mt-1 ${notification.is_read ? 'text-gray-500' : 'text-gray-700'}`}>
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </span>
              
              {notification.action_url && (
                <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                  View
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAsRead(notification.id)}
              className="h-6 w-6 p-0"
              title="Mark as read"
            >
              <Check className="w-3 h-3" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(notification.id)}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            title="Delete"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const RealtimeNotifications: React.FC<RealtimeNotificationsProps> = ({
  userId,
  className = '',
  maxHeight = '400px'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    notifications,
    unreadCount,
    lastNotification,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    hasUnreadNotifications
  } = useRealtimeNotifications({ userId });

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleDelete = async (notificationId: string) => {
    await deleteNotification(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  // Show animation for new notifications
  const [showNewNotificationPulse, setShowNewNotificationPulse] = React.useState(false);
  
  React.useEffect(() => {
    if (lastNotification && !lastNotification.is_read) {
      setShowNewNotificationPulse(true);
      const timer = setTimeout(() => setShowNewNotificationPulse(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastNotification]);

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`relative ${showNewNotificationPulse ? 'animate-pulse' : ''}`}
          >
            {hasUnreadNotifications() ? (
              <BellRing className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
            
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-96 p-0" align="end">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Notifications</CardTitle>
                  <CardDescription className="flex items-center space-x-2">
                    <span>{notifications.length} total</span>
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {unreadCount} unread
                      </Badge>
                    )}
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  </CardDescription>
                </div>
                
                {hasUnreadNotifications() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs h-7"
                  >
                    <CheckCheck className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <Separator />
            
            <CardContent className="p-0">
              <ScrollArea className="h-full" style={{ maxHeight }}>
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4">
                    <Bell className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 text-center">
                      No notifications yet
                    </p>
                    <p className="text-xs text-gray-400 text-center mt-1">
                      You'll see real-time updates here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 p-3">
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default RealtimeNotifications;
