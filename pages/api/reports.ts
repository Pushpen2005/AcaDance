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
        const { type, date_from, date_to } = req.query;
        
        let query = supabase
          .from("analytics")
          .select("*");
        
        if (type) {
          query = query.eq("metric_type", type);
        }
        
        if (date_from) {
          query = query.gte("date", date_from);
        }
        
        if (date_to) {
          query = query.lte("date", date_to);
        }
        
        const { data, error } = await query
          .order("date", { ascending: false });
        
        if (error) {
          return res.status(500).json({ error: error.message });
        }
        
        return res.status(200).json(data);

      case "POST":
        // Generate analytics report
        const { reportType, filters } = req.body;
        
        let analyticsData;
        
        switch (reportType) {
          case "attendance_summary":
            analyticsData = await generateAttendanceSummary(filters);
            break;
          case "student_performance":
            analyticsData = await generateStudentPerformance(filters);
            break;
          case "faculty_workload":
            analyticsData = await generateFacultyWorkload(filters);
            break;
          case "timetable_utilization":
            analyticsData = await generateTimetableUtilization(filters);
            break;
          default:
            return res.status(400).json({ error: "Invalid report type" });
        }
        
        return res.status(200).json(analyticsData);

      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error("Analytics API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function generateAttendanceSummary(filters: any) {
  try {
    // Get attendance statistics
    const { data: attendanceData } = await supabase
      .from("attendance_records")
      .select(`
        *,
        profiles(full_name, role, department)
      `);
    
    if (!attendanceData) return { summary: "No data available" };
    
    const summary = {
      total_records: attendanceData.length,
      present_count: attendanceData.filter(r => r.status === "present").length,
      absent_count: attendanceData.filter(r => r.status === "absent").length,
      attendance_rate: 0,
      by_department: {},
      by_date: {},
      low_attendance_students: []
    };
    
    summary.attendance_rate = Math.round((summary.present_count / summary.total_records) * 100);
    
    // Group by department
    const departments: { [key: string]: { total: number; present: number } } = {};
    attendanceData.forEach(record => {
      const dept = record.profiles?.department || "Unknown";
      if (!departments[dept]) {
        departments[dept] = { total: 0, present: 0 };
      }
      departments[dept].total++;
      if (record.status === "present") {
        departments[dept].present++;
      }
    });
    
    summary.by_department = Object.keys(departments).map(dept => ({
      department: dept,
      total: departments[dept].total,
      present: departments[dept].present,
      rate: Math.round((departments[dept].present / departments[dept].total) * 100)
    }));
    
    return summary;
  } catch (error) {
    console.error("Error generating attendance summary:", error);
    return { error: "Failed to generate attendance summary" };
  }
}

async function generateStudentPerformance(filters: any) {
  try {
    const { data: students } = await supabase
      .from("profiles")
      .select("id, full_name, department")
      .eq("role", "student");
    
    if (!students) return { students: [] };
    
    const performance = [];
    
    for (const student of students) {
      const { data: attendance } = await supabase
        .from("attendance_records")
        .select("status")
        .eq("user_id", student.id);
      
      if (attendance) {
        const total = attendance.length;
        const present = attendance.filter(r => r.status === "present").length;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;
        
        performance.push({
          student_id: student.id,
          name: student.full_name,
          department: student.department,
          total_classes: total,
          attended: present,
          attendance_rate: rate,
          status: rate >= 75 ? "good" : rate >= 60 ? "warning" : "critical"
        });
      }
    }
    
    return {
      students: performance.sort((a, b) => b.attendance_rate - a.attendance_rate),
      summary: {
        total_students: performance.length,
        above_75: performance.filter(s => s.attendance_rate >= 75).length,
        below_60: performance.filter(s => s.attendance_rate < 60).length
      }
    };
  } catch (error) {
    console.error("Error generating student performance:", error);
    return { error: "Failed to generate student performance report" };
  }
}

async function generateFacultyWorkload(filters: any) {
  try {
    const { data: faculty } = await supabase
      .from("profiles")
      .select("id, full_name, department")
      .eq("role", "faculty");
    
    if (!faculty) return { faculty: [] };
    
    const workload = [];
    
    for (const member of faculty) {
      const { data: classes } = await supabase
        .from("timetable")
        .select("*")
        .eq("faculty_id", member.id);
      
      if (classes) {
        const totalHours = classes.reduce((sum, cls) => {
          const start = new Date(`2000-01-01 ${cls.start_time}`);
          const end = new Date(`2000-01-01 ${cls.end_time}`);
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }, 0);
        
        workload.push({
          faculty_id: member.id,
          name: member.full_name,
          department: member.department,
          total_classes: classes.length,
          total_hours: Math.round(totalHours * 10) / 10,
          classes_per_day: Math.round((classes.length / 5) * 10) / 10
        });
      }
    }
    
    return {
      faculty: workload.sort((a, b) => b.total_hours - a.total_hours),
      summary: {
        total_faculty: workload.length,
        average_hours: Math.round(workload.reduce((sum, f) => sum + f.total_hours, 0) / workload.length * 10) / 10,
        max_hours: Math.max(...workload.map(f => f.total_hours)),
        min_hours: Math.min(...workload.map(f => f.total_hours))
      }
    };
  } catch (error) {
    console.error("Error generating faculty workload:", error);
    return { error: "Failed to generate faculty workload report" };
  }
}

async function generateTimetableUtilization(filters: any) {
  try {
    const { data: timetable } = await supabase
      .from("timetable")
      .select("*");
    
    if (!timetable) return { utilization: {} };
    
    const roomUtilization: { [key: string]: number } = {};
    const timeSlotUtilization: { [key: string]: number } = {};
    const dayUtilization: { [key: string]: number } = { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 };
    
    timetable.forEach(slot => {
      // Room utilization
      if (!roomUtilization[slot.room]) {
        roomUtilization[slot.room] = 0;
      }
      roomUtilization[slot.room]++;
      
      // Time slot utilization
      const timeKey = `${slot.start_time}-${slot.end_time}`;
      if (!timeSlotUtilization[timeKey]) {
        timeSlotUtilization[timeKey] = 0;
      }
      timeSlotUtilization[timeKey]++;
      
      // Day utilization
      if (dayUtilization[slot.day] !== undefined) {
        dayUtilization[slot.day]++;
      }
    });
    
    return {
      room_utilization: Object.keys(roomUtilization).map(room => ({
        room,
        usage_count: roomUtilization[room],
        utilization_rate: Math.round((roomUtilization[room] / 25) * 100) // Assuming 25 total slots per week
      })),
      time_slot_utilization: Object.keys(timeSlotUtilization).map(slot => ({
        time_slot: slot,
        usage_count: timeSlotUtilization[slot]
      })),
      day_utilization: Object.keys(dayUtilization).map(day => ({
        day,
        class_count: dayUtilization[day]
      })),
      summary: {
        total_slots: timetable.length,
        unique_rooms: Object.keys(roomUtilization).length,
        busiest_day: Object.keys(dayUtilization).reduce((a, b) => dayUtilization[a] > dayUtilization[b] ? a : b)
      }
    };
  } catch (error) {
    console.error("Error generating timetable utilization:", error);
    return { error: "Failed to generate timetable utilization report" };
  }
}
