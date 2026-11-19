"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CompanyAvatar } from "@/components/CompanyAvatar";
import { analyzeJobDescription, JobAnalysisResult } from "@/actions/analyze-job";
import { analyzeGap } from "@/actions/analyze-gap";
import { createApplication } from "@/actions/applications";
import { parseGapAnalysis } from "@/lib/parse-analysis";
import { ScoreSummary, PointList, InsightNotes, BulletList, RequirementList, ProcessSteps, TechTags } from "@/components/analysis";
import { ApplicationDraft } from "@/types";
import {
    ArrowLeft, Loader2, Save, Sparkles, RefreshCw, MapPin,
    Link2, FileSearch, Target, UserRound, ChevronRight,
} from "lucide-react";

type Provider = "auto" | "gemini" | "openai";
type GapState = { status: "idle" | "loading" | "done" | "error"; text: string; error?: string };

export default function NewApplicationPage() {
    const router = useRouter();
    const [jobDescription, setJobDescription] = useState("");
    const [jobUrl, setJobUrl] = useState("");
    const [aiProvider, setAiProvider] = useState<Provider>("auto");

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzeError, setAnalyzeError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const [analysis, setAnalysis] = useState<JobAnalysisResult | null>(null);
    const [gap, setGap] = useState<GapState>({ status: "idle", text: "" });

    const runGap = async () => {
        setGap({ status: "loading", text: "" });
        try {
            const text = await analyzeGap(jobDescription, aiProvider);
            setGap({ status: "done", text });
        } catch (error) {
            const msg = error instanceof Error ? error.message : "";
            setGap({
                status: "error",
                text: "",
                error: /cv/i.test(msg)
                    ? "Aucun CV trouvé. Ajoutez-le dans vos paramètres pour obtenir l'analyse."
                    : "L'analyse d'adéquation a échoué. Réessayez.",
            });
        }
    };

    const handleAnalyze = async () => {
        if (!jobDescription.trim()) return;
        setIsAnalyzing(true);
        setAnalyzeError("");
        setGap({ status: "idle", text: "" });
        try {
            const result = await analyzeJobDescription(jobDescription, aiProvider);
            setAnalysis(result);
            // Gap analysis runs on its own so the offer details show up right away.
            runGap();
        } catch (error) {
            console.error("Analysis failed", error);
            setAnalyzeError("L'analyse de l'offre a échoué. Vérifiez votre clé API et réessayez.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSave = async () => {
        if (!analysis) return;
        setIsSaving(true);
        try {
            const draft: ApplicationDraft = {
                company_name: analysis.company_name,
                role: analysis.role,
                location: analysis.location,
                status: "En attente",
                job_description: jobDescription,
                missions: analysis.missions,
                insights: analysis.insights,
                gap_analysis: gap.text,
                cover_letter: "",
                job_url: jobUrl,
                tech_stack: analysis.tech_stack,
                daily_tasks_forecast: analysis.daily_tasks_forecast,
                recruitment_process: analysis.recruitment_process,
                profile_requirements: analysis.profile_requirements,
                company_summary: analysis.company_summary,
                cover_letter_context: "",
            };
            await createApplication(draft);
            router.push("/");
            router.refresh();
        } catch (error) {
            console.error("Save failed", error);
            alert("Impossible d'enregistrer la candidature.");
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen">
            <div className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
                <div className="max-w-7xl mx-auto px-6 md:px-8 h-14 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link href="/" className="p-1.5 -ml-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Retour">
                            <ArrowLeft size={18} />
                        </Link>
                        <h1 className="font-semibold tracking-tight truncate">Nouvelle candidature</h1>
                    </div>
                    <Button
                        size="sm"
                        className="gap-1.5 rounded-lg"
                        onClick={handleSave}
                        disabled={!analysis || isSaving}
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Enregistrer
                    </Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 grid gap-5 lg:grid-cols-3 items-start">
                {/* 1 — Offer input */}
                <Panel step={1} title="L'offre" icon={FileSearch}>
                    <div className="space-y-3">
                        <div className="relative">
                            <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                                placeholder="Lien vers l'offre (optionnel)"
                                value={jobUrl}
                                onChange={(e) => setJobUrl(e.target.value)}
                            />
                        </div>
                        <textarea
                            className="w-full h-72 p-3 rounded-lg border border-input bg-card text-sm leading-relaxed resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                            placeholder="Collez ici la description du poste…"
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <select
                                className="h-10 rounded-lg border border-input bg-card px-2 text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                                value={aiProvider}
                                onChange={(e) => setAiProvider(e.target.value as Provider)}
                                title="Modèle IA"
                            >
                                <option value="auto">IA : Auto</option>
                                <option value="gemini">Gemini</option>
                                <option value="openai">OpenAI</option>
                            </select>
                            <Button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || !jobDescription.trim()}
                                className="flex-1 gap-2 rounded-lg"
                            >
                                {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                {isAnalyzing ? "Analyse en cours…" : analysis ? "Relancer l'analyse" : "Analyser l'offre"}
                            </Button>
                        </div>
                        {analyzeError && <p className="text-xs text-destructive">{analyzeError}</p>}
                        <p className="text-xs text-muted-foreground">
                            L&apos;adéquation est calculée avec le CV de vos{" "}
                            <Link href="/settings" className="underline underline-offset-2 hover:text-foreground">paramètres</Link>.
                        </p>
                    </div>
                </Panel>

                {/* 2 — Offer summary */}
                <Panel step={2} title="En bref" icon={Target} muted={!analysis && !isAnalyzing}>
                    {isAnalyzing ? (
                        <Skeleton />
                    ) : !analysis ? (
                        <Placeholder text="Les informations clés de l'offre apparaîtront ici." />
                    ) : (
                        <OfferSummary analysis={analysis} onChange={setAnalysis} />
                    )}
                </Panel>

                {/* 3 — Fit with CV */}
                <Panel
                    step={3}
                    title="Mon adéquation"
                    icon={UserRound}
                    muted={!analysis && !isAnalyzing}
                    action={
                        analysis && gap.status !== "loading" ? (
                            <button
                                onClick={runGap}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                title="Relancer l'analyse d'adéquation"
                            >
                                <RefreshCw size={15} />
                            </button>
                        ) : null
                    }
                >
                    {isAnalyzing || gap.status === "loading" ? (
                        <Skeleton withScore />
                    ) : !analysis ? (
                        <Placeholder text="Votre score et vos points forts par rapport à l'offre apparaîtront ici." />
                    ) : gap.status === "error" ? (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
                            <p>{gap.error}</p>
                            <Link href="/settings" className="inline-flex items-center gap-1 mt-2 text-xs font-medium hover:underline">
                                Ouvrir les paramètres <ChevronRight size={13} />
                            </Link>
                        </div>
                    ) : gap.status === "done" ? (
                        <FitAnalysis markdown={gap.text} insights={analysis.insights} />
                    ) : null}
                </Panel>
            </div>
        </div>
    );
}

/* ---------- Layout pieces ---------- */

function Panel({
    step, title, icon: Icon, children, muted, action,
}: {
    step: number;
    title: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    children: React.ReactNode;
    muted?: boolean;
    action?: React.ReactNode;
}) {
    return (
        <section className={`rounded-xl border bg-card p-5 transition-opacity ${muted ? "opacity-60" : ""}`}>
            <header className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <span className="grid place-items-center h-6 w-6 rounded-md bg-muted text-xs font-semibold text-muted-foreground tabular-nums">
                        {step}
                    </span>
                    <h2 className="font-semibold tracking-tight flex items-center gap-2">
                        {title}
                    </h2>
                    <Icon size={15} className="text-muted-foreground" />
                </div>
                {action}
            </header>
            {children}
        </section>
    );
}

function Placeholder({ text }: { text: string }) {
    return (
        <div className="rounded-lg border border-dashed py-12 px-6 text-center text-sm text-muted-foreground">
            {text}
        </div>
    );
}

function Skeleton({ withScore }: { withScore?: boolean }) {
    return (
        <div className="space-y-4 animate-pulse">
            {withScore ? (
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/2 rounded bg-muted" />
                        <div className="h-3 w-3/4 rounded bg-muted" />
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-3/4 rounded bg-muted" />
                        <div className="h-3 w-1/3 rounded bg-muted" />
                    </div>
                </div>
            )}
            {[0.9, 0.75, 0.85, 0.6, 0.8].map((w, i) => (
                <div key={i} className="h-3 rounded bg-muted" style={{ width: `${w * 100}%` }} />
            ))}
        </div>
    );
}

/* ---------- Column 2: offer summary ---------- */

function OfferSummary({
    analysis, onChange,
}: {
    analysis: JobAnalysisResult;
    onChange: (a: JobAnalysisResult) => void;
}) {
    const inline =
        "w-full bg-transparent rounded-md px-1.5 -mx-1.5 py-0.5 border border-transparent hover:border-input focus:border-input focus:outline-none focus:bg-background transition-colors";

    return (
        <div className="space-y-5">
            {/* Identity — click any field to edit */}
            <div className="flex items-start gap-3">
                <CompanyAvatar name={analysis.company_name} />
                <div className="min-w-0 flex-1">
                    <input
                        className={`${inline} font-semibold leading-snug`}
                        value={analysis.role}
                        onChange={(e) => onChange({ ...analysis, role: e.target.value })}
                        aria-label="Poste"
                    />
                    <input
                        className={`${inline} text-sm text-muted-foreground`}
                        value={analysis.company_name}
                        onChange={(e) => onChange({ ...analysis, company_name: e.target.value })}
                        aria-label="Entreprise"
                    />
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin size={12} className="shrink-0" />
                        <input
                            className={`${inline} text-xs`}
                            value={analysis.location}
                            onChange={(e) => onChange({ ...analysis, location: e.target.value })}
                            aria-label="Localisation"
                        />
                    </div>
                </div>
            </div>

            {analysis.company_summary && (
                <p className="text-sm text-muted-foreground leading-relaxed">{analysis.company_summary}</p>
            )}

            <TechTags items={analysis.tech_stack} />
            <BulletList title="Missions" items={analysis.missions} />
            <RequirementList items={analysis.profile_requirements} />
            <ProcessSteps text={analysis.recruitment_process} />
        </div>
    );
}

/* ---------- Column 3: fit with CV ---------- */

function FitAnalysis({ markdown, insights }: { markdown: string; insights?: string }) {
    const parsed = useMemo(() => parseGapAnalysis(markdown), [markdown]);
    const unparsed = parsed.score === null && !parsed.strengths.length && !parsed.gaps.length;

    if (unparsed) {
        return <p className="text-sm whitespace-pre-line leading-relaxed">{markdown}</p>;
    }

    return (
        <div className="space-y-5">
            {parsed.score !== null && <ScoreSummary score={parsed.score} />}
            <PointList title="Points forts" points={parsed.strengths} tone="good" />
            <PointList title="À travailler" points={parsed.gaps} tone="warn" />
            <InsightNotes insights={insights} />
        </div>
    );
}
