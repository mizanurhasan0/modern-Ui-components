export const caseStudies = [
  {
    slug: "leadpylot-crm",
    number: "01",
    title: "LeadPylot CRM",
    category: "SaaS · Sales operations",
    role: "Lead frontend engineer",
    period: "Jan 2024 – Present",
    summary:
      "A CRM workspace for sales teams handling lead pipelines, detailed records, and live operational workflows.",
    challenge:
      "Sales teams needed to process leads across several pipeline views while keeping records, tasks, email workflows, and status changes in one place.",
    ownership:
      "I led the Next.js admin interface: realtime lead boards, authentication flows, data-heavy screens, and integrations with the platform APIs. Backend services and infrastructure were part of the wider team’s platform.",
    delivery: [
      "Multiple lead pipeline views with live updates and detailed lead records.",
      "Configurable data tables for sorting, filtering, grouping, columns, and bulk actions.",
      "Role-aware admin workflows, tasks, calendar, documents, and reporting interfaces.",
    ],
    engineering: [
      {
        title: "Client and server state",
        detail:
          "The frontend uses Zustand for interface state and TanStack Query for server data, keeping table controls and fetched records separate.",
      },
      {
        title: "Realtime operations",
        detail:
          "Socket.io updates feed notifications and live pipeline changes into the admin experience.",
      },
      {
        title: "Platform integration",
        detail:
          "The Next.js interface connects to Node.js services backed by MongoDB and Redis, with tenant roles and configurable pipeline stages.",
      },
    ],
    flow: ["Lead enters", "Pipeline view", "Team action", "Live update"],
    evidence:
      "The delivered work includes the admin interface and its operational workflows. Usage and business impact figures have not been independently verified for this showcase.",
    availability:
      "Private product. A permitted walkthrough can be discussed during an interview; source code is not public.",
    tags: ["Next.js", "TypeScript", "TanStack Query", "Zustand", "Socket.io"],
  },
  {
    slug: "mypick",
    number: "02",
    title: "MyPick",
    category: "Marketplace · Social commerce",
    role: "Full-stack product engineer",
    period: "May 2025 – Aug 2026",
    summary:
      "A multi-vendor marketplace connecting sellers, promoters, and shoppers through storefront and operations portals.",
    challenge:
      "Sellers needed to manage products and orders; promoters needed shops, links, and commissions; shoppers needed a coherent path from discovery to checkout.",
    ownership:
      "I worked across the customer storefront, promoter experience, admin and seller portals, and the NestJS marketplace API.",
    delivery: [
      "Catalog, product, cart, and checkout flows in the customer storefront.",
      "Promoter shops and links with attribution, commission, wallet, and payout workflows.",
      "Seller and admin tools for catalog, inventory, orders, roles, and reporting.",
    ],
    engineering: [
      {
        title: "One commerce data source",
        detail:
          "A modular NestJS API coordinates users, catalog, orders, commissions, wallets, and admin configuration across the portals.",
      },
      {
        title: "Portal-specific interfaces",
        detail:
          "Next.js storefront and operations interfaces use TanStack Query with Zustand or Redux for server cache and local UI state.",
      },
      {
        title: "Access and updates",
        detail:
          "Role policies, JWT and Firebase authentication, and Socket.io notifications support the different seller, promoter, shopper, and admin workflows.",
      },
    ],
    flow: ["Seller lists", "Promoter shares", "Shopper buys", "Order and commission"],
    evidence:
      "The product includes separate storefront, admin, partner, and API demos. Adoption, conversion, and revenue outcomes have not been verified for this showcase.",
    availability:
      "Public product demos exist; this page keeps the case study within Component Lab. A walkthrough can be shared during an interview.",
    tags: ["Next.js", "NestJS", "TypeScript", "MongoDB", "Redis"],
  },
] as const;

export type CaseStudy = (typeof caseStudies)[number];

export function getCaseStudy(slug: string) {
  return caseStudies.find((study) => study.slug === slug);
}
