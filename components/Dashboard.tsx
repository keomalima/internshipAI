"use client";

import { useState, useMemo } from "react";
import { Application, ApplicationStatus } from "@/types";
import { updateApplicationStatus, deleteApplication } from "@/actions/applications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, LayoutGrid, List, Search, Settings, Plus, Inbox, ExternalLink } from "lucide-react";
import { statusStyle } from "@/lib/status";
import { CompanyAvatar } from "@/components/CompanyAvatar";
import { Logo } from "@/components/Logo";
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


    const stats = useMemo(() => {
        const total = applications.length;
        const count = (s: ApplicationStatus) => applications.filter(a => a.status === s).length;
        const applied = total - count("En attente");
        const interviews = count("Entretien");
        const answered = interviews + count("Refusé");
        return [
            { label: "Candidatures", value: total },
            { label: "Envoyées", value: applied },
            { label: "Entretiens", value: interviews },
            { label: "Taux de réponse", value: applied ? `${Math.round((answered / applied) * 100)}%` : "–" },
        ];
    }, [applications]);

    return (
        <div className="min-h-screen">
            {/* Top bar */}
            <div className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
                <div className="max-w-7xl mx-auto px-6 md:px-8 h-14 flex items-center justify-between">
                    <Logo />
                    <div className="flex items-center gap-2">
                        <Link href="/settings">
                            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                                <Settings size={16} />
                                <span className="hidden sm:inline">Paramètres</span>
                            </Button>
                        </Link>
                        <Link href="/new">
                            <Button size="sm" className="gap-1.5 rounded-lg">
                                <Plus size={16} />
                                Nouvelle candidature
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 space-y-6">
                <header>
                    <h1 className="text-2xl font-semibold tracking-tight">Mes candidatures</h1>
                    <p className="text-muted-foreground text-sm mt-1">Gérez et suivez vos processus de recrutement.</p>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {stats.map((s) => (
                        <div key={s.label} className="rounded-xl border bg-card px-4 py-3">
                            <div className="text-xs text-muted-foreground">{s.label}</div>
                            <div className="text-2xl font-semibold tracking-tight mt-0.5 tabular-nums">{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                    <div className="relative w-full md:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher une entreprise ou un poste…"
                            className="pl-9 h-9 rounded-lg bg-card"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex self-end md:self-auto rounded-lg border bg-card p-0.5 shrink-0">
                        {([
                            { mode: "kanban", icon: LayoutGrid, label: "Tableau" },
                            { mode: "table", icon: List, label: "Liste" },
                        ] as const).map(({ mode, icon: Icon, label }) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${viewMode === mode
                                    ? "bg-muted text-foreground font-medium"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <Icon size={15} />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                {applications.length === 0 ? (
                    <div className="rounded-xl border border-dashed bg-card py-16 flex flex-col items-center text-center">
                        <span className="grid place-items-center h-12 w-12 rounded-full bg-muted text-muted-foreground mb-4">
                            <Inbox size={22} />
                        </span>
                        <h2 className="font-medium">Aucune candidature pour l&apos;instant</h2>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                            Collez une offre d&apos;emploi et l&apos;IA en extraira les informations clés.
                        </p>
                        <Link href="/new" className="mt-5">
                            <Button size="sm" className="gap-1.5 rounded-lg">
                                <Plus size={16} />
                                Ajouter une offre
                            </Button>
                        </Link>
                    </div>
                ) : viewMode === "kanban" ? (
                    <KanbanBoard
                        applications={filteredApplications}
                        onStatusChange={handleStatusChange}
                    />
                ) : (
                    <div className="rounded-xl border bg-card overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b text-xs text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Poste</th>
                                    <th className="px-4 py-3 font-medium">Lieu</th>
                                    <th className="px-4 py-3 font-medium">Tech</th>
                                    <th className="px-4 py-3 font-medium">Ajouté</th>
                                    <th className="px-4 py-3 font-medium">Statut</th>
                                    <th className="px-4 py-3 font-medium text-right"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredApplications.map((app) => (
                                    <tr key={app.id} className="group border-b last:border-0 hover:bg-muted/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <Link href={`/applications/${app.id}`} className="flex items-center gap-3">
                                                <CompanyAvatar name={app.company_name} />
                                                <div className="min-w-0">
                                                    <div className="font-medium truncate group-hover:underline underline-offset-2">{app.role}</div>
                                                    <div className="text-xs text-muted-foreground truncate">{app.company_name}</div>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{app.location || "–"}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1 flex-wrap">
                                                {app.tech_stack?.slice(0, 2).map((t, i) => (
                                                    <span key={i} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{t}</span>
                                                ))}
                                                {app.tech_stack && app.tech_stack.length > 2 && (
                                                    <span className="text-xs text-muted-foreground">+{app.tech_stack.length - 2}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap tabular-nums">
                                            {app.created_at ? new Date(app.created_at).toLocaleDateString("fr-FR") : "–"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset whitespace-nowrap ${statusStyle(app.status).badge}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${statusStyle(app.status).dot}`} />
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex gap-1 justify-end items-center">
                                                {app.job_url && (
                                                    <a href={app.job_url} target="_blank" rel="noopener noreferrer" title="Voir l'offre"
                                                        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                                                        <ExternalLink size={15} />
                                                    </a>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(app.id)} title="Supprimer">
                                                    <Trash2 size={15} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredApplications.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                                            Aucun résultat pour « {searchQuery} »
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
