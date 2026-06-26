import { useEffect, useState } from "react";
import {
  X,
  RotateCcw,
  ScrollText,
  Info,
  Check,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/providers";
import { cn } from "@/utils/cn";

interface Preset {
  name: string;
  emoji: string;
  prompt: string;
}

const PRESETS: Preset[] = [
  {
    name: "Nexus Default",
    emoji: "✨",
    prompt: DEFAULT_SYSTEM_PROMPT,
  },
  {
    name: "Senior Engineer",
    emoji: "🛠️",
    prompt:
      "You are an elite senior software engineer and architect. Write complete, production-ready code with full implementations — never partial or placeholder code. Include error handling, tests where relevant, and concise explanations. Prefer clean, modular, well-typed, maintainable code. Explain trade-offs and edge cases clearly.",
  },
  {
    name: "Research Analyst",
    emoji: "🔬",
    prompt:
      "You are a meticulous research analyst. Provide deep, well-structured, evidence-based analysis. Break down complex topics with clear headings, bullet points, and balanced perspectives. Note uncertainty explicitly and avoid fabrication. Cite assumptions and reasoning.",
  },
  {
    name: "Concise Expert",
    emoji: "⚡",
    prompt:
      "You are a precise expert assistant. Keep answers concise, direct, and to the point. No filler. Use short paragraphs, bullet points, and only necessary detail. Expand only when explicitly asked.",
  },
  {
    name: "Tutor / Mentor",
    emoji: "🎓",
    prompt:
      "You are a patient, encouraging programming tutor. Teach step by step, check understanding, and explain the 'why' behind concepts. Use analogies and small examples. Adapt your depth to the learner's level.",
  },
];

export function SystemPromptPanel() {
  const open = useStore((s) => s.systemPromptOpen);
  const setOpen = useStore((s) => s.setSystemPromptOpen);
  const systemPrompt = useStore((s) => s.settings.systemPrompt);
  const setSystemPrompt = useStore((s) => s.setSystemPrompt);

  const [draft, setDraft] = useState(systemPrompt);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) setDraft(systemPrompt);
  }, [open, systemPrompt]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) return null;

  const isDefault = draft.trim() === DEFAULT_SYSTEM_PROMPT.trim();
  const dirty = draft !== systemPrompt;

  const apply = (text: string) => {
    setDraft(text);
  };

  const save = () => {
    setSystemPrompt(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const close = () => setOpen(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        style={{ animation: "var(--animate-fade-in)" }}
        onClick={close}
      />
      <div
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-[#131419] sm:max-h-[85vh] sm:rounded-2xl"
        style={{ animation: "var(--animate-pop-in)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
              <ScrollText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                System Prompt
              </h2>
              <p className="text-xs text-zinc-500">
                Defines how Nexus AI behaves across every conversation.
              </p>
            </div>
          </div>
          <button
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
          {/* Info banner */}
          <div className="flex items-start gap-2.5 rounded-xl border border-brand-400/30 bg-brand-500/[0.06] px-3.5 py-3 text-xs text-zinc-600 dark:text-zinc-300">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
            <p>
              The system prompt is sent as the highest-priority instruction to
              the model on every request. It shapes tone, format, depth, and
              rules — keeping responses consistent and aligned with your goals.
            </p>
          </div>

          {/* Presets */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Quick presets
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => apply(p.prompt)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    draft.trim() === p.prompt.trim()
                      ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300"
                      : "border-zinc-200 text-zinc-600 hover:border-brand-400 hover:text-brand-600 dark:border-white/10 dark:text-zinc-300"
                  )}
                >
                  <span>{p.emoji}</span>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Instructions
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-400">
                  {draft.length.toLocaleString()} chars
                </span>
                <button
                  onClick={() => apply(DEFAULT_SYSTEM_PROMPT)}
                  disabled={isDefault}
                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-brand-600 disabled:opacity-40 dark:hover:text-brand-300"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              </div>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Describe how Nexus AI should think, answer, and format its responses…"
              spellCheck={false}
              className="min-h-[240px] flex-1 resize-none rounded-xl border border-zinc-200 bg-white p-3.5 text-sm leading-relaxed text-zinc-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-100"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-zinc-200 px-5 py-3.5 dark:border-white/10">
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Sparkles className="h-3.5 w-3.5 text-brand-500" />
            Applies to all new responses
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={close}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                save();
                if (dirty) setTimeout(close, 400);
                else close();
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors",
                saved
                  ? "bg-emerald-500"
                  : "bg-gradient-to-r from-brand-500 to-brand-600 hover:opacity-90"
              )}
            >
              {saved ? (
                <>
                  <Check className="h-4 w-4" /> Saved
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
