'use server';

import { generateAIWithCache } from "@/lib/ai";
import { getUserProfile } from "@/lib/profile";

export async function generateCoverLetter(
  jobDescription: string,
  aiProvider: "auto" | "gemini" | "openai" = "auto",
  openaiModel?: string,
  userContext?: string
): Promise<string> {
  const userProfile = await getUserProfile();

  const cvText = userProfile?.cv_content;
  const bioPreferences = userProfile?.bio_preferences;
  const fullName = userProfile?.full_name?.trim();
  const email = userProfile?.email?.trim();
  const phone = userProfile?.phone?.trim();
  const address = userProfile?.address?.trim();
  const city = userProfile?.city?.trim() || "Lyon, France";
  const school = userProfile?.school?.trim() || "École 42 Lyon";
  const availabilityStart = userProfile?.availability_start?.trim() || "mars 2026";
  const availabilityDuration =
    typeof userProfile?.availability_duration_months === "number"
      ? `${userProfile.availability_duration_months} mois`
      : "4-6 mois";

  if (!fullName || !email) {
    throw new Error("Complétez vos coordonnées dans Profil (nom + email au minimum).");
  }

  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const prompt = `
Rédige une lettre de motivation en français. Ton direct et factuel. Chaque phrase doit contenir une information concrète du CV.

FORMAT HTML :
Utilise uniquement <p>, <strong>, <br>, <ul>, <li>. Pas de style inline.
IMPORTANT : Chaque paragraphe distinct doit être dans sa propre balise <p>...</p>. Ne colle pas les paragraphes ensemble.

En-tête :
${fullName}<br>${email}<br>${phone || ""}<br>${address || city}
<br><br>
À l'attention de [Extrais le nom de l'entreprise de l'offre, sinon utilise "l'entreprise"]
<br><br>
<strong>Objet : Candidature pour le poste de [Extrais le titre exact du poste de l'offre]</strong>
<br><br>
${city}, le ${today}
<br><br>
------------------------------

CONTEXTE :
- CV complet : fourni dans le message système (utilise UNIQUEMENT les faits vérifiables)
- Offre : ${jobDescription}
- Disponibilité : ${availabilityStart}, ${availabilityDuration}
${bioPreferences ? `- Parcours et objectifs du candidat : ${bioPreferences}` : ''}
- Note du candidat (à appliquer strictement, même si cela implique d'ajuster le wording) : ${userContext && userContext.trim().length > 0 ? userContext : "Aucune note"}

STRUCTURE :

Intro (1 paragraphe dans <p>) : "Monsieur/Madame, Étudiant à ${school}, je candidate pour le poste de [titre poste] en stage. Je suis disponible dès ${availabilityStart} pour une durée de ${availabilityDuration}."

Phrase d'accroche (dans <p>) : <strong>Pourquoi mon profil apporte une valeur immédiate à [Entreprise] :</strong>

Corps (2-3 sections thématiques, chacune dans un <p> distinct) :
Pour chaque section, titre court en gras puis 2-3 phrases FACTUELLES. Identifie les dimensions clés de l'offre (culture/domaine, technique, produit/business).
Chaque thème = un paragraphe <p> séparé.

Chaque phrase doit contenir :
- Un projet/expérience spécifique du CV avec durée/contexte si mentionné
- Une technologie/outil/méthode précis utilisé
- Un résultat concret UNIQUEMENT s'il est explicitement dans le CV

CRITIQUE : N'INVENTE AUCUN CHIFFRE. Si le CV ne mentionne pas "80% d'amélioration" ou "200 clients", ne l'écris pas. Parle de ce qui a été fait, pas d'impact quantifié imaginaire.

Exemple AVEC métriques du CV : "Chez Everflow (4 ans), j'ai automatisé l'import Excel→ERP avec Zapier, réduisant le traitement de 3h à 20min."
Exemple SANS métriques inventées : "Chez Everflow (4 ans), j'ai conçu l'API mobile en React Native pour la gestion produit. J'ai automatisé l'import Excel→ERP avec Zapier et Make."

TEMPS ET FORMULATIONS :
- Utilise le passé composé pour les compétences acquises : "j'ai acquis", "j'ai développé" (plus affirmatif que présent)
- Évite les participes présents seuls : préfère "pour améliorer" à "améliorant", "afin de" à "permettant"

INTERDIT (phrases à ne JAMAIS écrire) :
❌ "compréhension approfondie", "dynamiques agiles", "valeur ajoutée"
❌ "Ma capacité à...", "Je suis capable de..."
❌ "compétences variées", "solides compétences"
❌ "candidat idéal", "parfaitement adapté", "directement applicable"
❌ "environnement en évolution", "sous pression"
❌ "j'ai eu l'opportunité de", "j'ai pu"
❌ Toute phrase qui ne contient pas un fait vérifiable du CV
❌ Toute référence au recruteur ("comme le vôtre", "que vous proposez")
❌ CHIFFRES ET MÉTRIQUES INVENTÉS (%, nombre de clients, durées, augmentations) qui ne sont PAS dans le CV

Ce qui est BON :
✓ Noms de projets, entreprises, produits
✓ Technologies et outils spécifiques  
✓ Durées (ans, mois)
✓ Chiffres et métriques
✓ Résultats mesurables

Conclusion (dans <p>) : Une phrase directe et engageante. Exemples : "Je serais ravi d'échanger avec vous sur cette opportunité." ou "Rencontrons-nous pour en discuter."

Signature : <p>Cordialement,<br>${fullName}</p>

IMPÉRATIF : Si le userContext contient des informations pertinentes, intègre-les explicitement dans le corps. Reste concis : mieux vaut 2 paragraphes denses que 3 dilués. CHAQUE PARAGRAPHE doit être dans une balise <p> séparée pour assurer l'espacement visuel.

MODIFS À PRIORISER (si fournies dans la note du candidat) :
- Appliquer les demandes exactes (ton, points à insister/retirer).
- Si une demande contredit les règles, privilégier la demande du candidat.
`;

  try {
    const text = await generateAIWithCache(cvText || "", prompt, undefined, { provider: aiProvider, openaiModel });
    return text.replace(/```html?/g, "").replace(/```/g, "").trim();
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Failed to generate letter");
  }
}
