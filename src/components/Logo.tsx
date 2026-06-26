import { cn } from "@/utils/cn";

interface LogoProps {
  size?: number;
  className?: string;
  /** When true, render as a monochrome currentColor icon (for compact UI). */
  mono?: boolean;
}

/**
 * Nexus AI logo — a faceted diamond "nexus" node with orbiting accent,
 * rendered as crisp inline SVG so it scales perfectly.
 */
export function Logo({ size = 36, className, mono = false }: LogoProps) {
  const id = mono ? "nexus-mono" : "nexus-grad";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="Nexus AI logo"
    >
      <defs>
        {mono ? (
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="currentColor" />
            <stop offset="1" stopColor="currentColor" />
          </linearGradient>
        ) : (
          <linearGradient id={id} x1="4" y1="4" x2="44" y2="44">
            <stop offset="0" stopColor="#4f8cff" />
            <stop offset="0.5" stopColor="#7c5cff" />
            <stop offset="1" stopColor="#e84cef" />
          </linearGradient>
        )}
      </defs>
      <rect width="48" height="48" rx="13" fill={`url(#${id})`} />
      {/* Faceted diamond */}
      <path
        d="M24 10 L36 24 L24 38 L12 24 Z"
        fill="none"
        stroke="white"
        strokeWidth="2.4"
        strokeLinejoin="round"
        opacity="0.95"
      />
      <path
        d="M24 10 L24 38 M12 24 L36 24"
        stroke="white"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="24" cy="24" r="4.6" fill="white" />
    </svg>
  );
}

/** A compact wordmark combining the logo + gradient text. */
export function LogoWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Logo size={30} />
      <div className="leading-none">
        <span className="text-[1.15rem] font-semibold tracking-tight text-gradient">
          Nexus
        </span>
        <span className="ml-1 text-[1.15rem] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          AI
        </span>
      </div>
    </div>
  );
}
