import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Paperclip,
  Square,
  X,
  FileText,
  Image as ImageIcon,
  AlertTriangle,
  SlidersHorizontal,
} from "lucide-react";
import type { Attachment } from "@/types";
import { useStore } from "@/store/useStore";
import { processFiles, formatBytes, getExtension } from "@/lib/files";
import { providerReady } from "@/lib/api";
import { PROVIDERS } from "@/lib/providers";
import { cn } from "@/utils/cn";

export function MessageInput() {
  const sendMessage = useStore((s) => s.sendMessage);
  const stop = useStore((s) => s.stop);
  const isStreaming = useStore((s) => s.isStreaming);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const activeProvider = useStore((s) => s.settings.activeProvider);
  const activeModel = useStore(
    (s) => s.settings.providers[s.settings.activeProvider].model
  );
  const activeCfg = useStore(
    (s) => s.settings.providers[s.settings.activeProvider]
  );
  const ready = providerReady(activeCfg);

  const composePrompt = useStore((s) => s.composePrompt);
  const setComposePrompt = useStore((s) => s.setComposePrompt);

  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 220) + "px";
  }, [text]);

  // Pre-fill composer from suggestion cards / external triggers.
  useEffect(() => {
    if (composePrompt) {
      setText(composePrompt);
      setComposePrompt("");
      requestAnimationFrame(() => {
        const ta = taRef.current;
        if (ta) {
          ta.focus();
          ta.style.height = "auto";
          ta.style.height = Math.min(ta.scrollHeight, 220) + "px";
        }
      });
    }
  }, [composePrompt, setComposePrompt]);

  const handleFiles = async (files: FileList | File[]) => {
    setWarning(null);
    const { attachments: atts, warnings } = await processFiles(files);
    setAttachments((prev) => [...prev, ...atts]);
    if (warnings.length) setWarning(warnings[0]);
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files);
    if (files.length) {
      e.preventDefault();
      handleFiles(files);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) handleFiles(files);
  };

  const submit = () => {
    if (isStreaming) return;
    const content = text.trim();
    if (!content && attachments.length === 0) return;
    void sendMessage(content, attachments);
    setText("");
    setAttachments([]);
    setWarning(null);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const removeAttachment = (id: string) =>
    setAttachments((prev) => prev.filter((a) => a.id !== id));

  const meta = PROVIDERS[activeProvider];

  return (
    <div className="mx-auto w-full max-w-3xl px-3 pb-3 sm:px-4 sm:pb-4">
      {/* Warning */}
      {warning && (
        <div className="mb-2 flex items-start gap-2 rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">{warning}</span>
          <button onClick={() => setWarning(null)} className="shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Pending attachments */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((a) => (
            <div
              key={a.id}
              className="group/att relative flex items-center gap-2 rounded-xl border border-zinc-200 bg-white py-1.5 pl-1.5 pr-2.5 dark:border-white/10 dark:bg-zinc-900"
            >
              {a.isImage && a.dataUrl ? (
                <img
                  src={a.dataUrl}
                  alt={a.name}
                  className="h-9 w-9 rounded-lg object-cover"
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-300">
                  {a.isText ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                </span>
              )}
              <span className="flex max-w-[140px] flex-col leading-tight">
                <span className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-200">
                  {a.name}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-zinc-400">
                  {a.isImage ? "image" : getExtension(a.name) || "file"} ·{" "}
                  {formatBytes(a.size)}
                </span>
              </span>
              <button
                onClick={() => removeAttachment(a.id)}
                className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-zinc-600 transition hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                aria-label={`Remove ${a.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!ready && (
        <button
          onClick={() => setSettingsOpen(true)}
          className="mb-2 flex w-full items-center gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-3.5 py-2.5 text-left text-xs text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/15"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            <span className="font-semibold">
              {PROVIDERS[activeProvider].name} isn't configured yet.
            </span>{" "}
            {activeCfg.apiKey.trim()
              ? "Choose a model to continue."
              : "Add your API key to start chatting."}
          </span>
          <span className="shrink-0 font-semibold underline">Open settings</span>
        </button>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "relative flex flex-col rounded-[26px] border bg-white shadow-sm transition-all dark:bg-[#1a1b1f]",
          dragging
            ? "border-brand-500 ring-2 ring-brand-500/30"
            : "border-zinc-200 dark:border-white/10"
        )}
      >
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          rows={1}
          placeholder="Message Nexus AI…  (Shift+Enter for new line)"
          className="max-h-[220px] w-full resize-none bg-transparent px-4 pb-1 pt-3.5 text-[0.95rem] leading-relaxed text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
        />

        <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5 pt-1">
          <div className="flex items-center gap-1">
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              title="Attach files, images, or code"
              className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
            >
              <Paperclip className="h-[18px] w-[18px]" />
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
              title="Model & provider settings"
              className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/10"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="max-w-[150px] truncate">
                {meta.name} · {activeModel || "select model"}
              </span>
            </button>
          </div>

          {isStreaming ? (
            <button
              onClick={stop}
              title="Stop generating"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-white transition hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-white"
            >
              <Square className="h-4 w-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!text.trim() && attachments.length === 0}
              title="Send"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-sm transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      <p className="mt-2 text-center text-[11px] text-zinc-400">
        Nexus AI can make mistakes. Verify important information and review
        generated code before use.
      </p>
    </div>
  );
}
