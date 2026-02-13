import { model as geminiModel, geminiModelName } from "@/lib/gemini";

type MimeType = "application/json" | "text/plain" | undefined;
type Provider = "auto" | "gemini" | "openai";

const openAIApiKey = process.env.OPENAI_API_KEY;
const openAIDefaultModel = process.env.OPENAI_MODEL || "gpt-4o-mini";

type ProviderResult = { text: string; model: string };

async function callGemini(prompt: string, mimeType?: MimeType): Promise<ProviderResult> {
  if (mimeType === "application/json") {
    const result = await geminiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });
    return { text: result.response.text(), model: geminiModelName };
  }

  const result = await geminiModel.generateContent(prompt);
  return { text: result.response.text(), model: geminiModelName };
}

async function callOpenAI(
  messages: Array<Record<string, unknown>>,
  mimeType?: MimeType,
  modelOverride?: string
): Promise<ProviderResult> {
  if (!openAIApiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const body: Record<string, unknown> = {
    model: modelOverride || openAIDefaultModel,
    messages,
  };

  if (mimeType === "application/json") {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAIApiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI response empty");
  }
  const usedModel = data?.model || modelOverride || openAIDefaultModel;
  return { text: content as string, model: usedModel };
}

interface AIOptions {
  provider?: Provider;
  openaiModel?: string;
}

export async function generateAI(
  prompt: string,
  mimeType?: MimeType,
  options: AIOptions = {}
): Promise<string> {
  const provider = options.provider || "auto";
  if (provider === "gemini") {
    const { text, model } = await callGemini(prompt, mimeType);
    console.info(`[AI] Provider=Gemini model=${model} success`);
    return text;
  }

  if (provider === "openai") {
    const { text, model } = await callOpenAI([{ role: "user", content: prompt }], mimeType, options.openaiModel);
    console.info(`[AI] Provider=OpenAI model=${model} success`);
    return text;
  }

  // auto: try gemini then OpenAI fallback
  try {
    const { text, model } = await callGemini(prompt, mimeType);
    console.info(`[AI] Provider=Gemini model=${model} success`);
    return text;
  } catch (error) {
    console.warn("[AI] Gemini failed, attempting OpenAI fallback:", error);
    const { text, model } = await callOpenAI([{ role: "user", content: prompt }], mimeType, options.openaiModel);
    console.info(`[AI] Provider=OpenAI model=${model} success`);
    return text;
  }
}

/**
 * generateAIWithCache allows sending a cacheable message (e.g., CV) to OpenAI with cache_control=ephemeral.
 * Gemini does not support caching; it receives the combined prompt.
 */
export async function generateAIWithCache(
  cacheableContent: string | null,
  prompt: string,
  mimeType?: MimeType,
  options: AIOptions = {}
): Promise<string> {
  const provider = options.provider || "auto";
  const combinedPrompt = cacheableContent ? `CV (cacheable):\n${cacheableContent}\n\n${prompt}` : prompt;

  if (provider === "gemini") {
    const { text, model } = await callGemini(combinedPrompt, mimeType);
    console.info(`[AI] Provider=Gemini model=${model} success`);
    return text;
  }

  if (provider === "openai") {
    const messages: Array<Record<string, unknown>> = [];
    if (cacheableContent) {
      messages.push({
        role: "system",
        content: cacheableContent,
        cache_control: { type: "ephemeral" },
      });
    }
    messages.push({ role: "user", content: prompt });

    const { text, model } = await callOpenAI(messages, mimeType, options.openaiModel);
    console.info(
      `[AI] Provider=OpenAI model=${model} success (cacheable CV${cacheableContent ? " used" : " skipped"})`
    );
    return text;
  }

  // auto with fallback
  try {
    const { text, model } = await callGemini(combinedPrompt, mimeType);
    console.info(`[AI] Provider=Gemini model=${model} success`);
    return text;
  } catch (error) {
    console.warn("[AI] Gemini failed, attempting OpenAI fallback with cache:", error);
    const messages: Array<Record<string, unknown>> = [];
    if (cacheableContent) {
      messages.push({
        role: "system",
        content: cacheableContent,
        cache_control: { type: "ephemeral" },
      });
    }
    messages.push({ role: "user", content: prompt });

    const { text, model } = await callOpenAI(messages, mimeType, options.openaiModel);
    console.info(
      `[AI] Provider=OpenAI model=${model} success (cacheable CV${cacheableContent ? " used" : " skipped"})`
    );
    return text;
  }
}
