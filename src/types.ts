export type ProviderId = "openrouter" | "gemini" | "groq" | "claude";

export type Role = "user" | "assistant" | "system";

export interface Attachment {
  id: string;
  name: string;
  /** MIME type of the file */
  mime: string;
  /** Size in bytes */
  size: number;
  /** For images: a base64 data URL. */
  dataUrl?: string;
  /** For text-based files: extracted string content. */
  text?: string;
  /** Whether the file content could be understood as text. */
  isText: boolean;
  /** Whether the file is an image usable for vision. */
  isImage: boolean;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  attachments?: Attachment[];
  createdAt: number;
  /** True while the assistant response is actively streaming. */
  streaming?: boolean;
  /** True if this message ended in an error. */
  error?: boolean;
  /** Which provider/model produced an assistant message. */
  model?: string;
  provider?: ProviderId;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  /** Conversation-level pinned state. */
  pinned?: boolean;
}

export interface ProviderSettings {
  apiKey: string;
  model: string;
}

export type ProviderSettingsMap = Record<ProviderId, ProviderSettings>;

export interface Settings {
  providers: ProviderSettingsMap;
  activeProvider: ProviderId;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  theme: "light" | "dark";
}

/** Description of a provider for the UI. */
export interface ProviderMeta {
  id: ProviderId;
  name: string;
  tagline: string;
  /** A curated list of recommended models. */
  models: string[];
  /** The auto-selected recommended model. */
  recommended: string;
  /** Default placeholder text for the model input. */
  modelPlaceholder: string;
  /** Where to obtain an API key. */
  keyUrl: string;
  accent: string;
}

/** Normalised chat message sent to the API layer. */
export interface ChatTurn {
  role: Role;
  content: string;
  attachments?: Attachment[];
}
