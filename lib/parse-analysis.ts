/**
 * Helpers that turn the AI's markdown-ish output into structured data
 * so the UI can render it cleanly instead of showing raw "###" and "**".
 */

export type Point = { title: string; detail: string };

export type ParsedGap = {
    score: number | null;
    strengths: Point[];
    gaps: Point[];
};

/** Removes markdown emphasis and stray bullet characters. */
export function stripMd(text: string) {
    return text
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/__(.*?)__/g, "$1")
        .replace(/^[\s*•\-–]+/, "")
        .trim();
}

function parsePoint(line: string): Point {
    const clean = line.replace(/^\s*[*•\-–]\s+/, "").trim();
    const bold = clean.match(/^\*\*(.+?)\*\*\s*[:–-]?\s*(.*)$/);
    if (bold) return { title: stripMd(bold[1]), detail: stripMd(bold[2]) };
    const colon = clean.match(/^([^:]{2,60}):\s*(.+)$/);
    if (colon) return { title: stripMd(colon[1]), detail: stripMd(colon[2]) };
    return { title: stripMd(clean), detail: "" };
}

export function parseGapAnalysis(md: string): ParsedGap {
    const scoreMatch = md.match(/score[^\d\n]{0,40}(\d{1,3})\s*%/i) || md.match(/(\d{1,3})\s*%/);
    const score = scoreMatch ? Math.min(100, parseInt(scoreMatch[1], 10)) : null;

    const strengths: Point[] = [];
    const gaps: Point[] = [];
    let current: Point[] | null = null;

    for (const raw of md.split(/\r?\n/)) {
        const line = raw.trim();
        if (!line) continue;
        if (/^#{1,6}\s/.test(line)) {
            if (/point|fort|strength/i.test(line)) current = strengths;
            else if (/gap|écart|ecart|manque|faibl/i.test(line)) current = gaps;
            else current = null;
            continue;
        }
        if (current && /^[*•\-–]\s/.test(line)) current.push(parsePoint(line));
    }

    return { score, strengths, gaps };
}

export type Requirement = { level: "Must" | "Nice" | null; text: string };

export function parseRequirement(item: string): Requirement {
    const m = item.match(/^\s*\**\s*(must|nice)(?:[\s-]*(?:have|to[\s-]*have))?\s*\**\s*[:\-–]?\s*(.*)$/i);
    if (m) {
        return {
            level: m[1].toLowerCase() === "must" ? "Must" : "Nice",
            text: stripMd(m[2]),
        };
    }
    return { level: null, text: stripMd(item) };
}

/** Splits "• a\n• b" style text into clean lines. */
export function toLines(text?: string) {
    return (text || "")
        .split(/\r?\n/)
        .map(stripMd)
        .filter(Boolean);
}

/** Parses the "🚩 **Vigilance** : …" insights block into labelled rows. */
export function parseInsights(text?: string) {
    return toLines(text).map((line) => {
        const m = line.match(/^(\W*)\s*([^:]{2,30}?)\s*:\s*(.+)$/u);
        return m
            ? { icon: m[1].trim(), label: m[2].trim(), text: m[3].trim() }
            : { icon: "", label: "", text: line };
    });
}
