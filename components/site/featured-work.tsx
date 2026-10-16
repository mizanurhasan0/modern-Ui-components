import Link from "next/link";
import { caseStudies } from "@/lib/case-studies";
import { SignalRoutesBackground } from "./signal-routes-background";
import styles from "./featured-work.module.css";

function ProductWindow({ slug }: { slug: string }) {
  const isCrm = slug === "leadpylot-crm";
  return (
    <div className={`${styles.visual} ${isCrm ? styles.crmVisual : styles.marketVisual}`} aria-hidden="true">
      <div className={styles.browser}>
        <div className={styles.browserBar}>
          <span className={styles.browserDots}><i /><i /><i /></span>
          <span>{isCrm ? "lead workspace" : "marketplace flow"}</span>
          <span className={styles.browserMark}>{isCrm ? "CRM" : "MP"}</span>
        </div>
        {isCrm ? (
          <div className={styles.crmBody}>
            <div className={styles.crmSidebar}><span /><span /><span /><span /></div>
            <div className={styles.crmMain}>
              <div className={styles.crmTopline}><span>LEADS / THIS WEEK</span><i /></div>
              <div className={styles.crmMetrics}><span /><span /><span /></div>
              <div className={styles.crmRows}><span /><span /><span /></div>
            </div>
          </div>
        ) : (
          <div className={styles.marketBody}>
            <div className={styles.marketFlow}>
              <span>Seller</span><b>→</b><span>Promoter</span><b>→</b><span>Shopper</span>
            </div>
            <div className={styles.marketTrack}><span /><span /><span /></div>
            <p>CATALOG · ORDER · COMMISSION</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function FeaturedWork() {
  return (
    <section id="selected-work" aria-labelledby="selected-work-heading" className="site-container scroll-mt-28 pt-12 sm:pt-16">
      <div className={styles.stage}>
        <SignalRoutesBackground />
        <div className={styles.content}>
          <div className={styles.kicker}>
            <span>Selected work</span>
            <span>Products / not just pixels</span>
          </div>
          <div className={styles.intro}>
            <h2 id="selected-work-heading">Built across the interface<br className={styles.headingBreak} /> and behind it.</h2>
            <div className={styles.introAside}>
              <p>Two systems. Different users. Clear ownership.</p>
              <Link href="/about#professional-work" className={styles.historyLink}>
                Full work history <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
          <div className={styles.grid}>
            {caseStudies.map((study) => (
              <article key={study.slug} className={styles.card}>
                <ProductWindow slug={study.slug} />
                <div className={styles.cardCopy}>
                  <p className={styles.cardMeta}>{study.number} / {study.role}</p>
                  <h3>{study.title}</h3>
                  <p className={styles.cardSummary}>
                    {study.slug === "leadpylot-crm"
                      ? "Pipeline UI, realtime updates, and admin workflows for sales teams."
                      : "Commerce portals, a marketplace API, and the promoter journey."}
                  </p>
                  <Link href={`/work/${study.slug}`} className={styles.caseLink}>
                    Explore case study <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
