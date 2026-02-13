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
import { Card, CardContent } from '@/components/ui/card';
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
        <div ref={setNodeRef} className="flex flex-col gap-4 min-w-[280px] w-full max-w-xs bg-muted/30 p-2 rounded-lg">
            <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="font-semibold text-muted-foreground flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
                    {status}
                </h3>
                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                    {applications.length}
                </span>
            </div>

            <SortableContext
                id={id}
                items={applications.map(a => a.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="flex flex-col gap-3 min-h-[100px]">
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
        <Card className={`cursor-grab hover:shadow-md transition-all ${isOverlay ? 'shadow-xl cursor-grabbing scale-105 rotate-2' : ''}`}>
            <CardContent className="p-3 space-y-2">
                <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-sm line-clamp-1" title={application.role}>{application.role}</h4>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{application.company_name}</p>

                <div className="flex flex-wrap gap-1 mt-2">
                    {application.location && (
                        <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                            {application.location}
                        </span>
                    )}
                    {application.tech_stack?.slice(0, 2).map((tech, i) => (
                        <span key={i} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                            {tech}
                        </span>
                    ))}
                    {application.tech_stack && application.tech_stack.length > 2 && (
                        <span className="text-[10px] text-gray-500">+{application.tech_stack.length - 2}</span>
                    )}
                </div>
                {application.job_url && (
                    <div className="text-[10px] text-blue-600 truncate">
                        <button
                            type="button"
                            className="hover:underline"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.open(application.job_url, "_blank", "noopener,noreferrer");
                            }}
                        >
                            Voir l&apos;offre
                        </button>
                    </div>
                )}
                {/* Date */}
                <div className="w-full pt-1 text-[10px] text-gray-400 text-right">
                    {application.created_at ? formatDistanceToNow(new Date(application.created_at), { addSuffix: true, locale: fr }) : '-'}
                </div>
            </CardContent>
        </Card>
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

function getStatusColor(status: string) {
    switch (status) {
        case "En attente": return "bg-gray-400";
        case "Postulé": return "bg-blue-500";
        case "Entretien": return "bg-purple-500";
        case "Refusé": return "bg-red-500";
        default: return "bg-gray-400";
    }
}
