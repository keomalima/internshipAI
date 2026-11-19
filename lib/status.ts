import { ApplicationStatus } from "@/types";

/** One soft color per status, reused by the Kanban board, table and stats. */
export const STATUS_STYLES: Record<
    ApplicationStatus,
    { dot: string; badge: string; bar: string }
> = {
    "En attente": {
        dot: "bg-stone-400",
        badge: "bg-stone-100 text-stone-700 ring-stone-200",
        bar: "before:bg-stone-300",
    },
    "Postulé": {
        dot: "bg-sky-500",
        badge: "bg-sky-50 text-sky-700 ring-sky-200",
        bar: "before:bg-sky-400",
    },
    "Entretien": {
        dot: "bg-amber-500",
        badge: "bg-amber-50 text-amber-800 ring-amber-200",
        bar: "before:bg-amber-400",
    },
    "Refusé": {
        dot: "bg-rose-400",
        badge: "bg-rose-50 text-rose-700 ring-rose-200",
        bar: "before:bg-rose-300",
    },
};

export function statusStyle(status: string) {
    return STATUS_STYLES[status as ApplicationStatus] ?? STATUS_STYLES["En attente"];
}

/** Deterministic soft background for a company's letter avatar. */
const AVATAR_COLORS = [
    "bg-stone-100 text-stone-700",
    "bg-sky-100 text-sky-800",
    "bg-emerald-100 text-emerald-800",
    "bg-amber-100 text-amber-800",
    "bg-violet-100 text-violet-800",
    "bg-rose-100 text-rose-800",
];

export function avatarColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
