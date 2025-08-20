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
        const { user_id, subject_id: subjectId, date_from, date_to } = req.query;
        
        let query = supabase
          .from("attendance_records")
          .select(`
            *,
            profiles(full_name, role),
            timetable(course, day, start_time, end_time)
          `);
        
        if (user_id) {
          query = query.eq("user_id", user_id);
        }
        
        if (subjectId) {
          query = query.eq("subject_id", subjectId);
        }
        
        if (date_from) {
          query = query.gte("marked_at", date_from);
        }
        
        if (date_to) {
          query = query.lte("marked_at", date_to);
        }
        
        const { data, error } = await query.order("marked_at", { ascending: false });
        
        if (error) {
          return res.status(500).json({ error: error.message });
        }
        
        return res.status(200).json(data);

      case "POST":
        const {
          user_id: userId,
          session_id,
          subject_id,
          status,
          location_lat,
          location_lng,
          device_fingerprint,
          geofence_verified
        } = req.body;
        
        // Check for duplicate attendance
        const { data: existing } = await supabase
          .from("attendance_records")
          .select("id")
          .eq("user_id", userId)
          .eq("session_id", session_id);
          
        if (existing && existing.length > 0) {
          return res.status(400).json({ error: "Attendance already marked for this session" });
        }
        
        // Mark attendance
        const { data: attendance, error: attendanceError } = await supabase
          .from("attendance_records")
          .insert([{
            user_id: userId,
            session_id,
            subject_id,
            status,
            location_lat,
            location_lng,
            device_fingerprint,
            geofence_verified,
            marked_at: new Date().toISOString()
          }])
          .select();
          
        if (attendanceError) {
          return res.status(500).json({ error: attendanceError.message });
        }
        
        // Update user's attendance statistics
        await updateAttendanceStats(userId);
        
        return res.status(201).json(attendance);

      case "PUT":
        const { id } = req.query;
        const updateData = req.body;
        
        const { data: updated, error: updateError } = await supabase
          .from("attendance_records")
          .update(updateData)
          .eq("id", id)
          .select();
          
        if (updateError) {
          return res.status(500).json({ error: updateError.message });
        }
        
        // Recalculate stats if status changed
        if (updateData.status && updated) {
          await updateAttendanceStats(updated[0].user_id);
        }
        
        return res.status(200).json(updated);

      case "DELETE":
        const { id: deleteId } = req.query;
        
        // Get user_id before deletion for stats update
        const { data: toDelete } = await supabase
          .from("attendance_records")
          .select("user_id")
          .eq("id", deleteId)
          .single();
        
        const { error: deleteError } = await supabase
          .from("attendance_records")
          .delete()
          .eq("id", deleteId);
          
        if (deleteError) {
          return res.status(500).json({ error: deleteError.message });
        }
        
        // Update stats
        if (toDelete) {
          await updateAttendanceStats(toDelete.user_id);
        }
        
        return res.status(200).json({ message: "Attendance record deleted" });

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error("Attendance API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function updateAttendanceStats(userId: string) {
  try {
    // Get all attendance records for user
    const { data: records } = await supabase
      .from("attendance_records")
      .select("status")
      .eq("user_id", userId);
    
    if (!records) return;
    
    const totalClasses = records.length;
    const presentClasses = records.filter(r => r.status === "present").length;
    const absentClasses = records.filter(r => r.status === "absent").length;
    
    // Update or insert attendance summary
    await supabase
      .from("attendance")
      .upsert({
        user_id: userId,
        total_classes: totalClasses,
        present_classes: presentClasses,
        absent_classes: absentClasses
      }, {
        onConflict: "user_id"
      });
      
  } catch (error) {
    console.error("Error updating attendance stats:", error);
  }
}
