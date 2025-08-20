import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, Edit, Trash2, Users, BookOpen, MapPin, Clock, 
  Calendar, Settings, AlertCircle, Check, X
} from "lucide-react";

type EntityType = 'subjects' | 'faculty' | 'rooms' | 'timeSlots' | 'constraints';

interface Subject {
  id: number;
  code: string;
  name: string;
  credits: number;
  department: string;
  semester: number;
  status: string;
}

interface Faculty {
  id: number;
  name: string;
  email: string;
  department: string;
  specialization: string;
  maxHours: number;
  currentHours: number;
  status: string;
}

interface Room {
  id: number;
  name: string;
  type: string;
  capacity: number;
  equipment: string[];
  department: string;
  status: string;
}

interface TimeSlot {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: string;
  status: string;
}

interface Constraint {
  id: number;
  type: string;
  faculty?: string;
  room?: string;
  subject?: string;
  constraint: string;
  priority: string;
  status: string;
}

type EditingItem = (Subject | Faculty | Room | TimeSlot | Constraint) & { type: EntityType };

const ComprehensiveTimetableManagement = () => {
  const [activeTab, setActiveTab] = useState<EntityType>('subjects');
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [newItem, setNewItem] = useState<any>({});

  // Sample data
  const subjects = [
    { id: 1, code: 'CS101', name: 'Computer Science Fundamentals', credits: 3, department: 'Computer Science', semester: 1, status: 'active' },
    { id: 2, code: 'DS201', name: 'Data Structures', credits: 4, department: 'Computer Science', semester: 2, status: 'active' },
    { id: 3, code: 'ALG301', name: 'Algorithms', credits: 4, department: 'Computer Science', semester: 3, status: 'active' },
    { id: 4, code: 'DB401', name: 'Database Systems', credits: 3, department: 'Computer Science', semester: 4, status: 'inactive' },
  ];

  const faculty = [
    { id: 1, name: 'Dr. John Smith', email: 'john.smith@university.edu', department: 'Computer Science', specialization: 'Machine Learning', maxHours: 20, currentHours: 16, status: 'active' },
    { id: 2, name: 'Prof. Jane Johnson', email: 'jane.johnson@university.edu', department: 'Computer Science', specialization: 'Database Systems', maxHours: 18, currentHours: 14, status: 'active' },
    { id: 3, name: 'Dr. Mike Wilson', email: 'mike.wilson@university.edu', department: 'Mathematics', specialization: 'Discrete Mathematics', maxHours: 16, currentHours: 12, status: 'active' },
  ];

  const rooms = [
    { id: 1, name: 'Room A-101', type: 'Lecture Hall', capacity: 100, equipment: ['Projector', 'Audio System', 'Whiteboard'], department: 'Computer Science', status: 'available' },
    { id: 2, name: 'Lab B-205', type: 'Computer Lab', capacity: 40, equipment: ['40 Computers', 'Projector', 'Whiteboard'], department: 'Computer Science', status: 'available' },
    { id: 3, name: 'Room C-301', type: 'Classroom', capacity: 60, equipment: ['Projector', 'Whiteboard'], department: 'General', status: 'maintenance' },
  ];

  const timeSlots = [
    { id: 1, name: 'Period 1', startTime: '09:00', endTime: '10:00', duration: 60, type: 'regular', status: 'active' },
    { id: 2, name: 'Period 2', startTime: '10:00', endTime: '11:00', duration: 60, type: 'regular', status: 'active' },
    { id: 3, name: 'Period 3', startTime: '11:15', endTime: '12:15', duration: 60, type: 'regular', status: 'active' },
    { id: 4, name: 'Lab Session', startTime: '14:00', endTime: '17:00', duration: 180, type: 'lab', status: 'active' },
  ];

  const constraints = [
    { id: 1, type: 'Faculty Availability', faculty: 'Dr. John Smith', constraint: 'Not available on Fridays after 2 PM', priority: 'high', status: 'active' },
    { id: 2, type: 'Room Conflict', room: 'Lab B-205', constraint: 'Maintenance scheduled on Wednesdays 1-3 PM', priority: 'critical', status: 'active' },
    { id: 3, type: 'Subject Constraint', subject: 'CS101', constraint: 'Must be scheduled before 12 PM', priority: 'medium', status: 'active' },
  ];

  const renderEntityTable = (data: any[], type: EntityType) => {
    const columns: Record<EntityType, string[]> = {
      subjects: ['Code', 'Name', 'Credits', 'Department', 'Semester', 'Status', 'Actions'],
      faculty: ['Name', 'Department', 'Specialization', 'Hours (Current/Max)', 'Status', 'Actions'],
      rooms: ['Name', 'Type', 'Capacity', 'Equipment', 'Status', 'Actions'],
      timeSlots: ['Name', 'Time', 'Duration', 'Type', 'Status', 'Actions'],
      constraints: ['Type', 'Details', 'Priority', 'Status', 'Actions']
    };

    const renderRow = (item: any) => {
      switch (type) {
        case 'subjects':
          return (
            <tr key={item.id} className="border-b">
              <td className="p-3 font-medium">{item.code}</td>
              <td className="p-3">{item.name}</td>
              <td className="p-3">{item.credits}</td>
              <td className="p-3">{item.department}</td>
              <td className="p-3">{item.semester}</td>
              <td className="p-3">
                <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                  {item.status}
                </Badge>
              </td>
              <td className="p-3">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingItem({...item, type: 'subject'})}>
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </td>
            </tr>
          );
        case 'faculty':
          return (
            <tr key={item.id} className="border-b">
              <td className="p-3 font-medium">{item.name}</td>
              <td className="p-3">{item.department}</td>
              <td className="p-3">{item.specialization}</td>
              <td className="p-3">{item.currentHours}/{item.maxHours}</td>
              <td className="p-3">
                <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                  {item.status}
                </Badge>
              </td>
              <td className="p-3">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingItem({...item, type: 'faculty'})}>
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </td>
            </tr>
          );
        case 'rooms':
          return (
            <tr key={item.id} className="border-b">
              <td className="p-3 font-medium">{item.name}</td>
              <td className="p-3">{item.type}</td>
              <td className="p-3">{item.capacity}</td>
              <td className="p-3">
                <div className="flex flex-wrap gap-1">
                  {item.equipment.slice(0, 2).map((eq: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">{eq}</Badge>
                  ))}
                  {item.equipment.length > 2 && (
                    <Badge variant="outline" className="text-xs">+{item.equipment.length - 2}</Badge>
                  )}
                </div>
              </td>
              <td className="p-3">
                <Badge variant={item.status === 'available' ? 'default' : item.status === 'maintenance' ? 'destructive' : 'secondary'}>
                  {item.status}
                </Badge>
              </td>
              <td className="p-3">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingItem({...item, type: 'room'})}>
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </td>
            </tr>
          );
        case 'timeSlots':
          return (
            <tr key={item.id} className="border-b">
              <td className="p-3 font-medium">{item.name}</td>
              <td className="p-3">{item.startTime} - {item.endTime}</td>
              <td className="p-3">{item.duration} min</td>
              <td className="p-3">{item.type}</td>
              <td className="p-3">
                <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                  {item.status}
                </Badge>
              </td>
              <td className="p-3">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingItem({...item, type: 'timeSlot'})}>
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </td>
            </tr>
          );
        case 'constraints':
          return (
            <tr key={item.id} className="border-b">
              <td className="p-3 font-medium">{item.type}</td>
              <td className="p-3">{item.constraint}</td>
              <td className="p-3">
                <Badge variant={
                  item.priority === 'critical' ? 'destructive' :
                  item.priority === 'high' ? 'secondary' : 'outline'
                }>
                  {item.priority}
                </Badge>
              </td>
              <td className="p-3">
                <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                  {item.status}
                </Badge>
              </td>
              <td className="p-3">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingItem({...item, type: 'constraint'})}>
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </td>
            </tr>
          );
        default:
          return null;
      }
    };

    return (
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns[type].map((column: string) => (
                <th key={column} className="p-3 text-left font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(renderRow)}
          </tbody>
        </table>
      </div>
    );
  };

  const renderAddForm = (type: EntityType) => {
    const forms: Record<EntityType, React.ReactElement> = {
      subjects: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject Code</Label>
              <Input placeholder="CS101" />
            </div>
            <div className="space-y-2">
              <Label>Credits</Label>
              <Input type="number" placeholder="3" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Subject Name</Label>
            <Input placeholder="Computer Science Fundamentals" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cs">Computer Science</SelectItem>
                  <SelectItem value="math">Mathematics</SelectItem>
                  <SelectItem value="physics">Physics</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Semester</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Semester 1</SelectItem>
                  <SelectItem value="2">Semester 2</SelectItem>
                  <SelectItem value="3">Semester 3</SelectItem>
                  <SelectItem value="4">Semester 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea placeholder="Subject description..." rows={3} />
          </div>
        </div>
      ),
      faculty: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input placeholder="Dr. John Smith" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="john.smith@university.edu" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cs">Computer Science</SelectItem>
                  <SelectItem value="math">Mathematics</SelectItem>
                  <SelectItem value="physics">Physics</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max Weekly Hours</Label>
              <Input type="number" placeholder="20" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Specialization</Label>
            <Input placeholder="Machine Learning, Database Systems" />
          </div>
          <div className="space-y-2">
            <Label>Availability Notes</Label>
            <Textarea placeholder="Special availability constraints..." rows={3} />
          </div>
        </div>
      ),
      rooms: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Room Name</Label>
              <Input placeholder="Room A-101" />
            </div>
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input type="number" placeholder="100" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Room Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lecture">Lecture Hall</SelectItem>
                <SelectItem value="lab">Computer Lab</SelectItem>
                <SelectItem value="classroom">Classroom</SelectItem>
                <SelectItem value="seminar">Seminar Room</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Equipment</Label>
            <Textarea placeholder="Projector, Audio System, Whiteboard..." rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Department Assignment</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Use</SelectItem>
                <SelectItem value="cs">Computer Science</SelectItem>
                <SelectItem value="math">Mathematics</SelectItem>
                <SelectItem value="physics">Physics</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
      timeSlots: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Time Slot Name</Label>
            <Input placeholder="Period 1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="time" />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input type="time" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular Class</SelectItem>
                <SelectItem value="lab">Lab Session</SelectItem>
                <SelectItem value="exam">Exam Slot</SelectItem>
                <SelectItem value="break">Break Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="recurring" />
            <Label htmlFor="recurring">Recurring Daily</Label>
          </div>
        </div>
      ),
      constraints: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Constraint Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="faculty">Faculty Availability</SelectItem>
                <SelectItem value="room">Room Constraint</SelectItem>
                <SelectItem value="subject">Subject Constraint</SelectItem>
                <SelectItem value="time">Time Constraint</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Constraint Description</Label>
            <Textarea placeholder="Describe the constraint..." rows={4} />
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="active" defaultChecked />
            <Label htmlFor="active">Active</Label>
          </div>
        </div>
      )
    };

    return forms[type] || <div>Form not implemented</div>;
  };

  const getEntityData = (type: EntityType) => {
    switch (type) {
      case 'subjects': return subjects;
      case 'faculty': return faculty;
      case 'rooms': return rooms;
      case 'timeSlots': return timeSlots;
      case 'constraints': return constraints;
      default: return [];
    }
  };

  const getEntityIcon = (type: EntityType) => {
    switch (type) {
      case 'subjects': return BookOpen;
      case 'faculty': return Users;
      case 'rooms': return MapPin;
      case 'timeSlots': return Clock;
      case 'constraints': return AlertCircle;
      default: return Settings;
    }
  };

  const getEntityTitle = (type: EntityType) => {
    switch (type) {
      case 'subjects': return 'Subjects';
      case 'faculty': return 'Faculty';
      case 'rooms': return 'Rooms';
      case 'timeSlots': return 'Time Slots';
      case 'constraints': return 'Constraints';
      default: return 'Entity';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timetable Management</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive CRUD operations for all timetable entities
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as EntityType)} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="faculty">Faculty</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="timeSlots">Time Slots</TabsTrigger>
          <TabsTrigger value="constraints">Constraints</TabsTrigger>
        </TabsList>

        {(['subjects', 'faculty', 'rooms', 'timeSlots', 'constraints'] as EntityType[]).map((type) => {
          const Icon = getEntityIcon(type);
          const title = getEntityTitle(type);
          const data = getEntityData(type);

          return (
            <TabsContent key={type} value={type} className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5" />
                      <CardTitle>{title} Management</CardTitle>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add {title.slice(0, -1)}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Add New {title.slice(0, -1)}</DialogTitle>
                          <DialogDescription>
                            Create a new {type.slice(0, -1)} entry for the timetable system.
                          </DialogDescription>
                        </DialogHeader>
                        {renderAddForm(type)}
                        <div className="flex justify-end gap-2 mt-6">
                          <Button variant="outline">Cancel</Button>
                          <Button>Create {title.slice(0, -1)}</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <CardDescription>
                    Manage {type} for the timetable system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderEntityTable(data, type)}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Edit Dialog */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit {editingItem.type}</DialogTitle>
              <DialogDescription>
                Update the {editingItem.type} information.
              </DialogDescription>
            </DialogHeader>
            {renderAddForm(editingItem.type)}
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
              <Button>Update {editingItem.type}</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ComprehensiveTimetableManagement;
