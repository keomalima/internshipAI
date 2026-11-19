/** Candid logo: a 75% "score ring" with a green centre, matching the in-app score rings. */
export function LogoMark({ size = 28 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
            <rect width="32" height="32" rx="8" fill="#262522" />
            <circle cx="16" cy="16" r="8.5" fill="none" stroke="#fafaf9" strokeOpacity="0.18" strokeWidth="3" />
            <path d="M16 7.5 A8.5 8.5 0 1 1 7.5 16" fill="none" stroke="#fafaf9" strokeWidth="3" strokeLinecap="round" />
            <circle cx="16" cy="16" r="2.6" fill="#34d399" />
        </svg>
    );
}

export function Logo() {
    return (
        <span className="flex items-center gap-2 font-semibold tracking-tight">
            <LogoMark />
            Candid
        </span>
    );
}
