"use client";

import { useMemo } from "react";
import { Check, AlertTriangle } from "lucide-react";
import { parseInsights, parseRequirement, toLines, Point } from "@/lib/parse-analysis";

/* Shared building blocks for displaying an AI analysis (new + detail pages). */

export function SectionLabel({ children }: { children: React.ReactNode }) {
    return <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">{children}</h3>;
}

export function scoreTone(score: number) {
    return score >= 75
        ? { stroke: "stroke-emerald-500", text: "Très bon match" }
        : score >= 50
            ? { stroke: "stroke-amber-500", text: "Match correct" }
            : { stroke: "stroke-rose-400", text: "Match faible" };
}

export function ScoreRing({ score, size = "md" }: { score: number; size?: "md" | "lg" }) {
    const r = 26;
    const c = 2 * Math.PI * r;
    const tone = scoreTone(score);
    const box = size === "lg" ? "h-24 w-24" : "h-16 w-16";
    const txt = size === "lg" ? "text-xl" : "text-sm";

    return (
        <div className={`relative shrink-0 ${box}`}>
            <svg viewBox="0 0 64 64" className={`${box} -rotate-90`}>
                <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-muted" />
                <circle
                    cx="32" cy="32" r={r} fill="none" strokeWidth="6" strokeLinecap="round"
                    className={`${tone.stroke} transition-[stroke-dashoffset] duration-700`}
                    strokeDasharray={c}
                    strokeDashoffset={c * (1 - score / 100)}
                />
            </svg>
            <span className={`absolute inset-0 grid place-items-center font-semibold tabular-nums ${txt}`}>{score}%</span>
        </div>
    );
}

export function ScoreSummary({ score }: { score: number }) {
    return (
        <div className="flex items-center gap-4">
            <ScoreRing score={score} />
            <div>
                <div className="font-medium">{scoreTone(score).text}</div>
                <div className="text-xs text-muted-foreground">Score de pertinence avec votre CV</div>
            </div>
        </div>
    );
}

export function PointList({ title, points, tone }: { title: string; points: Point[]; tone: "good" | "warn" }) {
    if (!points.length) return null;
    const Icon = tone === "good" ? Check : AlertTriangle;
    const iconCls = tone === "good" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600";
    return (
        <div>
            <SectionLabel>{title}</SectionLabel>
            <ul className="space-y-2.5">
                {points.map((p, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                        <span className={`mt-0.5 grid place-items-center h-[18px] w-[18px] shrink-0 rounded-full ${iconCls}`}>
                            <Icon size={11} strokeWidth={2.5} />
                        </span>
                        <span className="leading-snug">
                            <span className="font-medium">{p.title}</span>
                            {p.detail && <span className="text-muted-foreground"> — {p.detail}</span>}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function InsightNotes({ insights, title = "À retenir" }: { insights?: string | null; title?: string }) {
    const notes = useMemo(() => parseInsights(insights || ""), [insights]);
    if (!notes.length) return null;
    return (
        <div>
            {title && <SectionLabel>{title}</SectionLabel>}
            <div className="rounded-lg bg-muted/60 divide-y divide-border">
                {notes.map((n, i) => (
                    <div key={i} className="px-3 py-2.5 text-sm leading-snug">
                        {n.label && (
                            <span className="font-medium">
                                {n.icon && <span className="mr-1">{n.icon}</span>}
                                {n.label}
                            </span>
                        )}
                        <span className={n.label ? "text-muted-foreground" : ""}>{n.label ? " — " : ""}{n.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function BulletList({ title, items }: { title: string; items?: string[] | null }) {
    if (!items?.length) return null;
    return (
        <div>
            <SectionLabel>{title}</SectionLabel>
            <ul className="space-y-1.5 text-sm">
                {items.map((m, i) => (
                    <li key={i} className="flex gap-2 leading-snug">
                        <span className="mt-[7px] h-1 w-1 rounded-full bg-muted-foreground shrink-0" />
                        {m}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function RequirementList({ items }: { items?: string[] | null }) {
    const reqs = useMemo(() => (items || []).map(parseRequirement).filter(r => r.text), [items]);
    if (!reqs.length) return null;
    return (
        <div>
            <SectionLabel>Profil recherché</SectionLabel>
            <ul className="space-y-1.5 text-sm">
                {reqs.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 leading-snug">
                        {r.level && (
                            <span className={`mt-px shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${r.level === "Must" ? "bg-stone-800 text-white" : "bg-muted text-muted-foreground"}`}>
                                {r.level}
                            </span>
                        )}
                        <span>{r.text}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function ProcessSteps({ text, title = "Processus de recrutement" }: { text?: string | null; title?: string }) {
    const steps = useMemo(() => toLines(text || ""), [text]);
    if (!steps.length) return null;
    return (
        <div>
            {title && <SectionLabel>{title}</SectionLabel>}
            <ol className="relative space-y-2 text-sm before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-px before:bg-border">
                {steps.map((s, i) => (
                    <li key={i} className="relative flex items-start gap-3">
                        <span className="relative z-10 grid place-items-center h-[19px] w-[19px] shrink-0 rounded-full border bg-card text-[10px] font-medium text-muted-foreground tabular-nums">
                            {i + 1}
                        </span>
                        <span className="leading-snug pt-px">{s}</span>
                    </li>
                ))}
            </ol>
        </div>
    );
}

export function TechTags({ items }: { items?: string[] | null }) {
    if (!items?.length) return null;
    return (
        <div className="flex flex-wrap gap-1.5">
            {items.map((tech, i) => (
                <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">{tech}</span>
            ))}
        </div>
    );
}
