import { PanelLeft, Sun, Moon, SquarePen, Settings } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/utils/cn";

export function TopBar() {
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const theme = useStore((s) => s.settings.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const newChat = useStore((s) => s.newChat);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const activeTitle = useStore((s) => {
    const conv = s.conversations.find((c) => c.id === s.activeId);
    return conv?.title ?? "Nexus AI";
  });

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-zinc-200/70 bg-white/80 px-2.5 backdrop-blur-md dark:border-white/5 dark:bg-[#0c0d11]/80 sm:px-4">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10"
        aria-label="Toggle sidebar"
      >
        <PanelLeft className="h-5 w-5" />
      </button>

      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        {activeTitle}
      </h1>

      <div className="flex items-center gap-1">
        <button
          onClick={newChat}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10"
          aria-label="New chat"
          title="New chat"
        >
          <SquarePen className="h-5 w-5" />
        </button>
        <button
          onClick={toggleTheme}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10"
          )}
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10"
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
