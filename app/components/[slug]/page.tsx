import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ComponentPlayground } from "@/components/showcase/component-playground";
import { ExplorePreviewButton } from "@/components/showcase/explore-preview-button";
import { ComponentBackdrop } from "@/components/showcase/component-backdrop";
import "@/components/showcase/component-detail.css";
import { componentPreviews, componentThumbnails } from "@/lib/component-previews";
import { components, getComponent } from "@/lib/component-registry";
import { ArrowUpRight } from "@/components/site/icons";

type ComponentPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return components.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ComponentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const component = getComponent(slug);

  if (!component) {
    notFound();
  }

  return {
    title: component.title,
    description: component.description,
  };
}

export default async function ComponentPage({ params }: ComponentPageProps) {
  const { slug } = await params;
  const entry = getComponent(slug);
  const Preview = componentPreviews[slug];
  const Thumbnail = componentThumbnails[slug];

  if (!entry || !Preview) {
    notFound();
  }
  const related = [
    ...components.filter((component) => component.category === entry.category && component.slug !== slug),
    ...components.filter((component) => component.category !== entry.category),
  ].slice(0, 2);

  return (
    <main
      id="main-content"
      className="site-container component-detail-page pb-24 pt-5 sm:pt-6"
    >
      <ComponentBackdrop slug={slug}>
        {Thumbnail && <Thumbnail className="h-full w-full" previewStep={0} />}
      </ComponentBackdrop>
      <nav aria-label="Breadcrumb" className="detail-breadcrumb mb-5 text-[12px]">
        <ol className="flex flex-wrap items-center gap-2.5">
          <li>
            <Link href="/" className="transition-colors hover:text-[#111318]">
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="text-[#c9cbd1]">
            /
          </li>
          <li>
            <Link
              href="/#collection"
              className="transition-colors hover:text-[#111318]"
            >
              Components
            </Link>
          </li>
          <li aria-hidden="true" className="text-[#c9cbd1]">
            /
          </li>
          <li aria-current="page" className="font-medium text-[#252b36]">
            {entry.title}
          </li>
        </ol>
      </nav>

      <header className="detail-intro mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        <div className="min-w-0 flex-1">
          <p className="detail-section-eyebrow mb-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.18em]">
            Component {entry.number}
            <span aria-hidden="true" className="mx-3 text-[#c7cad3]">
              /
            </span>
            {entry.category}
          </p>
          <h1 className="text-[clamp(2rem,3.8vw,3rem)] leading-[1.1] font-semibold tracking-[-0.055em] text-[#111318]">
            {entry.title}
          </h1>
          <p className="detail-secondary-copy mt-3 max-w-[780px] text-[14px] leading-[1.7] sm:text-[15px]">
            {entry.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:shrink-0 lg:flex-col lg:items-end">
          <ul aria-label="Built with" className="flex flex-wrap gap-2">
            {["React", "Tailwind CSS", "TypeScript"].map((technology) => (
              <li
                key={technology}
                className="rounded-lg border border-[#e4e8ee] bg-white px-3 py-1.5 text-[11px] font-medium text-[#667085]"
              >
                {technology}
              </li>
            ))}
          </ul>
          <ExplorePreviewButton />
        </div>
      </header>

      <ComponentPlayground
        slug={slug}
        fileName={entry.fileName}
        title={entry.title}
        usage={entry.usage}
        demoNote={entry.demoNote}
      >
        <Preview />
      </ComponentPlayground>

      <section
        aria-labelledby="about-component"
        className="detail-information"
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="detail-section-eyebrow font-mono text-[10px] tracking-[0.18em] uppercase">Behind the interaction</p>
            <h2 id="about-component" className="mt-3 text-[clamp(1.65rem,3vw,2.25rem)] leading-tight font-semibold tracking-[-0.05em] text-[#171b24]">
              The details that make it work.
            </h2>
          </div>
          <span className="detail-secondary-copy text-[12px]">Designed to explore, ready to adapt.</span>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {entry.features.map((feature, index) => (
            <article key={feature.title} className="detail-feature rounded-2xl p-6">
              <span
                aria-hidden="true"
                className="mb-8 inline-flex size-9 items-center justify-center rounded-xl bg-[#f2f4f7] font-mono text-[11px] text-[#536072]"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[#252b36]">
                {feature.title}
              </h3>
              <p className="detail-secondary-copy mt-3 text-[13px] leading-[1.75]">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="related-components" className="detail-information">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="detail-section-eyebrow font-mono text-[10px] tracking-[0.18em] uppercase">Keep exploring</p>
            <h2 id="related-components" className="mt-3 text-[clamp(1.65rem,3vw,2.25rem)] leading-tight font-semibold tracking-[-0.05em] text-[#171b24]">More from the lab.</h2>
          </div>
          <Link href="/#collection" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#3d4859] hover:text-[#0b0d12]">
            View all components <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {related.map((component) => (
            <Link key={component.slug} href={`/components/${component.slug}`} className="detail-related-card group flex min-h-[170px] flex-col justify-between rounded-2xl p-6 transition hover:border-[#c8d0dc] hover:shadow-[0_12px_34px_rgba(20,32,55,0.07)]">
              <div className="flex items-center justify-between gap-3">
                <span className="detail-section-eyebrow font-mono text-[10px] tracking-[0.12em] uppercase">{component.category} / {component.number}</span>
                <ArrowUpRight className="size-4 text-[#8993a2] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#111318]" />
              </div>
              <div>
                <h3 className="text-[20px] font-semibold tracking-[-0.04em] text-[#252b36]">{component.title}</h3>
                <p className="detail-secondary-copy mt-2 line-clamp-2 text-[12px] leading-[1.6]">{component.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
