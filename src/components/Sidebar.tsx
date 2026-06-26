import { memo, useMemo, useState } from "react";
import {
  Plus,
  Search,
  MessageSquare,
  Settings,
  ScrollText,
  Trash2,
  Pencil,
  Pin,
  PinOff,
  Check,
  X,
  PanelLeftClose,
} from "lucide-react";
import { LogoWordmark } from "./Logo";
import { useStore } from "@/store/useStore";
import { cn } from "@/utils/cn";

function ConversationItemImpl({
  id,
  title,
  active,
  pinned,
}: {
  id: string;
  title: string;
  active: boolean;
  pinned?: boolean;
}) {
  const selectConversation = useStore((s) => s.selectConversation);
  const deleteConversation = useStore((s) => s.deleteConversation);
  const renameConversation = useStore((s) => s.renameConversation);
  const togglePin = useStore((s) => s.togglePin);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  const commit = () => {
    renameConversation(id, draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1.5 dark:bg-white/5">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(title);
              setEditing(false);
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-sm text-zinc-800 outline-none dark:text-zinc-100"
        />
        <button
          onClick={commit}
          className="text-emerald-500 hover:opacity-80"
          aria-label="Save name"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            setDraft(title);
            setEditing(false);
          }}
          className="text-zinc-400 hover:opacity-80"
          aria-label="Cancel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex items-center rounded-lg transition-colors",
        active
          ? "bg-zinc-200/80 dark:bg-white/10"
          : "hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
      )}
    >
      <button
        onClick={() => selectConversation(id)}
        className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-left"
      >
        <MessageSquare
          className={cn(
            "h-4 w-4 shrink-0",
            active ? "text-brand-500" : "text-zinc-400"
          )}
        />
        <span
          className={cn(
            "truncate text-sm",
            active
              ? "font-medium text-zinc-900 dark:text-zinc-100"
              : "text-zinc-600 dark:text-zinc-300"
          )}
        >
          {title}
        </span>
        {pinned && (
          <Pin className="h-3 w-3 shrink-0 fill-current text-brand-500" />
        )}
      </button>

      <div className="flex shrink-0 items-center pr-1.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        <button
          onClick={() => togglePin(id)}
          title={pinned ? "Unpin" : "Pin"}
          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
        >
          {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={() => {
            setDraft(title);
            setEditing(true);
          }}
          title="Rename"
          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => deleteConversation(id)}
          title="Delete"
          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

const ConversationItem = memo(ConversationItemImpl);

export function Sidebar() {
  const conversations = useStore((s) => s.conversations);
  const activeId = useStore((s) => s.activeId);
  const newChat = useStore((s) => s.newChat);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const setSystemPromptOpen = useStore((s) => s.setSystemPromptOpen);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const clearAll = useStore((s) => s.clearAll);

  const [query, setQuery] = useState("");

  const { pinned, recent } = useMemo(() => {
    const filtered = conversations.filter((c) =>
      c.title.toLowerCase().includes(query.trim().toLowerCase())
    );
    const sorted = [...filtered].sort((a, b) => b.updatedAt - a.updatedAt);
    return {
      pinned: sorted.filter((c) => c.pinned),
      recent: sorted.filter((c) => !c.pinned),
    };
  }, [conversations, query]);

  const isEmpty = conversations.length === 0;

  return (
    <div className="flex h-full w-full flex-col bg-zinc-50 dark:bg-[#0a0b0e]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3">
        <LogoWordmark />
        <button
          onClick={() => setSidebarOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/10 lg:hidden"
          aria-label="Close sidebar"
        >
          <PanelLeftClose className="h-5 w-5" />
        </button>
      </div>

      {/* New chat */}
      <div className="px-3 pt-3">
        <button
          onClick={newChat}
          className="flex w-full items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:border-brand-400/50"
        >
          <Plus className="h-4 w-4" />
          New chat
        </button>
      </div>

      {/* Search */}
      {!isEmpty && (
        <div className="px-3 pt-3">
          <div className="flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 dark:bg-white/5">
            <Search className="h-4 w-4 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats"
              className="w-full bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400 dark:text-zinc-200"
            />
          </div>
        </div>
      )}

      {/* List */}
      <div className="mt-3 flex-1 overflow-y-auto px-2 pb-2">
        {isEmpty ? (
          <div className="px-3 py-10 text-center text-sm text-zinc-400">
            No conversations yet.
            <br />
            Start by sending a message.
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {pinned.length > 0 && (
              <>
                <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Pinned
                </div>
                {pinned.map((c) => (
                  <ConversationItem
                    key={c.id}
                    id={c.id}
                    title={c.title}
                    active={c.id === activeId}
                    pinned
                  />
                ))}
                <div className="my-1 px-3">
                  <div className="h-px bg-zinc-200 dark:bg-white/5" />
                </div>
              </>
            )}
            {recent.length > 0 && (
              <>
                {pinned.length === 0 && (
                  <div className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Recent
                  </div>
                )}
                {recent.map((c) => (
                  <ConversationItem
                    key={c.id}
                    id={c.id}
                    title={c.title}
                    active={c.id === activeId}
                  />
                ))}
              </>
            )}
            {pinned.length === 0 && recent.length === 0 && (
              <div className="px-3 py-8 text-center text-sm text-zinc-400">
                No matches for “{query}”.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-200 p-2 dark:border-white/5">
        <button
          onClick={() => setSystemPromptOpen(true)}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06]"
        >
          <ScrollText className="h-4 w-4 text-brand-500" />
          System Prompt
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06]"
        >
          <Settings className="h-4 w-4 text-brand-500" />
          Settings & Providers
        </button>
        {!isEmpty && (
          <button
            onClick={() => {
              if (confirm("Delete ALL conversations? This cannot be undone.")) {
                clearAll();
              }
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
            Clear all chats
          </button>
        )}
      </div>
    </div>
  );
}
