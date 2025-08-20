"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabaseClient"
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from "@/hooks/use-toast"
import { 
  Bell, 
  Send, 
  Trash2, 
  Eye, 
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar,
  Clock,
  Users,
  Filter,
  Search,
  Plus,
  X,
  MessageSquare
} from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error' | 'announcement'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  recipient_type: 'all' | 'student' | 'faculty' | 'admin' | 'department'
  recipient_filter?: string
  sender_id: string
  sender_name: string
  read_at?: string
  created_at: string
  scheduled_for?: string
  expires_at?: string
}

interface NotificationTemplate {
  id: string
  name: string
  title: string
  message: string
  type: string
  priority: string
}

export default function RealTimeNotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  
  // New notification form state
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info',
    priority: 'medium',
    recipient_type: 'all',
    recipient_filter: '',
    scheduled_for: '',
    expires_at: ''
  })
  
  const { toast } = useToast()

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setCurrentUser(profile)
      }
    }
    
    fetchUser()
  }, [])

  // Fetch notifications
  const fetchNotifications = async () => {
    setIsLoading(true)
    
    try {
      if (!currentUser) return
      
      // Build query based on user role
      let query = supabase
        .from('notifications')
        .select(`
          *,
          notification_recipients(read_at)
        `)
        .order('created_at', { ascending: false })
      
      // Filter based on recipient type and user role
      if (currentUser.role !== 'admin') {
        query = query.or(`recipient_type.eq.all,recipient_type.eq.${currentUser.role},and(recipient_type.eq.department,recipient_filter.eq.${currentUser.department})`)
      }
      
      const { data, error } = await query.limit(100)
      
      if (error) throw error
      
      // Process notifications with read status
      const processedNotifications = data?.map((notif: any) => ({
        ...notif,
        read_at: notif.notification_recipients?.[0]?.read_at || null
      })) || []
      
      setNotifications(processedNotifications)
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch notification templates
  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('name')
      
      if (!error && data) {
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  // Real-time subscription
  useEffect(() => {
    if (!currentUser) return
    
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          fetchNotifications()
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser])

  // Filter notifications
  useEffect(() => {
    let filtered = notifications
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(notif => 
        notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(notif => notif.type === filterType)
    }
    
    // Priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(notif => notif.priority === filterPriority)
    }
    
    // Unread filter
    if (showUnreadOnly) {
      filtered = filtered.filter(notif => !notif.read_at)
    }
    
    setFilteredNotifications(filtered)
  }, [notifications, searchTerm, filterType, filterPriority, showUnreadOnly])

  // Initial data fetch
  useEffect(() => {
    if (currentUser) {
      fetchNotifications()
      fetchTemplates()
    }
  }, [currentUser])

  // Create notification
  const createNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      toast({
        title: "Validation Error",
        description: "Title and message are required",
        variant: "destructive"
      })
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...newNotification,
          sender_id: currentUser.id,
          sender_name: currentUser.full_name,
          scheduled_for: newNotification.scheduled_for || null,
          expires_at: newNotification.expires_at || null
        })
        .select()
        .single()
      
      if (error) throw error
      
      toast({
        title: "Notification Created",
        description: "Notification has been sent successfully"
      })
      
      setShowCreateForm(false)
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        priority: 'medium',
        recipient_type: 'all',
        recipient_filter: '',
        scheduled_for: '',
        expires_at: ''
      })
      
      fetchNotifications()
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notification_recipients')
        .upsert({
          notification_id: notificationId,
          user_id: currentUser.id,
          read_at: new Date().toISOString()
        })
      
      if (!error) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read_at: new Date().toISOString() }
              : notif
          )
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Delete notification (admin only)
  const deleteNotification = async (notificationId: string) => {
    if (currentUser?.role !== 'admin') return
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
      
      if (!error) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
        toast({
          title: "Notification Deleted",
          description: "Notification has been removed"
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  // Apply template
  const applyTemplate = (template: NotificationTemplate) => {
    setNewNotification(prev => ({
      ...prev,
      title: template.title,
      message: template.message,
      type: template.type,
      priority: template.priority
    }))
  }

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <X className="w-5 h-5 text-red-600" />
      case 'announcement':
        return <MessageSquare className="w-5 h-5 text-purple-600" />
      default:
        return <Info className="w-5 h-5 text-green-600" />
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (isLoading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Notification Center
          </h1>
          <p className="text-green-700 mt-1">Real-time notifications and announcements</p>
        </div>
        
        {(currentUser?.role === 'admin' || currentUser?.role === 'faculty') && (
          <Button onClick={() => setShowCreateForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Notification
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 lg:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full lg:w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-full lg:w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant={showUnreadOnly ? "default" : "outline"}
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className="w-full lg:w-auto"
            >
              {showUnreadOnly ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
              {showUnreadOnly ? 'Show All' : 'Unread Only'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No notifications found</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={`${!notification.read_at ? 'bg-blue-50 border-blue-200' : ''} hover:shadow-md transition-shadow`}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-lg">{notification.title}</h3>
                              {!notification.read_at && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            
                            <p className="text-gray-700 mb-3">{notification.message}</p>
                            
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                              <Badge variant="outline" className={getPriorityColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                              
                              <Badge variant="outline">
                                {notification.type}
                              </Badge>
                              
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(notification.created_at).toLocaleString()}</span>
                              </span>
                              
                              <span>From: {notification.sender_name}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {!notification.read_at && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            
                            {currentUser?.role === 'admin' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Create Notification Modal */}
      {showCreateForm && (currentUser?.role === 'admin' || currentUser?.role === 'faculty') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <Card className="border-0">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Create New Notification</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Templates */}
                {templates.length > 0 && (
                  <div>
                    <Label>Quick Templates</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {templates.map((template) => (
                        <Button
                          key={template.id}
                          variant="outline"
                          size="sm"
                          onClick={() => applyTemplate(template)}
                        >
                          {template.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Notification title"
                      value={newNotification.title}
                      onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={newNotification.type} onValueChange={(value) => setNewNotification(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newNotification.priority} onValueChange={(value) => setNewNotification(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipients</Label>
                    <Select value={newNotification.recipient_type} onValueChange={(value) => setNewNotification(prev => ({ ...prev, recipient_type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="student">Students Only</SelectItem>
                        <SelectItem value="faculty">Faculty Only</SelectItem>
                        <SelectItem value="admin">Admins Only</SelectItem>
                        <SelectItem value="department">Specific Department</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {newNotification.recipient_type === 'department' && (
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={newNotification.recipient_filter} onValueChange={(value) => setNewNotification(prev => ({ ...prev, recipient_filter: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="computer-science">Computer Science</SelectItem>
                        <SelectItem value="mathematics">Mathematics</SelectItem>
                        <SelectItem value="physics">Physics</SelectItem>
                        <SelectItem value="chemistry">Chemistry</SelectItem>
                        <SelectItem value="biology">Biology</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Notification message"
                    rows={4}
                    value={newNotification.message}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduled">Schedule For (Optional)</Label>
                    <Input
                      id="scheduled"
                      type="datetime-local"
                      value={newNotification.scheduled_for}
                      onChange={(e) => setNewNotification(prev => ({ ...prev, scheduled_for: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expires">Expires At (Optional)</Label>
                    <Input
                      id="expires"
                      type="datetime-local"
                      value={newNotification.expires_at}
                      onChange={(e) => setNewNotification(prev => ({ ...prev, expires_at: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createNotification} className="bg-blue-600 hover:bg-blue-700">
                    <Send className="w-4 h-4 mr-2" />
                    Send Notification
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  )
}
