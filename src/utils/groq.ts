// Groq's OpenAI-compatible chat endpoint, on the free tier
// (1000 requests/day, 8000 tokens/min).
//
// Groq decommissions models without notice — `llama-3.3-70b-versatile`
// vanished and took all three AI routes down at once, because each one
// hardcoded its own copy of the model id. Keep it here so the next swap
// is a one-line change.
//
// To see what the key can actually use:
//   curl https://api.groq.com/openai/v1/models -H "Authorization: Bearer $GROQ_API_KEY"
export const GROQ_MODEL = "openai/gpt-oss-120b";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

type GroqMessage = { role: "system" | "user"; content: string };

type GroqChatOptions = {
  messages: GroqMessage[];
  maxTokens: number;
  /** Ask the model for a JSON object. Use when the caller JSON.parses the reply. */
  jsonMode?: boolean;
};

/**
 * Calls Groq and returns the assistant's text.
 * Throws with the provider's own message so routes can surface it.
 *
 * gpt-oss models emit a separate `reasoning` field whose tokens count
 * against max_tokens, so reasoning_effort is pinned low — otherwise a
 * long chain of thought can consume the budget and return empty content.
 */
export async function groqChat({
  messages,
  maxTokens,
  jsonMode,
}: GroqChatOptions): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: maxTokens,
      reasoning_effort: "low",
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      messages,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || `Groq request failed (${res.status})`);
  }

  return data.choices?.[0]?.message?.content?.trim() || "";
}
