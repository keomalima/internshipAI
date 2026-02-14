'use server';

import { generateAIWithCache } from "@/lib/ai";
import { getUserProfile } from "@/lib/profile";

export async function generateEmail(
  jobDescription: string,
  userNote: string | undefined,
  aiProvider: "auto" | "gemini" | "openai" = "auto",
  openaiModel?: string
): Promise<string> {
  const userProfile = await getUserProfile();

  const fullName = userProfile?.full_name?.trim();
  const email = userProfile?.email?.trim();
  const phone = userProfile?.phone?.trim();
  const city = userProfile?.city?.trim() || "Lyon";
  const bioPreferences = userProfile?.bio_preferences;

  if (!fullName || !email) {
    throw new Error("Complétez vos coordonnées dans Profil (nom + email au minimum).");
  }

  const note = userNote && userNote.trim().length > 0 ? userNote.trim() : "Aucune note";

  const prompt = `
Rédige un email de candidature court et direct pour accompagner un CV et une lettre de motivation.

Contexte :
- Offre : ${jobDescription}
- Candidat : ${fullName}, ${city}
${bioPreferences ? `- Parcours et objectifs : ${bioPreferences}` : ''}
- Note du candidat : ${note}

Structure :

OBJET : Court et précis (ex: "Candidature stage [Poste] - ${fullName}")

CORPS (50-80 mots max, 2-3 phrases) :
- Salutation (Bonjour / Madame, Monsieur)
- 1 phrase : Je candidate pour [poste]. [1 teaser court - une expérience/compétence clé du CV pertinente pour l'offre].
- 1 phrase : Vous trouverez mon CV et ma lettre de motivation en pièces jointes.
- Formule de politesse courte (Cordialement, Bien cordialement)

Ton : Direct et factuel. PAS de "Je suis..." ou "Je me présente". Le teaser doit être concret (ex: "Mon expérience de 4 ans chez X en tant que Y" ou "J'ai développé Z avec [stack]").

Format : Texte brut, pas de HTML.
  `;

  try {
    const text = await generateAIWithCache(userProfile?.cv_content || "", prompt, undefined, { provider: aiProvider, openaiModel });
    return text.trim();
  } catch (error) {
    console.error("Email generation error:", error);
    throw new Error("Failed to generate email");
  }
}
