"use server";

import { generateAI } from "@/lib/ai";

export interface JobAnalysisResult {
    company_name: string;
    role: string;
    location: string;
    missions: string[];
    insights: string;
    tech_stack: string[];
    daily_tasks_forecast: string;
    recruitment_process: string;
    profile_requirements: string[];
    company_summary: string;
}

export async function analyzeJobDescription(
    description: string,
    aiProvider: "auto" | "gemini" | "openai" = "auto",
    openaiModel?: string
): Promise<JobAnalysisResult> {
    const prompt = `
    Analyse l'offre d'emploi suivante. Ne te contente pas de résumer, cherche "l'entre-les-lignes".
    
    Tu DOIS répondre avec un objet JSON :
    {
      "company_name": "...",
      "role": "...",
      "location": "...",
      "missions": ["...", "..."],
      "insights": "🚩 **Vigilance** : [Un risque ou contrainte cachée]\\n\\n💎 **Pépite** : [L'avantage unique ou tech sympa]\\n\\n⚡ **Le Vrai Job** : [La priorité réelle n°1 en 10 mots]",
      "tech_stack": ["..."],
      "daily_tasks_forecast": "• [Verbe d'action] tâche concrète (≈30% du temps)\\n• [Verbe d'action] tâche concrète (≈50% du temps)\\n• [Verbe d'action] tâche concrète (≈20% du temps)",
      "recruitment_process": "• Étape 1\\n• Étape 2\\n• Étape 3 (max 5 lignes, clair et concret)",
      "profile_requirements": ["Must-have 1", "Must-have 2", "Nice-to-have 1"],
      "company_summary": "1 phrase sur qui est l'entreprise et ce qu'elle fait (pas le poste)"
    }

    CONSIGNES POUR "insights" :
    - Utilise DEUX retours à la ligne (\\n\\n) entre chaque point pour le rendu Markdown.
    - Sois critique : si l'offre est floue, mentionne-le. 
    - Ne dépasse pas 15 mots par point.
    - Pas de blabla promotionnel.
    - daily_tasks_forecast : 3 puces max, phrases ultra courtes, commence par un verbe d'action, indique une estimation (%) et NE répète pas les missions officielles; c'est un forecast de ce que la personne fera vraiment au quotidien.
    - recruitment_process : 3 à 5 étapes max, chaque étape en puce courte.
    - profile_requirements : liste 3-6 bullet points, commence par **Must** ou **Nice** pour signaler la priorité.
    - company_summary : 1 phrase neutre sur l'activité de l'entreprise (produit/secteur), ne pas mentionner le poste ni la localisation.

    OFFRE :
    ${description}
    `;

    try {
        const text = await generateAI(prompt, "application/json", { provider: aiProvider, openaiModel });
        return JSON.parse(text) as JobAnalysisResult;
    } catch (error) {
        console.error("Error analyzing job description:", error);
        throw new Error("Failed to analyze job description");
    }
}
