"use client";
import { useEffect, useState } from "react";

type SubjectAttendance = {
  name: string;
  percent: number;
};

export default function AttendanceProgress() {
  const [subjects, setSubjects] = useState<SubjectAttendance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/attendance")
      .then((res) => res.json())
      .then((data) => {
        // Transform backend data to { name, percent }
        if (Array.isArray(data)) {
          const subjectMap: Record<string, { name: string; present: number; total: number }> = {};
          data.forEach((rec: any) => {
            if (!subjectMap[rec.subject_id]) subjectMap[rec.subject_id] = { name: rec.subject_id, present: 0, total: 0 };
            subjectMap[rec.subject_id].total++;
            if (rec.status === "present") subjectMap[rec.subject_id].present++;
          });
          const subjectsArr: SubjectAttendance[] = Object.values(subjectMap).map((s) => ({ name: s.name, percent: Math.round((s.present / s.total) * 100) }));
          setSubjects(subjectsArr);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4 text-green-700">Attendance Progress</h2>
      {loading ? <div className="text-gray-500">Loading attendance...</div> : null}
      <div className="space-y-6">
        {subjects.map((subj) => (
          <div key={subj.name}>
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-gray-700">{subj.name}</span>
              <span className={`font-bold ${subj.percent < 75 ? "text-red-600" : "text-green-600"}`}>{subj.percent}%</span>
            </div>
            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  subj.percent < 75 ? "bg-red-400 animate-attendance-low" : "bg-green-400 animate-attendance-high"
                }`}
                style={{ width: `${subj.percent}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .animate-attendance-high {
          animation: attendanceHigh 1.2s cubic-bezier(.68,-0.55,.27,1.55);
        }
        .animate-attendance-low {
          animation: attendanceLow 1.2s cubic-bezier(.68,-0.55,.27,1.55);
        }
        @keyframes attendanceHigh {
          0% { width: 0; background: #d1fae5; }
          100% { width: 100%; background: #22c55e; }
        }
        @keyframes attendanceLow {
          0% { width: 0; background: #fee2e2; }
          100% { width: 100%; background: #ef4444; }
        }
      `}</style>
    </div>
  );
}
