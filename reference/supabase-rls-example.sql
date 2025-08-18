-- Supabase RLS Example Policies
-- Students can view their own attendance
CREATE POLICY "Students can view their attendance"
  ON attendance
  FOR SELECT
  USING (student_id = auth.uid());

-- Faculty can view their sessions
CREATE POLICY "Faculty can view their sessions"
  ON attendance
  FOR SELECT
  USING (faculty_id = auth.uid());

-- Admin can view all
CREATE POLICY "Admin can view all"
  ON attendance
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
