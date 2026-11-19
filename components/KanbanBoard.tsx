'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { Application, ApplicationStatus } from '@/types';
import { MapPin, ExternalLink } from 'lucide-react';
import { CompanyAvatar } from '@/components/CompanyAvatar';
import { statusStyle } from '@/lib/status';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface KanbanBoardProps {
    applications: Application[];
    onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
}

const statuses: ApplicationStatus[] = ["En attente", "Postulé", "Entretien", "Refusé"];

export default function KanbanBoard({ applications, onStatusChange }: KanbanBoardProps) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Enable click on cards
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const columns = useMemo(() => {
        const cols: Record<ApplicationStatus, Application[]> = {
            "En attente": [],
            "Postulé": [],
            "Entretien": [],
            "Refusé": [],
        };
        applications.forEach((app) => {
            if (cols[app.status]) {
                cols[app.status].push(app);
            }
        });
        return cols;
    }, [applications]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = () => {
        // Optional: Real-time visual feedback if needed
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find the application
        const app = applications.find(a => a.id === activeId);
        if (!app) return;

        // Check if overId is a status directly (droppable container)
        let newStatus: ApplicationStatus | undefined;

        if (statuses.includes(overId as ApplicationStatus)) {
            newStatus = overId as ApplicationStatus;
        } else {
            // Dropped over another item?
            // Let Dnd Kit handle sorting if within same container, but if different container we need status update
            // Actually, for simplicity, if we rely on `SortableContext` strategy, we need to know which container effectively.
            // But simply checking if the over element belongs to a different status group is easier.
            // However, dnd-kit's `over` usually gives the droppable id.
            // If we use `SortableContext` per column, items are droppable too.

            // Let's look at the container mapping.
            // The simplest way for Kanban moving between columns is to detect the column.
            // Dnd-Kit `SortableContext` uses `items` prop. 
            // We can find which column `overId` belongs to.

            const overApp = applications.find(a => a.id === overId);
            if (overApp) {
                newStatus = overApp.status;
            }
        }

        if (newStatus && newStatus !== app.status) {
            onStatusChange(activeId, newStatus);
        }

        // Handle reordering within same column if needed (requires updated order in DB, skipping for now as per requirements only Status change is explicitly asked but Drag & Drop implies reordering often. 
        // IF sorting is required, we need a `position` field. 
        // The user said "glisser-déposer ... entre les colonnes de statut".
        // Prioritize status change. Active sorting purely visual for now effectively resets on refresh unless persisted.

        setActiveId(null);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-4 h-full min-h-[500px]">
                {statuses.map((status) => (
                    <KanbanColumn
                        key={status}
                        id={status}
                        status={status}
                        applications={columns[status]}
                    />
                ))}
            </div>
            <DragOverlay dropAnimation={dropAnimation}>
                {activeId ? (
                    <ApplicationCard application={applications.find(a => a.id === activeId)!} isOverlay />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
};

interface KanbanColumnProps {
    id: string;
    status: ApplicationStatus;
    applications: Application[];
}

function KanbanColumn({ id, status, applications }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({ id }); // Make the whole column droppable

    return (
        <div ref={setNodeRef} className="flex flex-col gap-3 min-w-[272px] w-full max-w-xs rounded-xl bg-muted/60 p-2">
            <div className="flex items-center justify-between px-2 pt-1">
                <h3 className="text-sm font-medium flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusStyle(status).dot}`} />
                    {status}
                </h3>
                <span className="text-xs text-muted-foreground tabular-nums">
                    {applications.length}
                </span>
            </div>

            <SortableContext
                id={id}
                items={applications.map(a => a.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="flex flex-col gap-2 min-h-[100px]">
                    {applications.map((app) => (
                        <SortableApplicationCard key={app.id} application={app} />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
}

interface SortableApplicationCardProps {
    application: Application;
}

function SortableApplicationCard({ application }: SortableApplicationCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: application.id, data: { application } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <ApplicationCard application={application} />
        </div>
    );
}



function ApplicationCard({ application, isOverlay }: { application: Application, isOverlay?: boolean }) {
    const cardContent = (
        <div
            className={`group relative overflow-hidden rounded-lg border bg-card p-3 pl-4 cursor-grab transition-all
                before:absolute before:inset-y-0 before:left-0 before:w-[3px] ${statusStyle(application.status).bar}
                hover:-translate-y-px hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.12)] hover:border-stone-300
                ${isOverlay ? 'shadow-xl cursor-grabbing rotate-1' : ''}`}
        >
            <div className="flex items-start gap-2.5">
                <CompanyAvatar name={application.company_name} size="sm" />
                <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm leading-snug line-clamp-2" title={application.role}>{application.role}</h4>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{application.company_name}</p>
                </div>
            </div>

            {(application.location || (application.tech_stack && application.tech_stack.length > 0)) && (
                <div className="flex flex-wrap items-center gap-1 mt-3">
                    {application.location && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground mr-1">
                            <MapPin size={11} />
                            {application.location}
                        </span>
                    )}
                    {application.tech_stack?.slice(0, 2).map((tech, i) => (
                        <span key={i} className="text-[11px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">
                            {tech}
                        </span>
                    ))}
                    {application.tech_stack && application.tech_stack.length > 2 && (
                        <span className="text-[11px] text-muted-foreground">+{application.tech_stack.length - 2}</span>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between mt-3 text-[11px] text-muted-foreground">
                <span>
                    {application.created_at ? formatDistanceToNow(new Date(application.created_at), { addSuffix: true, locale: fr }) : '–'}
                </span>
                {application.job_url && (
                    <button
                        type="button"
                        className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(application.job_url, "_blank", "noopener,noreferrer");
                        }}
                    >
                        Offre <ExternalLink size={11} />
                    </button>
                )}
            </div>
        </div>
    );

    if (isOverlay) {
        return cardContent;
    }

    return (
        <Link href={`/applications/${application.id}`} className="block">
            {cardContent}
        </Link>
    );
}
