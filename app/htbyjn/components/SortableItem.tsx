"use client";
import { useDraggable } from "@dnd-kit/core";

export function SortableItem({ id, label, color }: { id: string; label: string; color: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-4 rounded-xl shadow-lg font-semibold text-white cursor-grab transition-all duration-300 ${color}`}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${isDragging ? 1.05 : 1}) rotateY(${isDragging ? 10 : 0}deg)` : undefined,
        boxShadow: isDragging ? "0 8px 32px rgba(34,197,94,0.15)" : undefined,
      }}
      aria-label={label}
      tabIndex={0}
    >
      {label}
    </div>
  );
}
