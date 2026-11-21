import Image from "next/image";
import Link from "next/link";
import { caseStudies } from "@/lib/case-studies";

/** Studies already shown on the desk scene above; every other case study is listed here. */
const DESK_SLUGS: readonly string[] = ["sales-crm", "multi-vendor-marketplace"];

/** Which screenshot represents each study on its card (defaults to the first). */
const COVER_INDEX: Readonly<Record<string, number>> = { cartpos: 3, workgrid: 1 };

export function MoreCaseStudies() {
  const studies = caseStudies.filter((study) => !DESK_SLUGS.includes(study.slug));
  if (studies.length === 0) return null;

  return (
    <div aria-labelledby="more-case-studies-heading" role="group" className="mt-12 sm:mt-14">
      <h3 id="more-case-studies-heading" className="font-mono text-[11px] font-semibold tracking-[0.16em] text-[#596273] uppercase">
        More case studies
      </h3>
      <ul className="mt-4 grid gap-4">
        {studies.map((study) => {
          const cover = study.screenshots[COVER_INDEX[study.slug] ?? 0];
          return (
          <li key={study.slug}>
            <Link
              href={`/work/${study.slug}`}
              className="group grid overflow-hidden rounded-[1.25rem] border border-[#e4e7ed] bg-white transition-colors hover:border-[#aabde4] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3152b4] md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
            >
              <Image
                src={cover.src}
                alt={cover.alt}
                width={1448}
                height={1086}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="h-auto w-full border-b border-[#e4e7ed] md:border-r md:border-b-0"
              />
              <span className="flex flex-col justify-center p-6 sm:p-8">
                <span className="font-mono text-xs font-semibold tracking-[0.13em] text-[#4262a9] uppercase">
                  Case study {study.number} · {study.category}
                </span>
                <span className="mt-3 block text-2xl font-semibold tracking-[-0.04em] text-[#111318]">{study.title}</span>
                <span className="mt-3 block text-[15px] leading-7 text-[#43516a]">{study.summary}</span>
                <span className="mt-4 flex flex-wrap gap-2">
                  {study.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-[#dce5f3] bg-[#f7faff] px-3 py-1 text-xs font-medium text-[#1f3050]">
                      {tag}
                    </span>
                  ))}
                </span>
                <span className="mt-7 inline-flex min-h-12 w-fit items-center gap-4 rounded-full bg-[#111318] py-1.5 pr-1.5 pl-6 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_#111318] transition-[background-color,box-shadow] duration-200 group-hover:bg-[#244bb0] group-hover:shadow-[0_12px_26px_-10px_#244bb0] group-focus-visible:bg-[#244bb0]">
                  Read the case study
                  <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-white text-[#111318] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#244bb0]">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform duration-200 group-hover:-rotate-45">
                      <path d="M2.5 8h10.5M8.6 3.6 13 8l-4.4 4.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </span>
              </span>
            </Link>
          </li>
          );
        })}
      </ul>
    </div>
  );
}
