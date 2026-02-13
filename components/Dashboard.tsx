"use client";

import { useState, useMemo } from "react";
import { Application, ApplicationStatus } from "@/types";
import { updateApplicationStatus, deleteApplication } from "@/actions/applications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, LayoutGrid, List, Search } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const KanbanBoard = dynamic(() => import("./KanbanBoard"), { ssr: false });

interface DashboardProps {
    initialApplications: Application[];
}

export default function Dashboard({ initialApplications }: DashboardProps) {
    const [applications, setApplications] = useState<Application[]>(initialApplications);
    const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

    // Filters state
    const [searchQuery, setSearchQuery] = useState("");
    const [techFilter] = useState("");
    const [dateFilter] = useState<"all" | "newest" | "oldest">("newest"); // basic sort

    const handleStatusChange = async (id: string, newStatus: ApplicationStatus) => {
        // Optimistic update
        setApplications((prev) =>
            prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
        );
        try {
            await updateApplicationStatus(id, newStatus);
        } catch (error) {
            console.error("Failed to update status", error);
            // Revert if needed 
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this application?")) return;
        setApplications((prev) => prev.filter((app) => app.id !== id));
        try {
            await deleteApplication(id);
        } catch (error) {
            console.error("Failed to delete application", error);
        }
    };

    // Filter Logic
    const filteredApplications = useMemo(() => {
        let result = [...applications];

        // 1. Search (Company)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(app =>
                app.company_name.toLowerCase().includes(query) ||
                app.role.toLowerCase().includes(query)
            );
        }

        // 2. Tech Filter
        if (techFilter) {
            const query = techFilter.toLowerCase();
            result = result.filter(app =>
                app.tech_stack?.some(t => t.toLowerCase().includes(query))
            );
        }

        // 3. Date Sort
        result.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateFilter === "newest" ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [applications, searchQuery, techFilter, dateFilter]);

    // Extract unique tech stack for suggestion (optional, keeping it simple text input for now as per "Système de Filtres : Ajoute des filtres par technologie")
    // A multiselect would be better but text search is requested "par technologie".

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mes Candidatures</h1>
                    <p className="text-muted-foreground text-sm">Gérez et suivez vos processus de recrutement.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/settings">
                        <Button variant="outline" size="sm">⚙️ Paramètres</Button>
                    </Link>
                    <Link href="/new">
                        <Button>Nouvelle Candidature</Button>
                    </Link>
                </div>
            </header>

            {/* Search Bar - Keeping only Search as requested */}
            <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher une candidature (Entreprise, Poste)..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex bg-muted p-1 rounded-lg shrink-0">
                    <button
                        onClick={() => setViewMode("kanban")}
                        className={`p-2 rounded-md transition-all ${viewMode === "kanban" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                            }`}
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode("table")}
                        className={`p-2 rounded-md transition-all ${viewMode === "table" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                            }`}
                    >
                        <List size={20} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="h-full min-h-[500px]">
                {viewMode === "kanban" ? (
                    <KanbanBoard
                        applications={filteredApplications}
                        onStatusChange={handleStatusChange}
                    />
                ) : (
                    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted border-b">
                                <tr>
                                    <th className="p-4 font-medium">Poste</th>
                                    <th className="p-4 font-medium">Entreprise</th>
                                    <th className="p-4 font-medium">Lieu</th>
                                    <th className="p-4 font-medium">Tech</th>
                                    <th className="p-4 font-medium">Ajouté</th>
                                    <th className="p-4 font-medium">Statut</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredApplications.map((app) => (
                                    <tr key={app.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-4 font-medium">
                                            <Link href={`/applications/${app.id}`} className="hover:underline">
                                                {app.role}
                                            </Link>
                                        </td>
                                        <td className="p-4">{app.company_name}</td>
                                        <td className="p-4 text-muted-foreground">{app.location}</td>
                                        <td className="p-4">
                                            <div className="flex gap-1 flex-wrap">
                                                {app.tech_stack?.slice(0, 2).map((t, i) => (
                                                    <span key={i} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{t}</span>
                                                ))}
                                                {app.tech_stack && app.tech_stack.length > 2 && (
                                                    <span className="text-xs text-gray-500">+{app.tech_stack.length - 2}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-muted-foreground">
                                            {app.created_at ? new Date(app.created_at).toLocaleDateString("fr-FR") : "-"}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(app.status)}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex gap-2 justify-end items-center">
                                                {app.job_url && (
                                                    <Link href={app.job_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                                        Offre
                                                    </Link>
                                                )}
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(app.id)}>
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function getStatusBadge(status: string) {
    switch (status) {
        case "En attente": return "bg-gray-100 text-gray-700";
        case "Postulé": return "bg-blue-100 text-blue-700";
        case "Entretien": return "bg-purple-100 text-purple-700";
        case "Refusé": return "bg-red-100 text-red-700";
        default: return "bg-gray-100 text-gray-700";
    }
}
