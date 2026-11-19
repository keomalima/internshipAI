"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Loader2, Save, Check, ExternalLink, MapPin, RefreshCw, Sparkles,
    ChevronDown, ChevronRight,
} from "lucide-react";

import { Application, ApplicationStatus } from "@/types";
import { updateApplication } from "@/actions/applications";
import { analyzeGap } from "@/actions/analyze-gap";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/DatePicker";
import { CompanyAvatar } from "@/components/CompanyAvatar";
import {
    ScoreRing, scoreTone, PointList, InsightNotes, BulletList, RequirementList,
    ProcessSteps, TechTags,
} from "@/components/analysis";
import { parseGapAnalysis, toLines } from "@/lib/parse-analysis";
import { STATUS_STYLES, statusStyle } from "@/lib/status";

/*
 * Detail page for one application. Focused on reading the analysis:
 * score + fit first, offer details second. Cover letter / email generation
 * is hidden for now (actions still exist in /actions if needed again).
 */

const STATUSES = Object.keys(STATUS_STYLES) as ApplicationStatus[];

function snapshot(a: Application) {
    return JSON.stringify([a.status, a.applied_at ?? null, a.cover_letter_context ?? "", a.gap_analysis ?? ""]);
}

export default function ApplicationEditor({ application }: { application: Application }) {
    const router = useRouter();
    const [data, setData] = useState<Application>(application);
    const [saved, setSaved] = useState(() => snapshot(application));
    const [isSaving, setIsSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const [gapState, setGapState] = useState<{ loading: boolean; error?: string }>({ loading: false });

    const dirty = snapshot(data) !== saved;
    const gap = useMemo(() => parseGapAnalysis(data.gap_analysis || ""), [data.gap_analysis]);
    const hasGap = gap.score !== null || gap.strengths.length > 0 || gap.gaps.length > 0;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateApplication(data.id, {
                status: data.status,
                applied_at: data.applied_at ? new Date(data.applied_at).toISOString() : undefined,
                cover_letter_context: data.cover_letter_context || "",
                gap_analysis: data.gap_analysis || "",
            });
            setSaved(snapshot(data));
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 2000);
            router.refresh();
        } catch (error) {
            console.error("Save failed", error);
            alert("Erreur lors de la sauvegarde.");
        } finally {
            setIsSaving(false);
        }
    };

    const runGap = async () => {
        if (!data.job_description) {
            setGapState({ loading: false, error: "Description de l'offre manquante." });
            return;
        }
        setGapState({ loading: true });
        try {
            const text = await analyzeGap(data.job_description);
            const next = { ...data, gap_analysis: text };
            setData(next);
            // Persist straight away: re-running an analysis shouldn't need a manual save.
            await updateApplication(data.id, { gap_analysis: text });
            setSaved((prev) => {
                const p = JSON.parse(prev);
                p[3] = text;
                return JSON.stringify(p);
            });
            setGapState({ loading: false });
        } catch (error) {
            const msg = error instanceof Error ? error.message : "";
            setGapState({
                loading: false,
                error: /cv/i.test(msg)
                    ? "Aucun CV trouvé. Ajoutez-le dans vos paramètres."
                    : "L'analyse a échoué. Réessayez.",
            });
        }
    };

    return (
        <div className="min-h-screen">
            {/* Top bar */}
            <div className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 h-14 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link href="/" className="p-1.5 -ml-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Retour">
                            <ArrowLeft size={18} />
                        </Link>
                        <div className="min-w-0 hidden sm:block text-sm">
                            <span className="font-medium truncate">{data.role}</span>
                            <span className="text-muted-foreground"> · {data.company_name}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <StatusSelect
                            value={data.status}
                            onChange={(status) => setData({ ...data, status })}
                        />
                        <DatePicker
                            date={data.applied_at ? new Date(data.applied_at) : undefined}
                            setDate={(date) => setData({ ...data, applied_at: date ? date.toISOString() : undefined })}
                            label="Date d'envoi"
                            className="hidden sm:inline-flex w-auto h-9 rounded-lg text-sm"
                        />
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isSaving || (!dirty && !justSaved)}
                            className="gap-1.5 rounded-lg sm:min-w-[118px]"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={16} />
                                : justSaved ? <Check size={16} /> : <Save size={16} />}
                            <span className="hidden sm:inline">{justSaved ? "Enregistré" : "Enregistrer"}</span>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 space-y-5">
                <div className="sm:hidden">
                    <DatePicker
                        date={data.applied_at ? new Date(data.applied_at) : undefined}
                        setDate={(date) => setData({ ...data, applied_at: date ? date.toISOString() : undefined })}
                        label="Date d'envoi"
                        className="w-full h-9 rounded-lg text-sm"
                    />
                </div>
                {/* Hero: identity + score */}
                <section className="rounded-xl border bg-card p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                    <div className="flex items-start gap-4 min-w-0">
                        <CompanyAvatar name={data.company_name} size="lg" />
                        <div className="min-w-0 space-y-2">
                            <div>
                                <h1 className="text-xl font-semibold tracking-tight leading-snug">{data.role}</h1>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-0.5">
                                    <span className="text-foreground">{data.company_name}</span>
                                    {data.location && (
                                        <span className="inline-flex items-center gap-1"><MapPin size={13} />{data.location}</span>
                                    )}
                                    {data.job_url && (
                                        <a href={data.job_url} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 hover:text-foreground underline-offset-2 hover:underline">
                                            Voir l&apos;offre <ExternalLink size={12} />
                                        </a>
                                    )}
                                </div>
                            </div>
                            {data.company_summary && (
                                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{data.company_summary}</p>
                            )}
                            <TechTags items={data.tech_stack} />
                        </div>
                    </div>

                    <div className="md:pl-6 md:border-l shrink-0">
                        {gapState.loading ? (
                            <div className="flex items-center gap-4 animate-pulse">
                                <div className="h-24 w-24 rounded-full bg-muted" />
                                <div className="space-y-2"><div className="h-3 w-28 rounded bg-muted" /><div className="h-3 w-20 rounded bg-muted" /></div>
                            </div>
                        ) : gap.score !== null ? (
                            <div className="flex items-center gap-4">
                                <ScoreRing score={gap.score} size="lg" />
                                <div>
                                    <div className="font-medium">{scoreTone(gap.score).text}</div>
                                    <div className="text-xs text-muted-foreground">Adéquation avec votre CV</div>
                                    <div className="text-xs text-muted-foreground mt-2 tabular-nums">
                                        {gap.strengths.length} atout{gap.strengths.length > 1 ? "s" : ""} · {gap.gaps.length} écart{gap.gaps.length > 1 ? "s" : ""}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Button variant="outline" onClick={runGap} className="gap-2 rounded-lg">
                                <Sparkles size={16} /> Calculer mon score
                            </Button>
                        )}
                    </div>
                </section>

                {gapState.error && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900 flex items-center justify-between gap-3">
                        {gapState.error}
                        <Link href="/settings" className="inline-flex items-center gap-1 text-xs font-medium hover:underline shrink-0">
                            Paramètres <ChevronRight size={13} />
                        </Link>
                    </div>
                )}

                <div className="grid gap-5 lg:grid-cols-5 items-start">
                    {/* Left: fit analysis (priority) */}
                    <div className="lg:col-span-3 space-y-5">
                        <Card
                            title="Mon adéquation"
                            action={hasGap && !gapState.loading ? (
                                <button onClick={runGap} title="Relancer l'analyse"
                                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                                    <RefreshCw size={15} />
                                </button>
                            ) : null}
                        >
                            {gapState.loading ? (
                                <div className="space-y-3 animate-pulse">
                                    {[0.9, 0.7, 0.85, 0.6, 0.8, 0.5].map((w, i) => (
                                        <div key={i} className="h-3 rounded bg-muted" style={{ width: `${w * 100}%` }} />
                                    ))}
                                </div>
                            ) : hasGap ? (
                                <div className="grid gap-6 md:grid-cols-2">
                                    <PointList title="Points forts" points={gap.strengths} tone="good" />
                                    <PointList title="À travailler" points={gap.gaps} tone="warn" />
                                </div>
                            ) : data.gap_analysis ? (
                                <p className="text-sm whitespace-pre-line leading-relaxed">{data.gap_analysis}</p>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Pas encore d&apos;analyse. Cliquez sur « Calculer mon score » pour comparer l&apos;offre à votre CV.
                                </p>
                            )}
                        </Card>

                        {data.insights && (
                            <Card title="À retenir">
                                <InsightNotes insights={data.insights} title="" />
                            </Card>
                        )}

                        <Card title="Mes notes">
                            <textarea
                                className="w-full min-h-24 rounded-lg border border-input bg-background p-3 text-sm leading-relaxed resize-y placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                                placeholder="Contact, relance prévue, impressions après l'entretien…"
                                value={data.cover_letter_context || ""}
                                onChange={(e) => setData({ ...data, cover_letter_context: e.target.value })}
                            />
                        </Card>
                    </div>

                    {/* Right: the offer */}
                    <div className="lg:col-span-2 space-y-5">
                        <Card title="Le poste">
                            <div className="space-y-5">
                                <BulletList title="Missions" items={data.missions} />
                                <RequirementList items={data.profile_requirements} />
                                <DailyTasks text={data.daily_tasks_forecast} />
                            </div>
                        </Card>

                        {data.recruitment_process && (
                            <Card title="Processus de recrutement">
                                <ProcessSteps text={data.recruitment_process} title="" />
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ---------- pieces ---------- */

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
    return (
        <section className="rounded-xl border bg-card p-5">
            <header className="flex items-center justify-between mb-4 min-h-7">
                <h2 className="font-semibold tracking-tight">{title}</h2>
                {action}
            </header>
            {children}
        </section>
    );
}

function StatusSelect({ value, onChange }: { value: ApplicationStatus; onChange: (s: ApplicationStatus) => void }) {
    const style = statusStyle(value);
    return (
        <label className={`relative inline-flex items-center gap-1.5 h-9 pl-3 pr-7 rounded-lg text-sm font-medium ring-1 ring-inset cursor-pointer ${style.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            {value}
            <ChevronDown size={14} className="absolute right-2 opacity-60" />
            <select
                value={value}
                onChange={(e) => onChange(e.target.value as ApplicationStatus)}
                className="absolute inset-0 opacity-0 cursor-pointer"
                aria-label="Statut"
            >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
        </label>
    );
}

/** "Rédiger … (≈50% du temps)" → label + percentage bar. */
function DailyTasks({ text }: { text?: string | null }) {
    const tasks = useMemo(() => toLines(text || "").map((line) => {
        const m = line.match(/^(.*?)\s*\(\s*≈?\s*(\d{1,3})\s*%[^)]*\)\s*$/);
        return m ? { label: m[1], pct: Math.min(100, parseInt(m[2], 10)) } : { label: line, pct: null };
    }), [text]);
    if (!tasks.length) return null;
    return (
        <div>
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Au quotidien</h3>
            <ul className="space-y-2.5 text-sm">
                {tasks.map((t, i) => (
                    <li key={i}>
                        <div className="flex justify-between gap-3 leading-snug">
                            <span>{t.label}</span>
                            {t.pct !== null && <span className="text-muted-foreground tabular-nums shrink-0">{t.pct}%</span>}
                        </div>
                        {t.pct !== null && (
                            <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full bg-stone-400" style={{ width: `${t.pct}%` }} />
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
