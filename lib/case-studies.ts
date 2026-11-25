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
  {
    slug: "cartpos",
    number: "03",
    title: "CartPOS",
    category: "Retail · Multi-store point of sale",
    role: "Full-stack engineer",
    period: "2022",
    summary:
      "A multi-store point-of-sale and inventory platform where superadmins manage organizations, admins run a store, and cashiers sell from a POS screen.",
    challenge:
      "Retail teams needed one system for selling at the counter, tracking stock, handling refunds, and reviewing performance, with each person seeing only what their role allows and changes appearing without a page refresh.",
    ownership:
      "I built the full stack: the React 19 interface, the Express REST and Socket.IO API, the MongoDB data model, and the Docker-based setup with demo seed scripts. Permissions are enforced on the server, not only hidden in the UI.",
    delivery: [
      "Three roles (Superadmin, Admin, Cashier) with API-level permission checks, plus organization management where superadmins create stores and their admins.",
      "A cashier POS screen with product search, categories, cart, payment, and printable bills, backed by bills, refunds, and searchable sales history.",
      "Inventory with categories, add, edit, and restock flows, store and platform dashboards with charts, and self-service profile and password changes.",
    ],
    engineering: [
      {
        title: "Authorization on the server",
        detail:
          "JWT authentication, bcrypt password hashing, and rate limiting protect the API, and every route checks the caller’s role so the UI is never the only gate.",
      },
      {
        title: "Realtime updates",
        detail:
          "Socket.IO pushes changes to connected clients, while Redux Toolkit holds client state and Axios handles REST calls from the Vite-built React app.",
      },
      {
        title: "Data and local setup",
        detail:
          "Mongoose models back stores, users, products, bills, and expenses, with MongoDB 8 in Docker, an init script that creates a superadmin, and seed scripts for demo data.",
      },
    ],
    flow: ["Superadmin creates store", "Admin stocks inventory", "Cashier rings up sale", "Bills, refunds, and charts"],
    evidence:
      "The project is a working full-stack application, shown here with screens captured for each role. It has about 204 frontend and 60 backend source files. User counts, deployment details, and performance results are not claimed.",
    availability:
      "Source code is not published on this site. A role-by-role walkthrough can be shared during an interview.",
    tags: ["React 19", "Node.js", "Express", "MongoDB", "Socket.IO"],
    stack: [
      {
        group: "Frontend",
        items: [
          "React 19",
          "Vite 8",
          "React Router 7",
          "Redux Toolkit",
          "Tailwind CSS 4",
          "React Hook Form",
          "React Hot Toast",
          "Axios",
          "Socket.IO client",
          "ApexCharts",
          "react-to-print",
          "ESLint (Airbnb)",
        ],
      },
      {
        group: "Backend",
        items: [
          "Node.js",
          "Express 5",
          "MongoDB",
          "Mongoose 9",
          "Socket.IO",
          "JWT",
          "bcrypt",
          "express-rate-limit",
          "cookie-parser",
          "CORS",
          "Nodemailer",
          "web-push",
          "Orama search",
          "Babel",
          "Jest",
          "Supertest",
          "Nginx config",
        ],
      },
      {
        group: "Infrastructure",
        items: ["MongoDB 8 in Docker", "Superadmin init script", "Demo seed scripts"],
      },
    ],
    screenshots: [
      { src: "/work/cartpos/01_Login.png", alt: "CartPOS sign-in screen", caption: "Sign-in" },
      { src: "/work/cartpos/02_Superadmin_Dashboard.png", alt: "Superadmin platform dashboard with store totals and a store list", caption: "Superadmin · Platform dashboard" },
      { src: "/work/cartpos/03_Organizations.png", alt: "Organizations table listing each store, its owner, and status", caption: "Superadmin · Organizations" },
      { src: "/work/cartpos/04_Admin_Dashboard.png", alt: "Store admin dashboard with sales and purchase overview, a sales chart, and top items", caption: "Admin · Store dashboard" },
      { src: "/work/cartpos/05_Inventory.png", alt: "Inventory table with stock levels, prices, and restock and add item actions", caption: "Admin · Inventory" },
      { src: "/work/cartpos/06_Cashier_POS.png", alt: "Cashier point-of-sale screen with a product grid and a bill containing four items", caption: "Cashier · POS sales screen" },
      { src: "/work/cartpos/07_Sales_History.png", alt: "Sales history table filtered by day, week, month, and year", caption: "Admin · Sales history" },
      { src: "/work/cartpos/08_Accounts.png", alt: "Accounts page with money received and money spent charts and a transaction table", caption: "Admin · Accounts" },
      { src: "/work/cartpos/09_Store_Users.png", alt: "Store users management table", caption: "Admin · Store users" },
    ],
  },
  {
    slug: "workgrid",
    number: "04",
    title: "Workgrid",
    category: "SaaS · Project management",
    role: "Full-stack engineer",
    period: "2023",
    summary:
      "A project-management workspace that combines sprint and task tracking, team chat, video calls, and notifications, with owner, admin, and member roles.",
    challenge:
      "Teams juggling tasks in one tool and conversations in another lose context. They needed planning, discussion, and alerts in one workspace, with access that matches each person’s role.",
    ownership:
      "I built the React 19 client and the Express 5 API with its Socket.IO and peer-signalling servers. The backend started from an MIT-licensed REST boilerplate, which I moved to Express 5, Mongoose 9, Orama search, and HTTP/2, adding validation and bug fixes.",
    delivery: [
      "Spaces and projects with task lists grouped into backlog, bug, and sprint sections, covering status, priority, estimates, story points, due dates, time tracking, subtasks, and bulk actions.",
      "A task detail panel with activity history, rich-text descriptions, and per-user notifications that can be marked read or archived.",
      "Direct and project chats with reactions plus voice and video calls, a members screen with an invite link and access levels, and light and dark themes.",
    ],
    engineering: [
      {
        title: "Roles and sessions",
        detail:
          "Owner, admin, and member roles control what each person sees and manages. Login issues a JWT in an HTTP-only cookie that lasts 7 days, or 30 with remember me, and passwords are hashed with bcrypt.",
      },
      {
        title: "Realtime and calls",
        detail:
          "Socket.IO delivers chat messages, reactions, and notifications. Video and voice calls use PeerJS with a peer signalling server, and chat HTML is sanitised against an allow-list before it is stored.",
      },
      {
        title: "Search and data",
        detail:
          "Mongoose models on MongoDB back projects, tasks, sprints, chats, and notifications. An Orama search index is persisted to disk, and the repo ships a Postman collection and demo seed scripts.",
      },
    ],
    flow: ["Owner sets up spaces", "Team plans sprints and tasks", "Chat and calls in context", "Notifications keep everyone in sync"],
    evidence:
      "The project is a working full-stack application, shown here with screens captured for each role. It has roughly 255 frontend and 73 backend source files. User counts, deployment details, and performance results are not claimed.",
    availability:
      "Source code is not published on this site. A role-by-role walkthrough can be shared during an interview.",
    tags: ["React 19", "Node.js", "Express", "MongoDB", "Socket.IO"],
    stack: [
      {
        group: "Frontend",
        items: [
          "React 19",
          "Vite 8",
          "React Router 7",
          "Redux Toolkit",
          "Tailwind CSS 4",
          "React Hook Form",
          "React Select",
          "React Quill",
          "react-markdown",
          "Axios",
          "Socket.IO client",
          "PeerJS",
          "Lucide icons",
          "Vitest",
          "Testing Library",
          "ESLint (jsx-a11y)",
        ],
      },
      {
        group: "Backend",
        items: [
          "Node.js 24",
          "Express 5",
          "MongoDB",
          "Mongoose 9",
          "Socket.IO 4",
          "PeerJS server",
          "JWT",
          "bcrypt",
          "sanitize-html",
          "Nodemailer",
          "web-push",
          "Orama search",
          "Babel",
          "Nginx config",
        ],
      },
    ],
    screenshots: [
      { src: "/work/workgrid/01_Sign_In.png", alt: "Workgrid sign-in screen", caption: "Sign-in" },
      { src: "/work/workgrid/02_Owner_Project_Tasks.png", alt: "Owner view of a project with backlog and bug task lists showing status, assignee, due date, estimate, and priority", caption: "Owner · Project task lists" },
      { src: "/work/workgrid/03_Task_Details.png", alt: "Task detail side panel with status, story points, dates, priority, time tracking, and description", caption: "Task details" },
      { src: "/work/workgrid/04_Owner_Members_Roles.png", alt: "Settings dialog with an invite link and a members table with access levels", caption: "Owner · Members and access levels" },
      { src: "/work/workgrid/05_Notifications.png", alt: "Notifications inbox with a task detail panel", caption: "Notifications" },
      { src: "/work/workgrid/06_Team_Chat.png", alt: "Direct message conversation with call and video buttons", caption: "Team chat and calls" },
      { src: "/work/workgrid/07_Dark_Mode.png", alt: "Project task lists in dark mode", caption: "Dark mode" },
      { src: "/work/workgrid/08_Admin_Mobile_Project.png", alt: "Admin view of the Mobile App Launch project with its folders and task lists", caption: "Admin · Project folders" },
      { src: "/work/workgrid/09_Member_View.png", alt: "Member view showing only the projects assigned to that member", caption: "Member · Assigned projects" },
    ],
  },
] as const;

export type CaseStudy = (typeof caseStudies)[number];

export function getCaseStudy(slug: string) {
  return caseStudies.find((study) => study.slug === slug);
}
