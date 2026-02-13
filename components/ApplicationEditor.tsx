"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Sparkles, Wand2 } from "lucide-react";

import { Application, ApplicationStatus } from "@/types";
import { updateApplication } from "@/actions/applications";
import { generateCoverLetter } from "@/actions/generate-cover-letter";
import { generateEmail } from "@/actions/generate-email";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/DatePicker";
import RichTextEditor from "@/components/RichTextEditor";
import DownloadPdfButton from "@/components/DownloadPdfButton";

type JobMeta = { title?: string | null; company?: string | null; company_logo?: string | null; location?: string | null; description?: string | null };

function buildCompanySummary(raw: string, company: string) {
    if (!raw) return "";
    const sentences = raw.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
    const isJobSentence = (s: string) => /recrut|alternance|stage|poste|offre|développeur|developer|job/i.test(s);
    const prefer = sentences.find(s => s.toLowerCase().includes(company.toLowerCase()) && !isJobSentence(s));
    const fallback = sentences.find(s => !isJobSentence(s)) || sentences[0];
    const picked = prefer || fallback || raw;
    const cleaned = picked.replace(/\s+/g, " ").trim();
    const withName = cleaned.toLowerCase().includes(company.toLowerCase())
        ? cleaned
        : `${company} — ${cleaned}`;
    return withName.slice(0, 200);
}

type Requirement = { label: "Must" | "Nice" | "Req"; text: string };
function normalizeRequirements(reqs?: string[] | null): Requirement[] {
    if (!reqs) return [];
    return reqs.map((r) => {
        const trimmed = r.replace(/^[*-]\s*/, "").replace(/\*\*/g, "").trim();
        let label: Requirement["label"] = "Req";
        if (/^must[:\s-]/i.test(trimmed) || /\bmust\b/i.test(trimmed)) label = "Must";
        if (/^nice[:\s-]/i.test(trimmed) || /\bnice\b/i.test(trimmed)) label = "Nice";
        const text = trimmed.replace(/^(must|nice)[:\s-]*/i, "");
        return { label, text };
    }).filter(r => r.text.length > 0);
}

/* ---------- small subcomponents ---------- */
const TechTags = ({ tech }: { tech?: string[] }) => {
    if (!tech || tech.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1">
            {tech.map((t, i) => (
                <span key={i} className="text-[11px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                    {t}
                </span>
            ))}
        </div>
    );
};

const MissionList = ({ missions }: { missions?: string[] }) => {
    if (!missions || missions.length === 0) return null;
    return (
        <div className="space-y-1">
            <label className="text-xs uppercase font-bold text-muted-foreground">Missions</label>
            <ul className="text-xs bg-gray-50 border border-gray-100 p-3 rounded space-y-1 list-disc list-inside">
                {missions.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
        </div>
    );
};

const GapAnalysisCard = ({ gapAnalysis, insights }: { gapAnalysis?: string | null; insights?: string | null }) => (
    <div className="space-y-4">
        <div className="space-y-1">
            <label className="text-xs uppercase font-bold text-muted-foreground">Insights</label>
            <div className="prose prose-sm max-w-none text-xs bg-purple-50 border border-purple-100 p-4 rounded min-h-[5rem] max-h-60 overflow-y-auto">
                <ReactMarkdown>{insights || "*Aucun insight disponible*"}</ReactMarkdown>
            </div>
        </div>
        <div className="space-y-1">
            <label className="text-xs uppercase font-bold text-muted-foreground">Gap Analysis</label>
            <div className="prose prose-sm max-w-none text-xs bg-gray-50 border border-gray-100 p-4 rounded min-h-[10rem] max-h-80 overflow-y-auto leading-relaxed space-y-2">
                <ReactMarkdown>{gapAnalysis || "*Analyse non disponible*"}</ReactMarkdown>
            </div>
        </div>
    </div>
);

const JobMetadataCard = ({
    jobUrl,
    fallbackCompany,
    fallbackRole,
    fallbackLocation,
    techStack,
    missions,
    meta,
    loading,
    error,
    fallbackValue,
    onFallbackChange,
    dailyTasks,
    companySummary,
    recruitmentProcess,
    profileRequirements,
}: {
    jobUrl?: string | null;
    fallbackCompany: string;
    fallbackRole: string;
    fallbackLocation?: string | null;
    techStack?: string[];
    missions?: string[];
    meta: JobMeta | null;
    loading: boolean;
    error: string | null;
    fallbackValue: string;
    onFallbackChange: (val: string) => void;
    dailyTasks?: string | null;
    companySummary?: string | null;
    recruitmentProcess?: string | null;
    profileRequirements?: string[] | null;
}) => {
    const showFallback = Boolean(error) || !jobUrl;
    const displayCompany = meta?.company || fallbackCompany;
    const displayTitle = meta?.title || fallbackRole;
    const displayLocation = meta?.location || fallbackLocation;
    const titleNode = jobUrl ? (
        <a
            href={jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-bold leading-tight text-blue-700 hover:underline"
        >
            {displayTitle}
        </a>
    ) : (
        <span className="text-base font-bold leading-tight">{displayTitle}</span>
    );

    return (
        <div className="space-y-3">
            <div className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-500 shrink-0 uppercase">
                        {displayCompany?.slice(0, 2) || "—"}
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="text-sm font-semibold leading-tight">{displayCompany}</div>
                        {titleNode}
                        <div className="text-xs text-muted-foreground">{displayLocation || "—"}</div>
                    </div>
                </div>

                {loading && (
                    <div className="text-xs text-muted-foreground mt-3">Chargement des métadonnées...</div>
                )}
                {!loading && error && (
                    <div className="text-xs text-red-500 mt-3">Échec de récupération de l&apos;offre. Saisissez un texte de secours ci-dessous.</div>
                )}
            </div>

            <div className="space-y-3">
                <TechTags tech={techStack} />
                {companySummary && (
                    <div className="space-y-1">
                        <label className="text-xs uppercase font-bold text-muted-foreground">Entreprise</label>
                        <div className="text-xs bg-slate-50 border border-slate-100 p-3 rounded leading-relaxed">
                            {companySummary}
                        </div>
                    </div>
                )}
                <MissionList missions={missions} />
                {dailyTasks && (
                    <div className="space-y-1">
                        <label className="text-xs uppercase font-bold text-muted-foreground">Tâches probables (forecast)</label>
                        <div className="text-xs bg-amber-50 border border-amber-100 p-3 rounded whitespace-pre-line leading-relaxed">
                            {dailyTasks}
                        </div>
                    </div>
                )}
                {profileRequirements && profileRequirements.length > 0 && (
                    <div className="space-y-1">
                        <label className="text-xs uppercase font-bold text-muted-foreground">Profil recherché</label>
                        <ul className="text-xs bg-gray-50 border border-gray-100 p-3 rounded space-y-1">
                            {normalizeRequirements(profileRequirements).map((p, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${p.label === "Must" ? "bg-red-100 text-red-700" : p.label === "Nice" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                                        {p.label}
                                    </span>
                                    <span className="leading-snug">{p.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {recruitmentProcess && (
                    <div className="space-y-1">
                        <label className="text-xs uppercase font-bold text-muted-foreground">Processus de recrutement</label>
                        <div className="text-xs bg-gray-50 border border-gray-100 p-3 rounded whitespace-pre-line leading-relaxed">
                            {recruitmentProcess}
                        </div>
                    </div>
                )}
            </div>

            {showFallback && (
                <div className="space-y-1">
                    <label className="text-xs uppercase font-bold text-muted-foreground">Texte de l&apos;offre (fallback)</label>
                    <textarea
                        className="w-full h-40 border p-2 rounded text-sm resize-none"
                        value={fallbackValue}
                        onChange={(e) => onFallbackChange(e.target.value)}
                        placeholder="Collez le texte de l'offre si la récupération automatique échoue."
                    />
                </div>
            )}
        </div>
    );
};

/* ---------- main component ---------- */
export default function ApplicationEditor({ application }: { application: Application }) {
    const router = useRouter();
    const [data, setData] = useState<Application>(application);
    const [metaLoading, setMetaLoading] = useState(false);
    const [metaError, setMetaError] = useState<string | null>(null);
    const [jobMeta, setJobMeta] = useState<JobMeta | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
    const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
    const [aiProvider, setAiProvider] = useState<"auto" | "gemini" | "openai">("auto");
    const [refineHint, setRefineHint] = useState<string>("");

    useEffect(() => {
        const fetchMeta = async () => {
            if (!data.job_url) return;
            setMetaLoading(true);
            setMetaError(null);
            try {
                const res = await fetch(`/api/job-metadata?url=${encodeURIComponent(data.job_url)}`);
                if (!res.ok) throw new Error("metadata fetch failed");
                const json = await res.json();
                setJobMeta(json);
            } catch (err) {
                console.error(err);
                setMetaError("Impossible de récupérer les infos de l'offre.");
            } finally {
                setMetaLoading(false);
            }
        };
        fetchMeta();
    }, [data.job_url]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateApplication(data.id, {
                company_name: data.company_name,
                role: data.role,
                location: data.location || "",
                status: data.status,
                job_description: data.job_description || "",
                missions: data.missions || [],
                insights: data.insights || "",
                cover_letter: data.cover_letter || "",
                email_content: data.email_content || "",
                gap_analysis: data.gap_analysis || "",
                job_url: data.job_url || "",
                tech_stack: data.tech_stack || [],
                daily_tasks_forecast: data.daily_tasks_forecast || "",
                company_summary: data.company_summary || "",
                cover_letter_context: data.cover_letter_context || "",
                recruitment_process: data.recruitment_process || "",
                profile_requirements: data.profile_requirements || [],
                applied_at: data.applied_at ? new Date(data.applied_at).toISOString() : undefined,
            });
            router.refresh();
            alert("Sauvegardé !");
        } catch (error) {
            console.error("Save failed", error);
            alert("Erreur lors de la sauvegarde.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateLetter = async () => {
        if (!data.job_description && !data.insights) return alert("Description du poste manquante");

        setIsGeneratingLetter(true);
        try {
            const base = data.job_description || `${data.role} chez ${data.company_name}`;
            const userContext = refineHint || data.cover_letter_context || "";
            const letter = await generateCoverLetter(base, aiProvider, undefined, userContext);
            setData(prev => ({ ...prev, cover_letter: letter }));
        } catch (error) {
            console.error(error);
            alert("Erreur: Vérifiez que votre CV est bien enregistré dans les Paramètres.");
        } finally {
            setIsGeneratingLetter(false);
        }
    };

    const handleGenerateEmail = async () => {
        if (!data.job_description && !data.insights) return alert("Description du poste manquante");
        setIsGeneratingEmail(true);
        try {
            const base = data.job_description || `${data.role} chez ${data.company_name}`;
            const userNote = refineHint || data.cover_letter_context;
            const emailText = await generateEmail(base, userNote, aiProvider);
            setData(prev => ({ ...prev, email_content: emailText }));
        } catch (error) {
            console.error(error);
            alert("Erreur: Vérifiez que votre CV est bien enregistré dans les Paramètres.");
        } finally {
            setIsGeneratingEmail(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{data.role}</h1>
                        <p className="text-lg text-muted-foreground">{data.company_name}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <DatePicker
                        date={data.applied_at ? new Date(data.applied_at) : undefined}
                        setDate={(date) => setData({ ...data, applied_at: date ? date.toISOString() : undefined })}
                        label="Date de postulation"
                    />
                    <select
                        value={data.status}
                        onChange={(e) => setData({ ...data, status: e.target.value as ApplicationStatus })}
                        className="border p-2 rounded-md bg-white text-sm h-10"
                    >
                        {["En attente", "Postulé", "Entretien", "Refusé"].map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Sauvegarder
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Left: Offer display & gap analysis */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Offre & Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <JobMetadataCard
                                jobUrl={data.job_url}
                                fallbackCompany={data.company_name}
                                fallbackRole={data.role}
                                fallbackLocation={data.location}
                techStack={data.tech_stack}
                missions={data.missions}
                meta={jobMeta}
                loading={metaLoading}
                error={metaError}
                onFallbackChange={(val) => setData({ ...data, job_description: val })}
                fallbackValue={data.job_description || ""}
                dailyTasks={data.daily_tasks_forecast}
                        companySummary={data.company_summary || buildCompanySummary(jobMeta?.description || data.job_description || data.insights || "", data.company_name)}
                        recruitmentProcess={data.recruitment_process}
                        profileRequirements={data.profile_requirements}
                    />

                            <div className="space-y-1">
                                <label className="text-xs uppercase font-bold text-muted-foreground">Notes IA (contexte perso)</label>
                                <textarea
                                    className="w-full border p-2 rounded text-xs resize-none h-20"
                                    placeholder="Précise un angle, un manque de CV, une contrainte..."
                                    value={data.cover_letter_context || ""}
                                    onChange={(e) => setData({ ...data, cover_letter_context: e.target.value })}
                                />
                            </div>

                            <GapAnalysisCard gapAnalysis={data.gap_analysis} insights={data.insights} />
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Content Generation */}
                <div className="space-y-6">
                    <Card className="flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Lettre de Motivation</CardTitle>
                            <div className="flex flex-wrap gap-2 items-center">
                                <select
                                    className="border p-2 rounded text-xs"
                                    value={aiProvider}
                                    onChange={(e) => setAiProvider(e.target.value as "auto" | "gemini" | "openai")}
                                >
                                    <option value="auto">Auto</option>
                                    <option value="gemini">Gemini</option>
                                    <option value="openai">OpenAI</option>
                                </select>
                                {data.cover_letter && (
                                    <DownloadPdfButton
                                        content={data.cover_letter}
                                        fileName={`lettre_motivation_${data.company_name}.pdf`}
                                    />
                                )}
                                <Button
                                    size="sm"
                                    onClick={handleGenerateLetter}
                                    disabled={isGeneratingLetter}
                                    className="gap-2 bg-white text-black border border-input hover:bg-accent hover:text-accent-foreground"
                                >
                                    {isGeneratingLetter ? <Loader2 className="animate-spin" size={14} /> : <Wand2 size={14} />}
                                    {data.cover_letter ? "Régénérer" : "Générer"}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-[300px] space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs uppercase font-bold text-muted-foreground">Instructions de retouche (optionnel)</label>
                                <textarea
                                    className="w-full border p-2 rounded text-xs resize-none h-20"
                                    placeholder="Ex: Garde le ton concis, insiste sur React, enlève les formules trop formelles..."
                                    value={refineHint}
                                    onChange={(e) => setRefineHint(e.target.value)}
                                />
                            </div>
                            <RichTextEditor
                                value={data.cover_letter || ""}
                                onChange={(val) => setData({ ...data, cover_letter: val })}
                                placeholder="Générez ou écrivez votre lettre ici..."
                            />
                        </CardContent>
                    </Card>

                    {/* Email Generator */}
                    <Card className="flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Email d&apos;accompagnement</CardTitle>
                            <Button
                                size="sm"
                                onClick={handleGenerateEmail}
                                disabled={isGeneratingEmail}
                                className="gap-2 bg-white text-black border border-input hover:bg-accent hover:text-accent-foreground"
                            >
                                {isGeneratingEmail ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                                {data.email_content ? "Régénérer" : "Générer"}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <textarea
                                className="w-full h-32 border p-4 rounded text-sm resize-none"
                                value={data.email_content || ""}
                                onChange={e => setData({ ...data, email_content: e.target.value })}
                                placeholder="L'email d'accompagnement..."
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
