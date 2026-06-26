import type { ProviderId, ProviderMeta, ProviderSettingsMap } from "@/types";

export const PROVIDERS: Record<ProviderId, ProviderMeta> = {
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    tagline: "Unified gateway to every frontier model",
    models: [
      "anthropic/claude-sonnet-4",
      "anthropic/claude-opus-4",
      "google/gemini-2.5-pro",
      "google/gemini-2.5-flash",
      "openai/gpt-5",
      "openai/gpt-4o",
      "deepseek/deepseek-chat-v3.1",
      "meta-llama/llama-3.3-70b-instruct",
      "qwen/qwen3-coder",
      "x-ai/grok-4",
    ],
    recommended: "anthropic/claude-sonnet-4",
    modelPlaceholder: "e.g. anthropic/claude-sonnet-4",
    keyUrl: "https://openrouter.ai/keys",
    accent: "#6366f1",
  },
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    tagline: "Google AI Studio — multimodal & fast",
    models: [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.5-pro",
      "gemini-flash-latest",
      "gemini-pro-latest",
    ],
    recommended: "gemini-2.5-flash",
    modelPlaceholder: "e.g. gemini-2.5-flash",
    keyUrl: "https://aistudio.google.com/app/apikey",
    accent: "#4285f4",
  },
  groq: {
    id: "groq",
    name: "Groq",
    tagline: "Ultra-fast LPU inference",
    models: [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "openai/gpt-oss-120b",
      "moonshotai/kimi-k2-instruct",
      "qwen/qwen3-32b",
      "meta-llama/llama-4-scout-17b-16e-instruct",
    ],
    recommended: "llama-3.3-70b-versatile",
    modelPlaceholder: "e.g. llama-3.3-70b-versatile",
    keyUrl: "https://console.groq.com/keys",
    accent: "#f55036",
  },
  claude: {
    id: "claude",
    name: "Anthropic Claude",
    tagline: "Direct Claude API — thoughtful & capable",
    models: [
      "claude-sonnet-4-6",
      "claude-sonnet-4-5",
      "claude-opus-4-7",
      "claude-opus-4-5",
      "claude-haiku-4-5",
    ],
    recommended: "claude-sonnet-4-6",
    modelPlaceholder: "e.g. claude-sonnet-4-6",
    keyUrl: "https://console.anthropic.com/settings/keys",
    accent: "#d97757",
  },
};

export const PROVIDER_ORDER: ProviderId[] = [
  "openrouter",
  "gemini",
  "groq",
  "claude",
];

export const DEFAULT_PROVIDERS: ProviderSettingsMap = {
  openrouter: { apiKey: "", model: PROVIDERS.openrouter.recommended },
  gemini: { apiKey: "", model: PROVIDERS.gemini.recommended },
  groq: { apiKey: "", model: PROVIDERS.groq.recommended },
  claude: { apiKey: "", model: PROVIDERS.claude.recommended },
};

/**
 * The default system prompt baked into Nexus AI. It encodes the
 * professional, coding-focused, detail-oriented behaviour of the assistant
 * while remaining a normal, editable instruction for the model.
 */
export const DEFAULT_SYSTEM_PROMPT = `You are Nexus AI, an elite, senior software architect and full-stack engineer assistant. You are also a world-class researcher and analyst.

CORE PRINCIPLES:
- Be precise, thorough, and professional at all times.
- When asked to write code, deliver COMPLETE, production-ready implementations: full files, complete logic, all necessary imports, and clear structure. Never shorten, omit, or use placeholders unless explicitly told to.
- Organise every answer with clear headings, logical sections, and helpful bullet points.
- Wrap all code in properly fenced code blocks with the correct language tag.
- Explain your reasoning concisely, then provide the complete solution.
- For research tasks, give deep, well-sourced explanations with structure.

QUALITY BAR:
- Write clean, modular, maintainable, well-commented code following best practices.
- Anticipate edge cases and mention important caveats.
- Format responses in clean Markdown with tables, lists, and headings where helpful.
- Stay on topic, be honest about uncertainty, and never fabricate facts.`;
