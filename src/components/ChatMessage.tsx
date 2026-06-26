import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Pencil,
  RefreshCw,
  Sparkles,
  User,
  FileText,
  Image as ImageIcon,
  X,
} from "lucide-react";
import type { Attachment, Message } from "@/types";
import { useStore } from "@/store/useStore";
import { Markdown } from "./Markdown";
import { ThinkingBlock } from "./TypingDots";
import { formatBytes } from "@/lib/files";
import { cn } from "@/utils/cn";

function AttachmentChip({ att }: { att: Attachment }) {
  if (att.isImage && att.dataUrl) {
    return (
      <a
        href={att.dataUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group/img relative block overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-900"
      >
        <img
          src={att.dataUrl}
          alt={att.name}
          className="h-28 w-28 object-cover transition group-hover/img:scale-105"
        />
        <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-[10px] text-white opacity-0 transition group-hover/img:opacity-100">
          {att.name}
        </span>
      </a>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs dark:border-white/10 dark:bg-zinc-900">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-300">
        {att.isText ? <FileText className="h-4 w-4" /> : <FileIcon />}
      </span>
      <span className="flex flex-col">
        <span className="max-w-[160px] truncate font-medium text-zinc-700 dark:text-zinc-200">
          {att.name}
        </span>
        <span className="text-[10px] text-zinc-400">{formatBytes(att.size)}</span>
      </span>
    </div>
  );
}

function FileIcon() {
  return <ImageIcon className="h-4 w-4" />;
}

function ActionButton({
  label,
  onClick,
  children,
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-200/70 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
    >
      {children}
    </button>
  );
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const editUserMessage = useStore((s) => s.editUserMessage);
  const regenerate = useStore((s) => s.regenerate);
  const isStreaming = useStore((s) => s.isStreaming);

  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && taRef.current) {
      taRef.current.focus();
      taRef.current.style.height = "auto";
      taRef.current.style.height = taRef.current.scrollHeight + "px";
    }
  }, [editing]);

  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const saveEdit = () => {
    const next = draft.trim();
    if (!next) return;
    setEditing(false);
    editUserMessage(message.id, next);
  };

  const cancelEdit = () => {
    setDraft(message.content);
    setEditing(false);
  };

  const isUser = message.role === "user";
  const isEmptyStreaming =
    message.role === "assistant" && message.streaming && !message.content;

  return (
    <div
      className={cn(
        "group msg group flex w-full gap-3 sm:gap-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
      style={{ animation: "var(--animate-fade-up)" }}
    >
      {/* Avatar */}
      <div className="flex shrink-0 flex-col items-center pt-0.5">
        {isUser ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-200">
            <User className="h-4 w-4" />
          </div>
        ) : (
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-accent-500 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Body */}
      <div
        className={cn(
          "flex min-w-0 max-w-[calc(100%-3rem)] flex-col gap-1.5",
          isUser ? "items-end" : "items-start"
        )}
      >
        {isUser && (
          <span className="text-[11px] font-medium text-zinc-400">You</span>
        )}
        {!isUser && message.model && (
          <span className="text-[11px] font-medium text-zinc-400">
            Nexus · {message.model}
          </span>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div
            className={cn(
              "flex flex-wrap gap-2",
              isUser ? "justify-end" : "justify-start"
            )}
          >
            {message.attachments.map((a) => (
              <AttachmentChip key={a.id} att={a} />
            ))}
          </div>
        )}

        {/* Content */}
        {isUser ? (
          editing ? (
            <div className="w-full max-w-2xl">
              <textarea
                ref={taRef}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
                className="max-h-72 w-full resize-none rounded-2xl border border-brand-400/60 bg-white p-3 text-sm leading-relaxed text-zinc-800 shadow-sm outline-none focus:border-brand-500 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10"
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                  <span className="hidden text-[10px] text-zinc-400 sm:inline">
                    Esc
                  </span>
                </button>
                <button
                  onClick={saveEdit}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90"
                >
                  <Check className="h-3.5 w-3.5" /> Save &amp; Send
                  <span className="hidden text-[10px] text-white/70 sm:inline">
                    ⌘↵
                  </span>
                </button>
              </div>
            </div>
          ) : (
            message.content && (
              <div
                className={cn(
                  "whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[0.95rem] leading-relaxed",
                  "bg-brand-500/[0.07] text-zinc-800 dark:bg-brand-500/[0.12] dark:text-zinc-100"
                )}
              >
                {message.content}
              </div>
            )
          )
        ) : isEmptyStreaming ? (
          <ThinkingBlock />
        ) : (
          <div className="min-w-0">
            <Markdown content={message.content} />
            {message.streaming && (
              <span className="ml-0.5 inline-block h-4 w-[7px] -translate-y-[2px] animate-pulse rounded-[1px] bg-brand-500 align-middle" />
            )}
          </div>
        )}

        {/* Error note styling already inline; actions */}
        {!editing && (
          <div
            className={cn(
              "mt-1 flex items-center gap-0.5 transition-opacity",
              "opacity-0 focus-within:opacity-100 group-hover:opacity-100",
              isUser ? "flex-row-reverse" : "flex-row"
            )}
          >
            <ActionButton label="Copy" onClick={copyContent}>
              {copied ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </ActionButton>
            {isUser ? (
              <ActionButton
                label="Edit prompt"
                onClick={() => {
                  setDraft(message.content);
                  setEditing(true);
                }}
                disabled={isStreaming}
              >
                <Pencil className="h-4 w-4" />
              </ActionButton>
            ) : (
              <ActionButton
                label="Regenerate response"
                onClick={() => regenerate(message.id)}
                disabled={isStreaming}
              >
                <RefreshCw className="h-4 w-4" />
              </ActionButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
