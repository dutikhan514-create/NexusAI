import { useEffect, useState } from "react";
import {
  X,
  Eye,
  EyeOff,
  ExternalLink,
  Check,
  KeyRound,
  Cpu,
  Sliders,
  Sparkles,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import type { ProviderId } from "@/types";
import { useStore } from "@/store/useStore";
import { PROVIDERS, PROVIDER_ORDER } from "@/lib/providers";
import { cn } from "@/utils/cn";

type Tab = ProviderId | "general";

function ProviderTab({
  providerId,
  active,
  onClick,
}: {
  providerId: ProviderId;
  active: boolean;
  onClick: () => void;
}) {
  const meta = PROVIDERS[providerId];
  const cfg = useStore((s) => s.settings.providers[providerId]);
  const isActive = useStore((s) => s.settings.activeProvider === providerId);
  const ready = Boolean(cfg.apiKey.trim() && cfg.model.trim());

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
        active
          ? "bg-zinc-100 dark:bg-white/10"
          : "hover:bg-zinc-100/70 dark:hover:bg-white/5"
      )}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
        style={{ backgroundColor: meta.accent }}
      >
        {meta.name[0]}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="block truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
            {meta.name}
          </span>
          {isActive && (
            <span className="rounded-full bg-brand-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-brand-600 dark:text-brand-300">
              Active
            </span>
          )}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-zinc-400">
          {ready ? (
            <>
              <Check className="h-3 w-3 text-emerald-500" /> Ready
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3 text-amber-500" /> Needs setup
            </>
          )}
        </span>
      </span>
    </button>
  );
}

export function SettingsModal() {
  const settings = useStore((s) => s.settings);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const setActiveProvider = useStore((s) => s.setActiveProvider);
  const setProviderField = useStore((s) => s.setProviderField);
  const updateSettings = useStore((s) => s.updateSettings);

  const [tab, setTab] = useState<Tab>(settings.activeProvider);
  const [showKey, setShowKey] = useState(false);

  const close = () => setSettingsOpen(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        style={{ animation: "var(--animate-fade-in)" }}
        onClick={close}
      />

      {/* Panel */}
      <div
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-[#131419] sm:max-h-[85vh] sm:rounded-2xl"
        style={{ animation: "var(--animate-pop-in)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Settings & Providers
              </h2>
              <p className="text-xs text-zinc-500">
                Connect providers, choose models, and tune behaviour.
              </p>
            </div>
          </div>
          <button
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          {/* Tabs */}
          <div className="flex shrink-0 flex-col gap-1 overflow-x-auto border-b border-zinc-200 p-3 dark:border-white/10 sm:w-60 sm:border-b-0 sm:border-r">
            <p className="hidden px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 sm:block">
              Providers
            </p>
            {PROVIDER_ORDER.map((p) => (
              <ProviderTab
                key={p}
                providerId={p}
                active={tab === p}
                onClick={() => {
                  setTab(p);
                  setShowKey(false);
                }}
              />
            ))}
            <div className="my-1 hidden h-px bg-zinc-200 dark:bg-white/5 sm:block" />
            <button
              onClick={() => setTab("general")}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                tab === "general"
                  ? "bg-zinc-100 dark:bg-white/10"
                  : "hover:bg-zinc-100/70 dark:hover:bg-white/5"
              )}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-200 text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                <Cpu className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                General
              </span>
            </button>
          </div>

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {tab === "general" ? (
              <GeneralPanel />
            ) : (
              <ProviderPanel
                providerId={tab}
                settings={settings}
                setActiveProvider={setActiveProvider}
                setProviderField={setProviderField}
                updateSettings={updateSettings}
                showKey={showKey}
                setShowKey={setShowKey}
                onGoGeneral={() => setTab("general")}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ProviderPanel({
  providerId,
  settings,
  setActiveProvider,
  setProviderField,
  showKey,
  setShowKey,
  onGoGeneral,
}: {
  providerId: ProviderId;
  settings: ReturnType<typeof useStore.getState>["settings"];
  setActiveProvider: (p: ProviderId) => void;
  setProviderField: (p: ProviderId, field: "apiKey" | "model", value: string) => void;
  updateSettings: (partial: Partial<typeof settings>) => void;
  showKey: boolean;
  setShowKey: (b: boolean) => void;
  onGoGeneral: () => void;
}) {
  const meta = PROVIDERS[providerId];
  const cfg = settings.providers[providerId];
  const isActive = settings.activeProvider === providerId;

  return (
    <div className="flex flex-col gap-6">
      {/* Provider header */}
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white"
          style={{ backgroundColor: meta.accent }}
        >
          {meta.name[0]}
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {meta.name}
          </h3>
          <p className="text-sm text-zinc-500">{meta.tagline}</p>
        </div>
      </div>

      {/* API key */}
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
          <KeyRound className="h-4 w-4 text-zinc-400" /> API Key
        </label>
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={cfg.apiKey}
            onChange={(e) => setProviderField(providerId, "apiKey", e.target.value)}
            placeholder={`Paste your ${meta.name} API key`}
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 pr-11 text-sm text-zinc-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10"
            aria-label={showKey ? "Hide key" : "Show key"}
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <a
            href={meta.keyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-300"
          >
            Get a {meta.name} API key <ExternalLink className="h-3 w-3" />
          </a>
          {cfg.apiKey ? (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Stored locally only
            </span>
          ) : null}
        </div>
      </div>

      {/* Model */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            <Cpu className="h-4 w-4 text-zinc-400" /> Model
          </label>
          <button
            onClick={() => setProviderField(providerId, "model", meta.recommended)}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-300"
          >
            <Sparkles className="h-3 w-3" /> Use recommended
          </button>
        </div>
        <input
          type="text"
          value={cfg.model}
          onChange={(e) => setProviderField(providerId, "model", e.target.value)}
          placeholder={meta.modelPlaceholder}
          spellCheck={false}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-100"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {meta.models.map((m) => (
            <button
              key={m}
              onClick={() => setProviderField(providerId, "model", m)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                cfg.model === m
                  ? "border-brand-500 bg-brand-500/10 font-medium text-brand-600 dark:text-brand-300"
                  : "border-zinc-200 text-zinc-600 hover:border-brand-400 hover:text-brand-600 dark:border-white/10 dark:text-zinc-300"
              )}
            >
              {m}
              {m === meta.recommended && (
                <span className="ml-1 text-[9px] text-brand-500">★</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Activate */}
      <button
        onClick={() => {
          setActiveProvider(providerId);
          onGoGeneral();
        }}
        disabled={isActive}
        className={cn(
          "flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
          isActive
            ? "cursor-default bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:opacity-90"
        )}
      >
        {isActive ? (
          <>
            <Check className="h-4 w-4" /> Active provider
          </>
        ) : (
          <>Set as active provider</>
        )}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function GeneralPanel() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const toggleTheme = useStore((s) => s.toggleTheme);

  return (
    <div className="flex flex-col gap-7">
      {/* Appearance */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Appearance
        </h3>
        <div className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 dark:border-white/10">
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Theme
            </p>
            <p className="text-xs text-zinc-500">
              Currently in {settings.theme} mode
            </p>
          </div>
          <div className="flex rounded-lg bg-zinc-100 p-1 dark:bg-white/5">
            {(["light", "dark"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  if (settings.theme !== t) toggleTheme();
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  settings.theme === t
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Generation */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Generation
        </h3>

        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Temperature
            </label>
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
              {settings.temperature.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={settings.temperature}
            onChange={(e) =>
              updateSettings({ temperature: parseFloat(e.target.value) })
            }
            className="nexus-range w-full"
          />
          <p className="mt-1 text-xs text-zinc-400">
            Lower = focused & deterministic · Higher = creative & varied
          </p>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Max output tokens
            </label>
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
              {settings.maxTokens}
            </span>
          </div>
          <input
            type="range"
            min={256}
            max={8192}
            step={256}
            value={settings.maxTokens}
            onChange={(e) =>
              updateSettings({ maxTokens: parseInt(e.target.value, 10) })
            }
            className="nexus-range w-full"
          />
          <p className="mt-1 text-xs text-zinc-400">
            Maximum length of each response.
          </p>
        </div>
      </section>

      {/* Active model summary */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Active configuration
        </h3>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{ backgroundColor: PROVIDERS[settings.activeProvider].accent }}
            >
              {PROVIDERS[settings.activeProvider].name[0]}
            </span>
            <div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                {PROVIDERS[settings.activeProvider].name}
              </p>
              <p className="font-mono text-xs text-zinc-500">
                {settings.providers[settings.activeProvider].model || "no model"}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
