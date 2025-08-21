import { NextRequest, NextResponse } from 'next/server';
import { advancedSupabase } from '@/lib/advancedSupabase';

// Add a new student (Faculty/Admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, department, role = 'student' } = body;

    if (!name || !email || !department) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: name, email, department' },
        { status: 400 }
      );
    }

    // Validate role
    if (role !== 'student') {
      return NextResponse.json(
        { success: false, message: 'Invalid role. Only students can be added through this endpoint.' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingStudent } = await advancedSupabase.getClient()
      .from('students')
      .select('*')
      .eq('email', email)
      .single();

    if (existingStudent) {
      return NextResponse.json(
        { success: false, message: 'A student with this email already exists' },
        { status: 409 }
      );
    }

    // Create new student
    const { data, error } = await advancedSupabase.getClient()
      .from('students')
      .insert([{ name, email, department, role }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: 'Student added successfully'
    });

  } catch (error) {
    console.error('Add student error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to add student' 
      },
      { status: 500 }
    );
  }
}

// Get students list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const search = searchParams.get('search');

    let query = advancedSupabase.getClient()
      .from('students')
      .select('*')
      .order('name');

    // Apply filters
    if (department) {
      query = query.eq('department', department);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: 'Students retrieved successfully'
    });

  } catch (error) {
    console.error('Get students error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to get students' 
      },
      { status: 500 }
    );
  }
}

// Update student information
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, email, department } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Missing required field: id' },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (department) updateData.department = department;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No fields to update' },
        { status: 400 }
      );
    }

    // Update student
    const { data, error } = await advancedSupabase.getClient()
      .from('students')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Student updated successfully'
    });

  } catch (error) {
    console.error('Update student error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to update student' 
      },
      { status: 500 }
    );
  }
}
