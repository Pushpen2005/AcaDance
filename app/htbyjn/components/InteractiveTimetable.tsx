"use client";
import { useState, useEffect } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {SortableItem} from "./SortableItem";

const initialTimetable = [
  { id: "math", label: "Mathematics", color: "bg-blue-400", teacher: "Priya", room: "A101", type: "subject" },
  { id: "physics", label: "Physics", color: "bg-green-400", teacher: "Alex", room: "A102", type: "lab" },
  { id: "cs", label: "Computer Science", color: "bg-purple-400", teacher: "Priya", room: "A101", type: "elective" },
  { id: "english", label: "English", color: "bg-yellow-400", teacher: "John", room: "A103", type: "subject" },
];

export default function InteractiveTimetable() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [items, setItems] = useState(initialTimetable);
  const [conflict, setConflict] = useState<string | null>(null);
  const [view, setView] = useState<'admin' | 'student'>('admin');
  const [loading, setLoading] = useState(false);

  // Fetch timetable from backend
  useEffect(() => {
    setLoading(true);
    fetch("/api/timetable")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!active || !active.id || !over || !over.id) return;
    if (active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      // Advanced conflict detection
      let conflictMsg = null;
      for (let i = 0; i < newItems.length; i++) {
        for (let j = i + 1; j < newItems.length; j++) {
          if (newItems[i].teacher === newItems[j].teacher && newItems[i].room !== newItems[j].room) {
            conflictMsg = `Conflict: ${newItems[i].teacher} assigned to two slots.`;
          }
          if (newItems[i].room === newItems[j].room && newItems[i].id !== newItems[j].id) {
            conflictMsg = `Conflict: Room ${newItems[i].room} overlap.`;
          }
        }
      }
      setConflict(conflictMsg);
      // Save new timetable to backend
      fetch("/api/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: newItems }),
      });
    }
  }

  if (!mounted) return null;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4 text-green-700">Interactive Timetable</h2>
      <div className="mb-4 flex gap-2">
        <button
          className={`px-4 py-2 rounded-full font-semibold shadow ${view === 'admin' ? 'bg-green-700 text-white' : 'bg-gray-100 text-green-700'}`}
          onClick={() => setView('admin')}
        >
          Admin/Faculty View
        </button>
        <button
          className={`px-4 py-2 rounded-full font-semibold shadow ${view === 'student' ? 'bg-blue-700 text-white' : 'bg-gray-100 text-blue-700'}`}
          onClick={() => setView('student')}
        >
          Student View
        </button>
      </div>
      {view === 'admin' ? (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {items.map((item) => (
                <SortableItem key={item.id} id={item.id} label={`${item.label} (${item.teacher}, ${item.room})`} color={item.color} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.id} className={`p-4 rounded-xl shadow-lg font-semibold text-white ${item.color}`}
              aria-label={item.label} tabIndex={0}>
              <span className="block text-lg">{item.label}</span>
              <span className="block text-xs">{item.type}</span>
              <span className="block text-xs">{item.teacher}</span>
              <span className="block text-xs">Room: {item.room}</span>
            </div>
          ))}
        </div>
      )}
      {conflict && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded shadow animate-shake-3d">{conflict}</div>
      )}
      {loading ? <div className="text-gray-500">Loading timetable...</div> : null}
      <style jsx>{`
        .animate-shake-3d {
          animation: shake3d 0.6s cubic-bezier(.68,-0.55,.27,1.55);
        }
        @keyframes shake3d {
          0% { transform: rotateY(0deg) scale(1); }
          20% { transform: rotateY(-10deg) scale(0.98); }
          40% { transform: rotateY(10deg) scale(1.02); }
          60% { transform: rotateY(-10deg) scale(0.98); }
          80% { transform: rotateY(10deg) scale(1.02); }
          100% { transform: rotateY(0deg) scale(1); }
        }
      `}</style>
    </div>
  );
}
