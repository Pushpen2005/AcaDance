import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { method } = req;

    switch (method) {
      case "GET":
        const { department: deptFilter, semester: semFilter, search } = req.query;
        
        let query = supabase
          .from("profiles")
          .select(`
            *,
            attendance(total_classes, present_classes, percentage)
          `)
          .eq("role", "student");
        
        if (deptFilter) {
          query = query.eq("department", deptFilter);
        }
        
        if (semFilter) {
          query = query.eq("semester", semFilter);
        }
        
        if (search) {
          query = query.or(
            `full_name.ilike.%${search}%,email.ilike.%${search}%,student_id.ilike.%${search}%`
          );
        }
        
        const { data, error } = await query.order("full_name");
        
        if (error) {
          return res.status(500).json({ error: error.message });
        }
        
        return res.status(200).json(data);

      case "POST":
        const {
          student_id,
          full_name,
          email,
          department,
          semester,
          phone,
          batch,
          admission_year
        } = req.body;
        
        // Create auth user first
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: `student${student_id}`, // Temporary password
          email_confirm: true
        });
        
        if (authError) {
          return res.status(500).json({ error: authError.message });
        }
        
        // Create profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .insert([{
            id: authUser.user.id,
            student_id,
            full_name,
            email,
            role: "student",
            department,
            semester,
            phone,
            batch,
            admission_year
          }])
          .select();
          
        if (profileError) {
          // Cleanup auth user if profile creation fails
          await supabase.auth.admin.deleteUser(authUser.user.id);
          return res.status(500).json({ error: profileError.message });
        }
        
        // Initialize attendance record
        await supabase
          .from("attendance")
          .insert([{
            user_id: authUser.user.id,
            total_classes: 0,
            present_classes: 0,
            absent_classes: 0
          }]);
        
        // Initialize student features
        await supabase
          .from("student_features")
          .insert([{
            user_id: authUser.user.id,
            timetable_enabled: true,
            attendance_alerts: true,
            exam_notifications: true
          }]);
        
        return res.status(201).json(profile);

      case "PUT":
        const { id } = req.query;
        const updateData = req.body;
        
        const { data: updated, error: updateError } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", id)
          .select();
          
        if (updateError) {
          return res.status(500).json({ error: updateError.message });
        }
        
        return res.status(200).json(updated);

      case "DELETE":
        const { id: deleteId } = req.query;
        
        // Delete profile (cascade will handle related records)
        const { error: deleteError } = await supabase
          .from("profiles")
          .delete()
          .eq("id", deleteId);
          
        if (deleteError) {
          return res.status(500).json({ error: deleteError.message });
        }
        
        // Delete auth user
        await supabase.auth.admin.deleteUser(deleteId as string);
        
        return res.status(200).json({ message: "Student deleted successfully" });

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error("Students API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
