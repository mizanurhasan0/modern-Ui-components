"use client";

import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { unlockComponentSource } from "@/app/components/actions";
import { CodeBlock } from "./code-block";

type ComponentPlaygroundProps = {
  slug: string;
  fileName: string;
  title: string;
  usage: string;
  children: ReactNode;
};

type Tab = "preview" | "code";
type IconName =
  "preview" | "code" | "desktop" | "mobile" | "replay" | "chevron";

function Icon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "preview" && (
        <>
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
      {name === "code" && (
        <>
          <path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />
        </>
      )}
      {name === "desktop" && (
        <>
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </>
      )}
      {name === "mobile" && (
        <>
          <rect x="6.5" y="2" width="11" height="20" rx="2.5" />
          <path d="M11 18h2" />
        </>
      )}
      {name === "replay" && (
        <>
          <path d="M3 10a9 9 0 1 1 1.6 7M3 4v6h6" />
        </>
      )}
      {name === "chevron" && <path d="m9 5 7 7-7 7" />}
    </svg>
  );
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4666ee]";

export function ComponentPlayground({
  slug,
  fileName,
  title,
  usage,
  children,
}: ComponentPlaygroundProps) {
  const requiresThree = fileName === "creative-login.tsx";
  const [activeTab, setActiveTab] = useState<Tab>("preview");
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [replay, setReplay] = useState(0);
  const [unlockedSource, setUnlockedSource] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isCheckingPassword, startTransition] = useTransition();
  const id = useId();
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const passwordDialogRef = useRef<HTMLDialogElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const dialog = passwordDialogRef.current;
    if (!dialog) return;

    if (activeTab === "code" && !unlockedSource && !dialog.open) {
      dialog.showModal();
      passwordInputRef.current?.focus();
    } else if ((activeTab !== "code" || unlockedSource) && dialog.open) {
      dialog.close();
    }
  }, [activeTab, unlockedSource]);

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError("");

    startTransition(async () => {
      try {
        const result = await unlockComponentSource(slug, password);

        if (!result.success) {
          setPasswordError("That password didn’t match. Try again.");
          return;
        }

        setUnlockedSource(result.source);
        setPassword("");
      } catch {
        setPasswordError("Couldn’t unlock the source. Please try again.");
      }
    });
  }

  function closePasswordDialog() {
    setPassword("");
    setPasswordError("");
    setActiveTab("preview");
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    let nextTab: Tab;
    if (event.key === "Home") nextTab = "preview";
    else if (event.key === "End") nextTab = "code";
    else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      nextTab = activeTab === "preview" ? "code" : "preview";
    } else return;

    event.preventDefault();
    setActiveTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  }

  return (
    <div className="space-y-7">
      <section
        aria-label={`${title} playground`}
        className="overflow-hidden rounded-2xl border border-[#e2e5eb] bg-white shadow-[0_3px_12px_-8px_rgba(30,41,59,0.18)]"
      >
        <div className="flex min-h-[65px] items-center justify-between gap-2 border-b border-[#e7e9ee] px-3 sm:px-5">
          <div
            role="tablist"
            aria-label="Component view"
            className="flex items-center gap-1 rounded-lg bg-[#f2f3f6] p-1"
          >
            {(["preview", "code"] as const).map((tab) => (
              <button
                key={tab}
                ref={(element) => {
                  tabRefs.current[tab] = element;
                }}
                type="button"
                role="tab"
                id={`${id}-${tab}-tab`}
                aria-controls={`${id}-${tab}-panel`}
                aria-selected={activeTab === tab}
                tabIndex={activeTab === tab ? 0 : -1}
                onClick={() => setActiveTab(tab)}
                onKeyDown={handleTabKeyDown}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition motion-reduce:transition-none sm:px-3.5 ${focusRing} ${activeTab === tab ? "bg-white text-[#252e40] shadow-[0_1px_4px_rgba(24,36,55,0.08)]" : "text-[#687386] hover:text-[#252e40]"}`}
              >
                <Icon name={tab} />
                {tab === "preview" ? "Preview" : "Code"}
              </button>
            ))}
          </div>
          {activeTab === "preview" && (
            <div className="flex items-center gap-2 sm:gap-4">
              <div
                className="hidden items-center gap-1 sm:flex"
                role="group"
                aria-label="Preview viewport"
              >
                {(["desktop", "mobile"] as const).map((device) => (
                  <button
                    key={device}
                    type="button"
                    aria-label={`${device === "desktop" ? "Desktop" : "Mobile"} preview`}
                    title={`${device === "desktop" ? "Desktop" : "Mobile"} preview`}
                    aria-pressed={viewport === device}
                    onClick={() => setViewport(device)}
                    className={`grid size-8 place-items-center rounded-md transition motion-reduce:transition-none ${focusRing} ${viewport === device ? "bg-[#edf0fc] text-[#4666ee]" : "text-[#707b8e] hover:bg-[#f4f5f8] hover:text-[#505b6d]"}`}
                  >
                    <Icon name={device} />
                  </button>
                ))}
              </div>
              <span
                className="hidden h-5 w-px bg-[#e8eaf0] sm:block"
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => setReplay((value) => value + 1)}
                aria-label="Restart component preview"
                title="Restart preview"
                className={`grid size-8 place-items-center rounded-md text-[#6a7588] transition hover:bg-[#f3f4f7] hover:text-[#344054] motion-reduce:transition-none ${focusRing}`}
              >
                <Icon name="replay" />
              </button>
            </div>
          )}
          {activeTab === "code" && (
            <span className="hidden text-[11px] text-[#707b8e] sm:block">
              {unlockedSource ? "Source unlocked" : "Password required"}
            </span>
          )}
        </div>

        <div
          role="tabpanel"
          id={`${id}-preview-panel`}
          aria-labelledby={`${id}-preview-tab`}
          hidden={activeTab !== "preview"}
        >
          <div
            className="grid min-h-[590px] place-items-center bg-[#f3f4f6] p-3 sm:min-h-[620px] sm:p-7 lg:p-9"
            style={{
              backgroundImage:
                "radial-gradient(#dfe2e9 0.7px, transparent 0.7px)",
              backgroundSize: "12px 12px",
            }}
          >
            <div
              className={`w-full transition-[max-width] duration-300 motion-reduce:transition-none ${viewport === "mobile" ? "max-w-[390px]" : "max-w-[860px]"}`}
            >
              <Fragment key={replay}>{children}</Fragment>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e7e9ee] px-5 py-3.5 text-[11px] text-[#6b7587]">
            <span className="flex items-center gap-2">
              <span
                className="size-1.5 rounded-full bg-[#48a885]"
                aria-hidden="true"
              />
              Live, interactive preview
            </span>
            <span>Built with React &amp; Tailwind CSS</span>
          </div>
        </div>

        <div
          role="tabpanel"
          id={`${id}-code-panel`}
          aria-labelledby={`${id}-code-tab`}
          hidden={activeTab !== "code"}
          className="p-3 sm:p-5"
        >
          {unlockedSource ? (
            <>
              {requiresThree && <ThreeDependencies />}
              <CodeBlock source={unlockedSource} fileName={fileName} />
              <p className="px-1 pt-4 pb-1 text-xs leading-5 text-[#6b7587]">
                {requiresThree
                  ? "One component file with its 3D assets included. Install Three.js, then copy or download the source."
                  : "One self-contained component. Copy it into your project and make it your own."}
              </p>
            </>
          ) : (
            <p className="grid min-h-[280px] place-items-center text-center text-[12px] text-[#7c8493]">
              Enter the password in the dialog to view this source.
            </p>
          )}
        </div>
      </section>

      <details className="group rounded-xl border border-[#e3e6ed] bg-white">
        <summary
          className={`flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-4 [&::-webkit-details-marker]:hidden ${focusRing}`}
        >
          <span className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-[#f1f3fa] text-[#7080ae]">
              <Icon name="code" />
            </span>
            <span>
              <span className="block text-xs font-semibold text-[#394355]">
                Use in your project
              </span>
              <span className="mt-0.5 block text-[11px] text-[#6b7587]">
                A quick start. A clean slate.
              </span>
            </span>
          </span>
          <Icon
            name="chevron"
            className="text-[#929cac] transition-transform group-open:rotate-90 motion-reduce:transition-none"
          />
        </summary>
        <div className="border-t border-[#eceef3] p-4 sm:p-5">
          <p className="mb-4 text-xs leading-6 text-[#657286]">
            Save{" "}
            <code className="rounded bg-[#f2f4f8] px-1.5 py-1 font-mono text-[11px] text-[#536176]">
              {fileName}
            </code>{" "}
            in your components folder, then import it below. Requires React and
            Tailwind CSS{requiresThree ? ", plus Three.js." : "; no extra packages."}
          </p>
          {requiresThree && <ThreeDependencies />}
          <CodeBlock source={usage} fileName="app/page.tsx" compact />
        </div>
      </details>

      <dialog
        ref={passwordDialogRef}
        aria-labelledby={`${id}-password-title`}
        aria-describedby={`${id}-password-description`}
        onCancel={(event) => {
          event.preventDefault();
          closePasswordDialog();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-[420px] overflow-visible rounded-2xl border border-[#e2e6ef] bg-white p-0 text-[#252e40] shadow-[0_28px_90px_-24px_rgba(15,23,42,0.42)] backdrop:bg-[#111827]/45 backdrop:backdrop-blur-[3px]"
      >
        <form onSubmit={handlePasswordSubmit} className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#e3e8fa] bg-[#f0f3ff] text-[#5474ee]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
                aria-hidden="true"
              >
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
              </svg>
            </span>
            <button
              type="button"
              onClick={closePasswordDialog}
              aria-label="Close password dialog"
              className="grid size-8 place-items-center rounded-lg text-[#7b8494] transition-colors hover:bg-[#f2f4f8] hover:text-[#313a4b]"
            >
              <span aria-hidden="true" className="text-xl leading-none">×</span>
            </button>
          </div>
          <h2
            id={`${id}-password-title`}
            className="mt-5 text-[19px] font-semibold tracking-[-0.04em]"
          >
            This source is password protected
          </h2>
          <p
            id={`${id}-password-description`}
            className="mt-2 text-[13px] leading-[1.8] text-[#737d90]"
          >
            Enter the password to view and copy the component source.
          </p>
          <label
            htmlFor={`${id}-code-password`}
            className="mt-6 block text-[11px] font-medium text-[#525d70]"
          >
            Password
          </label>
          <input
            ref={passwordInputRef}
            id={`${id}-code-password`}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (passwordError) setPasswordError("");
            }}
            aria-invalid={Boolean(passwordError)}
            aria-describedby={passwordError ? `${id}-password-error` : undefined}
            disabled={isCheckingPassword}
            required
            className="mt-2 h-11 w-full rounded-lg border border-[#dfe4ed] bg-white px-3.5 text-[13px] text-[#252e40] outline-none transition placeholder:text-[#a2a8b4] focus:border-[#8295ef] focus:ring-4 focus:ring-[#5474ee]/10 disabled:opacity-60"
            placeholder="Enter password"
          />
          {passwordError && (
            <p
              id={`${id}-password-error`}
              role="alert"
              className="mt-2 text-[11px] text-[#c34949]"
            >
              {passwordError}
            </p>
          )}
          <button
            type="submit"
            disabled={isCheckingPassword || !password}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#4866e9] px-4 text-[12px] font-semibold text-white transition-colors hover:bg-[#3454dc] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isCheckingPassword ? "Checking password…" : "Unlock source"}
          </button>
          <p className="mt-5 border-t border-[#edf0f4] pt-4 text-[12px] leading-[1.8] text-[#737d90]">
            Don’t have the password? Email me at{" "}
            <a
              href="mailto:eng.mizanur.hasan@gmail.com"
              className="font-medium text-[#4866e9] underline decoration-[#c9d3ff] underline-offset-4 transition-colors hover:text-[#3454dc]"
            >
              eng.mizanur.hasan@gmail.com
            </a>
            {" "}and I’ll help you get access.
          </p>
        </form>
      </dialog>
    </div>
  );
}

function ThreeDependencies() {
  return (
    <div className="mb-4 rounded-lg border border-[#e2e7f2] bg-[#f5f7fc] p-4">
      <p className="text-xs font-medium text-[#39465f]">
        Install the 3D renderer
      </p>
      <pre className="mt-2 overflow-x-auto font-mono text-[11px] leading-6 text-[#536176]">
        <code>{"npm install three\nnpm install --save-dev @types/three"}</code>
      </pre>
      <p className="mt-2 text-[11px] leading-5 text-[#6b7587]">
        The second command adds TypeScript definitions. Models, animations, fonts,
        and the fallback image are included in the copied file.
      </p>
    </div>
  );
}
