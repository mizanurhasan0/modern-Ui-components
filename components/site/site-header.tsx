"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NeumorphicNavbar, {
  type NeumorphicNavItem,
  type NeumorphicPalette,
} from "@/components/ui/neumorphic-navbar";
import { components } from "@/lib/component-registry";
import { LabMark, LabWordmark } from "./icons";

const NAV_ITEMS: readonly NeumorphicNavItem[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "components", label: "Components", href: "/#collection" },
  { id: "about", label: "About", href: "/about" },
];

/** Matches the page background so the bar reads as softly raised from it. */
const PALETTE: NeumorphicPalette = {
  surface: "#fafbfc",
  shadow: "#d5d9e2",
  light: "#ffffff",
};

function activeItem(pathname: string) {
  if (pathname.startsWith("/components")) return "components";
  if (pathname.startsWith("/about")) return "about";
  return "home";
}

export function SiteHeader() {
  const pathname = usePathname();
  const latest = components[0];

  return (
    <header className="sticky top-0 z-30 bg-[#fafbfc]/85 px-4 py-3 backdrop-blur-xl sm:px-6">
      <NeumorphicNavbar
        embedded
        palette={PALETTE}
        linkAs={Link}
        items={NAV_ITEMS}
        activeId={activeItem(pathname)}
        brand={<LabWordmark className="w-[118px] sm:w-[148px]" />}
        brandMark={<LabMark className="size-9 sm:size-10" />}
        brandHref="/"
        actionLabel={latest ? "Latest experiment" : null}
        actionHref={latest ? `/components/${latest.slug}` : undefined}
        ariaLabel="Main navigation"
      />
    </header>
  );
}
