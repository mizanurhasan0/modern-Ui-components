import { ComponentGallery } from "@/components/showcase/component-gallery";
import { CursorHelicopter } from "@/components/site/hero/cursor-helicopter";
import { HeroSection } from "@/components/site/hero/hero-section";
import { FeaturedWork } from "@/components/site/featured-work";
import { components } from "@/lib/component-registry";

export default function Home() {
  return (
    <main id="main-content" className="w-full">
      <HeroSection componentCount={components.length} />
      <FeaturedWork />
      <div className="site-container pt-16 sm:pt-20">
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
      </div>
      <CursorHelicopter componentCount={components.length} />
    </main>
  );
}
