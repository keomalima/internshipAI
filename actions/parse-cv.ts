"use server";

// @ts-expect-error pdf-parse has no TypeScript types for this path
import pdf from "pdf-parse/lib/pdf-parse.js";

export async function parseCV(formData: FormData): Promise<string> {
    const file = formData.get("file") as File;
    if (!file) {
        throw new Error("No file uploaded");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
        const data = await pdf(buffer);
        return data.text;
    } catch (error) {
        console.error("Error parsing PDF:", error);
        throw new Error("Failed to parse PDF");
    }
}
