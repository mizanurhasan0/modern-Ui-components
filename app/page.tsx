import { ComponentGallery } from "@/components/showcase/component-gallery";
import { ArrowUpRight, CodeIcon, SparkIcon } from "@/components/site/icons";

export default function Home() {
  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-[1200px] px-5 sm:px-8"
    >
      <section className="relative pt-16 pb-14 sm:pt-24 sm:pb-20">
        <div className="mb-7 flex items-center gap-2.5 font-mono text-[11px] font-medium tracking-[0.13em] text-[#646b7a] uppercase">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full rounded-full bg-[#5474ee] opacity-25 motion-safe:animate-ping" />
            <span className="relative inline-flex size-2 rounded-full bg-[#5474ee]" />
          </span>
          An ongoing exploration of interface & interaction
        </div>
        <div className="grid items-end gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-16">
          <h1 className="max-w-[780px] text-[clamp(2.7rem,5.5vw,4.5rem)] leading-[1.08] font-medium tracking-[-0.065em] text-[#171b25]">
            Small components.
            <br />
            <span className="text-[#969ba6]">A little more </span>
            <span className="font-serif italic font-normal tracking-[-0.065em] text-[#4866e9]">
              character.
            </span>
          </h1>
          <div className="max-w-[340px] pb-1">
            <p className="text-[15px] leading-[1.8] text-[#737987]">
              Thoughtfully crafted interfaces for the things we click, type, and
              interact with. Explore the details. Take the code. Make it yours.
            </p>
            <a
              href="#collection"
              className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold text-[#252b38] transition-colors hover:text-[#4866e9]"
            >
              Explore the collection <ArrowUpRight className="size-4" />
            </a>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px] text-[#818693] sm:mt-12">
          <span className="flex items-center gap-2">
            <CodeIcon className="size-4 text-[#626a7a]" /> React & Next.js
          </span>
          <span className="flex items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-5 text-[#626a7a]"
              aria-hidden="true"
            >
              <path d="M6 8c.8-3 2.6-4.5 5.4-4.5 4.2 0 4.6 3.2 6.7 3.7 1.4.4 2.7-.1 3.9-1.6-.8 3-2.6 4.5-5.4 4.5-4.2 0-4.6-3.2-6.7-3.7C8.5 6 7.2 6.5 6 8Zm-4 8c.8-3 2.6-4.5 5.4-4.5 4.2 0 4.6 3.2 6.7 3.7 1.4.4 2.7-.1 3.9-1.6-.8 3-2.6 4.5-5.4 4.5-4.2 0-4.6-3.2-6.7-3.7C4.5 14 3.2 14.5 2 16Z" />
            </svg>
            Tailwind CSS
          </span>
          <span className="flex items-center gap-2">
            <span className="flex size-4 items-center justify-center rounded-[3px] bg-[#737b8a] text-[9px] font-semibold text-white">
              TS
            </span>
            TypeScript
          </span>
          <span className="hidden h-3 w-px bg-[#dce0e8] sm:block" />
          <span className="flex items-center gap-2">
            <SparkIcon className="size-3.5" /> Made with attention
          </span>
        </div>
      </section>
      <ComponentGallery />
      <section
        id="about"
        className="my-16 grid scroll-mt-24 gap-8 border-t border-[#e4e7ed] pt-12 pb-4 md:my-20 md:grid-cols-[1fr_1.8fr] md:gap-20"
      >
        <div>
          <span className="font-mono text-[10px] tracking-[0.16em] text-[#8a909b] uppercase">
            The idea behind the lab
          </span>
          <h2 className="mt-4 max-w-[290px] text-[27px] leading-[1.25] font-medium tracking-[-0.04em]">
            Good interfaces live
            <br />
            in the little details.
          </h2>
        </div>
        <div className="grid gap-7 sm:grid-cols-3 sm:gap-6">
          {[
            {
              number: "01",
              title: "Explore",
              text: "A growing collection of small ideas, brought to life with thoughtful design.",
            },
            {
              number: "02",
              title: "Interact",
              text: "Real components. Real states. Try every interaction in a live preview.",
            },
            {
              number: "03",
              title: "Make it yours",
              text: "Readable, independent source code. Copy it, adapt it, and build on it.",
            },
          ].map((item) => (
            <div key={item.number}>
              <span className="font-mono text-[10px] text-[#969daa]">
                / {item.number}
              </span>
              <h3 className="mt-3 text-sm font-semibold text-[#353b48]">
                {item.title}
              </h3>
              <p className="mt-2 text-[13px] leading-[1.8] text-[#858b96]">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
