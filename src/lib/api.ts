import type { ChatTurn, ProviderId } from "@/types";
import { formatBytes, getExtension } from "./files";

export interface StreamOptions {
  provider: ProviderId;
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: ChatTurn[];
  temperature: number;
  maxTokens: number;
  signal: AbortSignal;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Merge consecutive turns of the same role (required by Claude, safer overall). */
function sanitizeTurns(turns: ChatTurn[]): ChatTurn[] {
  const out: ChatTurn[] = [];
  for (const t of turns) {
    const last = out[out.length - 1];
    if (last && last.role === t.role) {
      last.content = `${last.content}\n\n${t.content}`.trim();
      last.attachments = [
        ...(last.attachments ?? []),
        ...(t.attachments ?? []),
      ];
    } else {
      out.push({
        ...t,
        attachments: t.attachments ? [...t.attachments] : undefined,
      });
    }
  }
  return out;
}

/** Build the textual context for a turn (prompt + attached text/binary files). */
function buildTextContext(turn: ChatTurn): string {
  let out = turn.content ?? "";
  const atts = turn.attachments ?? [];
  const textFiles = atts.filter((a) => a.isText && a.text);
  const binaries = atts.filter((a) => !a.isImage && !a.isText);

  if (textFiles.length) {
    out +=
      "\n\n" +
      textFiles
        .map((a) => {
          const ext = getExtension(a.name);
          return `📎 Attached file: ${a.name} (${a.mime || "text/plain"}, ${formatBytes(
            a.size
          )})\n\`\`\`${ext}\n${a.text}\n\`\`\``;
        })
        .join("\n\n");
  }
  if (binaries.length) {
    out +=
      "\n\n" +
      binaries
        .map(
          (a) =>
            `📎 Attached binary file: ${a.name} (type: ${a.mime}, size: ${formatBytes(
              a.size
            )}) — content could not be read as text.`
        )
        .join("\n");
  }
  return out;
}

function splitDataUrl(dataUrl: string): { mime: string; data: string } {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) return { mime: "image/png", data: dataUrl };
  const meta = dataUrl.slice(0, comma);
  const data = dataUrl.slice(comma + 1);
  const mime = meta.match(/data:(.*?);base64/)?.[1] ?? "image/png";
  return { mime, data };
}

/* ------------------------------------------------------------------ */
/* Provider-specific message builders                                  */
/* ------------------------------------------------------------------ */

// --- OpenAI compatible (OpenRouter + Groq) ---
function buildOpenAITurns(turns: ChatTurn[], systemPrompt: string) {
  const messages: unknown[] = [];
  if (systemPrompt.trim()) {
    messages.push({ role: "system", content: systemPrompt });
  }
  for (const t of turns) {
    if (t.role === "system") continue;
    const ctx = buildTextContext(t);
    const images = (t.attachments ?? []).filter((a) => a.isImage && a.dataUrl);
    if (images.length === 0) {
      messages.push({ role: t.role, content: ctx });
    } else {
      const parts: unknown[] = [];
      if (ctx.trim()) parts.push({ type: "text", text: ctx });
      for (const img of images) {
        parts.push({ type: "image_url", image_url: { url: img.dataUrl } });
      }
      messages.push({ role: t.role, content: parts });
    }
  }
  return messages;
}

// --- Gemini ---
function buildGeminiPayload(turns: ChatTurn[], systemPrompt: string, opts: StreamOptions) {
  const contents = turns.map((t) => {
    const parts: unknown[] = [];
    const ctx = buildTextContext(t);
    if (ctx) parts.push({ text: ctx });
    for (const img of (t.attachments ?? []).filter((a) => a.isImage && a.dataUrl)) {
      const { mime, data } = splitDataUrl(img.dataUrl!);
      parts.push({ inline_data: { mime_type: mime, data } });
    }
    return {
      role: t.role === "assistant" ? "model" : "user",
      parts,
    };
  });

  return {
    contents,
    ...(systemPrompt.trim()
      ? { systemInstruction: { parts: [{ text: systemPrompt }] } }
      : {}),
    generationConfig: {
      temperature: opts.temperature,
      maxOutputTokens: opts.maxTokens,
    },
  };
}

// --- Claude ---
function buildClaudeTurns(turns: ChatTurn[]) {
  const messages: unknown[] = [];
  for (const t of turns) {
    if (t.role === "system") continue;
    const ctx = buildTextContext(t);
    const images = (t.attachments ?? []).filter((a) => a.isImage && a.dataUrl);
    if (images.length === 0) {
      messages.push({ role: t.role, content: ctx });
    } else {
      const parts: unknown[] = [];
      if (ctx.trim()) parts.push({ type: "text", text: ctx });
      for (const img of images) {
        const { mime, data } = splitDataUrl(img.dataUrl!);
        parts.push({
          type: "image",
          source: { type: "base64", media_type: mime, data },
        });
      }
      messages.push({ role: t.role, content: parts });
    }
  }
  return messages;
}

/* ------------------------------------------------------------------ */
/* SSE line reader                                                    */
/* ------------------------------------------------------------------ */
async function* sseLines(response: Response, signal: AbortSignal) {
  if (!response.body) throw new Error("No response stream available.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      if (signal.aborted) {
        reader.cancel().catch(() => {});
        return;
      }
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        yield line;
      }
    }
    if (buffer) yield buffer;
  } finally {
    reader.releaseLock();
  }
}

async function extractError(res: Response): Promise<Error> {
  let detail = "";
  try {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      detail =
        json?.error?.message ||
        json?.error ||
        json?.message ||
        json?.detail ||
        text;
    } catch {
      detail = text;
    }
  } catch {
    /* ignore */
  }
  detail = String(detail).slice(0, 600);
  if (res.status === 401 || res.status === 403) {
    return new Error(
      `Authentication failed (${res.status}). Your API key is missing, invalid, or lacks permission. ${
        detail ? "Detail: " + detail : ""
      }`.trim()
    );
  }
  if (res.status === 404) {
    return new Error(
      `Model or endpoint not found (404). Check the model name is correct for this provider. ${
        detail ? "Detail: " + detail : ""
      }`.trim()
    );
  }
  if (res.status === 429) {
    return new Error(
      `Rate limit reached (429). Please wait a moment and try again. ${
        detail ? "Detail: " + detail : ""
      }`.trim()
    );
  }
  return new Error(`${res.status} ${res.statusText}${detail ? ": " + detail : ""}`);
}

/* ------------------------------------------------------------------ */
/* Per-provider streamers                                             */
/* ------------------------------------------------------------------ */
async function* streamOpenAICompatible(
  url: string,
  headers: Record<string, string>,
  payload: unknown,
  signal: AbortSignal
): AsyncGenerator<string> {
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok) throw await extractError(res);

  for await (const line of sseLines(res, signal)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const data = trimmed.slice(5).trim();
    if (!data || data === "[DONE]") continue;
    try {
      const json = JSON.parse(data);
      const delta = json?.choices?.[0]?.delta?.content;
      if (typeof delta === "string" && delta) yield delta;
    } catch {
      /* partial JSON across chunks — ignore */
    }
  }
}

async function* streamGemini(
  opts: StreamOptions
): AsyncGenerator<string> {
  const payload = buildGeminiPayload(opts.messages, opts.systemPrompt, opts);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    opts.model
  )}:streamGenerateContent?alt=sse&key=${encodeURIComponent(opts.apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: opts.signal,
  });
  if (!res.ok) throw await extractError(res);

  for await (const line of sseLines(res, opts.signal)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const data = trimmed.slice(5).trim();
    if (!data || data === "[DONE]") continue;
    try {
      const json = JSON.parse(data);
      const parts = json?.candidates?.[0]?.content?.parts;
      if (Array.isArray(parts)) {
        for (const p of parts) {
          if (typeof p?.text === "string" && p.text) yield p.text;
        }
      }
      if (json?.promptFeedback?.blockReason) {
        yield `\n\n> ⚠️ Blocked by Gemini safety filter: ${json.promptFeedback.blockReason}`;
      }
    } catch {
      /* ignore */
    }
  }
}

async function* streamClaude(opts: StreamOptions): AsyncGenerator<string> {
  const clean = sanitizeTurns(opts.messages).filter(
    (t) => t.role !== "system"
  );
  // Claude requires the first message to be a user message.
  while (clean.length && clean[0].role === "assistant") clean.shift();

  const messages = buildClaudeTurns(clean);
  const payload = {
    model: opts.model,
    system: opts.systemPrompt.trim() || undefined,
    messages,
    max_tokens: opts.maxTokens,
    // Claude (without extended thinking) requires temperature in [0, 1].
    temperature: Math.min(Math.max(opts.temperature, 0), 1),
    stream: true,
  };

  const url = "https://api.anthropic.com/v1/messages";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": opts.apiKey,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
  };

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: opts.signal,
  });
  if (!res.ok) throw await extractError(res);

  for await (const line of sseLines(res, opts.signal)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const data = trimmed.slice(5).trim();
    if (!data || data === "[DONE]") continue;
    try {
      const json = JSON.parse(data);
      if (
        json?.type === "content_block_delta" &&
        json?.delta?.type === "text_delta" &&
        typeof json.delta.text === "string"
      ) {
        yield json.delta.text;
      }
    } catch {
      /* ignore */
    }
  }
}

/* ------------------------------------------------------------------ */
/* Public dispatcher                                                   */
/* ------------------------------------------------------------------ */
export async function* streamChat(
  opts: StreamOptions
): AsyncGenerator<string> {
  if (!opts.apiKey || !opts.apiKey.trim()) {
    throw new Error(
      `No API key set for ${opts.provider}. Open Settings (⚙) and add your key.`
    );
  }
  if (!opts.model || !opts.model.trim()) {
    throw new Error("No model selected. Open Settings (⚙) and choose a model.");
  }

  const turns = sanitizeTurns(opts.messages.filter((t) => t.role !== "system"));

  switch (opts.provider) {
    case "openrouter": {
      const messages = buildOpenAITurns(turns, opts.systemPrompt);
      const payload = {
        model: opts.model,
        messages,
        temperature: opts.temperature,
        max_tokens: opts.maxTokens,
        stream: true,
      };
      const headers: Record<string, string> = {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          typeof window !== "undefined" ? window.location.origin : "https://nexus.ai",
        "X-Title": "Nexus AI",
      };
      yield* streamOpenAICompatible(
        "https://openrouter.ai/api/v1/chat/completions",
        headers,
        payload,
        opts.signal
      );
      return;
    }
    case "groq": {
      const messages = buildOpenAITurns(turns, opts.systemPrompt);
      const payload = {
        model: opts.model,
        messages,
        temperature: opts.temperature,
        max_tokens: opts.maxTokens,
        stream: true,
      };
      const headers: Record<string, string> = {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
      };
      yield* streamOpenAICompatible(
        "https://api.groq.com/openai/v1/chat/completions",
        headers,
        payload,
        opts.signal
      );
      return;
    }
    case "gemini": {
      yield* streamGemini(opts);
      return;
    }
    case "claude": {
      yield* streamClaude(opts);
      return;
    }
    default:
      throw new Error(`Unknown provider: ${opts.provider as string}`);
  }
}

/** Quick check whether the active provider is ready to send. */
export function providerReady(p: {
  apiKey: string;
  model: string;
}): boolean {
  return Boolean(p.apiKey.trim() && p.model.trim());
}
