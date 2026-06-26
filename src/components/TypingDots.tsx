import { cn } from "@/utils/cn";

/** Three bouncing dots used for the "thinking" state. */
export function TypingDots({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block h-2 w-2 rounded-full bg-gradient-to-br from-brand-400 to-accent-500"
          style={{
            animation: "var(--animate-bounce-dot)",
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
    </span>
  );
}

/** A compact inline shimmer bar. */
export function ShimmerLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-3 rounded-full bg-gradient-to-r from-transparent via-zinc-300/70 to-transparent dark:via-zinc-600/70",
        className
      )}
      style={{
        backgroundSize: "800px 100%",
        animation: "var(--animate-shimmer)",
      }}
    />
  );
}

/** Full "Nexus is thinking" block with animated bars. */
export function ThinkingBlock() {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-400/30 to-accent-500/30 blur-[6px]" />
        <span className="relative block h-5 w-5 rounded-full border-2 border-brand-400/40 border-t-brand-500" style={{ animation: "var(--animate-spin-slow)" }} />
      </div>
      <div className="flex flex-col gap-2 pt-1.5">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Nexus is thinking
        </span>
        <div className="flex w-44 flex-col gap-1.5">
          <ShimmerLine className="w-full" />
          <ShimmerLine className="w-4/5" />
          <ShimmerLine className="w-3/5" />
        </div>
      </div>
    </div>
  );
}
