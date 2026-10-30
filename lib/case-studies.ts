export const caseStudies = [
  {
    slug: "sales-crm",
    number: "01",
    title: "Sales CRM Workspace",
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
    screenshots: [
      { src: "/work/sales-crm/01_CRM_Login.png", alt: "Sales CRM sign-in screen", caption: "Sign-in" },
      { src: "/work/sales-crm/02_Leads_Management.png", alt: "Lead management table with pipeline records", caption: "Lead management" },
      { src: "/work/sales-crm/03_VoIP_Servers.png", alt: "VoIP server operations dashboard", caption: "VoIP servers" },
      { src: "/work/sales-crm/04_Security_Monitoring.png", alt: "Security monitoring dashboard", caption: "Security monitoring" },
      { src: "/work/sales-crm/05_Email_Inbox.png", alt: "CRM email inbox and message view", caption: "Email inbox" },
      { src: "/work/sales-crm/06_Lead_Details.png", alt: "Lead record details and activity history", caption: "Lead details" },
      { src: "/work/sales-crm/07_Telegram_Bot.png", alt: "Telegram bot integration settings", caption: "Telegram integration" },
      { src: "/work/sales-crm/08_Layout_Configuration.png", alt: "Workspace layout configuration controls", caption: "Layout configuration" },
      { src: "/work/sales-crm/09_User_Management.png", alt: "User and role management screen", caption: "User management" },
      { src: "/work/sales-crm/10_Server_Management.png", alt: "Server management screen", caption: "Server management" },
    ],
  },
  {
    slug: "multi-vendor-marketplace",
    number: "02",
    title: "Multi-Vendor Marketplace",
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
    screenshots: [
      { src: "/work/multi-vendor-marketplace/warm_marketplace_home_living_homepage.png", alt: "Home and living marketplace storefront homepage", caption: "Storefront" },
      { src: "/work/multi-vendor-marketplace/modern_creator_shopping_dashboard.png", alt: "Creator shopping feed with product cards and earnings", caption: "Creator shopping" },
      { src: "/work/multi-vendor-marketplace/modern_e_commerce_products_dashboard.png", alt: "Marketplace product catalog and inventory dashboard", caption: "Product catalog" },
      { src: "/work/multi-vendor-marketplace/modern_marketplace_admin_dashboard.png", alt: "Marketplace administration analytics dashboard", caption: "Admin overview" },
      { src: "/work/multi-vendor-marketplace/professional_profile_dashboard.png", alt: "Creator public profile dashboard", caption: "Creator profile" },
    ],
  },
] as const;

export type CaseStudy = (typeof caseStudies)[number];

export function getCaseStudy(slug: string) {
  return caseStudies.find((study) => study.slug === slug);
}
