"use client";

import { useEffect, useMemo, useState } from "react";

type CodeBlockProps = {
  source: string;
  fileName: string;
  compact?: boolean;
};

type Token = { text: string; className?: string };

// Keep portable artwork in the copied file without burying the readable code.
const embeddedAssetPattern = /data:[\w.+/-]+;base64,[A-Za-z0-9+/=]{256,}/g;

const tokenPattern =
  /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b(?:import|from|export|default|function|const|let|return|if|else|async|await|try|catch|finally|throw|new|type|interface|extends|typeof|keyof|as|void|true|false|null|undefined)\b)|(\b\d+(?:\.\d+)?\b)|(<\/?[A-Za-z][\w.]*)/g;

// Render tokens as React text nodes, so copied source never becomes executable HTML.
function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let cursor = 0;

  for (const match of source.matchAll(tokenPattern)) {
    const index = match.index ?? 0;
    if (index > cursor) tokens.push({ text: source.slice(cursor, index) });

    const className = match[1]
      ? "text-[#748195]"
      : match[2]
        ? "text-[#a9d5aa]"
        : match[3]
          ? "text-[#c5a5ee]"
          : match[4]
            ? "text-[#edbc84]"
            : "text-[#8abcf1]";

    tokens.push({ text: match[0], className });
    cursor = index + match[0].length;
  }

  if (cursor < source.length) tokens.push({ text: source.slice(cursor) });
  return tokens;
}

async function copyText(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Some embedded browsers deny clipboard access; try their legacy API.
    }
  }

  const previousFocus = document.activeElement;
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);

  try {
    field.select();
    if (!document.execCommand("copy")) throw new Error("Clipboard unavailable");
  } finally {
    field.remove();
    if (previousFocus instanceof HTMLElement) previousFocus.focus();
  }
}

export function CodeBlock({
  source,
  fileName,
  compact = false,
}: CodeBlockProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const [showEmbeddedAssets, setShowEmbeddedAssets] = useState(false);
  const foldedSource = useMemo(
    () => source.replace(embeddedAssetPattern, (asset) => {
      const size = Math.round(asset.length * 0.75 / 1024);
      return `${asset.slice(0, asset.indexOf(",") + 1)}[${size} KB embedded asset — included in copy/download]`;
    }),
    [source],
  );
  const hasEmbeddedAssets = foldedSource !== source;
  const tokens = useMemo(
    // Large base64 strings do not benefit from syntax highlighting.
    () => showEmbeddedAssets && hasEmbeddedAssets
      ? [{ text: source }]
      : tokenize(foldedSource),
    [source, foldedSource, showEmbeddedAssets, hasEmbeddedAssets],
  );

  useEffect(() => {
    if (copyState === "idle") return;
    const timeout = window.setTimeout(() => setCopyState("idle"), 3000);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  async function handleCopy() {
    try {
      await copyText(source);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  function handleDownload() {
    const url = URL.createObjectURL(
      new Blob([source], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#273041] bg-[#121720] text-[#d7dfec]">
      <div className="flex min-h-13 items-center justify-between gap-3 border-b border-white/8 px-4 sm:px-5">
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="rounded bg-[#273955] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[#97bbf6]">
            TSX
          </span>
          <span className="truncate font-mono text-xs text-[#abb7cb]">
            {fileName}
          </span>
        </span>
        <div className="flex shrink-0 items-center gap-2">
          {!compact && (
            <button
              type="button"
              onClick={handleDownload}
              aria-label={`Download ${fileName}`}
              title="Download component"
              className="grid size-8 place-items-center rounded-md text-[#abb7cb] transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#92acff]"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 3v12m-4-4 4 4 4-4M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-[#cbd4e3] transition hover:border-white/20 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#92acff] motion-reduce:transition-none"
            aria-label={`Copy ${fileName}`}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {copyState === "copied" ? (
                <path d="m5 12 4 4L19 6" />
              ) : (
                <>
                  <rect x="8" y="8" width="12" height="12" rx="2" />
                  <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
                </>
              )}
            </svg>
            {copyState === "copied" ? "Copied!" : "Copy code"}
          </button>
        </div>
      </div>
      {hasEmbeddedAssets && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/8 px-4 py-3 text-[11px] text-[#a9b6ca] sm:px-5">
          <span>Embedded assets folded. Copy and download include everything.</span>
          <button
            type="button"
            aria-expanded={showEmbeddedAssets}
            onClick={() => setShowEmbeddedAssets((value) => !value)}
            className="rounded text-[#afc7ff] underline decoration-white/20 underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#92acff]"
          >
            {showEmbeddedAssets ? "Fold assets" : "Show full source"}
          </button>
        </div>
      )}
      <pre
        tabIndex={0}
        aria-label={`${fileName} source code`}
        className={`${compact ? "max-h-72" : "max-h-[700px]"} overflow-auto p-4 font-mono text-[11px] leading-[1.9] [tab-size:2] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#92acff] sm:p-5 sm:text-xs`}
      >
        <code>
          {tokens.map((token, index) => (
            <span key={index} className={token.className}>
              {token.text}
            </span>
          ))}
        </code>
      </pre>
      <span
        aria-live="polite"
        className={
          copyState === "error"
            ? "block border-t border-white/8 px-5 py-3 text-xs text-[#ffb3ad]"
            : "sr-only"
        }
      >
        {copyState === "copied" && "Code copied to clipboard."}
        {copyState === "error" &&
          (hasEmbeddedAssets
            ? "Clipboard access is unavailable. Download the complete file, or show the full source to copy it manually."
            : "Clipboard access is unavailable. Select the code above and copy it manually.")}
      </span>
    </div>
  );
}
