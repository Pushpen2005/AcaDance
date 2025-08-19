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
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Profiles policies
-- Students can only read their own profile
create policy if not exists "Students read own profile"
on profiles for select
using (auth.uid() = id);

-- Admins can view all
create policy if not exists "Admins read all"
on profiles for select
using (exists(select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
