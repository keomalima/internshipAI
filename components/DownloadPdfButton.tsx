'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface DownloadPdfButtonProps {
    content: string; // HTML content
    fileName: string;
}

export default function DownloadPdfButton({ content, fileName }: DownloadPdfButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/generate-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ html: content, fileName }),
            });

            if (!response.ok) {
                throw new Error(`PDF generation failed (${response.status})`);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName || "lettre_motivation.pdf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("PDF generation failed:", error);
            alert("Failed to generate PDF.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button onClick={handleDownload} variant="outline" size="sm" className="gap-2" disabled={loading}>
            <Download size={16} />
            {loading ? "Création en cours..." : "Télécharger PDF"}
        </Button>
    );
}
