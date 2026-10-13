"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";

type Snippet = { id: string; label: string; code: string };
type Result = { kind: "output" | "error"; text: string };

const SNIPPETS: Snippet[] = [
  {
    id: "greet",
    label: "greet",
    code: `function greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet("you"));`,
  },
  {
    id: "stack",
    label: "stack",
    code: `const frontend = ["React", "Next.js", "TypeScript"];\nconst backend = ["Node.js", "REST", "MongoDB"];\n\nconsole.log("♥", frontend.join(" · "));\nconsole.log("⚙", backend.join(" · "));`,
  },
  {
    id: "hire",
    label: "hire",
    code: `const hasan = { available: true, focus: "frontend" };\n\nconsole.log(hasan.available\n  ? \`Let's build something, \${hasan.focus} first!\`\n  : "Back soon");`,
  },
];

const RUN_TIMEOUT = 1500;

/**
 * Visitor code runs in a throwaway sandboxed iframe (scripts only, no same-origin
 * access), so it can never touch this page. The frame is removed after every run.
 */
function runInSandbox(code: string): Promise<Result> {
  return new Promise((resolve) => {
    const token = Math.random().toString(36).slice(2);
    const frame = document.createElement("iframe");
    frame.setAttribute("sandbox", "allow-scripts");
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    frame.style.display = "none";
    // JSON-encode the code and escape "<" so it can never close the script tag.
    const payload = JSON.stringify(code).replace(/</g, "\\u003c");
    frame.srcdoc = `<script>
      const out = [];
      const fmt = (v) => typeof v === "string" ? v : (() => { try { return JSON.stringify(v); } catch { return String(v); } })();
      console.log = (...a) => out.push(a.map(fmt).join(" "));
      let error = null;
      try { new Function(${payload})(); } catch (e) { error = String(e && e.message || e); }
      parent.postMessage({ token: "${token}", out, error }, "*");
    </script>`;

    const finish = (result: Result) => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timer);
      frame.remove();
      resolve(result);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.contentWindow || event.data?.token !== token) return;
      const { out, error } = event.data as { out: string[]; error: string | null };
      finish(error ? { kind: "error", text: error } : { kind: "output", text: out.join("\n") || "(no output)" });
    };
    const timer = setTimeout(() => finish({ kind: "error", text: "Stopped: the code took too long." }), RUN_TIMEOUT);
    window.addEventListener("message", onMessage);
    document.body.appendChild(frame);
  });
}

/** A small live editor: pick an example or write your own, then run it. */
export function CodePlayground({ editorRef }: { editorRef?: RefObject<HTMLTextAreaElement | null> }) {
  const id = useId();
  const [code, setCode] = useState(SNIPPETS[0].code);
  const [result, setResult] = useState<Result | null>(null);
  const [shown, setShown] = useState("");
  const [running, setRunning] = useState(false);
  const mounted = useRef(true);
  const typing = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  /** Type the result out character by character; instant under reduced motion. */
  function reveal(next: Result) {
    clearInterval(typing.current);
    setResult(next);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(next.text);
      return;
    }
    let index = 0;
    setShown("");
    typing.current = setInterval(() => {
      index += 1;
      setShown(next.text.slice(0, index));
      if (index >= next.text.length) clearInterval(typing.current);
    }, 16);
  }

  async function run(source = code) {
    setRunning(true);
    const next = await runInSandbox(source);
    if (!mounted.current) return;
    setRunning(false);
    reveal(next);
  }

  // Show the first example's output shortly after the hero appears.
  useEffect(() => {
    mounted.current = true;
    const timer = setTimeout(() => {
      void runInSandbox(SNIPPETS[0].code).then((next) => {
        if (mounted.current) reveal(next);
      });
    }, 600);
    return () => {
      mounted.current = false;
      clearTimeout(timer);
      clearInterval(typing.current);
    };
  }, []);

  const lines = code.split("\n").length;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-2xl bg-[#11141b] text-[#d7dfec] shadow-[0_24px_50px_-18px_rgba(10,14,24,.55)]">
        <div className="flex items-center gap-1.5 bg-[#0b0e14] px-3 py-2.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <label htmlFor={`${id}-snippet`} className="ml-2 font-mono text-[11px] text-[#8b93a3]">
            playground.js
          </label>
          <select
            id={`${id}-snippet`}
            aria-label="Load an example"
            onChange={(event) => {
              const snippet = SNIPPETS.find((item) => item.id === event.target.value) ?? SNIPPETS[0];
              setCode(snippet.code);
              void run(snippet.code);
            }}
            className="ml-auto h-6 rounded-md border-0 bg-[#1a1f28] px-1.5 font-mono text-[11px] text-[#cbd4e3] outline-none"
          >
            {SNIPPETS.map((snippet) => (
              <option key={snippet.id} value={snippet.id}>
                {snippet.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void run()}
            aria-label="Run code"
            disabled={running}
            className="grid h-6 w-7 place-items-center rounded-md bg-white text-[11px] text-[#11141b] transition hover:bg-[#dfe6ff] disabled:opacity-60"
          >
            ▶
          </button>
        </div>
        <div className="relative font-mono text-[12px] leading-[1.7]">
          <div aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-8 py-3 pr-2 text-right text-[#4b5363]">
            {Array.from({ length: lines }, (_, index) => (
              <div key={index}>{index + 1}</div>
            ))}
          </div>
          <textarea
            ref={editorRef}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                void run();
              }
            }}
            spellCheck={false}
            wrap="off"
            aria-label="Code editor. Press Control or Command and Enter to run."
            rows={Math.max(6, lines)}
            className="block w-full resize-none overflow-x-auto border-0 bg-transparent py-3 pr-3 pl-10 whitespace-pre text-[#d7dfec] caret-[#7fa2ff] outline-none [scrollbar-width:thin]"
          />
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#e3e6ec] bg-white shadow-[0_14px_30px_-16px_rgba(10,14,24,.25)]">
        <div className="flex items-center justify-between border-b border-[#eceef3] px-3">
          <span className="border-b-2 border-(--hero-accent) py-2 text-[11px] font-medium text-[#171b25]">Output</span>
          <span className="font-mono text-[10px] text-[#8a90a0]">⌘/Ctrl + Enter</span>
        </div>
        <pre
          aria-live="polite"
          className={`min-h-[52px] px-3 py-2.5 font-mono text-[12px] leading-[1.6] whitespace-pre-wrap ${result?.kind === "error" ? "text-[#d13b3b]" : "text-[#171b25]"}`}
        >
          {running ? "Running…" : shown}
        </pre>
      </div>
    </div>
  );
}
