import { memo, useMemo, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy } from "lucide-react";
import { cn } from "@/utils/cn";

/** Recursively extract plain text from React children (for copy-to-clipboard). */
function textFromChildren(node: ReactNode): string {
  if (node == null || node === false) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromChildren).join("");
  if (typeof node === "object" && "props" in node) {
    // @ts-expect-error runtime inspection of react element props
    return textFromChildren(node.props?.children);
  }
  return "";
}

function CodeBlock({
  language,
  className,
  children,
}: {
  language: string;
  className?: string;
  children: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const raw = useMemo(() => textFromChildren(children).replace(/\n$/, ""), [children]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="group/code my-4 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-[#0f1015]">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-100/70 px-3.5 py-1.5 dark:border-white/10 dark:bg-white/[0.03]">
        <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {language || "code"}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-zinc-200/70 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

interface MarkdownProps {
  content: string;
  className?: string;
}

function MarkdownImpl({ content, className }: MarkdownProps) {
  return (
    <div className={cn("prose-nexus", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { ignoreMissing: true, detect: true }]]}
        components={{
          code(props) {
            const { children, className, node, ...rest } = props as {
              children?: ReactNode;
              className?: string;
              node?: unknown;
            };
            void node;
            const match = /language-(\w+)/.exec(className || "");
            const text = textFromChildren(children);
            const isBlock = Boolean(match) || text.includes("\n");
            if (isBlock) {
              return (
                <CodeBlock language={match?.[1] ?? ""} className={className}>
                  {children}
                </CodeBlock>
              );
            }
            return (
              <code className={className} {...rest}>
                {children}
              </code>
            );
          },
          a({ children, ...props }) {
            return (
              <a target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto">
                <table>{children}</table>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export const Markdown = memo(MarkdownImpl, (a, b) => a.content === b.content);
