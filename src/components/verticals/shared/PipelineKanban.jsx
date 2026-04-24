import React, { useState } from 'react';
import {
  DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors,
  DragOverlay, useDraggable, useDroppable,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { GripVertical, Trash2, Loader2 } from 'lucide-react';

const Draggable = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners}
      style={transform ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)`, zIndex: 999, position: 'relative' } : undefined}
      className={`transition-opacity ${isDragging ? 'opacity-30' : ''} cursor-grab active:cursor-grabbing`}>
      {children}
    </div>
  );
};

const Droppable = ({ id, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`space-y-2 min-h-[72px] rounded-xl p-1 -m-1 transition-all ${isOver ? 'bg-amber-50 ring-1 ring-amber-300' : ''}`}>
      {children}
    </div>
  );
};

/**
 * Generic vertical Kanban — consumes useVerticalPipeline output.
 * Props:
 *   rows           — { stage: [] } grouped rows
 *   stages         — ordered stage names
 *   stageBadgeMap  — { stage: tailwindClasses }
 *   onMove(id, from, to)
 *   onDelete(id)
 *   renderCard(row) — render one card (inside the Draggable)
 *   loading
 *   emptyLabel
 */
export const PipelineKanban = ({
  rows, stages, stageBadgeMap = {},
  onMove, onDelete, renderCard,
  loading, emptyLabel = 'Drop here',
}) => {
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const dragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over) return;
    let from = null;
    for (const s of stages) {
      if ((rows[s] || []).some(x => x.id === active.id)) { from = s; break; }
    }
    if (from && from !== over.id) onMove(active.id, from, over.id);
  };

  const dragged = activeId ? stages.flatMap(s => rows[s] || []).find(x => x.id === activeId) : null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-500 text-sm">
        <Loader2 size={16} className="animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <DndContext sensors={sensors}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={dragEnd}
      onDragCancel={() => setActiveId(null)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stages.map(stage => {
          const items = rows[stage] || [];
          const badge = stageBadgeMap[stage] || 'bg-zinc-100 text-zinc-700 border-zinc-200';
          return (
            <div key={stage} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${badge}`}>{stage}</span>
                <span className="text-xs font-mono text-zinc-500">{items.length}</span>
              </div>
              <Droppable id={stage}>
                {items.map(r => (
                  <Draggable key={r.id} id={r.id}>
                    <div className="relative bg-white rounded-xl p-3 overflow-hidden group" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent pointer-events-none" />
                      <div className="relative z-10">
                        <div className="flex items-start gap-1.5">
                          <GripVertical size={12} className="text-zinc-400 flex-shrink-0 mt-0.5 cursor-grab" />
                          <div className="flex-1 min-w-0">{renderCard(r)}</div>
                          <button onPointerDown={e => e.stopPropagation()} onClick={() => onDelete(r.id)}
                            className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-600 transition p-0.5"
                            aria-label="Delete"><Trash2 size={11} /></button>
                        </div>
                      </div>
                    </div>
                  </Draggable>
                ))}
                {items.length === 0 && (
                  <div className="rounded-xl border-2 border-dashed border-zinc-200 p-3 text-center text-[11px] text-zinc-500">
                    {emptyLabel}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
      <DragOverlay modifiers={[snapCenterToCursor]}>
        {dragged ? (
          <div className="relative bg-white rounded-xl p-3 shadow-lg rotate-1 scale-105" style={{ border: '1px solid rgba(245,158,11,0.3)' }}>
            {renderCard(dragged)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
