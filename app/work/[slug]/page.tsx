import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { caseStudies, getCaseStudy } from "@/lib/case-studies";

type WorkPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return caseStudies.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: WorkPageProps): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  if (!study) return {};

  return {
    title: `${study.title} case study`,
    description: `${study.summary} Read Mizanur Hasan’s role and engineering approach.`,
    openGraph: {
      title: `${study.title} — Mizanur Hasan`,
      description: study.summary,
      type: "article",
    },
  };
}

export default async function WorkPage({ params }: WorkPageProps) {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  if (!study) notFound();
  const otherStudy = caseStudies.find((item) => item.slug !== study.slug);

  return (
    <main id="main-content" className="bg-[#f7f9fc] text-[#172238]">
      <div className="site-container py-8 sm:py-12">
        <nav aria-label="Breadcrumb" className="text-sm text-[#55637b]">
          <Link href="/#selected-work" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-[#244bb0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3152b4]">
            Selected work
          </Link>
          <span aria-hidden="true" className="mx-3 text-[#91a0b8]">/</span>
          <span aria-current="page">{study.title}</span>
        </nav>

        <header className="relative mt-5 overflow-hidden rounded-[2rem] border border-[#dbe3f0] bg-[linear-gradient(130deg,#152a4b,#1e365e_55%,#38528c)] px-6 py-10 text-white sm:px-10 sm:py-14 lg:px-14">
          <div aria-hidden="true" className="pointer-events-none absolute -top-28 -right-20 size-[340px] rounded-full border border-white/15 shadow-[0_0_0_50px_#ffffff08,0_0_0_110px_#ffffff06]" />
          <div className="relative max-w-3xl">
            <p className="font-mono text-xs font-semibold tracking-[0.16em] text-[#c6d8fa] uppercase">Case study {study.number} · {study.category}</p>
            <h1 className="mt-5 text-[clamp(2.6rem,6vw,5rem)] leading-[1.02] font-semibold tracking-[-0.055em]">{study.title}</h1>
            <p className="mt-5 max-w-[64ch] text-base leading-7 text-[#e2eafb] sm:text-lg sm:leading-8">{study.summary}</p>
            <ul className="mt-7 flex flex-wrap gap-2" aria-label="Technologies used">
              {study.tags.map((tag) => <li key={tag} className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white">{tag}</li>)}
            </ul>
          </div>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_290px] lg:gap-10">
          <div className="space-y-8">
            <section aria-labelledby="challenge-heading" className="rounded-[1.5rem] border border-[#e0e6f0] bg-white p-6 sm:p-9">
              <p className="font-mono text-xs font-semibold tracking-[0.13em] text-[#4262a9] uppercase">01 / Context</p>
              <h2 id="challenge-heading" className="mt-3 text-2xl font-semibold tracking-[-0.035em]">The problem</h2>
              <p className="mt-4 max-w-[75ch] text-[15px] leading-7 text-[#43516a]">{study.challenge}</p>
            </section>

            <section aria-labelledby="ownership-heading" className="rounded-[1.5rem] border border-[#e0e6f0] bg-white p-6 sm:p-9">
              <p className="font-mono text-xs font-semibold tracking-[0.13em] text-[#4262a9] uppercase">02 / Contribution</p>
              <h2 id="ownership-heading" className="mt-3 text-2xl font-semibold tracking-[-0.035em]">What I owned</h2>
              <p className="mt-4 max-w-[75ch] text-[15px] leading-7 text-[#43516a]">{study.ownership}</p>
              <h3 className="mt-7 text-base font-semibold">Delivered workflows</h3>
              <ul className="mt-3 space-y-3">
                {study.delivery.map((item) => (
                  <li key={item} className="flex gap-3 text-[15px] leading-7 text-[#43516a]"><span aria-hidden="true" className="mt-[11px] size-1.5 shrink-0 rounded-full bg-[#4262a9]" />{item}</li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="engineering-heading" className="rounded-[1.5rem] border border-[#e0e6f0] bg-white p-6 sm:p-9">
              <p className="font-mono text-xs font-semibold tracking-[0.13em] text-[#4262a9] uppercase">03 / Engineering</p>
              <h2 id="engineering-heading" className="mt-3 text-2xl font-semibold tracking-[-0.035em]">How the system fits together</h2>
              <ol className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Product workflow">
                {study.flow.map((step, index) => (
                  <li key={step} className="rounded-xl border border-[#dce5f3] bg-[#f7faff] p-4">
                    <span className="font-mono text-xs font-semibold text-[#4262a9]">{String(index + 1).padStart(2, "0")}</span>
                    <p className="mt-2 text-sm font-semibold text-[#1f3050]">{step}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-7 grid gap-4 md:grid-cols-3">
                {study.engineering.map((item) => (
                  <div key={item.title} className="border-t border-[#dce5f3] pt-4">
                    <h3 className="text-sm font-semibold text-[#1f3050]">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#526079]">{item.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section aria-labelledby="evidence-heading" className="rounded-[1.5rem] border border-[#e0e6f0] bg-white p-6 sm:p-9">
              <p className="font-mono text-xs font-semibold tracking-[0.13em] text-[#4262a9] uppercase">04 / Evidence</p>
              <h2 id="evidence-heading" className="mt-3 text-2xl font-semibold tracking-[-0.035em]">What this case demonstrates</h2>
              <p className="mt-4 text-[15px] leading-7 text-[#43516a]">{study.evidence}</p>
              <p className="mt-4 rounded-xl border border-[#dce5f3] bg-[#f7faff] p-4 text-sm leading-6 text-[#445571]">{study.availability}</p>
            </section>
          </div>

          <aside className="self-start rounded-[1.5rem] border border-[#dce5f0] bg-white p-6 lg:sticky lg:top-28" aria-label="Case study facts">
            <h2 className="text-xs font-semibold tracking-[0.13em] text-[#5b6a85] uppercase">Project facts</h2>
            <dl className="mt-4 divide-y divide-[#e9edf4]">
              <div className="py-3"><dt className="text-xs text-[#65728a]">Role</dt><dd className="mt-1 text-sm font-semibold">{study.role}</dd></div>
              <div className="py-3"><dt className="text-xs text-[#65728a]">Period</dt><dd className="mt-1 text-sm font-semibold">{study.period}</dd></div>
              <div className="py-3"><dt className="text-xs text-[#65728a]">Product</dt><dd className="mt-1 text-sm font-semibold">{study.category}</dd></div>
            </dl>
            <a href="mailto:eng.mizanur.hasan@gmail.com?subject=Let%27s%20discuss%20your%20project%20work" className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#244bb0] px-4 text-sm font-semibold text-white hover:bg-[#193b92] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244bb0]">
              Discuss this work <span aria-hidden="true" className="ml-2">↗</span>
            </a>
          </aside>
        </div>

        {otherStudy && (
          <Link href={`/work/${otherStudy.slug}`} className="mt-10 flex min-h-24 items-center justify-between gap-4 rounded-[1.5rem] border border-[#dce5f0] bg-white p-6 transition-colors hover:border-[#aabde4] hover:bg-[#fafdff] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3152b4] sm:p-8">
            <span><span className="block text-xs font-semibold tracking-[0.13em] text-[#65728a] uppercase">Next case study</span><span className="mt-2 block text-xl font-semibold text-[#172238]">{otherStudy.title}</span></span>
            <span aria-hidden="true" className="text-2xl text-[#3152b4]">↗</span>
          </Link>
        )}
      </div>
    </main>
  );
}
