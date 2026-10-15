"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { CodePlayground } from "./code-playground";
import { PixelKnight } from "./pixel-knight";
import { TechLogo } from "./tech-logo";
import { TECH_STACK, type Category, type CategoryIcon, type Tool } from "./tech-stack-data";

const ICON_PATHS: Record<CategoryIcon, ReactNode> = {
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  server: (
    <>
      <rect x="4" y="4" width="16" height="6" rx="1.5" />
      <rect x="4" y="14" width="16" height="6" rx="1.5" />
      <path d="M8 7h.01M8 17h.01M12 7h4M12 17h4" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </>
  ),
  cloud: (
    <>
      <path d="M7 18a4 4 0 0 1-.6-8 5.5 5.5 0 0 1 10.7 1.5A3.3 3.3 0 0 1 17 18Z" />
      <path d="M12 16v-5M9.8 13 12 10.8l2.2 2.2" />
    </>
  ),
  tools: <path d="m14.5 6.5 3 3M4 20l7.5-7.5M13 4.5l6.5 6.5-2 2L11 6.5ZM6.5 4 4 6.5 9 11.5l2.5-2.5Z" />,
};

function CategoryGlyph({ icon }: { icon: CategoryIcon }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-5">
      {ICON_PATHS[icon]}
    </svg>
  );
}

type Props = {
  /** Category highlighted from outside, e.g. by the intro tour. */
  activeId: string | null;
  onActiveChange: (id: string | null) => void;
};

/*
 * Each row draws its piece of the connector rail: middle rows a straight segment
 * plus a tick, the first and last rows a rounded elbow, so together they form one
 * continuous bracket from the root node to every category.
 */
const ROW =
  "relative flex items-center gap-2.5 md:pl-9 " +
  "md:before:absolute md:before:left-0 md:before:-top-1.5 md:before:-bottom-1.5 md:before:border-l-[1.5px] md:before:border-(--line) md:before:transition-colors " +
  "md:after:absolute md:after:top-1/2 md:after:left-0 md:after:w-8 md:after:border-t-[1.5px] md:after:border-(--line) md:after:transition-colors " +
  "md:first:before:top-1/2 md:first:before:w-8 md:first:before:rounded-tl-2xl md:first:before:border-t-[1.5px] md:first:after:hidden " +
  "md:last:before:bottom-1/2 md:last:before:w-8 md:last:before:rounded-bl-2xl md:last:before:border-b-[1.5px] md:last:after:hidden";

export function TechStack({ activeId, onActiveChange }: Props) {
  const [selected, setSelected] = useState<{ tool: Tool; category: Category } | null>(null);
  const [playground, setPlayground] = useState(false);
  const guardianCategory = TECH_STACK.find((category) => category.id === activeId) ?? selected?.category ?? null;

  return (
    <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:gap-0">
      <PixelKnight category={guardianCategory} playgroundOpen={playground} onTogglePlayground={() => setPlayground((open) => !open)} />

      {playground ? (
        <div className="w-full md:ml-6 md:max-w-[440px]">
          <p className="mb-2 text-[12px] text-[#5b6271]">Playground: edit the code and press ▶ to run it.</p>
          <CodePlayground />
        </div>
      ) : (
        <div className="min-w-0 flex-1">
          <ul className="m-0 flex list-none flex-col gap-3 p-0" onMouseLeave={() => onActiveChange(null)}>
            {TECH_STACK.map((category, index) => {
              const active = activeId === category.id;
              const dimmed = activeId !== null && !active;
              return (
                <li
                  key={category.id}
                  data-knight-accent={category.color}
                  style={{ "--line": active ? category.color : "#cfd6e2", "--c": category.color, animationDelay: `${index * 90}ms` } as CSSProperties}
                  className={`${ROW} motion-safe:animate-[stack-in_.6s_cubic-bezier(.2,.8,.2,1)_both] max-md:flex-col max-md:items-stretch`}
                  onMouseEnter={() => onActiveChange(category.id)}
                  onFocus={() => onActiveChange(category.id)}
                >
                  <div
                    className={`flex w-full shrink-0 items-center gap-2.5 rounded-xl bg-white/90 p-2 pr-3 shadow-[0_8px_24px_-14px_rgba(15,23,42,.35)] ring-1 ring-black/5 backdrop-blur transition duration-300 md:w-[128px] ${active ? "-translate-y-0.5 ring-2 ring-(--c)" : ""} ${dimmed ? "opacity-55" : ""}`}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-(--c) text-white shadow-[inset_0_1px_0_rgba(255,255,255,.35)]">
                      <CategoryGlyph icon={category.icon} />
                    </span>
                    <span className="text-[13px] font-semibold whitespace-nowrap text-[#111827]">{category.label}</span>
                  </div>
                  <span aria-hidden="true" className="hidden h-9 w-2 shrink-0 rounded-l-md border-y-[1.5px] border-l-[1.5px] border-(--line) transition-colors md:block" />
                  <div
                    className={`grid flex-1 grid-cols-2 gap-x-1.5 gap-y-2 rounded-2xl bg-white/90 p-2.5 shadow-[0_10px_30px_-16px_rgba(15,23,42,.35)] ring-1 ring-black/5 backdrop-blur transition duration-300 sm:grid-cols-3 ${active ? "ring-2 ring-(--c)/40" : ""} ${dimmed ? "opacity-55" : ""}`}
                  >
                    {category.tools.map((tool) => {
                      const isSelected = selected?.tool.name === tool.name;
                      return (
                        <button
                          key={tool.name}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setSelected(isSelected ? null : { tool, category })}
                          className="flex min-w-0 items-center gap-1.5 rounded-lg px-1 py-1.5 text-left text-[11.5px] leading-tight text-[#1f2937] transition hover:bg-[#f2f4f8] aria-pressed:bg-(--c)/10 aria-pressed:text-[#0f172a]"
                        >
                          <TechLogo tool={tool} className="size-5" />
                          <span className="line-clamp-2 min-w-0">{tool.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
          <p aria-live="polite" className="mt-3 flex min-h-9 items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-[12.5px] text-[#4b5563] ring-1 ring-black/5 backdrop-blur md:ml-9">
            {selected ? (
              <>
                <span className="size-2 rounded-full" style={{ backgroundColor: selected.category.color }} />
                <b className="font-semibold text-[#111827]">{selected.tool.name}</b>
                <span>· {selected.tool.about}</span>
              </>
            ) : (
              <span>Tap any tool to see what it&rsquo;s for, or open the playground.</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
