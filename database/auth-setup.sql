-- Auth Setup for Academic System
-- Run this in your Supabase SQL Editor

-- 1. First, ensure the profiles table uses 'users' naming for consistency with auth component
-- Update existing profiles table or create users table if needed
DO $$
BEGIN
    -- Check if 'users' table exists, if not create it based on profiles
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TABLE users (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            name TEXT,
            email TEXT,
            role TEXT DEFAULT 'Student' CHECK (role IN ('Student', 'Faculty', 'Admin')),
            department TEXT,
            phone TEXT,
            avatar_url TEXT,
            device_fingerprint TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- 2. Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;

-- Policy for users to read their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

-- Policy for users to update their own data  
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Policy for users to insert their own data
CREATE POLICY "Enable insert for authenticated users" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, name, email, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'name', new.email),
        new.email,
        COALESCE(new.raw_user_meta_data->>'role', 'Student')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger for automatic user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Sync existing profiles to users table (if upgrading)
-- Only sync if profiles table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        INSERT INTO users (id, name, email, role, created_at)
        SELECT 
            p.id,
            p.full_name,
            au.email,
            CASE 
                WHEN p.role = 'student' THEN 'Student'
                WHEN p.role = 'faculty' THEN 'Faculty' 
                WHEN p.role = 'admin' THEN 'Admin'
                ELSE 'Student'
            END,
            p.created_at
        FROM profiles p
        JOIN auth.users au ON p.id = au.id
        WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.id);
    END IF;
END $$;

-- 7. Test data (optional - for development)
-- You can uncomment these lines to create test users
/*
-- Create test admin user (replace with your email)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at)
VALUES (
    gen_random_uuid(),
    'admin@test.com',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Add corresponding user record
INSERT INTO users (id, name, email, role)
SELECT id, 'Test Admin', email, 'Admin' 
FROM auth.users 
WHERE email = 'admin@test.com'
ON CONFLICT DO NOTHING;
*/

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE users TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
