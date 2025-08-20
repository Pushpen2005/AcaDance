import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface NotificationRequest {
  user_id: string
  type: 'attendance_confirmation' | 'attendance_alert' | 'system_announcement' | 'timetable_update'
  title: string
  message: string
  priority?: 'low' | 'medium' | 'high'
  channels?: ('email' | 'sms' | 'push' | 'in_app')[]
  data?: Record<string, any>
  expires_at?: string
  action_url?: string
  attachment_url?: string
}

interface NotificationResponse {
  success: boolean
  notification_id?: string
  delivery_status?: Record<string, boolean>
  error?: string
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    })
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    const notification: NotificationRequest = await req.json()

    if (!notification.user_id || !notification.title || !notification.message) {
      throw new Error('Missing required fields: user_id, title, message')
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user profile and notification preferences
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select(`
        *,
        user_settings (
          email_notifications,
          sms_notifications,
          push_notifications,
          attendance_alerts,
          timetable_updates,
          assignment_reminders,
          exam_notifications
        )
      `)
      .eq('id', notification.user_id)
      .single()

    if (userError || !user) {
      throw new Error('User not found')
    }

    // Check user preferences for notification type
    const settings = user.user_settings?.[0] || {}
    const typeEnabled = checkNotificationTypeEnabled(notification.type, settings)
    
    if (!typeEnabled) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Notification blocked by user preferences'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Default channels based on user preferences
    const defaultChannels: ('email' | 'sms' | 'push' | 'in_app')[] = ['in_app']
    if (settings.email_notifications) defaultChannels.push('email')
    if (settings.sms_notifications) defaultChannels.push('sms')
    if (settings.push_notifications) defaultChannels.push('push')

    const channels = notification.channels || defaultChannels
    const deliveryStatus: Record<string, boolean> = {}

    // Store notification in database
    const { data: savedNotification, error: saveError } = await supabase
      .from('notifications')
      .insert({
        recipient_id: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority || 'medium',
        data: notification.data || {},
        expires_at: notification.expires_at || null,
        action_url: notification.action_url || null,
        attachment_url: notification.attachment_url || null,
        channels_sent: channels,
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) {
      throw new Error(`Failed to save notification: ${saveError.message}`)
    }

    // Send via different channels
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            if (user.email && settings.email_notifications) {
              deliveryStatus.email = await sendEmail({
                to: user.email,
                subject: notification.title,
                html: generateEmailTemplate(notification, user),
                priority: notification.priority
              })
            }
            break

          case 'sms':
            if (user.phone && settings.sms_notifications) {
              deliveryStatus.sms = await sendSMS({
                to: user.phone,
                message: `${notification.title}: ${notification.message}`,
                priority: notification.priority
              })
            }
            break

          case 'push':
            if (settings.push_notifications) {
              deliveryStatus.push = await sendPushNotification({
                user_id: notification.user_id,
                title: notification.title,
                body: notification.message,
                data: notification.data,
                priority: notification.priority
              })
            }
            break

          case 'in_app':
            deliveryStatus.in_app = true // Already stored in database
            break
        }
      } catch (channelError) {
        console.error(`Failed to send ${channel} notification:`, channelError)
        deliveryStatus[channel] = false
      }
    }

    // Update delivery status in database
    await supabase
      .from('notifications')
      .update({
        delivery_status: deliveryStatus,
        delivered_at: new Date().toISOString()
      })
      .eq('id', savedNotification.id)

    // Log notification activity
    await supabase
      .from('audit_logs')
      .insert({
        user_id: notification.user_id,
        action: 'NOTIFICATION_SENT',
        table_name: 'notifications',
        record_id: savedNotification.id,
        new_values: {
          type: notification.type,
          channels,
          delivery_status: deliveryStatus
        },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      })

    const response: NotificationResponse = {
      success: true,
      notification_id: savedNotification.id,
      delivery_status: deliveryStatus
    }

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error: any) {
    console.error('Notification Error:', error)
    
    const errorResponse: NotificationResponse = {
      success: false,
      error: error.message || 'Internal server error'
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
})

// Helper function to check if notification type is enabled
function checkNotificationTypeEnabled(type: string, settings: any): boolean {
  switch (type) {
    case 'attendance_confirmation':
    case 'attendance_alert':
      return settings.attendance_alerts !== false
    case 'timetable_update':
      return settings.timetable_updates !== false
    case 'system_announcement':
      return true // System announcements are always enabled
    default:
      return true
  }
}

// Email service implementation
async function sendEmail({ to, subject, html, priority }: {
  to: string
  subject: string
  html: string
  priority?: string
}): Promise<boolean> {
  try {
    // Example using SendGrid API
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
    if (!sendGridApiKey) {
      console.warn('SendGrid API key not configured')
      return false
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to }],
          subject: subject
        }],
        from: {
          email: Deno.env.get('FROM_EMAIL') || 'noreply@academicsystem.com',
          name: 'Academic System'
        },
        content: [{
          type: 'text/html',
          value: html
        }],
        priority: priority === 'high' ? 1 : 3
      })
    })

    return response.ok
  } catch (error) {
    console.error('Email sending failed:', error)
    return false
  }
}

// SMS service implementation  
async function sendSMS({ to, message, priority }: {
  to: string
  message: string
  priority?: string
}): Promise<boolean> {
  try {
    // Example using Twilio API
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.warn('Twilio credentials not configured')
      return false
    }

    const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`)
    
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        From: twilioPhoneNumber,
        To: to,
        Body: message
      })
    })

    return response.ok
  } catch (error) {
    console.error('SMS sending failed:', error)
    return false
  }
}

// Push notification implementation
async function sendPushNotification({ user_id, title, body, data, priority }: {
  user_id: string
  title: string
  body: string
  data?: any
  priority?: string
}): Promise<boolean> {
  try {
    // Example using Firebase Cloud Messaging
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY')
    if (!fcmServerKey) {
      console.warn('FCM server key not configured')
      return false
    }

    // In a real implementation, you would get the user's FCM token from database
    // For now, we'll simulate the push notification
    console.log(`Push notification sent to user ${user_id}: ${title}`)
    return true
  } catch (error) {
    console.error('Push notification failed:', error)
    return false
  }
}

// Email template generator
function generateEmailTemplate(notification: NotificationRequest, user: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notification.title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                           width: 80px; height: 80px; border-radius: 50%; 
                           display: inline-flex; align-items: center; justify-content: center;">
                    <span style="color: white; font-size: 24px; font-weight: bold;">AS</span>
                </div>
                <h1 style="color: #333; margin: 10px 0;">Academic System</h1>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #333; margin: 0 0 10px 0;">${notification.title}</h2>
                <p style="color: #666; line-height: 1.6; margin: 0;">${notification.message}</p>
            </div>
            
            ${notification.action_url ? `
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${notification.action_url}" 
                       style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                              color: white; padding: 12px 24px; text-decoration: none;
                              border-radius: 6px; font-weight: bold; display: inline-block;">
                        Take Action
                    </a>
                </div>
            ` : ''}
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                    This email was sent to ${user.email} for ${user.full_name}.<br>
                    You can update your notification preferences in your account settings.
                </p>
            </div>
        </div>
    </body>
    </html>
  `
}
