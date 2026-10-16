"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NeumorphicNavbar, {
  type NeumorphicNavItem,
  type NeumorphicPalette,
} from "@/components/ui/neumorphic-navbar";
import { contactHref } from "@/lib/portfolio-profile";
import { LabMark, LabWordmark } from "./icons";

const NAV_ITEMS: readonly NeumorphicNavItem[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "work", label: "Work", href: "/#selected-work" },
  { id: "components", label: "Components", href: "/#collection" },
  { id: "about", label: "About", href: "/about" },
  { id: "contact", label: "Contact", href: contactHref },
];

/** Matches the page background so the bar reads as softly raised from it. */
const PALETTE: NeumorphicPalette = {
  surface: "#fafbfc",
  shadow: "#d5d9e2",
  light: "#ffffff",
};

function activeItem(pathname: string) {
  if (pathname.startsWith("/components")) return "components";
  if (pathname.startsWith("/work")) return "work";
  if (pathname.startsWith("/about")) return "about";
  return "home";
}

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 bg-transparent py-3">
      <div className="site-container site-header-container">
        <NeumorphicNavbar
          embedded
          palette={PALETTE}
          linkAs={Link}
          items={NAV_ITEMS}
          activeId={activeItem(pathname)}
          brand={<LabWordmark className="w-[118px] sm:w-[148px]" />}
          brandMark={<LabMark className="size-9 sm:size-10" />}
          brandHref="/"
          actionLabel="Email me"
          actionHref={contactHref}
          ariaLabel="Main navigation"
        />
      </div>
    </header>
  );
}
