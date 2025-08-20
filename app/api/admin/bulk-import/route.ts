import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Example: Insert user/timetable into Supabase
async function insertUserOrTimetable(row: Record<string, any>) {
  try {
    // Example: Insert into 'users' table
    const { error } = await supabase.from('users').insert({
      email: row.email,
      role: row.role,
      name: row.name || null,
      department: row.department || null,
      // Add other fields as needed
    });
    if (error) return false;
    return true;
  } catch (err) {
    return false;
  }
}

export async function POST(req: NextRequest) {
  // Placeholder: Check for admin authentication
  const isAdmin = true; // TODO: Replace with real auth check
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Parse the incoming form-data for Excel file
  const formData = await req.formData();
  const file = formData.get('file');
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
  }

  // Read file as ArrayBuffer
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet) as Record<string, any>[];

  // Process parsed data and insert users/timetables
  let imported = 0;
  let failed = 0;
  let errors: any[] = [];
  for (let idx = 0; idx < json.length; idx++) {
    const row = json[idx];
    // Basic validation
    if (!row.email || !row.role) {
      failed++;
      errors.push({ row: idx + 2, error: 'Missing required fields: email or role' });
      continue;
    }
    // Insert into DB (stub)
    const success = await insertUserOrTimetable(row);
    if (success) {
      imported++;
    } else {
      failed++;
      errors.push({ row: idx + 2, error: 'DB insert failed' });
    }
  }

  return NextResponse.json({
    message: 'Bulk import processed.',
    imported,
    failed,
    errors,
    preview: json
  });
}
