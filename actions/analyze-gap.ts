"use server";

import { generateAIWithCache } from "@/lib/ai";
import { getUserProfile } from "@/lib/profile";

export async function analyzeGap(
  jobDescription: string,
  aiProvider: "auto" | "gemini" | "openai" = "auto",
  openaiModel?: string
): Promise<string> {
  const userProfile = await getUserProfile();
  const cvText = userProfile?.cv_content;
  const bioPreferences = userProfile?.bio_preferences;

  if (!cvText) {
    throw new Error("CV introuvable dans le profil.");
  }

  const prompt = `
      Agis comme un recruteur technique. Compare le CV du candidat avec l'offre.
      Sois **direct** et **synthétique**.

      Offre :
      ${jobDescription}
      
      CV : fourni dans le message système précédent (cacheable).
      
      ${bioPreferences ? `Contexte additionnel du candidat (objectifs, préférences de stage) :
      ${bioPreferences}
      ` : ''}
      Tâche : Analyse le profil par rapport à l'offre${bioPreferences ? ' en tenant compte de ses objectifs et de ses préférences' : ''}.
      
      CONSIGNES DE FORMATAGE (STRICT) :
      - Utilise du Markdown standard.
      - **IMPORTANT** : Ajoute une ligne vide entre CHAQUE point de liste (*) pour éviter les blocs de texte compacts.
      - **IMPORTANT** : Ajoute une ligne vide avant chaque titre (###).
      - Ne pas utiliser de phrases d'introduction ou de conclusion.

      FORMAT ATTENDU :
      
      ### 🎯 Score de pertinence : [0-100]%
      
      ### ✅ Points Forts
      * **[Compétence]** : [Preuve courte du CV]
      
      * **[Expérience]** : [Preuve courte du CV]
      
      ### ⚠️ Gaps
      * **[Manquant]** : [Raison factuelle]
      
      * **[Différence]** : [Raison factuelle]
      
      Règles : Max 3-4 points par section. Pas de remplissage.
    `;

  try {
    // We stay with a string return since your DB stores it as text,
    // but we use strict formatting instructions.
    const text = await generateAIWithCache(cvText, prompt, undefined, { provider: aiProvider, openaiModel });
    return text.trim();
  } catch (error) {
    console.error("Error analyzing gap:", error);
    throw new Error("Failed to analyze gap");
  }
}
