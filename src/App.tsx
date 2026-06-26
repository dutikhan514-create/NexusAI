import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { ChatArea } from "@/components/ChatArea";
import { MessageInput } from "@/components/MessageInput";
import { SettingsModal } from "@/components/SettingsModal";
import { SystemPromptPanel } from "@/components/SystemPromptPanel";
import { cn } from "@/utils/cn";

export default function App() {
  const theme = useStore((s) => s.settings.theme);
  const conversations = useStore((s) => s.conversations);
  const activeId = useStore((s) => s.activeId);
  const selectConversation = useStore((s) => s.selectConversation);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const settingsOpen = useStore((s) => s.settingsOpen);
  const systemPromptOpen = useStore((s) => s.systemPromptOpen);

  // Apply theme to <html>.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    root.style.colorScheme = theme;
  }, [theme]);

  // If conversations exist but none is active, select the most recent.
  useEffect(() => {
    if (!activeId && conversations.length > 0) {
      selectConversation(conversations[0].id);
    }
  }, [activeId, conversations, selectConversation]);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-white text-zinc-900 dark:bg-[#0c0d11] dark:text-zinc-100">
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 border-r border-zinc-200 dark:border-white/5 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          sidebarOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200",
            sidebarOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => useStore.getState().setSidebarOpen(false)}
        />
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-[300px] max-w-[85vw] shadow-2xl transition-transform duration-300 ease-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Sidebar />
        </div>
      </div>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <ChatArea />
        <div className="shrink-0">
          <MessageInput />
        </div>
      </div>

      {/* Overlays */}
      {settingsOpen && <SettingsModal />}
      {systemPromptOpen && <SystemPromptPanel />}
    </div>
  );
}
