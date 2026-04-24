import React, { useState } from 'react';
import {
  DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, DragOverlay,
  useDraggable, useDroppable,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { Clock, GripVertical } from 'lucide-react';
import { STAGES, stageColorMap } from './constants';

const FFDraggableCard = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={transform
        ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, position: 'relative', zIndex: 999 }
        : undefined}
      className={`cursor-grab active:cursor-grabbing transition-opacity ${isDragging ? 'opacity-30' : ''}`}
    >
      {children}
    </div>
  );
};

const FFDroppableColumn = ({ id, children, color }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const hoverRing = color === 'emerald' ? 'ring-emerald-300 bg-emerald-50'
    : color === 'amber'   ? 'ring-amber-300 bg-amber-50'
    : color === 'purple'  ? 'ring-purple-300 bg-purple-50'
    : color === 'blue'    ? 'ring-blue-300 bg-blue-50'
    : 'ring-zinc-300 bg-zinc-100';
  return (
    <div
      ref={setNodeRef}
      className={`space-y-2 min-h-[72px] rounded-xl p-1 -m-1 transition-all ${isOver ? `ring-1 ${hoverRing}` : ''}`}
    >
      {children}
    </div>
  );
};

export const PipelineTab = ({ pipeline, setPipeline }) => {
  const [activeCardId, setActiveCardId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = ({ active, over }) => {
    setActiveCardId(null);
    if (!over) return;
    const [srcStage, idxStr] = active.id.split('::');
    const destStage = over.id;
    if (srcStage === destStage) return;
    setPipeline(prev => {
      const src  = [...(prev[srcStage]  || [])];
      const dest = [...(prev[destStage] || [])];
      const [moved] = src.splice(Number(idxStr), 1);
      dest.push(moved);
      return { ...prev, [srcStage]: src, [destStage]: dest };
    });
  };

  const draggedCard = (() => {
    if (!activeCardId) return null;
    const [stage, idx] = activeCardId.split('::');
    return pipeline[stage]?.[Number(idx)] || null;
  })();

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => setActiveCardId(active.id)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveCardId(null)}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {STAGES.map(stage => {
          const leads = pipeline[stage.key] || [];
          const colors = stageColorMap[stage.color];
          return (
            <div key={stage.key} className="space-y-3">
              <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${colors.header}`}>
                <span className="text-xs font-semibold uppercase tracking-wider">{stage.label}</span>
                <span className="text-xs font-mono font-bold">{leads.length}</span>
              </div>
              <FFDroppableColumn id={stage.key} color={stage.color}>
                {leads.map((lead, i) => {
                  const cardId = `${stage.key}::${i}`;
                  return (
                    <FFDraggableCard key={cardId} id={cardId}>
                      <div className={`rounded-xl border p-3 ${colors.card}`}>
                        <div className="flex items-start gap-1.5 mb-1">
                          <GripVertical size={11} className="text-zinc-600 flex-shrink-0 mt-0.5" />
                          <div className="text-xs font-semibold text-zinc-900 leading-snug">{lead.title}</div>
                        </div>
                        {lead.director && <div className="text-xs text-zinc-500 mb-1 pl-4">{lead.director}</div>}
                        <div className="flex items-center gap-1.5 flex-wrap mt-2 pl-4">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${colors.badge}`}>{lead.budget}</span>
                          {lead.country && <span className="text-xs text-zinc-600 truncate">{lead.country}</span>}
                        </div>
                        {lead.daysInStage !== undefined && (
                          <div className="flex items-center gap-1 mt-2 pl-4 text-zinc-600">
                            <Clock size={10} />
                            <span className="text-xs">{lead.daysInStage}d</span>
                          </div>
                        )}
                        {lead.incentiveSavings && (
                          <div className="text-xs text-emerald-600 mt-1 pl-4 font-medium">Saves {lead.incentiveSavings}</div>
                        )}
                        {lead.signal && (
                          <div className="text-xs text-zinc-500 mt-1 pl-4 italic leading-snug">"{lead.signal}"</div>
                        )}
                        {lead.status && <div className="text-xs text-zinc-700 mt-1 pl-4">{lead.status}</div>}
                      </div>
                    </FFDraggableCard>
                  );
                })}
                {leads.length === 0 && (
                  <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-600">
                    Drop here
                  </div>
                )}
              </FFDroppableColumn>
            </div>
          );
        })}
      </div>

      {/* Ghost card overlay */}
      <DragOverlay modifiers={[snapCenterToCursor]}>
        {draggedCard ? (
          <div
            className="rounded-xl bg-white p-3 shadow-lg rotate-1 scale-105 opacity-95"
            style={{ border: '1px solid rgba(59,130,246,0.3)' }}
          >
            <div className="text-xs font-semibold text-zinc-900 mb-1">{draggedCard.title}</div>
            {draggedCard.director && <div className="text-xs text-zinc-500">{draggedCard.director}</div>}
            <div className="text-xs bg-zinc-100 text-zinc-700 border border-zinc-200 inline-block px-1.5 py-0.5 rounded mt-1">{draggedCard.budget}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
