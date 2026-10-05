import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CodeIcon, SparkIcon } from "@/components/site/icons";

export const metadata: Metadata = {
  title: "About the Developer",
  description:
    "Frontend developer with 3+ years building React and Next.js interfaces. Focused on performance, maintainable code, and solving problems at the root.",
  openGraph: {
    title: "About the Developer | Component Lab",
    description:
      "A frontend developer focused on thoughtful interfaces, performance, and solving the root cause of complex problems.",
    type: "website",
  },
};

const principles = [
  {
    number: "01",
    title: "Start with the real problem",
    text: "I look past the visible bug to understand the cause, the surrounding system, and what a reliable fix needs to do.",
  },
  {
    number: "02",
    title: "Make every interaction count",
    text: "I care about the details people feel: responsive layouts, accessible controls, quick feedback, and smooth performance.",
  },
  {
    number: "03",
    title: "Build for the next change",
    text: "Clear structure and maintainable code make it easier for a product to grow without making the next feature harder.",
  },
];

const explorations = [
  { label: "Live location", detail: "GPS tracking and real-time updates" },
  { label: "Commerce", detail: "E-commerce flows and useful interfaces" },
  { label: "Motion", detail: "AnimateIcons and expressive React interfaces" },
  { label: "Connected systems", detail: "Real-time notifications and event-driven ideas" },
];

export default function AboutPage() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">
      <section className="relative grid gap-12 border-b border-[#e4e7ed] pt-14 pb-16 sm:pt-20 sm:pb-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-16">
        <div>
          <div className="mb-7 flex items-center gap-2.5 font-mono text-[11px] font-medium tracking-[0.13em] text-[#646b7a] uppercase">
            <span className="size-2 rounded-full bg-[#5474ee]" />
            A little context
          </div>
          <h1 className="max-w-[750px] text-[clamp(2.8rem,6vw,5.15rem)] leading-[1.04] font-medium tracking-[-0.075em] text-[#171b25]">
            I build for the details that make software feel{" "}
            <span className="font-serif font-normal italic tracking-[-0.065em] text-[#4866e9]">
              effortless.
            </span>
          </h1>
          <p className="mt-7 max-w-[610px] text-[15px] leading-[1.9] text-[#737987] sm:text-base">
            I’m a frontend developer with 3+ years of experience building
            thoughtful web interfaces. I work mainly with React, Next.js,
            JavaScript, and TypeScript, and I enjoy turning complex requirements
            into clear, reliable experiences.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px] text-[#818693]">
            <span className="flex items-center gap-2">
              <CodeIcon className="size-4 text-[#626a7a]" /> React & Next.js
            </span>
            <span className="flex items-center gap-2">
              <span className="flex size-4 items-center justify-center rounded-[3px] bg-[#737b8a] text-[9px] font-semibold text-white">
                TS
              </span>
              JavaScript & TypeScript
            </span>
            <span className="flex items-center gap-2">
              <SparkIcon className="size-3.5 text-[#626a7a]" />
              Thoughtful by default
            </span>
          </div>
        </div>

        <aside
          aria-label="Engineering profile"
          className="relative overflow-hidden rounded-[22px] border border-[#e2e6ef] bg-white p-5 shadow-[0_24px_70px_-44px_rgba(30,47,104,0.35)] sm:p-7"
        >
          <div className="absolute -top-20 -right-16 size-56 rounded-full bg-[#edf1ff] blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between border-b border-[#edf0f4] pb-4">
              <span className="font-mono text-[10px] tracking-[0.13em] text-[#858b97] uppercase">
                Engineering profile
              </span>
              <span className="rounded-full border border-[#e6eaf2] bg-[#fafbfc] px-2.5 py-1 font-mono text-[9px] text-[#7a8291]">
                01 / 04
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-5">
              <div className="rounded-xl bg-[#f7f8fb] p-4">
                <span className="block text-[29px] leading-none font-medium tracking-[-0.07em] text-[#1b2030]">3+</span>
                <span className="mt-2 block text-[11px] text-[#7a8190]">years building for the web</span>
              </div>
              <div className="rounded-xl bg-[#f7f8fb] p-4">
                <span className="block text-[13px] leading-[1.3] font-semibold text-[#1b2030]">Frontend</span>
                <span className="mt-2 block text-[11px] text-[#7a8190]">primary focus</span>
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-[#e9edf3] bg-white/80 p-4">
              <p className="font-mono text-[10px] tracking-[0.12em] text-[#969daa] uppercase">How I think</p>
              <p className="mt-3 text-[13px] leading-[1.8] text-[#535b6b]">
                Find the root cause <span className="text-[#b5bac4]">→</span>{" "}
                design a clear solution <span className="text-[#b5bac4]">→</span>{" "}
                leave the code easier to change.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["React", "Next.js", "TypeScript", "Performance"].map((skill) => (
                <span key={skill} className="rounded-full bg-[#f0f3ff] px-2.5 py-1.5 text-[10px] font-medium text-[#5268c1]">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-8 border-b border-[#e4e7ed] py-14 sm:py-16 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
        <div>
          <p className="font-mono text-[10px] tracking-[0.16em] text-[#8a909b] uppercase">The way I work</p>
          <h2 className="mt-4 max-w-[340px] text-[29px] leading-[1.2] font-medium tracking-[-0.055em] text-[#1b2030] sm:text-[34px]">
            Thoughtful code starts with thoughtful questions.
          </h2>
        </div>
        <div className="grid gap-7 sm:grid-cols-3 sm:gap-6">
          {principles.map((item) => (
            <article key={item.number}>
              <span className="font-mono text-[10px] text-[#969daa]">/ {item.number}</span>
              <h3 className="mt-3 text-[14px] font-semibold text-[#353b48]">{item.title}</h3>
              <p className="mt-2 text-[12px] leading-[1.85] text-[#858b96]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-8 border-b border-[#e4e7ed] py-14 sm:py-16 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
        <div>
          <p className="font-mono text-[10px] tracking-[0.16em] text-[#8a909b] uppercase">Beyond the interface</p>
          <h2 className="mt-4 max-w-[310px] text-[29px] leading-[1.2] font-medium tracking-[-0.055em] text-[#1b2030] sm:text-[34px]">
            Curious about the whole system.
          </h2>
        </div>
        <div className="max-w-[680px]">
          <p className="text-[14px] leading-[1.9] text-[#737987]">
            My focus is frontend engineering, but I like understanding what sits
            behind the screen too. Familiarity with Node.js, NestJS, REST APIs,
            databases, Docker, and AWS helps me think through how an interface
            fits into a complete product.
          </p>
          <p className="mt-4 text-[14px] leading-[1.9] text-[#737987]">
            I’m especially interested in performance—from Core Web Vitals and
            code splitting to network behavior—and in real-time applications,
            system design, and practical AI integrations. I use AI tools to
            explore and debug faster, while making sure I understand the code
            I work with.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Node.js", "NestJS", "REST APIs", "Databases", "Socket.IO", "Docker", "AWS", "Git"].map((skill) => (
              <span key={skill} className="rounded-md border border-[#e5e8ee] bg-white px-2.5 py-1.5 text-[10px] text-[#687080]">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 py-14 sm:py-16 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
        <div>
          <p className="font-mono text-[10px] tracking-[0.16em] text-[#8a909b] uppercase">Currently curious about</p>
          <h2 className="mt-4 max-w-[310px] text-[29px] leading-[1.2] font-medium tracking-[-0.055em] text-[#1b2030] sm:text-[34px]">
            Ideas at the edge of product and engineering.
          </h2>
          <p className="mt-4 max-w-[310px] text-[13px] leading-[1.8] text-[#858b96]">
            These are areas I enjoy learning about and exploring through projects.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {explorations.map((item, index) => (
            <article key={item.label} className="group flex min-h-[112px] items-start justify-between rounded-xl border border-[#e7eaf0] bg-white p-4 transition-colors hover:border-[#cbd4fa] sm:p-5">
              <div>
                <span className="font-mono text-[9px] text-[#a0a6b1]">0{index + 1}</span>
                <h3 className="mt-2 text-[13px] font-semibold text-[#353b48]">{item.label}</h3>
                <p className="mt-1 text-[11px] leading-[1.6] text-[#858b96]">{item.detail}</p>
              </div>
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-[#cbd3ef] transition-colors group-hover:bg-[#5474ee]" />
            </article>
          ))}
        </div>
      </section>

      <section className="mb-14 flex flex-col gap-5 rounded-2xl border border-[#e2e7f1] bg-[#f3f5fb] px-6 py-7 sm:mb-20 sm:flex-row sm:items-center sm:justify-between sm:px-9 sm:py-8">
        <div>
          <p className="font-mono text-[10px] tracking-[0.15em] text-[#81899b] uppercase">That’s the short version</p>
          <h2 className="mt-2 text-[21px] font-medium tracking-[-0.045em] text-[#1d2331]">The work says the rest.</h2>
        </div>
        <Link href="/#collection" className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#4866e9] px-4 py-3 text-[12px] font-semibold text-white transition-colors hover:bg-[#3454dc]">
          Explore the component lab <ArrowUpRight className="size-4" />
        </Link>
      </section>
    </main>
  );
}
