import { create } from "zustand";
import type {
  Attachment,
  ChatTurn,
  Conversation,
  Message,
  ProviderId,
  Settings,
} from "@/types";
import { streamChat } from "@/lib/api";
import {
  loadConversations,
  loadSettings,
  saveConversations,
  saveSettings,
  uid,
} from "@/lib/storage";

/* ------------------------------------------------------------------ */
/* Module-level streaming controller (kept out of reactive state)      */
/* ------------------------------------------------------------------ */
let abortController: AbortController | null = null;

/* Debounced persistence for conversations. */
let persistTimer: ReturnType<typeof setTimeout> | null = null;

/* ------------------------------------------------------------------ */
/* Immutable state helpers                                             */
/* ------------------------------------------------------------------ */
function patchMessage(
  convs: Conversation[],
  convId: string,
  msgId: string,
  patcher: (m: Message) => Message
): Conversation[] {
  return convs.map((c) =>
    c.id !== convId
      ? c
      : {
          ...c,
          updatedAt: Date.now(),
          messages: c.messages.map((m) => (m.id === msgId ? patcher(m) : m)),
        }
  );
}

function setMessages(
  convs: Conversation[],
  convId: string,
  fn: (msgs: Message[]) => Message[]
): Conversation[] {
  return convs.map((c) =>
    c.id !== convId ? c : { ...c, updatedAt: Date.now(), messages: fn(c.messages) }
  );
}

function deriveTitle(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "New chat";
  const words = clean.split(" ").slice(0, 7).join(" ");
  return words.length > 48 ? words.slice(0, 48) + "…" : words;
}

/* ------------------------------------------------------------------ */
/* Store definition                                                    */
/* ------------------------------------------------------------------ */
interface UIState {
  sidebarOpen: boolean;
  settingsOpen: boolean;
  systemPromptOpen: boolean;
  isStreaming: boolean;
}

interface NexusState extends UIState {
  conversations: Conversation[];
  activeId: string | null;
  settings: Settings;
  /** A prompt pre-filled into the composer (used by suggestion cards). */
  composePrompt: string;
  setComposePrompt: (text: string) => void;

  /* conversation actions */
  newChat: () => string;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  togglePin: (id: string) => void;
  clearAll: () => void;

  /* messaging */
  sendMessage: (content: string, attachments?: Attachment[]) => Promise<void>;
  regenerate: (assistantMessageId: string) => Promise<void>;
  editUserMessage: (messageId: string, newContent: string) => Promise<void>;
  stop: () => void;

  /* settings */
  updateSettings: (partial: Partial<Settings>) => void;
  setActiveProvider: (p: ProviderId) => void;
  setProviderField: (
    p: ProviderId,
    field: "apiKey" | "model",
    value: string
  ) => void;
  setSystemPrompt: (text: string) => void;
  toggleTheme: () => void;

  /* ui */
  setSidebarOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setSystemPromptOpen: (open: boolean) => void;
}

export const useStore = create<NexusState>((set, get) => {
  /* ---- persistence helpers ---- */
  function persistConversationsSoon() {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      saveConversations(get().conversations);
    }, 350);
  }

  function persistSettings(partial: Partial<Settings>) {
    const next = { ...get().settings, ...partial };
    set({ settings: next });
    saveSettings(next);
  }

  async function runCompletion(convId: string, assistantId: string) {
    const state = get();
    const conv = state.conversations.find((c) => c.id === convId);
    if (!conv) return;

    const assistantIdx = conv.messages.findIndex((m) => m.id === assistantId);
    const history = conv.messages.slice(0, assistantIdx);
    const turns: ChatTurn[] = history.map((m) => ({
      role: m.role,
      content: m.content,
      attachments: m.attachments,
    }));

    const { settings } = state;
    const providerCfg = settings.providers[settings.activeProvider];

    abortController = new AbortController();
    set({ isStreaming: true });

    try {
      const stream = streamChat({
        provider: settings.activeProvider,
        apiKey: providerCfg.apiKey,
        model: providerCfg.model,
        systemPrompt: settings.systemPrompt,
        messages: turns,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        signal: abortController.signal,
      });

      let acc = "";
      for await (const chunk of stream) {
        acc += chunk;
        const current = acc;
        set((s) => ({
          conversations: patchMessage(s.conversations, convId, assistantId, (m) => ({
            ...m,
            content: current,
            streaming: true,
            error: false,
            provider: settings.activeProvider,
            model: providerCfg.model,
          })),
        }));
      }

      set((s) => ({
        conversations: patchMessage(s.conversations, convId, assistantId, (m) => ({
          ...m,
          content: acc || "*(The model returned an empty response.)*",
          streaming: false,
          provider: settings.activeProvider,
          model: providerCfg.model,
        })),
      }));
    } catch (err) {
      const aborted = abortController?.signal.aborted ?? false;
      const message =
        err instanceof Error ? err.message : "Unknown streaming error.";

      set((s) => ({
        conversations: patchMessage(s.conversations, convId, assistantId, (m) => {
          if (aborted) {
            return {
              ...m,
              streaming: false,
              content: m.content || "*(Generation stopped.)*",
            };
          }
          const note = `> ⚠️ **Error:** ${message}`;
          return {
            ...m,
            streaming: false,
            error: true,
            content: m.content ? `${m.content}\n\n${note}` : note,
          };
        }),
      }));
    } finally {
      abortController = null;
      set({ isStreaming: false });
      // Auto-title from first user message if still default.
      set((s) => ({
        conversations: s.conversations.map((c) => {
          if (c.id !== convId) return c;
          if (c.title && c.title !== "New chat") return c;
          const firstUser = c.messages.find((m) => m.role === "user");
          return firstUser ? { ...c, title: deriveTitle(firstUser.content) } : c;
        }),
      }));
      persistConversationsSoon();
    }
  }

  function ensureConversation(): string {
    const state = get();
    if (state.activeId) {
      const exists = state.conversations.some((c) => c.id === state.activeId);
      if (exists) return state.activeId;
    }
    const conv: Conversation = {
      id: uid("conv_"),
      title: "New chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((s) => ({ conversations: [conv, ...s.conversations], activeId: conv.id }));
    return conv.id;
  }

  return {
    conversations: loadConversations(),
    activeId: null,
    settings: loadSettings(),
    composePrompt: "",
    sidebarOpen: false,
    settingsOpen: false,
    systemPromptOpen: false,
    isStreaming: false,

    /* ---------------- conversation actions ---------------- */
    newChat: () => {
      // If an empty "New chat" already exists, reuse it.
      const existing = get().conversations.find(
        (c) => c.title === "New chat" && c.messages.length === 0
      );
      if (existing) {
        set({ activeId: existing.id, sidebarOpen: false });
        return existing.id;
      }
      const id = ensureConversation();
      set({ sidebarOpen: false });
      return id;
    },

    selectConversation: (id) => set({ activeId: id, sidebarOpen: false }),

    deleteConversation: (id) => {
      set((s) => {
        const conversations = s.conversations.filter((c) => c.id !== id);
        let activeId = s.activeId;
        if (activeId === id) {
          activeId = conversations[0]?.id ?? null;
        }
        return { conversations, activeId };
      });
      persistConversationsSoon();
    },

    renameConversation: (id, title) => {
      const finalTitle = title.trim() || "Untitled";
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === id ? { ...c, title: finalTitle } : c
        ),
      }));
      persistConversationsSoon();
    },

    togglePin: (id) => {
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === id ? { ...c, pinned: !c.pinned } : c
        ),
      }));
      persistConversationsSoon();
    },

    clearAll: () => {
      set({ conversations: [], activeId: null });
      saveConversations([]);
    },

    /* ---------------- messaging ---------------- */
    sendMessage: async (content, attachments) => {
      if (get().isStreaming) return;
      const text = content.trim();
      if (!text && (!attachments || attachments.length === 0)) return;

      const convId = ensureConversation();
      const userMsg: Message = {
        id: uid("msg_"),
        role: "user",
        content: text,
        attachments: attachments && attachments.length ? attachments : undefined,
        createdAt: Date.now(),
      };
      const assistantMsg: Message = {
        id: uid("msg_"),
        role: "assistant",
        content: "",
        createdAt: Date.now(),
        streaming: true,
        provider: get().settings.activeProvider,
        model: get().settings.providers[get().settings.activeProvider].model,
      };

      set((s) => ({
        conversations: setMessages(s.conversations, convId, (msgs) => [
          ...msgs,
          userMsg,
          assistantMsg,
        ]),
      }));

      // Title immediately if still default.
      set((s) => ({
        conversations: s.conversations.map((c) => {
          if (c.id !== convId || (c.title && c.title !== "New chat")) return c;
          return { ...c, title: deriveTitle(text || "New chat") };
        }),
      }));

      await runCompletion(convId, assistantMsg.id);
    },

    regenerate: async (assistantMessageId) => {
      if (get().isStreaming) return;
      let convId = "";
      set((s) => ({
        conversations: s.conversations.map((c) => {
          const idx = c.messages.findIndex((m) => m.id === assistantMessageId);
          if (idx === -1) return c;
          convId = c.id;
          // Keep everything up to and including the assistant message, reset it.
          return {
            ...c,
            updatedAt: Date.now(),
            messages: [
              ...c.messages.slice(0, idx),
              {
                ...c.messages[idx],
                content: "",
                streaming: true,
                error: false,
                createdAt: Date.now(),
              },
            ],
          };
        }),
      }));
      if (convId) await runCompletion(convId, assistantMessageId);
    },

    editUserMessage: async (messageId, newContent) => {
      if (get().isStreaming) return;
      const text = newContent.trim();
      if (!text) return;
      let convId = "";
      let assistantId = "";
      set((s) => ({
        conversations: s.conversations.map((c) => {
          const idx = c.messages.findIndex((m) => m.id === messageId);
          if (idx === -1 || c.messages[idx].role !== "user") return c;
          convId = c.id;
          const edited: Message = { ...c.messages[idx], content: text };
          const assistantMsg: Message = {
            id: uid("msg_"),
            role: "assistant",
            content: "",
            streaming: true,
            createdAt: Date.now(),
            provider: s.settings.activeProvider,
            model: s.settings.providers[s.settings.activeProvider].model,
          };
          assistantId = assistantMsg.id;
          // Discard everything after the edited prompt and add a fresh reply.
          return {
            ...c,
            updatedAt: Date.now(),
            messages: [...c.messages.slice(0, idx), edited, assistantMsg],
          };
        }),
      }));
      if (convId && assistantId) await runCompletion(convId, assistantId);
    },

    stop: () => {
      abortController?.abort();
    },

    /* ---------------- settings ---------------- */
    updateSettings: (partial) => persistSettings(partial),

    setActiveProvider: (p) => persistSettings({ activeProvider: p }),

    setProviderField: (p, field, value) => {
      const current = get().settings;
      const next: Settings = {
        ...current,
        providers: {
          ...current.providers,
          [p]: { ...current.providers[p], [field]: value },
        },
      };
      set({ settings: next });
      saveSettings(next);
    },

    setSystemPrompt: (text) => persistSettings({ systemPrompt: text }),

    toggleTheme: () => {
      const next = get().settings.theme === "dark" ? "light" : "dark";
      persistSettings({ theme: next });
    },

    /* ---------------- ui ---------------- */
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    setSettingsOpen: (open) => set({ settingsOpen: open }),
    setSystemPromptOpen: (open) => set({ systemPromptOpen: open }),
    setComposePrompt: (text) => set({ composePrompt: text }),
  };
});

/* ------------------------------------------------------------------ */
/* Selectors                                                          */
/* ------------------------------------------------------------------ */
export const selectActiveConversation = (s: NexusState): Conversation | null =>
  s.conversations.find((c) => c.id === s.activeId) ?? null;
