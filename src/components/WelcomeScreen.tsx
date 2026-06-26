import {
  Code2,
  Sparkles,
  Search,
  FileSearch,
  Wand2,
} from "lucide-react";
import { Logo } from "./Logo";
import { useStore } from "@/store/useStore";

interface Suggestion {
  icon: React.ReactNode;
  title: string;
  prompt: string;
  accent: string;
}

const SUGGESTIONS: Suggestion[] = [
  {
    icon: <Code2 className="h-5 w-5" />,
    title: "Build a complete project",
    prompt:
      "Build a complete, production-ready React + TypeScript todo application with drag-and-drop reordering, local persistence, and a clean UI. Give me every file with full implementation.",
    accent: "from-blue-500/15 to-blue-500/5 text-blue-500",
  },
  {
    icon: <Search className="h-5 w-5" />,
    title: "Deep research & analysis",
    prompt:
      "Give me a structured, in-depth comparison of PostgreSQL vs MongoDB for a high-write analytics workload, covering data model, indexing, scaling, consistency, and cost.",
    accent: "from-violet-500/15 to-violet-500/5 text-violet-500",
  },
  {
    icon: <FileSearch className="h-5 w-5" />,
    title: "Analyze a file or image",
    prompt:
      "I'll attach a source file — please review it for bugs, performance issues, and security risks, then provide a refactored, fully-rewritten version with explanations.",
    accent: "from-emerald-500/15 to-emerald-500/5 text-emerald-500",
  },
  {
    icon: <Wand2 className="h-5 w-5" />,
    title: "Explain a concept",
    prompt:
      "Explain how JWT authentication works end-to-end, including refresh tokens, with a complete Node.js + Express implementation and clear diagrams using ASCII art.",
    accent: "from-fuchsia-500/15 to-fuchsia-500/5 text-fuchsia-500",
  },
];

export function WelcomeScreen() {
  const setComposePrompt = useStore((s) => s.setComposePrompt);
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl text-center">
        <div className="mb-6 flex justify-center" style={{ animation: "var(--animate-pop-in)" }}>
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-brand-400/30 to-accent-500/30 blur-2xl" />
            <Logo size={64} className="relative drop-shadow-lg" />
          </div>
        </div>

        <h1
          className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl"
          style={{ animation: "var(--animate-fade-up)" }}
        >
          <span className="text-gradient">{greeting}</span>
          <span className="text-zinc-900 dark:text-zinc-100">. How can I help?</span>
        </h1>
        <p
          className="mx-auto mt-3 max-w-xl text-[0.95rem] text-zinc-500 dark:text-zinc-400"
          style={{ animation: "var(--animate-fade-up)", animationDelay: "60ms" }}
        >
          Your advanced AI partner for{" "}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            coding
          </span>
          ,{" "}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            research
          </span>
          , and{" "}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            file understanding
          </span>
          . Ask anything, or start with one of these.
        </p>

        <div className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={s.title}
              onClick={() => setComposePrompt(s.prompt)}
              className="group flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white/70 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-brand-400/50 hover:shadow-md dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-brand-400/40"
              style={{
                animation: "var(--animate-fade-up)",
                animationDelay: `${120 + i * 70}ms`,
              }}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${s.accent}`}
              >
                {s.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                  {s.title}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-xs text-zinc-500 dark:text-zinc-400">
                  {s.prompt}
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-brand-500" /> Multi-provider
            (OpenRouter · Gemini · Groq · Claude)
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-zinc-300 sm:block dark:bg-zinc-600" />
          <span>Custom System Prompt</span>
          <span className="hidden h-1 w-1 rounded-full bg-zinc-300 sm:block dark:bg-zinc-600" />
          <span>File & Image Understanding</span>
        </div>
      </div>
    </div>
  );
}
