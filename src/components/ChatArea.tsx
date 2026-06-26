import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { useStore } from "@/store/useStore";
import { ChatMessage } from "./ChatMessage";
import { WelcomeScreen } from "./WelcomeScreen";
import { cn } from "@/utils/cn";

export function ChatArea() {
  const conversation = useStore((s) =>
    s.conversations.find((c) => c.id === s.activeId) ?? null
  );
  const isStreaming = useStore((s) => s.isStreaming);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const messages = conversation?.messages ?? [];
  const hasMessages = messages.length > 0;

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distance < 140;
    stickToBottom.current = nearBottom;
    setShowScrollBtn(hasMessages && !nearBottom);
  };

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior });
  };

  useLayoutEffect(() => {
    if (stickToBottom.current) scrollToBottom();
  }, [messages.length, isStreaming]);

  useEffect(() => {
    if (!isStreaming) return;
    const id = setInterval(() => {
      if (stickToBottom.current) scrollToBottom();
    }, 120);
    return () => clearInterval(id);
  }, [isStreaming]);

  useEffect(() => {
    stickToBottom.current = true;
    setShowScrollBtn(false);
    scrollToBottom();
  }, [conversation?.id]);

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="h-full overflow-y-auto"
      >
        {!hasMessages ? (
          <WelcomeScreen />
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-3 py-6 sm:px-4 sm:py-8">
            {messages.map((m) => (
              <ChatMessage key={m.id} message={m} />
            ))}
            <div ref={bottomRef} className="h-1" />
          </div>
        )}
      </div>

      {/* Scroll to bottom */}
      <button
        onClick={() => {
          stickToBottom.current = true;
          scrollToBottom("smooth");
        }}
        className={cn(
          "absolute bottom-4 left-1/2 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-lg transition-all hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700",
          showScrollBtn
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0"
        )}
        aria-label="Scroll to bottom"
      >
        <ArrowDown className="h-4 w-4" />
      </button>
    </div>
  );
}
