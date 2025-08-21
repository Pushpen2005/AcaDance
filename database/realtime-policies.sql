-- Real-time Database Policies and Setup for Academic System
-- Run this script in your Supabase SQL editor

-- Enable Realtime for tables
ALTER publication supabase_realtime ADD TABLE profiles;
ALTER publication supabase_realtime ADD TABLE timetables;
ALTER publication supabase_realtime ADD TABLE attendance_sessions;
ALTER publication supabase_realtime ADD TABLE attendance_records;
ALTER publication supabase_realtime ADD TABLE notifications;
ALTER publication supabase_realtime ADD TABLE courses;

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error', 'attendance_shortage', 'timetable_update', 'assignment', 'exam')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
-- Users can see their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

-- Admin can see all profiles
CREATE POLICY "Admin can view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Faculty can see student profiles in their courses
CREATE POLICY "Faculty can view student profiles"
ON profiles FOR SELECT
USING (
  role = 'student' AND
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'faculty'
  )
);

-- Timetables Policies
-- Students can view timetables for their enrolled courses
CREATE POLICY "Students can view enrolled timetables"
ON timetables FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'student'
    -- Add enrollment check here when enrollment table exists
  )
);

-- Faculty can view their assigned timetables
CREATE POLICY "Faculty can view assigned timetables"
ON timetables FOR SELECT
USING (faculty_id = auth.uid());

-- Admin can view all timetables
CREATE POLICY "Admin can view all timetables"
ON timetables FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Faculty can update their timetables
CREATE POLICY "Faculty can update assigned timetables"
ON timetables FOR UPDATE
USING (faculty_id = auth.uid());

-- Admin can manage all timetables
CREATE POLICY "Admin can manage all timetables"
ON timetables FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Attendance Sessions Policies
-- Faculty can manage their attendance sessions
CREATE POLICY "Faculty can manage own attendance sessions"
ON attendance_sessions FOR ALL
USING (faculty_id = auth.uid());

-- Students can view sessions for their enrolled courses
CREATE POLICY "Students can view attendance sessions"
ON attendance_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM timetables t
    WHERE t.id = timetable_id
    -- Add enrollment check here
  )
);

-- Admin can view all attendance sessions
CREATE POLICY "Admin can view all attendance sessions"
ON attendance_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Attendance Records Policies
-- Students can insert their own attendance
CREATE POLICY "Students can mark own attendance"
ON attendance_records FOR INSERT
WITH CHECK (student_id = auth.uid());

-- Students can view their own attendance records
CREATE POLICY "Students can view own attendance"
ON attendance_records FOR SELECT
USING (student_id = auth.uid());

-- Faculty can view attendance for their sessions
CREATE POLICY "Faculty can view session attendance"
ON attendance_records FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM attendance_sessions s
    WHERE s.id = session_id 
    AND s.faculty_id = auth.uid()
  )
);

-- Faculty can update attendance records for their sessions
CREATE POLICY "Faculty can update session attendance"
ON attendance_records FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM attendance_sessions s
    WHERE s.id = session_id 
    AND s.faculty_id = auth.uid()
  )
);

-- Admin can view all attendance records
CREATE POLICY "Admin can view all attendance"
ON attendance_records FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Notifications Policies
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
USING (user_id = auth.uid());

-- System can insert notifications for any user (for automated notifications)
CREATE POLICY "System can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- Admin can manage all notifications
CREATE POLICY "Admin can manage all notifications"
ON notifications FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Create indexes for better real-time performance
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_timestamp ON attendance_records(timestamp);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_faculty_id ON attendance_sessions(faculty_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON attendance_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_status ON attendance_sessions(session_status);
CREATE INDEX IF NOT EXISTS idx_timetables_faculty_id ON timetables(faculty_id);
CREATE INDEX IF NOT EXISTS idx_timetables_day_week ON timetables(day_of_week);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Create function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to send attendance shortage notifications
CREATE OR REPLACE FUNCTION check_attendance_shortage()
RETURNS TRIGGER AS $$
DECLARE
    attendance_percentage DECIMAL;
    threshold DECIMAL := 75; -- Default threshold
    user_threshold DECIMAL;
BEGIN
    -- Get user's attendance threshold
    SELECT attendance_threshold INTO user_threshold
    FROM profiles 
    WHERE id = NEW.student_id;
    
    IF user_threshold IS NOT NULL THEN
        threshold := user_threshold;
    END IF;
    
    -- Calculate attendance percentage for this student
    -- This is a simplified calculation - you might need to adjust based on your enrollment logic
    WITH student_sessions AS (
        SELECT COUNT(*) as total_sessions
        FROM attendance_sessions s
        JOIN timetables t ON s.timetable_id = t.id
        WHERE s.session_status = 'completed'
        -- Add course enrollment filter here
    ),
    student_attendance AS (
        SELECT COUNT(*) as attended_sessions
        FROM attendance_records r
        JOIN attendance_sessions s ON r.session_id = s.id
        WHERE r.student_id = NEW.student_id
        AND r.status = 'present'
    )
    SELECT 
        CASE 
            WHEN ss.total_sessions > 0 THEN (sa.attended_sessions::DECIMAL / ss.total_sessions::DECIMAL) * 100
            ELSE 100
        END INTO attendance_percentage
    FROM student_sessions ss, student_attendance sa;
    
    -- Send notification if below threshold
    IF attendance_percentage < threshold THEN
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            priority,
            metadata
        ) VALUES (
            NEW.student_id,
            'Attendance Warning',
            format('Your attendance is %s%%, which is below the required %s%% threshold.', 
                   ROUND(attendance_percentage, 1), threshold),
            'attendance_shortage',
            CASE 
                WHEN attendance_percentage < (threshold - 20) THEN 'urgent'
                WHEN attendance_percentage < (threshold - 10) THEN 'high'
                ELSE 'medium'
            END,
            jsonb_build_object(
                'attendance_percentage', attendance_percentage,
                'threshold', threshold,
                'student_id', NEW.student_id
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for attendance shortage notifications
DROP TRIGGER IF EXISTS attendance_shortage_notification ON attendance_records;
CREATE TRIGGER attendance_shortage_notification
    AFTER INSERT ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION check_attendance_shortage();

-- Create function to notify about timetable changes
CREATE OR REPLACE FUNCTION notify_timetable_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify all students in affected courses about timetable changes
    INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        priority,
        metadata
    )
    SELECT 
        p.id,
        'Timetable Update',
        format('Your class schedule has been updated. Check the new timetable for %s.', 
               COALESCE(c.course_name, 'your course')),
        'timetable_update',
        'medium',
        jsonb_build_object(
            'timetable_id', COALESCE(NEW.id, OLD.id),
            'course_id', COALESCE(NEW.course_id, OLD.course_id),
            'change_type', 
            CASE 
                WHEN TG_OP = 'INSERT' THEN 'created'
                WHEN TG_OP = 'UPDATE' THEN 'updated'
                WHEN TG_OP = 'DELETE' THEN 'deleted'
            END
        )
    FROM profiles p
    JOIN courses c ON c.id = COALESCE(NEW.course_id, OLD.course_id)
    WHERE p.role = 'student'
    -- Add enrollment filter here when enrollment table exists
    ;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create trigger for timetable change notifications
DROP TRIGGER IF EXISTS timetable_change_notification ON timetables;
CREATE TRIGGER timetable_change_notification
    AFTER INSERT OR UPDATE OR DELETE ON timetables
    FOR EACH ROW
    EXECUTE FUNCTION notify_timetable_changes();

-- Grant necessary permissions
GRANT SELECT ON notifications TO authenticated;
GRANT INSERT ON notifications TO authenticated;
GRANT UPDATE ON notifications TO authenticated;
GRANT DELETE ON notifications TO authenticated;

-- Comments for documentation
COMMENT ON TABLE notifications IS 'Real-time notifications for users including attendance warnings and timetable updates';
COMMENT ON FUNCTION check_attendance_shortage() IS 'Automatically sends notifications when student attendance falls below threshold';
COMMENT ON FUNCTION notify_timetable_changes() IS 'Sends notifications to affected students when timetables are modified';

-- Enable realtime for notifications
ALTER publication supabase_realtime ADD TABLE notifications;
