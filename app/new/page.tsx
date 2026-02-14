"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { analyzeJobDescription, JobAnalysisResult } from "@/actions/analyze-job";
import { analyzeGap } from "@/actions/analyze-gap";
import { createApplication } from "@/actions/applications";
import { ArrowLeft, Loader2, Save, Sparkles, FileText } from "lucide-react";
import Link from "next/link";
import { ApplicationDraft } from "@/types";

export default function NewApplicationPage() {
    const router = useRouter();
    const [jobDescription, setJobDescription] = useState("");
    const [jobUrl, setJobUrl] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isAnalyzingGap, setIsAnalyzingGap] = useState(false);

    const [analysisResult, setAnalysisResult] = useState<JobAnalysisResult | null>(null);
    const [gapAnalysis, setGapAnalysis] = useState("");
    const [aiProvider, setAiProvider] = useState<"auto" | "gemini" | "openai">("auto");
    const [recruitmentProcess, setRecruitmentProcess] = useState("");
    const [profileRequirements, setProfileRequirements] = useState<string[]>([]);
    const [companySummary, setCompanySummary] = useState("");



    const handleAnalyze = async () => {
        if (!jobDescription.trim()) {
            return;
        }
        setIsAnalyzing(true);
        try {
            const result = await analyzeJobDescription(jobDescription, aiProvider);
            setAnalysisResult(result);
            setRecruitmentProcess(result.recruitment_process || "");
            setProfileRequirements(result.profile_requirements || []);
            setCompanySummary(result.company_summary || "");
            // Auto-generate gap analysis right after job analysis
            const analysis = await analyzeGap(jobDescription, aiProvider);
            setGapAnalysis(analysis);
        } catch (error) {
            console.error("Analysis failed", error);
            alert("Failed to analyze job description. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGapAnalysis = async () => {
        if (!jobDescription) return;
        setIsAnalyzingGap(true);
        try {
            const analysis = await analyzeGap(jobDescription, aiProvider);
            setGapAnalysis(analysis);
        } catch (error) {
            console.error("Gap analysis failed", error);
            alert("Erreur: Vérifiez que votre CV est bien enregistré dans les Paramètres.");
        } finally {
            setIsAnalyzingGap(false);
        }
    };

    const handleSave = async () => {
        if (!analysisResult) return;
        setIsSaving(true);
        try {
            const draft: ApplicationDraft = {
                company_name: analysisResult.company_name,
                role: analysisResult.role,
                location: analysisResult.location,
                status: "En attente",
                job_description: jobDescription,
                missions: analysisResult.missions,
                insights: analysisResult.insights,
                gap_analysis: gapAnalysis,
                cover_letter: "",
                job_url: jobUrl,
                tech_stack: analysisResult.tech_stack,
                daily_tasks_forecast: analysisResult.daily_tasks_forecast,
                recruitment_process: recruitmentProcess || analysisResult.recruitment_process,
                profile_requirements: profileRequirements.length ? profileRequirements : analysisResult.profile_requirements,
                company_summary: companySummary || analysisResult.company_summary,
                cover_letter_context: "",
            };

            await createApplication(draft);
            router.push("/");
            router.refresh();
        } catch (error) {
            console.error("Save failed", error);
            alert("Failed to save application.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            <div className="mb-6">
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
                    <ArrowLeft size={16} /> Retour au Dashboard
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Nouvelle Candidature</h1>
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
                {/* Left Column: Job Description & CV Input (4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Offre de Stage</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <input
                                className="w-full p-2 rounded border text-sm mb-2"
                                placeholder="Lien vers l&apos;offre (URL)"
                                value={jobUrl}
                                onChange={(e) => setJobUrl(e.target.value)}
                            />
                            <textarea
                                className="w-full h-64 p-3 rounded-md border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black mb-4"
                                placeholder="Collez ici la description du poste..."
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                            />
                            <div className="flex flex-col gap-2 text-xs mb-2">
                                <label className="font-semibold text-muted-foreground uppercase">Modèle IA</label>
                                <select
                                    className="border rounded p-2 text-sm"
                                    value={aiProvider}
                                    onChange={(e) => setAiProvider(e.target.value as "auto" | "gemini" | "openai")}
                                >
                                    <option value="auto">Auto (Gemini puis OpenAI)</option>
                                    <option value="gemini">Gemini uniquement</option>
                                    <option value="openai">OpenAI uniquement</option>
                                </select>
                            </div>
                            <Button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || !jobDescription.trim()}
                                className="w-full gap-2 mb-6"
                            >
                                {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                Analyser l&apos;offre
                            </Button>

                            <div className="text-xs text-muted-foreground p-3 bg-gray-50 rounded border">
                                <p>ℹ️ L&apos;analyse et la génération utilisent votre CV enregistré dans les <strong>Paramètres</strong>.</p>
                                <Link href="/settings" className="text-blue-600 hover:underline mt-1 block">
                                    Vérifier mon profil →
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Middle Column: Analysis Result (4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                    <Card className={`h-full transition-all duration-300 ${!analysisResult ? 'opacity-50' : ''}`}>
                        <CardHeader>
                            <CardTitle>3. Détails Clés</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!analysisResult ? (
                                <div className="text-sm text-muted-foreground italic">En attente d&apos;analyse de l&apos;offre...</div>
                            ) : (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">Entreprise</label>
                                        <input
                                            className="w-full p-2 rounded border text-sm font-medium"
                                            value={analysisResult.company_name}
                                            onChange={(e) => setAnalysisResult({ ...analysisResult, company_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">Poste</label>
                                        <input
                                            className="w-full p-2 rounded border text-sm font-medium"
                                            value={analysisResult.role}
                                            onChange={(e) => setAnalysisResult({ ...analysisResult, role: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">Localisation</label>
                                        <input
                                            className="w-full p-2 rounded border text-sm"
                                            value={analysisResult.location}
                                            onChange={(e) => setAnalysisResult({ ...analysisResult, location: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">Tech Stack</label>
                                        <div className="flex flex-wrap gap-1">
                                            {analysisResult.tech_stack?.map((tech, i) => (
                                                <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">Missions</label>
                                        <ul className="list-disc pl-5 text-xs space-y-1 text-gray-700">
                                            {analysisResult.missions.map((m, i) => <li key={i}>{m}</li>)}
                                        </ul>
                                    </div>
                                    {analysisResult.profile_requirements?.length > 0 && (
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase">Profil recherché</label>
                                            <ul className="list-disc pl-5 text-xs space-y-1 text-gray-700">
                                                {analysisResult.profile_requirements.map((m, i) => <li key={i}>{m}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {analysisResult.recruitment_process && (
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase">Processus de recrutement</label>
                                            <div className="text-xs bg-gray-50 border border-gray-100 p-3 rounded whitespace-pre-line leading-relaxed">
                                                {analysisResult.recruitment_process}
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">Tâches probables</label>
                                        <div className="text-xs bg-amber-50 border border-amber-100 p-3 rounded whitespace-pre-line leading-relaxed">
                                            {analysisResult.daily_tasks_forecast}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase text-purple-600">Culture</label>
                                        <p className="text-xs text-gray-700 italic border-l-2 border-purple-200 pl-2">{analysisResult.insights}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Generation & Gap Analysis (4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>4. IA & Génération</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-6">
                            {!analysisResult ? (
                                <p className="text-sm text-muted-foreground italic">Commencez par analyser l&apos;offre.</p>
                            ) : (
                                <>
                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            onClick={handleGapAnalysis}
                                            disabled={isAnalyzingGap}
                                            variant="secondary"
                                            className="w-full gap-2 text-xs"
                                        >
                                            {isAnalyzingGap ? <Loader2 className="animate-spin" size={14} /> : <FileText size={14} />}
                                            Analyser Gaps
                                        </Button>
                                    </div>

                                    {!analysisResult && <p className="text-xs text-red-400">Analysez l&apos;offre d&apos;abord.</p>}

                                    {/* Gap Analysis Result */}
                                    {gapAnalysis && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase">Analyse des Écarts</label>
                                            <textarea
                                                className="w-full h-32 p-3 rounded-md border text-xs resize-none bg-gray-50 focus:outline-none"
                                                value={gapAnalysis}
                                                onChange={(e) => setGapAnalysis(e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {/* Editable fields for additional data */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">Processus de recrutement</label>
                                        <textarea
                                            className="w-full p-3 rounded-md border text-xs resize-none bg-gray-50 focus:outline-none"
                                            rows={3}
                                            value={recruitmentProcess}
                                            onChange={(e) => setRecruitmentProcess(e.target.value)}
                                            placeholder="• Entretien RH\n• Test technique\n• Entretien manager"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">Profil recherché (1 item par ligne)</label>
                                        <textarea
                                            className="w-full p-3 rounded-md border text-xs resize-none bg-gray-50 focus:outline-none"
                                            rows={3}
                                            value={profileRequirements.join('\\n')}
                                            onChange={(e) => setProfileRequirements(e.target.value.split('\\n').map(s => s.trim()).filter(Boolean))}
                                            placeholder="Must: Typescript confirmé\nMust: React\nNice: CI/CD"
                                        />
                                    </div>

                                    <div className="pt-4 mt-auto border-t">
                                        <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
                                            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                            Sauvegarder la Candidature
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
