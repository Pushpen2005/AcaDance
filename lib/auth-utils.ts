// Complete signup and role management utilities
import { supabase } from './supabaseClient';

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'faculty' | 'admin';
  department?: string;
  student_id?: string;
  employee_id?: string;
  phone?: string;
}

// Sign up and create profile in one transaction
export async function signUpAndCreateProfile(userData: SignUpData) {
  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password
    });

    if (authError) {
      throw new Error(`Authentication failed: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('No user returned from signup');
    }

    // 2. Create profile
    const profileData = {
      id: authData.user.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      department: userData.department,
      student_id: userData.student_id,
      employee_id: userData.employee_id,
      phone: userData.phone,
      is_active: true
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .insert(profileData);

    if (profileError) {
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }

    return {
      success: true,
      user: authData.user,
      profile: profileData
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Get user role and redirect URL
export async function getRoleAndRedirect() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { redirectTo: '/login', role: null };
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return { redirectTo: '/setup-profile', role: null };
    }

    // Role-based redirects
    const redirectMap: Record<string, string> = {
      admin: '/admin',
      faculty: '/faculty',
      student: '/student'
    };

    return {
      redirectTo: redirectMap[profile.role] || '/student',
      role: profile.role
    };

  } catch (error) {
    return { redirectTo: '/login', role: null };
  }
}

// Check if user has required role
export async function checkUserRole(requiredRole: string | string[]) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { hasRole: false, role: null };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) return { hasRole: false, role: null };

    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasRole = allowedRoles.includes(profile.role);

    return { hasRole, role: profile.role };

  } catch (error) {
    return { hasRole: false, role: null };
  }
}

// Create default admin user (run once)
export async function createDefaultAdmin(adminData: {
  email: string;
  password: string;
  name: string;
}) {
  return signUpAndCreateProfile({
    ...adminData,
    role: 'admin',
    department: 'Administration'
  });
}

// Bulk user creation for testing
export async function createTestUsers() {
  const testUsers = [
    {
      email: 'admin@academic-system.com',
      password: 'admin123',
      name: 'System Administrator',
      role: 'admin' as const,
      department: 'Administration'
    },
    {
      email: 'faculty@academic-system.com', 
      password: 'faculty123',
      name: 'Prof. John Smith',
      role: 'faculty' as const,
      department: 'Computer Science',
      employee_id: 'FAC001'
    },
    {
      email: 'student@academic-system.com',
      password: 'student123', 
      name: 'Jane Doe',
      role: 'student' as const,
      department: 'Computer Science',
      student_id: 'STU001'
    }
  ];

  const results = [];
  
  for (const userData of testUsers) {
    const result = await signUpAndCreateProfile(userData);
    results.push({ ...userData, ...result });
  }

  return results;
}

// Password reset flow
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Password reset failed'
    };
  }
}

// Update password
export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Password update failed'
    };
  }
}
