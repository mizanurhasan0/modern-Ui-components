import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ComponentPlayground } from "@/components/showcase/component-playground";
import { componentPreviews } from "@/lib/component-previews";
import { components, getComponent } from "@/lib/component-registry";

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

  if (!entry || !Preview) {
    notFound();
  }

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-[1200px] px-5 pb-24 pt-8 sm:px-8 sm:pt-10"
    >
      <nav aria-label="Breadcrumb" className="mb-12 text-[13px] text-[#8b8d97]">
        <ol className="flex flex-wrap items-center gap-2.5">
          <li>
            <Link href="/" className="transition-colors hover:text-[#4666ee]">
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="text-[#c9cbd1]">
            /
          </li>
          <li>
            <Link
              href="/#collection"
              className="transition-colors hover:text-[#4666ee]"
            >
              Components
            </Link>
          </li>
          <li aria-hidden="true" className="text-[#c9cbd1]">
            /
          </li>
          <li aria-current="page" className="font-medium text-[#363944]">
            {entry.title}
          </li>
        </ol>
      </nav>

      <header className="mb-10">
        <p className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[#818592]">
          Component {entry.number}
          <span aria-hidden="true" className="mx-3 text-[#c7cad3]">
            /
          </span>
          {entry.category}
        </p>
        <h1 className="text-[40px] leading-[1.12] font-semibold tracking-[-0.055em] text-[#171922] sm:text-[48px]">
          {entry.title}
        </h1>
        <p className="mt-4 max-w-[550px] text-[15px] leading-7 text-[#737783]">
          {entry.description}
        </p>
        <ul aria-label="Built with" className="mt-6 flex flex-wrap gap-2">
          {["React", "Tailwind CSS", "TypeScript"].map((technology) => (
            <li
              key={technology}
              className="rounded-md border border-[#e4e6ed] bg-white px-2.5 py-1 text-[11px] font-medium text-[#686c79]"
            >
              {technology}
            </li>
          ))}
        </ul>
      </header>

      <ComponentPlayground
        slug={slug}
        fileName={entry.fileName}
        title={entry.title}
        usage={entry.usage}
      >
        <Preview />
      </ComponentPlayground>

      <p className="mt-4 flex items-start justify-center gap-2 text-center text-[11px] leading-5 text-[#9195a1]">
        <span
          aria-hidden="true"
          className="mt-2 size-1 shrink-0 rounded-full bg-[#4666ee]"
        />
        {entry.demoNote}
      </p>

      <section
        aria-labelledby="about-component"
        className="mt-16 border-t border-[#e5e7ee] pt-9"
      >
        <h2
          id="about-component"
          className="text-[18px] font-semibold tracking-[-0.03em] text-[#252832]"
        >
          About this component
        </h2>
        <div className="mt-7 grid gap-8 sm:grid-cols-3 sm:gap-10">
          {entry.features.map((feature, index) => (
            <article key={feature.title}>
              <span
                aria-hidden="true"
                className="mb-4 inline-flex size-8 items-center justify-center rounded-lg border border-[#e0e5f5] bg-[#edf0fc] font-mono text-[10px] text-[#4666ee]"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-[13px] font-semibold text-[#343742]">
                {feature.title}
              </h3>
              <p className="mt-2 text-[12px] leading-[1.9] text-[#818591]">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
