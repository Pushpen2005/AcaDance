import { NextApiRequest, NextApiResponse } from 'next'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { format, timetable, subjects, faculty, rooms, timeSlots, filters } = req.body

    // Process timetable data
    const processedData = timetable.map((entry: any) => {
      const subject = subjects.find((s: any) => s.id === entry.subject_id)
      const facultyMember = faculty.find((f: any) => f.id === entry.faculty_id)
      const room = rooms.find((r: any) => r.id === entry.room_id)
      const timeSlot = timeSlots.find((ts: any) => ts.id === entry.time_slot_id)

      return {
        Subject: subject?.name || 'Unknown',
        'Subject Code': subject?.code || '',
        Faculty: facultyMember?.name || 'Unknown',
        Room: room?.name || 'Unknown',
        Day: timeSlot?.day || '',
        Time: timeSlot ? `${timeSlot.start_time} - ${timeSlot.end_time}` : '',
        'Time Slot': timeSlot?.slot_name || '',
        Batch: entry.batch,
        Semester: entry.semester,
        Department: entry.department,
        'Session Type': entry.session_type,
        'Week Type': entry.week_type
      }
    })

    if (format === 'excel') {
      // Create Excel file
      const worksheet = XLSX.utils.json_to_sheet(processedData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Timetable')

      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', 'attachment; filename=timetable.xlsx')
      res.send(excelBuffer)

    } else if (format === 'pdf') {
      // Generate PDF using jsPDF
      const doc = new jsPDF('landscape')
      
      // Add header
      doc.setFontSize(20)
      doc.text('Academic Timetable', 20, 20)
      
      // Add filters info
      if (filters?.department && filters.department !== 'all') {
        doc.setFontSize(12)
        doc.text(`Department: ${filters.department}`, 20, 30)
      }
      if (filters?.semester && filters.semester !== 'all') {
        doc.setFontSize(12)
        doc.text(`Semester: ${filters.semester}`, 120, 30)
      }
      
      // Create table
      const tableColumns = [
        'Subject', 'Faculty', 'Room', 'Day', 'Time', 'Batch', 'Type'
      ]
      
      const tableRows = processedData.map((entry: any) => [
        entry.Subject,
        entry.Faculty,
        entry.Room,
        entry.Day,
        entry.Time,
        entry.Batch,
        entry['Session Type']
      ])
      
      doc.autoTable({
        head: [tableColumns],
        body: tableRows,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 35 }, // Subject
          1: { cellWidth: 35 }, // Faculty
          2: { cellWidth: 25 }, // Room
          3: { cellWidth: 20 }, // Day
          4: { cellWidth: 25 }, // Time
          5: { cellWidth: 30 }, // Batch
          6: { cellWidth: 20 }  // Type
        }
      })
      
      // Add footer
      const pageCount = doc.getNumberOfPages()
      doc.setFontSize(10)
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, doc.internal.pageSize.height - 10)
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10)
      }
      
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'attachment; filename=timetable.pdf')
      res.send(pdfBuffer)

    } else if (format === 'ical') {
      // Generate iCal format
      let icalContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Academic System//Timetable//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
      ]

      processedData.forEach((entry: any, index: number) => {
        // Convert day and time to proper date format
        const now = new Date()
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1)) // Monday
        
        const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(entry.Day)
        const eventDate = new Date(startOfWeek.getTime() + dayIndex * 24 * 60 * 60 * 1000)
        
        const [startHour, startMinute] = entry.Time.split(' - ')[0].split(':')
        const [endHour, endMinute] = entry.Time.split(' - ')[1].split(':')
        
        const startDateTime = new Date(eventDate)
        startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0)
        
        const endDateTime = new Date(eventDate)
        endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0)

        icalContent.push(
          'BEGIN:VEVENT',
          `UID:${index + 1}@academic-system.com`,
          `DTSTART:${startDateTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
          `DTEND:${endDateTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
          `SUMMARY:${entry.Subject}`,
          `DESCRIPTION:Faculty: ${entry.Faculty}\\nRoom: ${entry.Room}\\nBatch: ${entry.Batch}`,
          `LOCATION:${entry.Room}`,
          'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA',
          'END:VEVENT'
        )
      })

      icalContent.push('END:VCALENDAR')

      res.setHeader('Content-Type', 'text/calendar')
      res.setHeader('Content-Disposition', 'attachment; filename=timetable.ics')
      res.send(icalContent.join('\r\n'))

    } else {
      res.status(400).json({ error: 'Invalid format specified' })
    }

  } catch (error: any) {
    console.error('Export error:', error)
    res.status(500).json({ error: 'Export failed', details: error.message })
  }
}
