#!/bin/bash

# Fix React.memo export syntax errors
files=(
  "components/FacultyAttendanceMarking.tsx"
  "components/IntegrationTestDashboard.tsx"
  "components/StudentAttendanceDashboard.tsx"
  "components/AdminAuditLogs.tsx"
  "components/StudentDashboard.tsx"
  "components/StudentAttendanceSystem.tsx"
  "components/SimpleAttendanceDemo.tsx"
  "components/ComprehensiveTimetableManagement.tsx"
  "components/FacultyAttendanceDashboard.tsx"
  "components/AdminDashboard-backup.tsx"
  "components/TimetableView.tsx"
  "components/StudentDashboard-enhanced.tsx"
  "components/FacultyDashboard-old.tsx"
  "components/AdminGlobalSettings.tsx"
  "components/StudentDashboard-old.tsx"
)

for file in "${files[@]}"; do
  echo "Fixing React.memo syntax in: $file"
  
  # Fix the export default React.memo(ComponentName; pattern
  sed -i '' 's/export default React\.memo(\([^;]*\);/export default React.memo(\1);/g' "$file"
  
  echo "Fixed: $file"
done

echo "All React.memo syntax errors fixed!"
