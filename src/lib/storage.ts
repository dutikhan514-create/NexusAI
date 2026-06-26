import type { Conversation, Settings } from "@/types";
import { DEFAULT_PROVIDERS, DEFAULT_SYSTEM_PROMPT } from "./providers";

const KEYS = {
  conversations: "nexus.conversations.v1",
  settings: "nexus.settings.v1",
} as const;

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */
export const DEFAULT_SETTINGS: Settings = {
  providers: DEFAULT_PROVIDERS,
  activeProvider: "openrouter",
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  temperature: 0.7,
  maxTokens: 4096,
  theme:
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark",
};

function isBrowser() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function loadSettings(): Settings {
  if (!isBrowser()) return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEYS.settings);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      providers: {
        ...DEFAULT_PROVIDERS,
        ...(parsed.providers ?? {}),
      },
      theme: parsed.theme === "light" ? "light" : "dark",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEYS.settings, JSON.stringify(settings));
  } catch {
    /* ignore quota errors */
  }
}

/* ------------------------------------------------------------------ */
/* Conversations                                                       */
/* ------------------------------------------------------------------ */
export function loadConversations(): Conversation[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEYS.conversations);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Conversation[];
    if (!Array.isArray(parsed)) return [];
    // Basic shape validation.
    return parsed.filter(
      (c) => c && typeof c.id === "string" && Array.isArray(c.messages)
    );
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      KEYS.conversations,
      JSON.stringify(conversations)
    );
  } catch {
    /* ignore quota errors */
  }
}

/** Create a unique id without external deps. */
export function uid(prefix = ""): string {
  const rnd = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}${time}${rnd}`;
}
