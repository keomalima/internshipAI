import { avatarColor } from "@/lib/status";

export function CompanyAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
    const initial = name?.trim()?.[0]?.toUpperCase() || "?";
    const dims = size === "sm" ? "h-7 w-7 text-xs" : size === "lg" ? "h-12 w-12 text-lg rounded-xl" : "h-8 w-8 text-sm";
    return (
        <span className={`grid place-items-center shrink-0 rounded-lg font-semibold ${dims} ${avatarColor(name || "")}`}>
            {initial}
        </span>
    );
}
