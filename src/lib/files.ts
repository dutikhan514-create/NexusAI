import type { Attachment } from "@/types";
import { uid } from "./storage";

/** Textual MIME prefixes & extensions we can read directly. */
const TEXT_EXTENSIONS = [
  "txt",
  "md",
  "markdown",
  "mdx",
  "json",
  "json5",
  "yaml",
  "yml",
  "toml",
  "ini",
  "cfg",
  "conf",
  "csv",
  "tsv",
  "log",
  "env",
  "gitignore",
  "html",
  "htm",
  "css",
  "scss",
  "sass",
  "less",
  "js",
  "jsx",
  "ts",
  "tsx",
  "mjs",
  "cjs",
  "vue",
  "svelte",
  "py",
  "rb",
  "php",
  "go",
  "rs",
  "java",
  "kt",
  "swift",
  "c",
  "h",
  "cpp",
  "cc",
  "cxx",
  "hpp",
  "hxx",
  "cs",
  "scala",
  "clj",
  "ex",
  "exs",
  "erl",
  "lua",
  "pl",
  "pm",
  "r",
  "jl",
  "dart",
  "gradle",
  "groovy",
  "sh",
  "bash",
  "zsh",
  "fish",
  "ps1",
  "bat",
  "cmd",
  "sql",
  "graphql",
  "gql",
  "prisma",
  "dockerfile",
  "makefile",
  "xml",
  "svg",
  "graphqls",
  "proto",
  "tf",
  "hcl",
  "nim",
  "hs",
  "ml",
  "asm",
  "v",
  "zig",
];

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "bmp"];

export function getExtension(name: string): string {
  const clean = name.toLowerCase().replace(/^.*[\\/]/, "");
  const dot = clean.lastIndexOf(".");
  if (dot === -1) return clean; // allow "Dockerfile", "Makefile"
  return clean.slice(dot + 1);
}

export function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

export function isTextMime(mime: string): boolean {
  return (
    mime.startsWith("text/") ||
    mime === "application/json" ||
    mime === "application/xml" ||
    mime === "application/javascript" ||
    mime === "application/typescript" ||
    mime === "application/x-yaml" ||
    mime === "application/x-sh" ||
    mime === "application/graphql"
  );
}

/** Best-effort guess whether a file is readable text. */
export function looksLikeText(file: File): boolean {
  if (file.type && isTextMime(file.type)) return true;
  if (isImageMime(file.type)) return false;
  const ext = getExtension(file.name);
  return TEXT_EXTENSIONS.includes(ext);
}

export function looksLikeImage(file: File): boolean {
  if (file.type && isImageMime(file.type)) return true;
  const ext = getExtension(file.name);
  return IMAGE_EXTENSIONS.includes(ext);
}

const MAX_TEXT_BYTES = 1_200_000; // ~1.2 MB of text
const MAX_IMAGE_BYTES = 9_000_000; // ~9 MB for base64 images

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
    reader.readAsText(file);
  });
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
    reader.readAsDataURL(file);
  });
}

export interface ProcessResult {
  attachment: Attachment;
  warning?: string;
}

/**
 * Convert a File into a structured Attachment, extracting text or base64
 * image data as appropriate.
 */
export async function processFile(file: File): Promise<ProcessResult> {
  const isImage = looksLikeImage(file);
  const isText = !isImage && looksLikeText(file);

  const base: Attachment = {
    id: uid("att_"),
    name: file.name || "untitled",
    mime: file.type || "application/octet-stream",
    size: file.size,
    isText,
    isImage,
  };

  if (isImage) {
    if (file.size > MAX_IMAGE_BYTES) {
      return {
        attachment: base,
        warning: `“${base.name}” is ${formatBytes(
          file.size
        )} — large images may be rejected by the provider.`,
      };
    }
    const dataUrl = await readFileAsDataURL(file);
    return { attachment: { ...base, dataUrl } };
  }

  if (isText) {
    if (file.size > MAX_TEXT_BYTES) {
      const text = (await readFileAsText(file)).slice(0, MAX_TEXT_BYTES);
      return {
        attachment: { ...base, text },
        warning: `“${base.name}” was truncated to the first ${formatBytes(
          MAX_TEXT_BYTES
        )}.`,
      };
    }
    const text = await readFileAsText(file);
    return { attachment: { ...base, text } };
  }

  // Binary file we cannot parse as text (PDF, zip, etc.)
  return {
    attachment: base,
    warning: `“${base.name}” is a binary ${base.mime} file and cannot be read as text. Its name and size were attached; upload a text/HTML/image variant for full analysis.`,
  };
}

export async function processFiles(files: FileList | File[]): Promise<{
  attachments: Attachment[];
  warnings: string[];
}> {
  const list = Array.from(files);
  const results = await Promise.all(list.map(processFile));
  return {
    attachments: results.map((r) => r.attachment),
    warnings: results.map((r) => r.warning).filter(Boolean) as string[],
  };
}
