"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ComponentStyles } from "./component-styles";

export type CrmDashboardView =
  "overview" | "orders" | "ecosystem" | "customers" | "performance";
export type CrmDateRange = "week" | "month" | "year";
export type CrmOrderStatus =
  "processing" | "verified" | "packing" | "in-dispatch" | "shipped";
export interface CrmOrder {
  id: string;
  product: string;
  customer: string;
  status: CrmOrderStatus;
}
export interface CrmIntegration {
  id: string;
  name: string;
  category: string;
  statusLabel: string;
  latency: string;
  enabled: boolean;
  color: string;
}
export interface CrmDashboardReport {
  view: CrmDashboardView;
  range: CrmDateRange;
  quarter: number;
  orders: readonly CrmOrder[];
  revenue: readonly number[];
  integrations: readonly CrmIntegration[];
}
export interface GlassyCrmDashboardProps {
  className?: string;
  userName?: string;
  /** A fixed label keeps the reference presentation deterministic. */
  dateLabel?: string;
  initialView?: CrmDashboardView;
  initialRange?: CrmDateRange;
  orders?: readonly CrmOrder[];
  /** Up to 12 nonnegative revenue samples. */
  revenue?: readonly number[];
  integrations?: readonly CrmIntegration[];
  onViewChange?: (view: CrmDashboardView) => void;
  onDateRangeChange?: (range: CrmDateRange) => void;
  onOrderDispatch?: (
    orders: readonly CrmOrder[],
    signal: AbortSignal,
  ) => void | Promise<void>;
  onIntegrationChange?: (id: string, enabled: boolean) => void;
  /** Replaces the built-in report preview, for integration with an export service. */
  onExport?: (report: CrmDashboardReport) => void;
}

const DEFAULT_ORDERS: readonly CrmOrder[] = [
  {
    id: "ORD-8942",
    product: "MacBook Air M2",
    customer: "Sophia R.",
    status: "in-dispatch",
  },
  {
    id: "ORD-8941",
    product: "AirPods Pro 2",
    customer: "Liam Chen",
    status: "packing",
  },
  {
    id: "ORD-8940",
    product: "Apple Watch S9",
    customer: "Emma Wilson",
    status: "verified",
  },
  {
    id: "ORD-8939",
    product: "JBL Charge 5",
    customer: "Noah Miller",
    status: "processing",
  },
];
const DEFAULT_REVENUE = [
  20000, 10300, 14847, 12800, 15200, 18400, 20000, 12000,
];
const DEFAULT_INTEGRATIONS: readonly CrmIntegration[] = [
  {
    id: "shopify",
    name: "Shopify Store",
    category: "E-Commerce",
    statusLabel: "Live Sync",
    latency: "18ms",
    enabled: true,
    color: "#42c992",
  },
  {
    id: "stripe",
    name: "Stripe Payments",
    category: "Payments",
    statusLabel: "Active Webhooks",
    latency: "24ms",
    enabled: true,
    color: "#8772f9",
  },
  {
    id: "whatsapp",
    name: "WhatsApp CRM",
    category: "Messaging",
    statusLabel: "34 Chats Online",
    latency: "32ms",
    enabled: true,
    color: "#42c992",
  },
  {
    id: "klaviyo",
    name: "Klaviyo Email",
    category: "Marketing",
    statusLabel: "98% Delivery",
    latency: "40ms",
    enabled: true,
    color: "#63c9e8",
  },
  {
    id: "slack",
    name: "Slack Bot Alert",
    category: "DevOps",
    statusLabel: "Channel Active",
    latency: "12ms",
    enabled: true,
    color: "#db6baf",
  },
  {
    id: "quickbooks",
    name: "QuickBooks Cloud",
    category: "Accounting",
    statusLabel: "Disconnected",
    latency: "—",
    enabled: false,
    color: "#53afae",
  },
];
const PRODUCTS = [
  { name: "Apple MacBook Air M2", color: "#ff8b39", value: 26 },
  { name: "Apple Watch Series 9", color: "#3cbfe9", value: 23 },
  { name: "Acoustics JBL Charge 5", color: "#ffd650", value: 24 },
  { name: "Acoustics Divoom SongBird-HQ", color: "#ef6577", value: 11 },
  { name: "Apple AirPods Pro 2", color: "#38c7a3", value: 16 },
];
const NAVIGATION: { id: CrmDashboardView; label: string; icon: IconName }[] = [
  { id: "overview", label: "Overview", icon: "overview" },
  { id: "orders", label: "Orders & Fulfillment", icon: "orders" },
  { id: "ecosystem", label: "Connected Ecosystem", icon: "grid" },
  { id: "customers", label: "Customer Intelligence", icon: "people" },
  { id: "performance", label: "Performance & Audit", icon: "case" },
];
const VIEW_COPY: Record<
  CrmDashboardView,
  { title: string; emoji: string; description: string }
> = {
  overview: {
    title: "Hello",
    emoji: "👋",
    description: "This is what's happening in your store this month.",
  },
  orders: {
    title: "Orders & Fulfillment",
    emoji: "📦",
    description:
      "Real-time order dispatch tracking and carrier fulfillment queues.",
  },
  ecosystem: {
    title: "Connected Ecosystem",
    emoji: "⚡",
    description:
      "Manage active store plugins, cloud integrations, and API throughput.",
  },
  customers: {
    title: "Customer Intelligence",
    emoji: "👥",
    description:
      "Audience lifetime value, retention metrics, and VIP cohort analytics.",
  },
  performance: {
    title: "Performance & Audit",
    emoji: "📊",
    description:
      "Quarterly financial targets, EBITDA margins, and channel revenue.",
  },
};
const ORDER_LABELS: Record<CrmOrderStatus, string> = {
  processing: "Processing",
  verified: "Verified",
  packing: "Packing",
  "in-dispatch": "In Dispatch",
  shipped: "Shipped",
};
const RANGE_LABELS: Record<CrmDateRange, string> = {
  week: "This week",
  month: "This month",
  year: "This year",
};
const PROFILE_AVATAR =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAIAAABL1vtsAAAACXBIWXMAAAAAAAAAAQCEeRdzAAAABGNJQ1ABAQABlXPCVgAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABGdBTUEAALGPC/xhBQAABEpJREFUeJxNVFtz2kYU3qskJIEuXGyoiQ1OO5k607rjPPTJL33sj+gv7bQznfYhTZpLEwdKYwffbcASIBDSrrQ9wkmmGqFZ9vKd833nO4ubzSbGGH18GPywIkoppFie5Z/mc0xwjuV6nBFCRJ7DarHt/gw88AeAlCrOrD9IZbDrM0RW4FL1aa8iGOfFqEBh93NFoDxXOS+yyIssYAlACdOKmEkkIeYaEdLJMoinUHG8wGD35z8D3Q/8atX3NsrlcrW+AQGljJMkmQSjy4uLu/BWSsEYLeBAgTWEJITmmQGABBmmZba3vtzZ3v6i1YEdESZxHJsiggMb1a3d9tdH749PTo6XIoQZilYE/48IocSxnU6n83jvALLg1Dw9Pf3l2fPZbFZlGefc9Sp7j/cODw993//r9R+L5XIt3xoC2GY5cKZ7j37c3/+2ZJV1XZ9EwW9PB5chdd3Ogxq1bOv94NerIfru+5/29zYhgzdv3kSzVyAYy7I8y1JKULvd7nR2XNfLFDJKxvhkNJ6MN1o7rVZru4odx9lqqePjYwhu2fbu7u50On0/eCeEYGt5sc4rD3e/aTUfEqwrJHVuj0dLgqyKv8UNTycRR8yvtsdXUylNx6159VV7R4yvXt3e3jJgwRir1+uQhW3bhVUwhQKvVivP8xll0SKaozlldBZe+L5nGKWSYUhibjabtVotCAKmaRpIsv2g4zo+xhxMh7jIseh29jNppSUXKoXpnBBUMlq2ZRNjQ6QaYaCp4bhbSToEIhkQoZAJ51BtlROJU5jZaDSA7UhiSEQjml0uu6bJOEv1EjhFIAz7TcuCGSZlDrVgFF6WQWNwSsA24JCyU/Zr08kSypkpkmRKt+oQKEblHEKiGeOaZjDN4FAUUAOnqYDKADzwwiQBRUD2qu9fT1PwZUZzkRYDSqlu6EIKAnolSZqmH30BzRGEkySJibOSeZoijQKsnhoVrJlhlNwR7piVJrN8AY7GC85RrOK7xU0QjPIsLXpJiDQMw2g+F77giAO9Qv84Ho8n8SrWuOb7ZddzQTXP82YZnc/nzKaQAhgX+hmKWjCZ3J2enffrjY7newiJi/Pr31++BYND2zYajX8kezt8nQTTbqdb32uZFXOUXh5d/3keXC7xsiACgi2Xy16/51cfgQuevXzb6/WObwNKC50/DIc2EaARTUSv18+eYnBQbkSDwUCs4qKUMpfwJTQ+PTviz3Uo3t/vesCLmi6UDWwCrkAYyYykBofkJ+PBqnq3/VXb4No8UnE4X8upFASE5ZOTE7Bpt9u9vr4ZTgqecMEoKamSnGtSCLCm6TcPnjw5+GG/3+//fDSOb27YGkHBrUhA59XkdrQQeFGrV9zNdlQ8cQYmpQx619dKwOvfcB68+DDM6ejszBqvmFFb3xdgYYLvux60WF2JMAycxlalUimXHSEkEwkcXoSz4C4YyTmsvug/B3c4i+Li+g+KXmz1nfmREAAAAABJRU5ErkJggg==";
const SOPHIA_AVATAR =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAACXBIWXMAAAAAAAAAAQCEeRdzAAAABGNJQ1ABAQABlXPCVgAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABGdBTUEAALGPC/xhBQAABRJJREFUeJxVVVtvG0UUntmdvV+8vsSJwWlCkkooRVUjCEGhIPECiDd+Jm9UAvHAG0KpVEjShoaItkkTJ2l8ib22d9f2zu7McGadl56H0excvjnnO+d8i79+/CPGmCEGI8c5Qihncq4xIbhQEIYVvRgzBRW7HEbY4wKME1XNNQIzUqyK4iTCCjYMAyaUZrqCFFXBAuVZhnJOiMqRUBSVaJhzpun6bDYjqgIjB2OMICG9MDCLo7i+6FTKXgGE6r7PGKNpCrfUVNo4pfCk6bhwsRQ4jlt3bKff75+3O3E8kR5JXzCu1Wpf7m7Ztr23t6cSAp9jsNFoe3t7wXG6ne7r1mWrdXF72/c8d2Nj48GDB/V6HaD/ePbX/v6+DA9QXF37/rtvf/jqs3AQvtx7etvudlAehsPtRw+/+XzLRSJeaex8+snR0dHve08RSjdWGpv3V4KFD+Gu7pdc1yXAKFbx8vLyzs5Os9mAAIGgOImvr6cwWVtbg6CyJAHuKJ3Cp/vPy9PC4PIyU8EAa3NzkyiQL8HX7681730wM/Xcc5hhjPPcQIpb8n3bPjrYtzK6urL694vn6+vr1ZL/Mhq/OXsVDvvas4NyOXj0xWOAg9A4Rio8qKhy1HXd9/1ms6nMxrZjV2vVLM+MdFaulKvVmut6QVAejUbDcDidTMPoDA4vrW5UKhWScU6w0guHL45PmkvVV/+9wVgtB9VZjJI0JZQ1gqonKFHwBmxXS4aipHHSGw7K5UoYR+1+78kvv9WqNQK5FAo/v7iAFJmaSJIJlI/tOJhN3727ub6+hvd9lHme9/qqlWX08vJS17U4ThYXlyBrk2RycX5xcnJyl/7RMBqPY9dUHNu2NB1cHWf032G8v3+wtbWVdm6iYduzvHcXN88PDmcTGo0TmubN1RUol9sR7XQ7d0DADpSfaRouFIlhBkEwC28hoYeHh7u7u42V1U6nU202fn7ypNVqGQYBN2Gl1mjeu3fP8LBlWTL9cyCgueGZAHTfKvm2v2CUe3bNnMxqQ75QD4iVRYNp1p/U9RKlVLOsaS/st7sbKx8FpQXg584jTdMgR0Hg1+uLFdWEF1LfLwcB7XWvrq5oBryn0AUAMZ6MK165stToD/phOIiiyNRdQCAcQUUi6E7B8o9nqjekfrvXv71Njo6XO+2UTt7+9OuovgAuX81ifHb1EFlGJE6vOg5CSjwbnF86xIZoSNH0UiAcxwZlODs97fy532m3jSi0VAthlkySi/Y1aMEA55nIGeIpAv+kymSj0c3NTWOpSUqEgFBgjow0DxQ9vm6/Pj6enb1NWFRFlo11yihCKkLcwAYSUx3ZAaJSoTLOBAPWHN4115Ky5cumlXICikFp6xL6uxUwamNHF3JLnTuLHTjlYJtxiQjrGmEKUyBRkD7c64FUQGigaRiAhsMh7nTCMHSRwkWeI40Be1gCKTKxCmFMRbjIDq6C2AlBwQfKov4on1ICvMwTB/wDPhXguQmMQBLg/hyIC47eN+h4RcqPNJAK6DtSnBNZzvOcZaADmjnIEFGFwZAKeFjqNxGqvCxVGqpOPtw1EGd4IGjGxTRjMePQjJB5wZhUZXAVWOBSxcEbKe6MSyA8d6Pwa/47mBsczkQG5LI8J4X28zAeE0LOBeuJfKTKsgil9Cs+m0MUARbxiYKKLsEZEkN4Det5TkeT+K6yoRygUaHFkiQRkwxsyvOiXiUTc6D3zDRkrfNERaQalGH+P2IDI4xpSX8rAAAAAElFTkSuQmCC";

type IconName =
  | "logo"
  | "overview"
  | "orders"
  | "grid"
  | "people"
  | "case"
  | "target"
  | "exit"
  | "search"
  | "settings"
  | "bell"
  | "calendar"
  | "arrow"
  | "check"
  | "close"
  | "diamond";
function Icon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  const paths: Record<IconName, ReactNode> = {
    logo: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M16 6c-7-2-12 6-7 10 5 4 12-3 7-7-3-3-8 2-5 4 2 2 5-1 3-2" />
      </>
    ),
    overview: (
      <>
        <path d="M12 3a9 9 0 1 0 9 9h-9z" />
        <path d="M15 3v6h6a9 9 0 0 0-6-6Z" />
      </>
    ),
    orders: (
      <>
        <path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6" />
      </>
    ),
    grid: (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5" />
      </>
    ),
    case: (
      <>
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V3h8v4M3 12h18M10 11v3h4v-3" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="1" />
      </>
    ),
    exit: (
      <>
        <path d="M10 4H4v16h6M8 12h13m-4-4 4 4-4 4" />
      </>
    ),
    search: (
      <>
        <circle cx="10" cy="10" r="6" />
        <path d="m15 15 5 5" />
      </>
    ),
    settings: (
      <>
        <path d="m12 3 2 3 4-1 1 4 3 3-3 2-1 4-4-1-2 4-2-4-4 1-1-4-3-2 3-3 1-4 4 1z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    bell: (
      <>
        <path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5zM10 20h4M12 2v2" />
      </>
    ),
    calendar: (
      <>
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M4 10h16M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2" />
      </>
    ),
    arrow: <path d="M7 17 17 7M7 7h10v10" />,
    check: <path d="m5 12 4 4 10-10" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    diamond: (
      <>
        <path d="m3 8 4-5h10l4 5-9 13zM3 8h18M7 3l5 18 5-18" />
      </>
    ),
  };
  return (
    <svg
      className={`crm-icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}

function Action({
  children,
  label,
  onClick,
  className = "",
  disabled = false,
}: {
  children: ReactNode;
  label?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return onClick ? (
    <button
      type="button"
      className={className}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  ) : (
    <span className={className} aria-hidden={label ? true : undefined}>
      {children}
    </span>
  );
}
function Panel({
  title,
  subtitle,
  children,
  className = "",
  action,
  accessory,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: () => void;
  accessory?: ReactNode;
}) {
  return (
    <section className={`crm-panel ${className}`}>
      {title && (
        <div className="crm-panel-heading">
          <div>
            <h3>{title}</h3>
            {subtitle && <span className="crm-subtitle">{subtitle}</span>}
          </div>
          {accessory ?? (
            <Action
              className="crm-arrow"
              label={`View ${title} details`}
              onClick={action}
            >
              <Icon name="arrow" />
            </Action>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
function Metric({
  label,
  value,
  change,
  tone = "green",
  highlighted,
  action,
}: {
  label: string;
  value: string;
  change: string;
  tone?: string;
  highlighted?: boolean;
  action?: () => void;
}) {
  return (
    <section
      className={`crm-panel crm-metric ${highlighted ? "crm-metric-purple" : ""}`}
    >
      <div className="crm-metric-title">
        <span>{label}</span>
        <Action
          className="crm-arrow"
          label={`View ${label} details`}
          onClick={action}
        >
          <Icon name="arrow" />
        </Action>
      </div>
      <div className="crm-metric-bottom">
        <strong>{value}</strong>
        <span className={`crm-badge crm-tone-${tone}`}>{change}</span>
      </div>
      <small>This month vs last</small>
    </section>
  );
}
function Facets() {
  return (
    <svg
      className="crm-facets"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="1440" height="900" fill="#080a0e" />
      <g stroke="#3c3d44" strokeWidth="2">
        <path
          fill="#171820"
          d="M0 0h250L108 164 0 110zM250 0h197L200 308 108 164zM0 110l108 54L0 365zM0 520l200-212 90 180L105 745 0 677zM0 900V677l105 68-17 155z"
        />
        <path
          fill="#10111a"
          d="m447 0 146 128-303 360-90-180zM447 0h385L593 128zM290 488l303-360 70 165-244 295zM105 745l314-157 67 176-171 136H88z"
        />
        <path
          fill="#20212a"
          d="m1000 0-168 210L593 128 832 0zM1440 0v217L1130 69zM1440 217v112l-190-117-120-143zM1440 470v188l-224-195 34-251z"
        />
        <path
          fill="#10181b"
          d="m1440 658-90 100-134-295zM1440 658v242h-163l73-142zM1277 900h-185l124-437 134 295zM663 293l169-83 221 321-97 369H741l-322-312z"
        />
      </g>
      <g fill="#040508" opacity=".85">
        <path d="m40 10 24 6L10 99H0zM218 117l16 10-140 199-17-18zM1160 148l18-13 262 245v32zM1230 755l28 23-40 122h-43z" />
      </g>
    </svg>
  );
}
function Avatar({ customer = false }: { customer?: boolean }) {
  // These tiny native reference crops are embedded so copied code needs no asset setup.
  return (
    <span
      className={`crm-avatar ${customer ? "crm-customer-avatar" : ""}`}
      style={{
        backgroundImage: `url("${customer ? SOPHIA_AVATAR : PROFILE_AVATAR}")`,
      }}
      role="img"
      aria-label={customer ? "Sophia Reynolds" : "Profile avatar"}
    />
  );
}

type Tooltip = { chart: string; index: number };
type ChartEvents = {
  onHighlight?: (chart: string, index: number) => void;
  tooltip?: Tooltip;
  idPrefix?: string;
};
function pointEvents(
  chart: string,
  index: number,
  onHighlight?: ChartEvents["onHighlight"],
) {
  return onHighlight
    ? {
        tabIndex: 0,
        role: "button" as const,
        onMouseEnter: () => onHighlight(chart, index),
        onFocus: () => onHighlight(chart, index),
        onClick: () => onHighlight(chart, index),
        onKeyDown: (event: React.KeyboardEvent<SVGGElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onHighlight(chart, index);
          }
        },
      }
    : {};
}
function Tip({
  x,
  y,
  text,
  width = 83,
}: {
  x: number;
  y: number;
  text: string;
  width?: number;
}) {
  const left = Math.max(3, Math.min(417 - width, x - width / 2));
  return (
    <g className="crm-chart-tip" aria-hidden="true">
      <rect x={left} y={y} width={width} height="19" rx="5" fill="#f6f8fc" />
      <path d={`M${x - 3} ${y + 19}l3 4 3-4`} fill="#f6f8fc" />
      <text
        x={left + width / 2}
        y={y + 12.7}
        fill="#111725"
        textAnchor="middle"
      >
        {text}
      </text>
    </g>
  );
}
function RevenueChart({
  revenue,
  ...events
}: ChartEvents & { revenue: readonly number[] }) {
  const max = Math.max(25000, ...revenue);
  const selected =
    events.tooltip?.chart === "revenue"
      ? events.tooltip.index
      : Math.min(2, revenue.length - 1);
  const count = Math.max(1, revenue.length);
  const gradient = events.idPrefix ? `${events.idPrefix}-revenue` : undefined;
  return (
    <svg
      className="crm-chart crm-revenue-chart"
      viewBox="0 0 420 228"
      role={events.onHighlight ? "group" : "img"}
      aria-label={`Revenue chart: ${revenue.map((value) => `$${value.toLocaleString("en-US")}`).join(", ")}`}
    >
      {gradient && (
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#c2afff" />
            <stop offset="1" stopColor="#7660e9" />
          </linearGradient>
        </defs>
      )}
      {[0, 1, 2, 3, 4, 5].map((tick) => (
        <g key={tick}>
          <text
            className="crm-axis"
            x="35"
            y={205 - tick * 37}
            textAnchor="end"
          >
            $
            {((tick * max) / 5).toLocaleString("en-US", {
              maximumFractionDigits: 0,
            })}
          </text>
          <path className="crm-grid-line" d={`M43 ${201 - tick * 37}h366`} />
        </g>
      ))}
      {revenue.map((value, index) => {
        const x = 51 + (index * 357) / count;
        const h = (value / max) * 185;
        return (
          <g
            key={index}
            aria-label={`Sample ${index + 1}, revenue $${value.toLocaleString("en-US")}`}
            {...pointEvents("revenue", index, events.onHighlight)}
          >
            <rect
              className="crm-revenue-bar crm-bar-enter"
              style={{ "--crm-delay": `${index * 55}ms` } as CSSProperties}
              x={x}
              y={201 - h}
              width={Math.min(20, 235 / count)}
              height={h}
              rx="4"
              fill={gradient ? `url(#${gradient})` : "#9b83f5"}
            />
            <rect
              x={x - 5}
              y="16"
              width={357 / count - 2}
              height="192"
              fill="transparent"
            />
            <text
              className="crm-axis"
              x={x + 8}
              y="218"
              textAnchor="middle"
            >{`AUG ${index + 1}`}</text>
          </g>
        );
      })}
      {selected >= 0 && selected < revenue.length && (
        <Tip
          x={60 + (selected * 357) / count}
          y={Math.max(3, 173 - (revenue[selected] / max) * 185)}
          text={`$${revenue[selected].toLocaleString("en-US")}`}
          width={63}
        />
      )}
    </svg>
  );
}
function Donut({ idPrefix, tooltip, onHighlight }: ChartEvents) {
  const selected = tooltip?.chart === "category" ? tooltip.index : -1;
  return (
    <div className="crm-donut-wrap">
      <svg
        viewBox="0 0 160 160"
        role={onHighlight ? "group" : "img"}
        aria-label="Sales by category, MacBook Air 26%, Apple Watch 23%, JBL Charge 24%, Divoom 11%, AirPods 16%"
      >
        <circle
          cx="80"
          cy="80"
          r="53"
          fill="none"
          stroke="#ffffff08"
          strokeWidth="15"
        />
        {PRODUCTS.map((product, index) => {
          const offset = PRODUCTS.slice(0, index).reduce(
            (sum, item) => sum + item.value,
            0,
          );
          return (
            <g
              key={product.name}
              aria-label={`${product.name}: ${product.value}%`}
              {...pointEvents("category", index, onHighlight)}
            >
              <circle
                className="crm-donut-segment crm-donut-enter"
                style={
                  {
                    "--crm-delay": `${index * 80}ms`,
                    "--crm-dash": `${product.value - 2} ${102 - product.value}`,
                  } as CSSProperties
                }
                cx="80"
                cy="80"
                r="53"
                pathLength="100"
                fill="none"
                stroke={product.color}
                strokeWidth={selected === index ? 19 : 15}
                strokeDasharray={`${product.value - 2} ${102 - product.value}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 80 80)"
              />
            </g>
          );
        })}
        {selected >= 0 && (
          <text x="80" y="85" textAnchor="middle" className="crm-donut-value">
            {PRODUCTS[selected].value}%
          </text>
        )}
      </svg>
      <ul className="crm-legend">
        {PRODUCTS.map((product, index) => (
          <li key={product.name}>
            <Action
              className={
                selected === index
                  ? "crm-legend-item crm-selected"
                  : "crm-legend-item"
              }
              onClick={
                onHighlight ? () => onHighlight("category", index) : undefined
              }
            >
              <i style={{ background: product.color }} />
              {product.name}
            </Action>
          </li>
        ))}
      </ul>
      {idPrefix && (
        <span className="crm-sr-only">Choose a category for its share.</span>
      )}
    </div>
  );
}
function SmoothChart({
  kind,
  ...events
}: ChartEvents & { kind: "velocity" | "cohort" }) {
  const velocity = kind === "velocity";
  const velocityValues = [75, 150, 110, 190, 285, 170, 130];
  const organicValues = [800, 1200, 1700, 2150, 2500, 2850];
  const paidValues = [460, 710, 1000, 1350, 1600, 1800];
  const points = (velocity ? velocityValues : organicValues).map(
    (value, index) => [
      (velocity ? 43 : 45) + index * (velocity ? 58 : 62),
      267 - (value / (velocity ? 300 : 3000)) * 248,
    ],
  );
  const secondary = paidValues.map((value, index) => [
    45 + index * 62,
    267 - (value / 3000) * 248,
  ]);
  // Horizontal tangents at each checkpoint reproduce the reference's smooth spline.
  const spline = (coordinates: number[][]) =>
    coordinates
      .map(([x, y], index) => {
        if (!index) return `M${x} ${y}`;
        const [previousX, previousY] = coordinates[index - 1];
        const midpoint = (previousX + x) / 2;
        return `C${midpoint} ${previousY} ${midpoint} ${y} ${x} ${y}`;
      })
      .join(" ");
  const path = spline(points);
  const secondaryPath = spline(secondary);
  const chart = velocity ? "velocity" : "cohort";
  const selected =
    events.tooltip?.chart === chart ? events.tooltip.index : velocity ? 4 : 5;
  const gradient = events.idPrefix ? `${events.idPrefix}-${chart}` : undefined;
  return (
    <svg
      className={`crm-chart crm-line-chart ${velocity ? "crm-velocity-chart" : ""}`}
      viewBox="0 0 420 288"
      role={events.onHighlight ? "group" : "img"}
      aria-label={
        velocity
          ? "Fulfillment velocity, 75, 150, 110, 190, 285, 170, 130 orders."
          : "Cohort growth: organic referrals rise from 800 to 2850; paid conversions rise from 460 to 1800."
      }
    >
      {gradient && (
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop
              stopColor={velocity ? "#38bde4" : "#b581f7"}
              stopOpacity=".17"
            />
            <stop offset="1" stopColor="#14343e" stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {[0, 1, 2, 3, 4].map((tick) => (
        <g key={tick}>
          <text
            className="crm-axis"
            x="29"
            y={272 - tick * 62}
            textAnchor="end"
          >
            {velocity ? tick * 75 : [0, 750, "1.5k", "2.2k", "3.0k"][tick]}
          </text>
          <path className="crm-grid-line" d={`M38 ${267 - tick * 62}h365`} />
        </g>
      ))}
      <path
        d={`${path}L${velocity ? 391 : 355} 267H43Z`}
        fill={gradient ? `url(#${gradient})` : "#357e9610"}
      />
      <path
        className="crm-line-enter"
        d={path}
        fill="none"
        stroke={velocity ? "#54c9e9" : "#c395fc"}
        strokeWidth="3.2"
        pathLength="100"
      />
      {!velocity && (
        <path
          className="crm-line-enter"
          d={secondaryPath}
          fill="none"
          stroke="#39cda5"
          strokeWidth="3.2"
          pathLength="100"
        />
      )}
      {points.map(([x, y], index) => (
        <g
          key={index}
          aria-label={
            velocity
              ? `${[75, 150, 110, 190, 285, 170, 130][index]} orders`
              : `${[800, 1200, 1700, 2150, 2500, 2850][index]} organic, ${[460, 710, 1000, 1350, 1600, 1800][index]} paid`
          }
          {...pointEvents(chart, index, events.onHighlight)}
        >
          <circle
            className="crm-point"
            cx={x}
            cy={y}
            r={selected === index ? 5 : 4}
            fill="#f9f5ff"
            stroke="#27283a"
            strokeWidth="2"
          />
          {!velocity && (
            <circle
              cx={secondary[index][0]}
              cy={secondary[index][1]}
              r="4"
              fill="#3cd5ac"
            />
          )}
          <rect x={x - 16} y="10" width="32" height="260" fill="transparent" />
        </g>
      ))}
      <text className="crm-axis" x="45" y="285">
        {velocity ? "08:00" : "JAN"}
      </text>
      {selected >= 0 && selected < points.length && (
        <Tip
          x={points[selected][0]}
          y={Math.max(2, points[selected][1] - 31)}
          width={velocity ? 101 : 155}
          text={
            velocity
              ? `${[75, 150, 110, 190, 285, 170, 130][selected]} orders${selected === 4 ? " (Peak)" : ""}`
              : `+${[800, 1200, 1700, 2150, 2500, 2850][selected]} organic | +${[460, 710, 1000, 1350, 1600, 1800][selected]} paid`
          }
        />
      )}
    </svg>
  );
}
function ThroughputChart(events: ChartEvents) {
  const values = [
    [11, 8],
    [14, 9],
    [20, 14],
    [24.8, 19.5],
    [21, 16],
    [17, 12],
  ];
  const selected =
    events.tooltip?.chart === "throughput" ? events.tooltip.index : 3;
  return (
    <svg
      className="crm-chart"
      viewBox="0 0 420 190"
      role={events.onHighlight ? "group" : "img"}
      aria-label="Inbound and outbound integration throughput, peak inbound 24.8 thousand and outbound 19.5 thousand requests."
    >
      {[0, 1, 2, 3, 4].map((tick) => (
        <g key={tick}>
          <text
            className="crm-axis"
            x="31"
            y={169 - tick * 38}
            textAnchor="end"
          >
            {tick ? `${tick * 6}k req` : "0 req"}
          </text>
          <path className="crm-grid-line" d={`M39 ${165 - tick * 38}h371`} />
        </g>
      ))}
      {values.map(([inbound, outbound], index) => (
        <g
          key={index}
          aria-label={`${["02", "06", "10", "14", "18", "22"][index]}:00, inbound ${inbound}k, outbound ${outbound}k`}
          {...pointEvents("throughput", index, events.onHighlight)}
        >
          <rect
            className="crm-bar-enter"
            x={53 + index * 61}
            y={165 - inbound * 5.4}
            width="8"
            height={inbound * 5.4}
            rx="3"
            fill="#8c73ee"
            style={{ "--crm-delay": `${index * 60}ms` } as CSSProperties}
          />
          <rect
            className="crm-bar-enter"
            x={64 + index * 61}
            y={165 - outbound * 5.4}
            width="8"
            height={outbound * 5.4}
            rx="3"
            fill="#51bcce"
            style={{ "--crm-delay": `${index * 60 + 20}ms` } as CSSProperties}
          />
          <rect
            x={45 + index * 61}
            y="12"
            width="38"
            height="154"
            fill="transparent"
          />
          <text
            className="crm-axis"
            x={63 + index * 61}
            y="183"
            textAnchor="middle"
          >
            {["02", "06", "10", "14", "18", "22"][index]}:00
          </text>
        </g>
      ))}
      <Tip
        x={63 + selected * 61}
        y={Math.max(1, 138 - values[selected][0] * 5.4)}
        text={`In: ${values[selected][0]}k | Out: ${values[selected][1]}k${selected === 3 ? " (Peak)" : ""}`}
        width={151}
      />
    </svg>
  );
}
function Telemetry() {
  return (
    <div className="crm-telemetry">
      <svg
        viewBox="0 0 130 130"
        role="img"
        aria-label="API quota 85%, webhooks 78%, RAM cache 45%"
      >
        {[85, 78, 45].map((value, index) => (
          <g key={index}>
            <circle
              cx="65"
              cy="65"
              r={50 - index * 12}
              fill="none"
              stroke="#ffffff07"
              strokeWidth="6"
            />
            <circle
              className="crm-donut-enter"
              cx="65"
              cy="65"
              r={50 - index * 12}
              fill="none"
              stroke={["#52b5d1", "#9d85e9", "#42bb9b"][index]}
              strokeWidth="6"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray={`${value} ${100 - value}`}
              transform="rotate(-90 65 65)"
              style={
                {
                  "--crm-delay": `${index * 90}ms`,
                  "--crm-dash": `${value} ${100 - value}`,
                } as CSSProperties
              }
            />
          </g>
        ))}
      </svg>
      <div className="crm-list-metrics">
        <p>
          <i className="crm-dot crm-cyan" />
          API Quota (85%)<b>850k</b>
        </p>
        <p>
          <i className="crm-dot crm-purple" />
          Webhooks (78%)<b>Active</b>
        </p>
        <p>
          <i className="crm-dot crm-green" />
          RAM Cache (45%)<b>1.4 GB</b>
        </p>
      </div>
    </div>
  );
}
function CapsuleChart(events: ChartEvents) {
  const selected =
    events.tooltip?.chart === "capsule" ? events.tooltip.index : 2;
  const values = [98, 142, 185, 205];
  const gradient = events.idPrefix ? `${events.idPrefix}-capsule` : undefined;
  return (
    <svg
      className="crm-chart"
      viewBox="0 0 420 212"
      role={events.onHighlight ? "group" : "img"}
      aria-label="Quarterly target ranges: Q1 98k, Q2 142k, Q3 185k target hit, Q4 205k projected."
    >
      {gradient && (
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#64dcf3" />
            <stop offset="1" stopColor="#6250bd" />
          </linearGradient>
        </defs>
      )}
      {[0, 1, 2, 3, 4].map((tick) => (
        <g key={tick}>
          <text
            className="crm-axis"
            x="31"
            y={190 - tick * 43}
            textAnchor="end"
          >
            ${tick * 55}k
          </text>
          <path className="crm-grid-line" d={`M42 ${186 - tick * 43}h365`} />
        </g>
      ))}
      {values.map((value, index) => {
        const y = [110, 83, 56, 119][index];
        return (
          <g
            key={index}
            aria-label={`Q${index + 1}, $${value}k${index === 2 ? ", target hit" : index === 3 ? ", projected" : ""}`}
            {...pointEvents("capsule", index, events.onHighlight)}
          >
            <rect
              className="crm-capsule-enter"
              style={{ "--crm-delay": `${index * 80}ms` } as CSSProperties}
              x={89 + index * 89}
              y={y}
              width="24"
              height={index === 3 ? 27 : 53}
              rx="12"
              fill={gradient ? `url(#${gradient})` : "#798fe4"}
              stroke="#85cde666"
            />
            <text
              className="crm-capsule-label"
              x={101 + index * 89}
              y={y + 29}
              textAnchor="middle"
            >
              ${value}k
            </text>
            {index > 1 && (
              <>
                <text
                  className="crm-capsule-label"
                  x={101 + index * 89}
                  y={y + 41}
                  textAnchor="middle"
                >
                  ({index === 2 ? "Hit" : "Proj"})
                </text>
                <circle
                  className="crm-target-glow"
                  cx={101 + index * 89}
                  cy={y - 9}
                  r="3"
                  fill="#7cffde"
                />
              </>
            )}
            <rect
              x={78 + index * 89}
              y="15"
              width="47"
              height="174"
              fill="transparent"
            />
            <text
              className="crm-axis"
              x={101 + index * 89}
              y="205"
              textAnchor="middle"
            >
              Q{index + 1}
            </text>
          </g>
        );
      })}
      <Tip
        x={101 + selected * 89}
        y={2}
        text={`$${[50, 90, 95, 180][selected]}k - $${[110, 160, 195, 220][selected]}k - $${values[selected]}k${selected === 2 ? " (Hit)" : ""}`}
        width={145}
      />
    </svg>
  );
}

type ModalState =
  | { kind: "details"; title: string; text: string }
  | {
      kind:
        | "settings"
        | "notifications"
        | "profile"
        | "calendar"
        | "report"
        | "message"
        | "reset"
        | "help";
    }
  | null;
type SurfaceActions = {
  setView: (view: CrmDashboardView) => void;
  setRange: (range: CrmDateRange) => void;
  setQuery: (query: string) => void;
  open: (modal: Exclude<ModalState, null>) => void;
  filter: (value: "all" | "pending" | "shipped") => void;
  dispatch: () => void;
  toggleIntegration: (id: string) => void;
  setQuarter: (quarter: number) => void;
  exportReport: () => void;
  reward: () => void;
  highlight: (chart: string, index: number) => void;
};
type SurfaceProps = {
  view: CrmDashboardView;
  range: CrmDateRange;
  userName: string;
  dateLabel: string;
  orders: readonly CrmOrder[];
  revenue: readonly number[];
  integrations: readonly CrmIntegration[];
  quarter: number;
  query?: string;
  orderFilter?: "all" | "pending" | "shipped";
  dispatching?: boolean;
  rewarded?: boolean;
  notificationsRead?: boolean;
  tooltip?: Tooltip;
  idPrefix?: string;
  actions?: SurfaceActions;
};
function DashboardSurface(props: SurfaceProps) {
  const { view, range, actions, userName, dateLabel } = props;
  const heading = VIEW_COPY[view];
  const details = (title: string, text: string) =>
    actions ? () => actions.open({ kind: "details", title, text }) : undefined;
  const events: ChartEvents = {
    idPrefix: props.idPrefix,
    tooltip: props.tooltip,
    onHighlight: actions?.highlight,
  };
  return (
    <div className="crm-shell">
      <aside className="crm-rail">
        <Action
          className="crm-logo"
          label="Go to overview"
          onClick={actions ? () => actions.setView("overview") : undefined}
        >
          <Icon name="logo" />
          <span>»</span>
        </Action>
        <nav aria-label="CRM sections">
          {NAVIGATION.map((item) =>
            actions ? (
              <button
                key={item.id}
                type="button"
                className={`crm-nav-item ${view === item.id ? "crm-nav-active" : ""}`}
                title={item.label}
                aria-label={item.label}
                aria-current={view === item.id ? "page" : undefined}
                onClick={() => actions.setView(item.id)}
              >
                <Icon name={item.icon} />
              </button>
            ) : (
              <span
                key={item.id}
                className={`crm-nav-item ${view === item.id ? "crm-nav-active" : ""}`}
              >
                <Icon name={item.icon} />
              </span>
            ),
          )}
          <Action
            className="crm-nav-item"
            label="Dashboard guide"
            onClick={actions ? () => actions.open({ kind: "help" }) : undefined}
          >
            <Icon name="target" />
          </Action>
        </nav>
        <Action
          className="crm-nav-item crm-exit"
          label="Reset demo session"
          onClick={actions ? () => actions.open({ kind: "reset" }) : undefined}
        >
          <Icon name="exit" />
        </Action>
      </aside>
      <div className="crm-content">
        <header className="crm-topbar">
          <div className="crm-search">
            <Icon name="search" />
            {actions ? (
              <input
                type="search"
                placeholder="Search metrics, orders..."
                aria-label="Search metrics, orders, and integrations"
                value={props.query ?? ""}
                onChange={(event) => actions.setQuery(event.target.value)}
              />
            ) : (
              <span>Search metrics, orders...</span>
            )}
          </div>
          <span className="crm-today">{dateLabel}</span>
          <div className="crm-tools">
            <Action
              className="crm-tool"
              label="Dashboard settings"
              onClick={
                actions ? () => actions.open({ kind: "settings" }) : undefined
              }
            >
              <Icon name="settings" />
            </Action>
            <Action
              className={`crm-tool ${props.notificationsRead ? "" : "crm-unread"}`}
              label="Notifications"
              onClick={
                actions
                  ? () => actions.open({ kind: "notifications" })
                  : undefined
              }
            >
              <Icon name="bell" />
            </Action>
            <Action
              className="crm-profile"
              label="Your profile"
              onClick={
                actions ? () => actions.open({ kind: "profile" }) : undefined
              }
            >
              <Avatar />
              <i />
            </Action>
          </div>
        </header>
        <div className="crm-heading">
          <div>
            <h2>
              {view === "overview" ? `Hello, ${userName}!` : heading.title}
              <span>{heading.emoji}</span>
            </h2>
            <p>{heading.description}</p>
          </div>
          <div className="crm-date-tools">
            {actions ? (
              <select
                value={range}
                aria-label="Reporting period"
                onChange={(event) =>
                  actions.setRange(event.target.value as CrmDateRange)
                }
              >
                {Object.entries(RANGE_LABELS).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            ) : (
              <span className="crm-range-static">{RANGE_LABELS[range]}⌄</span>
            )}
            <Action
              className="crm-calendar"
              label="Choose report date"
              onClick={
                actions ? () => actions.open({ kind: "calendar" }) : undefined
              }
            >
              <Icon name="calendar" />
            </Action>
          </div>
        </div>
        <div className={`crm-view crm-view-${view}`} key={`${view}-${range}`}>
          {view === "overview" && (
            <>
              <div className="crm-overview-top">
                <div className="crm-stat-grid">
                  <Metric
                    label="Total revenue"
                    value="$99.560"
                    change="↗ 2.67%"
                    tone="purple"
                    highlighted
                    action={details(
                      "Total revenue",
                      "This month's reference revenue is $99,560, up 2.67% from the previous period. Revenue samples can be supplied through the revenue prop.",
                    )}
                  />
                  <Metric
                    label="Total orders"
                    value="35"
                    change="↘ 2.67%"
                    tone="red"
                    action={
                      actions ? () => actions.setView("orders") : undefined
                    }
                  />
                  <Metric
                    label="Total visitors"
                    value="45.600"
                    change="↘ 2.67%"
                    tone="red"
                    action={details(
                      "Total visitors",
                      "45,600 store visits this month. This is illustrative local dashboard data.",
                    )}
                  />
                  <Metric
                    label="Net profit"
                    value="$60.450"
                    change="↗ 5.67%"
                    action={
                      actions ? () => actions.setView("performance") : undefined
                    }
                  />
                </div>
                <Panel
                  title="Revenue"
                  subtitle={`${RANGE_LABELS[range]} vs last`}
                  className="crm-revenue-panel"
                  action={details(
                    "Revenue",
                    "Hover, focus, or tap a bar to inspect its revenue. Change the reporting period to compare locally scaled samples.",
                  )}
                >
                  <RevenueChart revenue={props.revenue} {...events} />
                </Panel>
              </div>
              <div className="crm-overview-bottom">
                <div className="crm-panel crm-summary-card">
                  <span className="crm-round-icon">
                    <Icon name="check" />
                  </span>
                  <div>
                    <strong>
                      98 <span>orders</span>
                    </strong>
                    <p>
                      12 orders are <em>awaiting</em> confirmation.
                    </p>
                  </div>
                  <Action
                    className="crm-card-overlay"
                    label="Open order dispatch"
                    onClick={
                      actions ? () => actions.setView("orders") : undefined
                    }
                  >
                    <span className="crm-sr-only">Open orders</span>
                  </Action>
                </div>
                <div className="crm-panel crm-summary-card crm-customers-summary">
                  <span className="crm-round-icon">
                    <Icon name="people" />
                  </span>
                  <svg
                    className="crm-mini-spark"
                    viewBox="0 0 180 50"
                    aria-hidden="true"
                  >
                    <path
                      d="M0 31q10-20 25-9t22-1 25-3 22 1 25-6 22 4 22-3 17 0"
                      fill="none"
                      stroke="#526393"
                      strokeWidth="1"
                    />
                    <path
                      d="M0 38q10-20 25-9t22-1 25-3 22 1 25-6 22 4 22-3 17 0"
                      fill="none"
                      stroke="#526393"
                      strokeWidth="1"
                    />
                  </svg>
                  <div>
                    <strong>
                      17 <span>customers</span>
                    </strong>
                    <p>
                      17 customers are <em>waiting</em> for response.
                    </p>
                  </div>
                  <Action
                    className="crm-card-overlay"
                    label="Open customer intelligence"
                    onClick={
                      actions ? () => actions.setView("customers") : undefined
                    }
                  >
                    <span className="crm-sr-only">Open customers</span>
                  </Action>
                </div>
                <Panel
                  title="Sales by Category"
                  subtitle={`${RANGE_LABELS[range]} vs last`}
                  className="crm-category-panel"
                  action={details(
                    "Sales by Category",
                    "Choose a donut segment or its legend to see each product's share of sales.",
                  )}
                >
                  <Donut {...events} />
                </Panel>
              </div>
            </>
          )}
          {view === "orders" && (
            <>
              <Panel
                title="Order Dispatch Terminal"
                subtitle="Real-time processing queue"
                className="crm-dispatch-panel"
                accessory={<span className="crm-live">● LIVE</span>}
              >
                <div className="crm-filter-tabs">
                  {(["all", "pending", "shipped"] as const).map((filter) => (
                    <Action
                      key={filter}
                      className={
                        (props.orderFilter ?? "all") === filter
                          ? "crm-filter-active"
                          : ""
                      }
                      onClick={
                        actions ? () => actions.filter(filter) : undefined
                      }
                    >
                      {filter.toUpperCase()}
                    </Action>
                  ))}
                </div>
                <div className="crm-order-list">
                  {props.orders
                    .filter(
                      (order) =>
                        (!props.query ||
                          `${order.id} ${order.product} ${order.customer}`
                            .toLowerCase()
                            .includes(props.query.toLowerCase())) &&
                        ((props.orderFilter ?? "all") === "all" ||
                          (props.orderFilter === "shipped"
                            ? order.status === "shipped"
                            : order.status !== "shipped")),
                    )
                    .map((order) => (
                      <Action
                        key={order.id}
                        className="crm-order-row"
                        onClick={details(
                          `#${order.id}`,
                          `${order.product} · ${order.customer}. Status: ${ORDER_LABELS[order.status]}. Dispatch Active Batch advances pending demo orders to In Dispatch; dispatching orders advance to Shipped.`,
                        )}
                      >
                        <div>
                          <b>#{order.id}</b>
                          <span>{order.product}</span>
                          <small>{order.customer}</small>
                        </div>
                        <span
                          className={`crm-order-status crm-status-${order.status}`}
                        >
                          {ORDER_LABELS[order.status]}
                        </span>
                      </Action>
                    ))}
                  {props.orders.filter(
                    (order) =>
                      (!props.query ||
                        `${order.id} ${order.product} ${order.customer}`
                          .toLowerCase()
                          .includes(props.query.toLowerCase())) &&
                      ((props.orderFilter ?? "all") === "all" ||
                        (props.orderFilter === "shipped"
                          ? order.status === "shipped"
                          : order.status !== "shipped")),
                  ).length === 0 && (
                    <p className="crm-empty">No matching orders.</p>
                  )}
                </div>
                <Action
                  className="crm-blue-action crm-dispatch-button"
                  label="Dispatch active batch"
                  onClick={actions?.dispatch}
                  disabled={
                    props.dispatching ||
                    props.orders.every((order) => order.status === "shipped")
                  }
                >
                  {props.dispatching
                    ? "Dispatching…"
                    : "Dispatch Active Batch (44 pkgs)"}
                  <span>↗</span>
                </Action>
              </Panel>
              <div className="crm-velocity-column">
                <Panel
                  title="Fulfillment Velocity Curve"
                  subtitle="Continuous delivery volume spline"
                  className="crm-velocity-panel"
                  action={details(
                    "Fulfillment Velocity Curve",
                    "Today's peak is 285 orders. Focus or tap the chart markers to inspect each checkpoint.",
                  )}
                >
                  <SmoothChart kind="velocity" {...events} />
                </Panel>
                <div className="crm-small-stats">
                  <SmallStat
                    label="Turnaround"
                    value="18.2 hrs"
                    note="↗ 14% faster"
                  />
                  <SmallStat
                    label="Pending"
                    value="142 ord"
                    note="96% on-time"
                  />
                  <SmallStat label="Returns" value="1.2%" note="↓ 0.4% lower" />
                </div>
              </div>
              <Panel
                title="Carrier Allocation"
                subtitle="Live transport hubs"
                className="crm-carrier-panel"
                action={details(
                  "Carrier Allocation",
                  "DHL Express Air carries 45% of orders, FedEx Ground 32%, and UPS Priority 23%. The capacity values below are local demo snapshots.",
                )}
              >
                <div className="crm-progress-list">
                  {[
                    {
                      name: "DHL Express Air (45%)",
                      count: "440 pkgs",
                      value: 45,
                      color: "#58c9e8",
                    },
                    {
                      name: "FedEx Ground (32%)",
                      count: "320 pkgs",
                      value: 32,
                      color: "#ad8cea",
                    },
                    {
                      name: "UPS Priority (23%)",
                      count: "230 pkgs",
                      value: 23,
                      color: "#49d3ae",
                    },
                  ].map((item) => (
                    <ProgressRow key={item.name} {...item} />
                  ))}
                </div>
                <div className="crm-hub-list">
                  <p>
                    <i />
                    Chicago Central Transit<b>94% Cap</b>
                  </p>
                  <p>
                    <i />
                    Detroit Regional Depot<b>78% Cap</b>
                  </p>
                  <p>
                    <i />
                    Newark Logistics Bay<b>82% Cap</b>
                  </p>
                </div>
              </Panel>
            </>
          )}
          {view === "ecosystem" && (
            <>
              <div className="crm-integration-grid">
                {props.integrations
                  .filter(
                    (item) =>
                      !props.query ||
                      `${item.name} ${item.category}`
                        .toLowerCase()
                        .includes(props.query.toLowerCase()),
                  )
                  .map((item) => (
                    <section
                      className={`crm-panel crm-integration ${item.enabled ? "" : "crm-disconnected"}`}
                      key={item.id}
                    >
                      <div className="crm-integration-top">
                        <Icon name="grid" />
                        <Action
                          className={`crm-switch ${item.enabled ? "crm-switch-on" : ""}`}
                          label={`${item.enabled ? "Disconnect" : "Connect"} ${item.name}`}
                          onClick={
                            actions
                              ? () => actions.toggleIntegration(item.id)
                              : undefined
                          }
                        >
                          <i />
                        </Action>
                      </div>
                      <h3>{item.name}</h3>
                      <p>{item.category}</p>
                      <footer>
                        <span>
                          <i style={{ background: item.color }} />
                          {item.enabled
                            ? item.statusLabel === "Disconnected"
                              ? "Connected"
                              : item.statusLabel
                            : "Disconnected"}
                        </span>
                        <b>
                          {item.enabled
                            ? item.latency === "—"
                              ? "20ms"
                              : item.latency
                            : "—"}
                        </b>
                      </footer>
                    </section>
                  ))}
                {props.integrations.filter(
                  (item) =>
                    !props.query ||
                    `${item.name} ${item.category}`
                      .toLowerCase()
                      .includes(props.query.toLowerCase()),
                ).length === 0 && (
                  <div className="crm-panel crm-empty">
                    No matching integrations.
                  </div>
                )}
              </div>
              <div className="crm-ecosystem-bottom">
                <Panel
                  title="Bidirectional Throughput"
                  subtitle="Inbound Webhooks vs Outbound Cloud Sync"
                  accessory={
                    <span className="crm-mini-legend">
                      <i className="crm-purple" />
                      Inbound
                      <i className="crm-cyan" />
                      Outbound
                    </span>
                  }
                >
                  <ThroughputChart {...events} />
                </Panel>
                <Panel
                  title="Ecosystem Telemetry"
                  subtitle="Multi-ring server load"
                  action={details(
                    "Ecosystem Telemetry",
                    "API quota: 850k requests (85%). Webhooks: active (78%). RAM cache: 1.4 GB (45%). Integration switches manage this local demo; onIntegrationChange connects them to your own backend.",
                  )}
                >
                  <Telemetry />
                </Panel>
              </div>
            </>
          )}
          {view === "customers" && (
            <>
              <div className="crm-customer-column">
                <section className="crm-panel crm-vip-panel">
                  <header>
                    <span className="crm-vip-badge">
                      <Icon name="diamond" />
                      VIP DIAMOND
                    </span>
                    <span className="crm-active-label">● Active</span>
                  </header>
                  <div className="crm-vip-person">
                    <Avatar customer />
                    <div>
                      <h3>Sophia Reynolds</h3>
                      <p>Platinum member</p>
                      <b>18 Orders · $4,280 spent</b>
                    </div>
                  </div>
                  <div className="crm-product-tags">
                    <span>MacBook Air M2</span>
                    <span>AirPods Pro 2</span>
                    <span>Priority Support</span>
                  </div>
                  <footer>
                    <Action
                      className="crm-blue-action"
                      onClick={
                        actions
                          ? () => actions.open({ kind: "message" })
                          : undefined
                      }
                    >
                      Message VIP
                    </Action>
                    <Action
                      className="crm-soft-action"
                      onClick={actions?.reward}
                      disabled={props.rewarded}
                    >
                      {props.rewarded ? "Reward applied ✓" : "Reward +10%"}
                    </Action>
                  </footer>
                </section>
                <div className="crm-small-stats">
                  <SmallStat label="Customer LTV" value="$ 428" note="↗ 8.4%" />
                  <SmallStat
                    label="Repeat Buyers"
                    value="46.2%"
                    note="High-retention"
                  />
                </div>
              </div>
              <div className="crm-customer-charts">
                <Panel
                  title="Cohort Growth Trajectory"
                  subtitle="Organic referrals vs Paid campaign conversion"
                  accessory={
                    <span className="crm-mini-legend">
                      <i className="crm-purple" />
                      Organic (34%)
                      <i className="crm-green" />
                      Paid (24%)
                    </span>
                  }
                >
                  <SmoothChart kind="cohort" {...events} />
                </Panel>
                <div className="crm-customer-bottom">
                  <Panel
                    title="CSAT Sentiment Gauge"
                    subtitle="Customer satisfaction index"
                    accessory={<span />}
                  >
                    <svg
                      className="crm-gauge"
                      viewBox="0 0 180 110"
                      role="img"
                      aria-label="Customer satisfaction 94%"
                    >
                      <path
                        d="M30 92a60 60 0 0 1 120 0"
                        fill="none"
                        stroke="#ffffff09"
                        strokeWidth="12"
                        strokeLinecap="round"
                      />
                      <path
                        className="crm-line-enter"
                        d="M30 92a60 60 0 0 1 119-10"
                        fill="none"
                        stroke="#62c3fb"
                        strokeWidth="12"
                        strokeLinecap="round"
                        pathLength="100"
                      />
                      <text x="90" y="91" textAnchor="middle">
                        94%
                      </text>
                    </svg>
                  </Panel>
                  <Panel
                    title="Top Regions"
                    subtitle="Geo revenue share"
                    accessory={<span />}
                  >
                    <div className="crm-region-list">
                      <p>
                        <i style={{ background: "#e58a65" }} />
                        North America (48%)<b>$47.8k</b>
                      </p>
                      <p>
                        <i style={{ background: "#4db6da" }} />
                        Europe & UK (28%)<b>$27.8k</b>
                      </p>
                      <p>
                        <i style={{ background: "#39bc9d" }} />
                        Middle East (14%)<b>$15.1k</b>
                      </p>
                    </div>
                  </Panel>
                </div>
              </div>
            </>
          )}
          {view === "performance" && (
            <>
              <section className="crm-panel crm-executive">
                <header>
                  <div>
                    <span className="crm-eyebrow">CEO EXECUTIVE BRIEFING</span>
                    <h3>Fiscal Performance & Revenue Intelligence</h3>
                  </div>
                  <div className="crm-quarter-actions">
                    <div className="crm-quarter-tabs">
                      {[1, 2, 3, 4].map((quarter) => (
                        <Action
                          key={quarter}
                          className={
                            props.quarter === quarter
                              ? "crm-quarter-active"
                              : ""
                          }
                          onClick={
                            actions
                              ? () => actions.setQuarter(quarter)
                              : undefined
                          }
                        >
                          Q{quarter}
                        </Action>
                      ))}
                    </div>
                    <Action
                      className="crm-blue-action"
                      onClick={actions?.exportReport}
                    >
                      Export PDF ↗
                    </Action>
                  </div>
                </header>
                <div className="crm-executive-metrics">
                  <ExecutiveMetric
                    label="Gross Merchandise Value"
                    value={
                      props.quarter === 3
                        ? "$ 482.9k"
                        : `$ ${(482.9 * [0.64, 0.82, 1, 1.12][props.quarter - 1]).toFixed(1)}k`
                    }
                    change="↗ 18.2%"
                    caption="Quarter-to-date GMV"
                  />
                  <ExecutiveMetric
                    label="Operating Margin"
                    value="32.4%"
                    change="↗ 4.1%"
                    caption="EBITDA margin ratio"
                  />
                  <ExecutiveMetric
                    label="Avg Order Value (AOV)"
                    value="$ 86.40"
                    change="↗ 6.2%"
                    caption="Direct & wholesale average"
                  />
                  <ExecutiveMetric
                    label="Annual Run Rate (ARR)"
                    value="$1.20M"
                    change="↗ 15.0%"
                    caption="Projected yearly revenue"
                  />
                </div>
              </section>
              <div className="crm-performance-middle">
                <Panel
                  title="Target Range Capsule Matrix"
                  subtitle="Quarterly Min-Max variance & target attainment"
                  accessory={
                    <span className="crm-mini-legend">
                      <i className="crm-cyan" />
                      Band Range
                      <i className="crm-green" />
                      Target Met
                    </span>
                  }
                >
                  <CapsuleChart {...events} />
                </Panel>
                <Panel
                  title="P&L Performance Ledger"
                  subtitle="Quarterly income & expenditure statement"
                  action={details(
                    "P&L Performance Ledger",
                    "Reference ledger: $482.9k gross revenue, $146.2k cost of goods, $72.5k marketing, and $48.0k R&D. Displayed EBITDA profit is $156.2k after other operating costs.",
                  )}
                >
                  <div className="crm-progress-list crm-ledger">
                    <ProgressRow
                      name="Gross Revenue"
                      count="$ 482.9k"
                      value={94}
                      color="#5dcae9"
                    />
                    <ProgressRow
                      name="Cost of Goods (COGS)"
                      count="− $ 146.2k"
                      value={33}
                      color="#e47788"
                    />
                    <ProgressRow
                      name="Marketing & CAC"
                      count="− $ 72.5k"
                      value={15}
                      color="#efc450"
                    />
                    <ProgressRow
                      name="R&D & Cloud Ops"
                      count="− $ 48.0k"
                      value={10}
                      color="#ae88e1"
                    />
                    <ProgressRow
                      name="Net EBITDA Profit"
                      count="+ $ 156.2k"
                      value={42}
                      color="#47cbb0"
                    />
                  </div>
                </Panel>
              </div>
              <div className="crm-panel crm-compliance">
                {[
                  { name: "SOX-404 Compliance", value: "100% Certified" },
                  { name: "Global VAT & Sales Tax", value: "EU & US Cleared" },
                  { name: "Cash Runway", value: "28.4 Months" },
                  { name: "Data Reconciliation", value: "0 Discrepancies" },
                ].map((item) => (
                  <Action
                    key={item.name}
                    className="crm-compliance-item"
                    onClick={details(
                      item.name,
                      `${item.value}. Compliance figures are illustrative local data, supplied for this reference design.`,
                    )}
                  >
                    <span className="crm-compliance-check">
                      <Icon name="check" />
                    </span>
                    <span>
                      {item.name}
                      <b>{item.value}</b>
                    </span>
                  </Action>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
function SmallStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <section className="crm-panel crm-small-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </section>
  );
}
function ProgressRow({
  name,
  count,
  value,
  color,
}: {
  name: string;
  count: string;
  value: number;
  color: string;
}) {
  return (
    <div className="crm-progress-row">
      <p>
        <span>{name}</span>
        <b style={{ color }}>{count}</b>
      </p>
      <div>
        <i
          className="crm-progress-enter"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}
function ExecutiveMetric({
  label,
  value,
  change,
  caption,
}: {
  label: string;
  value: string;
  change: string;
  caption: string;
}) {
  return (
    <div className="crm-executive-metric">
      <span>{label}</span>
      <div>
        <strong>{value}</strong>
        <small>{change}</small>
      </div>
      <p>{caption}</p>
    </div>
  );
}

function CrmModal({
  title,
  onClose,
  children,
  className = "",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    if (!dialog) return;
    if (!dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
    const focusTarget =
      dialog.querySelector<HTMLElement>("textarea, input, select") ??
      dialog.querySelector<HTMLElement>("button");
    focusTarget?.focus();
    return () => {
      dialog.close?.();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, [title]);
  return (
    <dialog
      className={`crm-dialog ${className}`}
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header>
        <h3 id={titleId}>{title}</h3>
        <button
          type="button"
          className="crm-tool"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </header>
      {children}
    </dialog>
  );
}

/** A portable five-screen CRM demo. Supply callbacks to connect local actions to your app. */
export default function GlassyCrmDashboard({
  className = "",
  userName = "User",
  dateLabel = "Today, Mon 22 Nov",
  initialView = "overview",
  initialRange = "month",
  orders = DEFAULT_ORDERS,
  revenue = DEFAULT_REVENUE,
  integrations = DEFAULT_INTEGRATIONS,
  onViewChange,
  onDateRangeChange,
  onOrderDispatch,
  onIntegrationChange,
  onExport,
}: GlassyCrmDashboardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dispatchRef = useRef<AbortController | null>(null);
  const idPrefix = `crm-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [view, setView] = useState<CrmDashboardView>(initialView);
  const [range, setRange] = useState<CrmDateRange>(initialRange);
  // Overrides preserve local demo edits while fresh incoming records remain reactive.
  const [orderOverrides, setOrderOverrides] = useState<
    Record<string, { from: CrmOrderStatus; to: CrmOrderStatus }>
  >({});
  const [integrationOverrides, setIntegrationOverrides] = useState<
    Record<string, { from: boolean; to: boolean }>
  >({});
  const localOrders = orders.map((order) => {
    const override = orderOverrides[order.id];
    return override && override.from === order.status
      ? { ...order, status: override.to }
      : order;
  });
  const localIntegrations = integrations.map((integration) => {
    const override = integrationOverrides[integration.id];
    return override && override.from === integration.enabled
      ? { ...integration, enabled: override.to }
      : integration;
  });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "shipped">("all");
  const [quarter, setQuarter] = useState(3);
  const [tooltip, setTooltip] = useState<Tooltip>({
    chart: "revenue",
    index: 2,
  });
  const [modal, setModal] = useState<ModalState>(null);
  const [date, setDate] = useState("");
  const [customDateLabel, setCustomDateLabel] = useState("");
  const [dispatching, setDispatching] = useState(false);
  const [status, setStatus] = useState("");
  const [rewarded, setRewarded] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [motion, setMotion] = useState(true);
  const [contrast, setContrast] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [sentMessage, setSentMessage] = useState("");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let inView = true;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () =>
      setRunning(inView && !document.hidden && !media.matches);
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              inView = entry.isIntersecting;
              update();
            },
            { threshold: 0.05 },
          );
    observer?.observe(root);
    document.addEventListener("visibilitychange", update);
    media.addEventListener("change", update);
    update();
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", update);
      media.removeEventListener("change", update);
      dispatchRef.current?.abort();
    };
  }, []);

  const samples = (revenue.length ? revenue : DEFAULT_REVENUE)
    .slice(0, 12)
    .map(
      (value) =>
        Math.min(1e12, Math.max(0, Number.isFinite(value) ? value : 0)) *
        (range === "week" ? 0.24 : range === "year" ? 11.5 : 1),
    );
  const changeView = (next: CrmDashboardView) => {
    setView(next);
    setQuery("");
    setTooltip({ chart: "", index: -1 });
    onViewChange?.(next);
  };
  const dispatch = async () => {
    if (dispatchRef.current) return;
    const batch = localOrders.filter((order) => order.status !== "shipped");
    if (!batch.length) return;
    const controller = new AbortController();
    dispatchRef.current = controller;
    setDispatching(true);
    setStatus("");
    try {
      await onOrderDispatch?.(batch, controller.signal);
      if (controller.signal.aborted) return;
      setOrderOverrides((previous) => {
        const next = { ...previous };
        for (const order of batch) {
          const source = orders.find((item) => item.id === order.id);
          if (source)
            next[order.id] = {
              from: source.status,
              to: order.status === "in-dispatch" ? "shipped" : "in-dispatch",
            };
        }
        return next;
      });
      setStatus(
        onOrderDispatch
          ? `${batch.length} orders dispatched.`
          : `Demo batch updated: ${batch.length} orders advanced in the local queue.`,
      );
    } catch (error) {
      if (!controller.signal.aborted)
        setStatus(
          error instanceof Error
            ? error.message
            : "Dispatch failed. Please try again.",
        );
    } finally {
      if (dispatchRef.current === controller) {
        dispatchRef.current = null;
        if (!controller.signal.aborted) setDispatching(false);
      }
    }
  };
  const report: CrmDashboardReport = {
    view,
    range,
    quarter,
    orders: localOrders,
    revenue: samples,
    integrations: localIntegrations,
  };
  const actions: SurfaceActions = {
    setView: changeView,
    setRange: (next) => {
      setRange(next);
      onDateRangeChange?.(next);
    },
    setQuery: (next) => {
      setQuery(next);
      if (next.trim() && view !== "orders" && view !== "ecosystem") {
        setView("orders");
        onViewChange?.("orders");
      }
    },
    open: setModal,
    filter: setFilter,
    dispatch: () => {
      void dispatch();
    },
    toggleIntegration: (id) => {
      const item = localIntegrations.find(
        (integration) => integration.id === id,
      );
      if (!item) return;
      const source = integrations.find((integration) => integration.id === id);
      if (source)
        setIntegrationOverrides((previous) => ({
          ...previous,
          [id]: { from: source.enabled, to: !item.enabled },
        }));
      onIntegrationChange?.(id, !item.enabled);
      setStatus(
        `${item.name} ${item.enabled ? "disconnected" : "connected"}${onIntegrationChange ? "." : " in this local demo."}`,
      );
    },
    setQuarter,
    exportReport: () => {
      if (onExport) onExport(report);
      else setModal({ kind: "report" });
    },
    reward: () => {
      setRewarded(true);
      setStatus(
        "Demo reward applied: Sophia has a 10% discount on her next order.",
      );
    },
    highlight: (chart, index) => setTooltip({ chart, index }),
  };
  const modalTitle =
    modal?.kind === "details"
      ? modal.title
      : (
          {
            settings: "Dashboard settings",
            notifications: "Notifications",
            profile: "Your profile",
            calendar: "Choose report date",
            report: "Quarterly report",
            message: "Message Sophia",
            reset: "Demo session",
            help: "Dashboard guide",
          } as const
        )[modal?.kind as Exclude<NonNullable<ModalState>["kind"], "details">];

  return (
    <div
      ref={rootRef}
      className={`crm-root relative isolate w-full overflow-hidden text-white ${className}`}
      data-running={running && motion}
      data-motion={motion}
      data-contrast={contrast}
    >
      <ComponentStyles css={CRM_CSS} />
      <Facets />
      <DashboardSurface
        view={view}
        range={range}
        userName={userName}
        dateLabel={customDateLabel || dateLabel}
        orders={localOrders}
        revenue={samples}
        integrations={localIntegrations}
        quarter={quarter}
        query={query}
        orderFilter={filter}
        dispatching={dispatching}
        rewarded={rewarded}
        notificationsRead={notificationsRead}
        tooltip={tooltip}
        idPrefix={idPrefix}
        actions={actions}
      />
      <div
        className={`crm-status ${status ? "crm-status-visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {status}
        {status && (
          <button
            type="button"
            aria-label="Dismiss status"
            onClick={() => setStatus("")}
          >
            <Icon name="close" />
          </button>
        )}
      </div>
      {modal && (
        <CrmModal
          title={modalTitle}
          onClose={() => setModal(null)}
          className={modal.kind === "report" ? "crm-print-report" : ""}
        >
          {modal.kind === "details" && <p>{modal.text}</p>}
          {modal.kind === "settings" && (
            <>
              <p>Preferences apply to this dashboard instance.</p>
              <label className="crm-setting-row">
                <span>Animate charts</span>
                <input
                  type="checkbox"
                  checked={motion}
                  onChange={(event) => setMotion(event.target.checked)}
                />
              </label>
              <label className="crm-setting-row">
                <span>Stronger panel borders</span>
                <input
                  type="checkbox"
                  checked={contrast}
                  onChange={(event) => setContrast(event.target.checked)}
                />
              </label>
              <p className="crm-dialog-note">
                Your system&apos;s reduced motion preference is always
                respected.
              </p>
            </>
          )}
          {modal.kind === "notifications" && (
            <>
              <ul className="crm-notification-list">
                <li>
                  <b>12 orders await confirmation</b>
                  <span>Review the dispatch queue.</span>
                  <button
                    type="button"
                    className="crm-blue-action"
                    onClick={() => {
                      changeView("orders");
                      setModal(null);
                    }}
                  >
                    Review orders
                  </button>
                </li>
                <li>
                  <b>Sophia is waiting for a response</b>
                  <span>Your VIP customer has a product question.</span>
                  <button
                    type="button"
                    className="crm-blue-action"
                    onClick={() => setModal({ kind: "message" })}
                  >
                    Open message
                  </button>
                </li>
              </ul>
              <button
                type="button"
                className="crm-soft-action"
                onClick={() => {
                  setNotificationsRead(true);
                  setStatus("All demo notifications marked as read.");
                }}
              >
                {notificationsRead ? "All caught up ✓" : "Mark all as read"}
              </button>
            </>
          )}
          {modal.kind === "profile" && (
            <>
              <div className="crm-dialog-profile">
                <Avatar />
                <div>
                  <b>{userName}</b>
                  <p>Store administrator</p>
                </div>
              </div>
              <p>
                Local dashboard demo. No account or sign-in service is
                connected.
              </p>
              <button
                type="button"
                className="crm-blue-action"
                onClick={() => setModal({ kind: "settings" })}
              >
                Edit dashboard preferences
              </button>
            </>
          )}
          {modal.kind === "calendar" && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!date) return;
                const parsed = new Date(`${date}T12:00:00Z`);
                setCustomDateLabel(
                  parsed.toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    timeZone: "UTC",
                  }),
                );
                setModal(null);
              }}
            >
              <p>Select the date displayed in your dashboard header.</p>
              <label>
                Report date
                <input
                  type="date"
                  value={date}
                  required
                  onChange={(event) => setDate(event.target.value)}
                />
              </label>
              <button type="submit" className="crm-blue-action">
                Apply date
              </button>
            </form>
          )}
          {modal.kind === "message" && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const text = message.trim();
                if (!text) return;
                setSentMessage(text);
                setMessage("");
                setStatus(
                  "Message saved in this local demo. No external message was sent.",
                );
              }}
            >
              <p>
                This inbox is a local demo. Messages are saved only in this
                dashboard session.
              </p>
              {sentMessage && (
                <div className="crm-saved-message">
                  <b>Saved draft to Sophia</b>
                  <p>{sentMessage}</p>
                </div>
              )}
              <label>
                Message
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  required
                  maxLength={1000}
                  placeholder="Hi Sophia, how can I help?"
                />
              </label>
              <button
                type="submit"
                className="crm-blue-action"
                disabled={!message.trim()}
              >
                Save message
              </button>
            </form>
          )}
          {modal.kind === "reset" && (
            <>
              <p>
                Reset this local demo&apos;s orders, integration switches, date,
                and customer reward.
              </p>
              <button
                type="button"
                className="crm-blue-action"
                onClick={() => {
                  dispatchRef.current?.abort();
                  dispatchRef.current = null;
                  setDispatching(false);
                  setOrderOverrides({});
                  setIntegrationOverrides({});
                  setRewarded(false);
                  setNotificationsRead(false);
                  setCustomDateLabel("");
                  setDate("");
                  setMessage("");
                  setSentMessage("");
                  setRange(initialRange);
                  changeView(initialView);
                  setStatus("Demo session reset.");
                  setModal(null);
                }}
              >
                Reset demo
              </button>
            </>
          )}
          {modal.kind === "help" && (
            <>
              <p>
                Use the left rail to explore five views. Search filters orders
                or integrations. Hover, focus, or tap chart marks for exact
                values.
              </p>
              <p>
                Dispatch, integration switches, rewards, and messages use local
                demo state. Optional typed callbacks connect dispatch,
                navigation, integration changes, and reports to your own
                application.
              </p>
            </>
          )}
          {modal.kind === "report" && (
            <>
              <p className="crm-report-note">
                Local sample report · Q{quarter} · {RANGE_LABELS[range]}. Use
                your browser&apos;s Print / Save as PDF option to export it.
              </p>
              <dl className="crm-report-values">
                <div>
                  <dt>Gross merchandise value</dt>
                  <dd>
                    $
                    {(
                      482900 * [0.64, 0.82, 1, 1.12][quarter - 1]
                    ).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </dd>
                </div>
                <div>
                  <dt>Operating margin</dt>
                  <dd>32.4%</dd>
                </div>
                <div>
                  <dt>Average order value</dt>
                  <dd>$86.40</dd>
                </div>
                <div>
                  <dt>Annual run rate</dt>
                  <dd>$1,200,000</dd>
                </div>
                <div>
                  <dt>Orders in queue</dt>
                  <dd>{localOrders.length}</dd>
                </div>
                <div>
                  <dt>Connected integrations</dt>
                  <dd>
                    {localIntegrations.filter((item) => item.enabled).length}
                  </dd>
                </div>
              </dl>
              <button
                type="button"
                className="crm-blue-action crm-print-button"
                onClick={() => window.print()}
              >
                Print / Save as PDF
              </button>
            </>
          )}
        </CrmModal>
      )}
    </div>
  );
}

/** Gallery frames are completely inert: no hooks, handlers, or private timers. */
export function GlassyCrmDashboardThumbnail({
  className = "",
  previewStep = 0,
}: {
  className?: string;
  previewStep?: number;
}) {
  const step = Number.isFinite(previewStep)
    ? Math.max(0, Math.floor(previewStep))
    : 0;
  const view = NAVIGATION[step % NAVIGATION.length].id;
  return (
    <div
      className={`crm-root crm-thumbnail relative isolate w-full overflow-hidden text-white ${className}`}
      data-running="true"
      aria-hidden="true"
    >
      <ComponentStyles css={CRM_CSS} />
      <Facets />
      <div className="crm-thumb-viewport">
        <DashboardSurface
          view={view}
          range="month"
          userName="User"
          dateLabel="Today, Mon 22 Nov"
          orders={DEFAULT_ORDERS}
          revenue={DEFAULT_REVENUE}
          integrations={DEFAULT_INTEGRATIONS}
          quarter={3}
        />
      </div>
    </div>
  );
}

const CRM_CSS = `
.crm-root{container-type:inline-size;container-name:glassy-crm;position:relative;isolation:isolate;width:100%;min-height:0;padding:clamp(16px,3vw,38px) clamp(10px,2.2vw,30px);background:#07090d;color:#f1f2f9;font-family:Inter,"Segoe UI",Arial,sans-serif;font-size:clamp(11px,1.05cqw,14px);line-height:1.35;overflow:hidden}
.crm-root *,.crm-dialog *{box-sizing:border-box}.crm-root :where(button,input,select),.crm-dialog :where(button,input,textarea){font:inherit}.crm-root button,.crm-dialog button{cursor:pointer}.crm-root button:disabled,.crm-dialog button:disabled{opacity:.5;cursor:default}.crm-root button:focus-visible,.crm-root select:focus-visible,.crm-root input:focus-visible,.crm-chart [tabindex]:focus-visible,.crm-dialog button:focus-visible,.crm-dialog input:focus-visible,.crm-dialog textarea:focus-visible{outline:2px solid #77d6f1;outline-offset:3px}.crm-root button{color:inherit}.crm-root h2,.crm-root h3,.crm-root p,.crm-dialog h3,.crm-dialog p{margin:0}.crm-root h3{font-size:1em;font-weight:550;line-height:1.3}.crm-root svg{display:block}.crm-icon{width:17px;height:17px;flex-shrink:0}.crm-facets{position:absolute;inset:0;z-index:-2;width:100%;height:100%}.crm-root:before{content:"";position:absolute;inset:0;background:linear-gradient(115deg,#10081e55,transparent 45%,#06191c55);z-index:-1;pointer-events:none}
.crm-shell{position:relative;display:grid;grid-template-columns:5.7% 1fr;width:min(1180px,100%);min-height:600px;margin:auto;aspect-ratio:1.66;border:1px solid #9c9da773;border-radius:clamp(13px,1.9cqw,24px);overflow:hidden;background:radial-gradient(ellipse at 12% 25%,#39305d66,transparent 52%),radial-gradient(ellipse at 87% 91%,#0b37454d,transparent 54%),linear-gradient(125deg,#37394355,#10161b88 55%,#070c118c);box-shadow:inset 0 1px 1px #d5d6e547,0 16px 35px #0008;backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px)}
.crm-rail{display:flex;align-items:center;flex-direction:column;padding:14px 0;border-right:1px solid #ffffff0c;background:#0d11192b;gap:18px}.crm-logo{display:flex;align-items:center;gap:6px;padding:0;border:0;background:none;color:#c5c7da}.crm-logo .crm-icon{width:24px;height:24px}.crm-logo span{font-size:12px;color:#6e7081}.crm-rail nav{display:flex;flex-direction:column;gap:10px;align-items:center;width:100%}.crm-nav-item{display:grid;place-items:center;position:relative;width:32px;height:32px;border:1px solid transparent;background:none;border-radius:8px;color:#999eaf!important;text-decoration:none}.crm-nav-item .crm-icon{width:16px;height:16px}.crm-nav-item:hover{background:#ffffff0c;color:#fff!important}.crm-nav-active{background:linear-gradient(135deg,#ffffff22,#ffffff0e);border-color:#dadbef42;box-shadow:inset 0 1px 0 #ffffff27;color:#ecebfa!important}.crm-nav-active:after{content:"";position:absolute;right:-8px;top:9px;width:3px;height:13px;border-radius:5px;background:#c3d477;box-shadow:0 0 7px #d7e85588}.crm-exit{margin-top:auto}
.crm-content{display:flex;flex-direction:column;min-width:0;padding:13px 16px 16px;gap:11px}.crm-topbar{display:flex;align-items:center;gap:15px;min-height:30px}.crm-search{display:flex;align-items:center;gap:6px;width:208px;min-width:130px;height:29px;padding:0 10px;border:1px solid #abaac63d;border-radius:100px;background:#ffffff0b;box-shadow:inset 0 1px 1px #ffffff13;color:#9d9cac;font-size:.81em}.crm-search .crm-icon{width:13px;height:13px}.crm-search input{width:100%;min-width:0;color:#ececf5;background:none;border:0;outline:none}.crm-search input::placeholder{color:#a09eaf}.crm-today{color:#77a9e1;font-size:.77em;white-space:nowrap}.crm-tools{margin-left:auto;display:flex;gap:9px;align-items:center}.crm-tool{display:grid;place-items:center;position:relative;width:30px;height:30px;border-radius:50%;border:1px solid #ffffff32;background:linear-gradient(135deg,#ffffff13,#ffffff04);color:#c4c8d2!important}.crm-tool .crm-icon{width:16px;height:16px}.crm-tool:hover,.crm-calendar:hover{background:#ffffff1b}.crm-unread:after{content:"";position:absolute;width:4px;height:4px;border-radius:50%;background:#6bd7ce;top:7px;right:6px}.crm-profile{position:relative;width:29px;height:29px;padding:0;border:0;background:none;border-radius:50%}.crm-avatar{display:block;width:29px;height:29px;border-radius:50%;background-color:#8493c9;background-size:cover;background-position:center;border:1px solid #a9b3db70;box-shadow:0 0 7px #9483ff44}.crm-profile>i{position:absolute;right:0;bottom:0;width:5px;height:5px;border:1px solid #202633;border-radius:50%;background:#68d7b6}.crm-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:33px}.crm-heading>div:first-child{display:flex;align-items:baseline;min-width:0;gap:5px}.crm-heading h2{font-size:1.47em;font-weight:600;letter-spacing:-.045em;white-space:nowrap}.crm-heading h2 span{font-size:.85em;margin-left:3px;letter-spacing:0}.crm-heading p{font-size:.75em;color:#b6b6c2;line-height:1.4}.crm-date-tools{display:flex;gap:7px;align-items:center;flex-shrink:0}.crm-date-tools select,.crm-range-static,.crm-calendar{color:#dce0e6;border:1px solid #ffffff2d;background:linear-gradient(#ffffff10,#ffffff06);border-radius:7px;height:27px;padding:0 9px;font-size:.78em}.crm-date-tools select{max-width:100px;cursor:pointer}.crm-date-tools option{background:#222731;color:#eee}.crm-range-static{display:flex;align-items:center;gap:5px}.crm-calendar{display:grid;place-items:center;width:27px;padding:0}.crm-calendar .crm-icon{width:14px;height:14px}.crm-view{display:flex;flex-direction:column;gap:11px;flex:1;min-height:0;animation:crm-view-in .22s ease both}.crm-panel{position:relative;min-width:0;overflow:hidden;border-radius:14px;border:1px solid #aeabb149;background:linear-gradient(135deg,#ffffff0e 0%,#ffffff03 65%,#030a1255);box-shadow:inset 0 1px 1px #e5e1e45c,0 4px 14px #0002;padding:13px}.crm-panel-heading{display:flex;align-items:center;justify-content:space-between;gap:4px;min-height:23px}.crm-panel-heading>div{display:flex;align-items:baseline;flex-wrap:wrap;gap:2px}.crm-subtitle{font-size:.73em;color:#b2b3c1;line-height:1.25}.crm-arrow{display:grid;place-items:center;width:21px;height:21px;border:1px solid #ffffff1f;border-radius:50%;background:#ffffff08;color:#c5c7d1!important;flex-shrink:0;padding:0}.crm-arrow .crm-icon{width:11px;height:11px}.crm-arrow:hover{background:#ffffff22}.crm-overview-top{display:grid;grid-template-columns:1fr 1.04fr;gap:11px;flex:1.1;min-height:275px}.crm-stat-grid{display:grid;grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(2,1fr);gap:11px}.crm-metric{display:flex;flex-direction:column;padding:12px}.crm-metric-title{display:flex;justify-content:space-between;align-items:center;gap:4px;font-size:.85em}.crm-metric-purple{background:radial-gradient(ellipse at 0 0,#9087e655,transparent 80%),linear-gradient(135deg,#554ab37a,#30236d99);border-color:#aaa5ff83;box-shadow:inset 0 1px 1px #d3cbff6b,0 0 20px #755bed22}.crm-metric-purple .crm-arrow{background:#f6f3ff;color:#6150a3!important;border:0}.crm-metric-bottom{display:flex;align-items:center;justify-content:space-between;gap:3px;margin-top:auto;padding-top:21px}.crm-metric-bottom strong{font-size:1.65em;font-weight:580;letter-spacing:-.03em}.crm-badge{border-radius:99px;padding:1px 6px;font-size:.62em;font-weight:600;white-space:nowrap}.crm-tone-purple{background:#c2b4ff42;color:#eeebff}.crm-tone-red{background:#a64d6330;color:#da8097}.crm-tone-green{background:#319b6530;color:#65c395}.crm-metric small{font-size:.65em;color:#adabba;line-height:1.3}.crm-revenue-panel{display:flex;flex-direction:column;padding-bottom:8px}.crm-revenue-panel .crm-chart{margin-top:auto}.crm-chart{width:100%;height:auto;display:block;overflow:visible;min-height:0;flex:1}.crm-revenue-chart{max-height:260px}.crm-axis{font-family:inherit;font-size:7.4px;fill:#9695a7}.crm-grid-line{stroke:#ffffff05;stroke-width:.7;stroke-dasharray:2 5}.crm-chart-tip{font-family:inherit;font-size:8px;font-weight:700}.crm-revenue-bar{filter:drop-shadow(0 2px 4px #9882fb66)}.crm-chart [tabindex]{cursor:pointer;outline:none}.crm-chart [tabindex]:hover .crm-revenue-bar{filter:drop-shadow(0 0 7px #b7a8ff)}.crm-chart [tabindex]:focus-visible .crm-point{stroke:#80f8e8;stroke-width:3}.crm-overview-bottom{display:grid;grid-template-columns:1fr 1fr 1.78fr;gap:11px;flex:.9;min-height:215px}.crm-summary-card{display:flex;flex-direction:column;justify-content:space-between}.crm-round-icon{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;border:1px solid #ffffff20;background:#ffffff15;color:#c7c8d4}.crm-round-icon .crm-icon{width:13px;height:13px}.crm-summary-card strong{font-size:1.9em;font-weight:580;letter-spacing:-.04em}.crm-summary-card strong span{font-size:.54em;font-weight:400;letter-spacing:0}.crm-summary-card p{font-size:.64em;color:#b3afc0}.crm-summary-card em{font-style:normal;color:#dc829d}.crm-card-overlay{position:absolute;inset:0;background:none;border:0;border-radius:inherit}.crm-card-overlay:hover{background:#ffffff04}.crm-mini-spark{position:absolute;right:7px;top:14px;width:57%;height:30px;opacity:.65}.crm-donut-wrap{display:flex;align-items:center;gap:3px;min-height:160px;height:calc(100% - 23px)}.crm-donut-wrap>svg{width:43%;max-height:170px;flex-shrink:0}.crm-legend{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px;min-width:0}.crm-legend-item{display:flex;align-items:center;gap:5px;font-size:.61em;white-space:nowrap;background:none;border:0;text-align:left;padding:0;color:#d0d3de!important}.crm-legend-item i,.crm-region-list i,.crm-dot,.crm-mini-legend i{display:inline-block;flex-shrink:0;width:5px;height:5px;border-radius:50%}.crm-legend-item.crm-selected{color:white!important}.crm-donut-value{font-size:22px;font-weight:600;fill:#eee}.crm-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.crm-view-orders{display:grid;grid-template-columns:28% 42% 1fr;gap:11px;min-height:470px}.crm-dispatch-panel,.crm-carrier-panel{display:flex;flex-direction:column}.crm-dispatch-panel .crm-panel-heading>div,.crm-carrier-panel .crm-panel-heading>div{display:block}.crm-live{font-size:.62em;white-space:nowrap;color:#70c397;background:#27825b27;padding:2px 6px;border-radius:8px}.crm-filter-tabs{display:flex;gap:5px;margin:14px 0 7px}.crm-filter-tabs button,.crm-filter-tabs>span{font-size:.65em;font-weight:600;border:0;border-radius:5px;background:#ffffff08;padding:4px 7px;color:#bbbfcc}.crm-filter-tabs .crm-filter-active{background:#2d839044;color:#76cae5}.crm-order-list{display:flex;flex-direction:column;gap:3px}.crm-order-row{display:flex;align-items:center;justify-content:space-between;gap:5px;text-align:left;padding:9px 7px;border:0;border-bottom:1px solid #ffffff06;border-radius:6px;background:#ffffff05}.crm-order-row:hover{background:#ffffff08}.crm-order-row>div{display:flex;flex-direction:column;min-width:0}.crm-order-row b{color:#70b1d4;font-size:.71em;font-weight:650}.crm-order-row>div>span{font-size:.81em;line-height:1.6}.crm-order-row small{font-size:.71em;color:#9492a8}.crm-order-status{font-size:.6em;font-weight:500;padding:2px 6px;border-radius:8px;white-space:nowrap}.crm-status-in-dispatch{color:#7fc8e5;background:#1e7dac38}.crm-status-packing{color:#ba9bdd;background:#81529c39}.crm-status-verified,.crm-status-shipped{color:#73cab0;background:#23896539}.crm-status-processing{color:#d9c45d;background:#87762942}.crm-blue-action,.crm-soft-action{display:flex;align-items:center;justify-content:center;gap:7px;min-height:27px;padding:5px 9px;border:1px solid #4d9bc14a;border-radius:5px;background:#2364852b;color:#81bce0!important;font-size:.78em;text-decoration:none}.crm-blue-action:hover{background:#317c9e48}.crm-soft-action{background:#ffffff06;color:#d5d5df!important;border-color:#ffffff0e}.crm-soft-action:hover{background:#ffffff12}.crm-dispatch-button{width:100%;margin-top:auto}.crm-velocity-column{display:flex;flex-direction:column;gap:11px;min-width:0}.crm-velocity-panel{display:flex;flex-direction:column;flex:1;min-height:340px}.crm-velocity-panel .crm-panel-heading>div{display:block}.crm-line-chart{max-height:325px;min-height:220px;margin-top:8px}.crm-small-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;min-height:116px}.crm-small-stat{display:flex;flex-direction:column;padding:11px;justify-content:space-between;gap:17px}.crm-small-stat>span{font-size:.75em;color:#aaa7bb}.crm-small-stat strong{font-size:1.45em;font-weight:600;letter-spacing:-.035em;white-space:nowrap}.crm-small-stat small{font-size:.64em;color:#67beb3;white-space:nowrap}.crm-progress-list{display:flex;flex-direction:column;gap:18px;margin-top:20px}.crm-progress-row p{display:flex;justify-content:space-between;gap:8px;align-items:baseline;font-size:.72em;margin-bottom:5px}.crm-progress-row p b{font-size:.9em;font-weight:500;white-space:nowrap}.crm-progress-row>div{height:4px;background:#ffffff0a;border-radius:5px}.crm-progress-row i{display:block;height:100%;border-radius:5px;box-shadow:0 0 5px currentColor}.crm-hub-list{display:flex;flex-direction:column;gap:7px;margin-top:auto;padding-top:20px}.crm-hub-list p,.crm-list-metrics p,.crm-region-list p{display:flex;align-items:center;gap:5px;font-size:.72em;color:#b3b5c6}.crm-hub-list i{width:5px;height:5px;border-radius:50%;background:#4bc1a8}.crm-hub-list b,.crm-list-metrics b,.crm-region-list b{margin-left:auto;font-weight:500;color:#65b8d3;white-space:nowrap}
.crm-view-ecosystem{min-height:470px}.crm-integration-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:11px;flex:1.2}.crm-integration{display:flex;flex-direction:column;min-height:139px}.crm-integration-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:21px;color:#6abca5}.crm-integration:nth-child(2) .crm-integration-top{color:#8b78e4}.crm-integration:nth-child(4) .crm-integration-top{color:#67bbd6}.crm-integration:nth-child(5) .crm-integration-top{color:#ce73b7}.crm-switch{display:flex;align-items:center;width:29px;height:16px;padding:2px;border-radius:10px;border:1px solid #ffffff16;background:#40434b33;color:#ccc}.crm-switch i{display:block;width:10px;height:10px;border-radius:50%;background:#bfc3c5;transition:transform .18s,background .18s}.crm-switch-on{background:#27845655}.crm-switch-on i{background:#43d994;transform:translateX(12px);box-shadow:0 0 5px #50e7ad88}.crm-integration h3{font-size:.92em}.crm-integration>p{font-size:.71em;color:#9491a5}.crm-integration footer{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;padding-top:22px;font-size:.67em;color:#b4aebf}.crm-integration footer span{display:flex;align-items:center;gap:5px}.crm-integration footer i{width:4px;height:4px;border-radius:50%}.crm-integration footer b{font-weight:500;border-radius:5px;padding:2px 5px;background:#ffffff06;font-size:.9em}.crm-disconnected h3,.crm-disconnected footer{opacity:.55}.crm-ecosystem-bottom{display:grid;grid-template-columns:1.5fr 1fr;gap:11px;flex:1;min-height:230px}.crm-mini-legend{display:flex;align-items:center;gap:5px;font-size:.65em;color:#b5b2c3;white-space:nowrap}.crm-mini-legend i:nth-of-type(2){margin-left:6px}.crm-purple{background:#a38af1}.crm-cyan{background:#62bfcf}.crm-green{background:#40c59c}.crm-telemetry{display:flex;align-items:center;gap:12px;height:calc(100% - 23px);min-height:175px}.crm-telemetry>svg{width:35%;max-height:150px;flex-shrink:0}.crm-list-metrics{display:flex;flex-direction:column;gap:12px;flex:1;min-width:0}.crm-list-metrics p{font-size:.69em}
.crm-view-customers{display:grid;grid-template-columns:35% 1fr;gap:11px;min-height:470px}.crm-customer-column,.crm-customer-charts{display:flex;flex-direction:column;gap:11px;min-width:0}.crm-vip-panel{display:flex;flex-direction:column;flex:1;min-height:328px}.crm-vip-panel>header{display:flex;align-items:center;justify-content:space-between;font-size:.67em}.crm-vip-badge{display:flex;align-items:center;gap:3px;color:#c4c5f3;background:#a6a3d126;border-radius:8px;padding:2px 6px;font-weight:600}.crm-vip-badge .crm-icon{width:12px;height:12px;color:#92cbf4}.crm-active-label{color:#70cbb3}.crm-vip-person{display:flex;align-items:center;gap:10px;margin-top:auto;margin-bottom:auto;padding:32px 0}.crm-customer-avatar{width:42px;height:42px;flex-shrink:0;border-radius:7px}.crm-vip-person h3{font-size:1.02em;font-weight:600}.crm-vip-person p{font-size:.75em;color:#a4a1b7}.crm-vip-person b{font-size:.72em;color:#74acc9;font-weight:500}.crm-product-tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:auto}.crm-product-tags span{background:#ffffff0a;border-radius:5px;font-size:.64em;padding:3px 5px;color:#c3bccd}.crm-vip-panel>footer{display:flex;gap:6px;margin-top:33px}.crm-vip-panel>footer>*{flex:1;font-size:.71em}.crm-customer-column .crm-small-stats{grid-template-columns:1fr 1fr;min-height:130px}.crm-customer-charts>.crm-panel{flex:1;min-height:304px}.crm-customer-charts .crm-line-chart{max-height:290px;min-height:180px}.crm-customer-bottom{display:grid;grid-template-columns:.9fr 1.12fr;gap:11px;min-height:166px;flex:.65}.crm-customer-bottom>.crm-panel{display:flex;flex-direction:column}.crm-customer-bottom .crm-panel-heading>div{display:block}.crm-gauge{width:68%;max-height:110px;margin:auto auto 0}.crm-gauge text{fill:#e4e9fa;font-size:28px;font-weight:650}.crm-region-list{display:flex;flex-direction:column;gap:9px;margin-top:15px}.crm-region-list p{font-size:.72em}.crm-region-list b{color:#d2d7e3;font-size:.88em}
.crm-view-performance{min-height:470px}.crm-executive{display:flex;flex-direction:column;min-height:155px;flex:.75}.crm-executive>header{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.crm-eyebrow{font-size:.65em;color:#76b5ca;font-weight:600;letter-spacing:.06em}.crm-executive h3{font-size:.92em}.crm-quarter-actions{display:flex;align-items:center;gap:8px}.crm-quarter-actions .crm-blue-action{font-size:.68em;min-height:24px;padding:3px 8px}.crm-quarter-tabs{display:flex;align-items:center;gap:2px;background:#ffffff05;border-radius:7px;padding:2px}.crm-quarter-tabs button,.crm-quarter-tabs>span{background:none;border:0;border-radius:5px;color:#a8adbb;padding:2px 7px;font-size:.74em}.crm-quarter-tabs .crm-quarter-active{background:#ffffff20;color:#e8e9f2}.crm-executive-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:auto;padding-top:43px}.crm-executive-metric>span{font-size:.67em;color:#b0acbf}.crm-executive-metric>div{display:flex;align-items:center;gap:6px;white-space:nowrap}.crm-executive-metric strong{font-size:1.35em;font-weight:650;letter-spacing:-.03em}.crm-executive-metric small{color:#58c4ae;background:#23796127;border-radius:6px;padding:0 3px;font-size:.62em}.crm-executive-metric p{font-size:.58em;color:#aaa1b9}.crm-performance-middle{display:grid;grid-template-columns:1.56fr 1fr;gap:11px;flex:1.5;min-height:252px}.crm-performance-middle>.crm-panel{display:flex;flex-direction:column}.crm-performance-middle .crm-panel-heading>div{display:block}.crm-performance-middle .crm-chart{margin-top:9px;max-height:234px}.crm-capsule-label{fill:#e2e7ff;font-size:10px;font-weight:500}.crm-target-glow{filter:drop-shadow(0 0 5px #64ffcc)}.crm-ledger{gap:16px;margin-top:auto;padding-top:15px}.crm-ledger .crm-progress-row:last-child{border:1px solid #4d938838;border-radius:6px;background:#48a48c07;padding:5px}.crm-compliance{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;align-items:center;min-height:81px;flex:.35}.crm-compliance-item{display:flex;align-items:center;gap:8px;border:0;background:none;text-align:left;font-size:.7em;padding:5px 0}.crm-compliance-item b{display:block;font-weight:550;color:#67c9b5;font-size:.88em}.crm-compliance-check{display:grid;place-items:center;background:#21795d55;border:1px solid #4a96814d;border-radius:50%;width:21px;height:21px;color:#68b9a2;flex-shrink:0}.crm-compliance-check .crm-icon{width:12px;height:12px}.crm-empty{padding:22px 10px!important;color:#a8aabc;font-size:.9em;text-align:center}
.crm-dialog{position:fixed;inset:0;width:min(440px,calc(100vw - 32px));max-height:85vh;margin:auto;overflow:auto;border:1px solid #787b9970;border-radius:18px;padding:23px;background:radial-gradient(ellipse at 0 0,#3d345b90,transparent 60%),#141b26;color:#e9ecf7;box-shadow:0 20px 80px #0009;font:13px/1.6 Inter,"Segoe UI",Arial,sans-serif}.crm-dialog::backdrop{background:#03070db5;backdrop-filter:blur(5px)}.crm-dialog>header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:20px}.crm-dialog h3{font-size:17px;line-height:1.3;font-weight:600}.crm-dialog p{color:#bcc1d3;margin-bottom:14px}.crm-dialog label{display:flex;flex-direction:column;gap:7px;font-size:12px;color:#c7ccde}.crm-dialog input[type=date],.crm-dialog textarea{width:100%;padding:10px;border-radius:8px;border:1px solid #59627f99;background:#0a101d;color:#eef2fb;color-scheme:dark}.crm-dialog textarea{min-height:112px;resize:vertical}.crm-dialog form .crm-blue-action{margin-top:14px;width:100%}.crm-setting-row{flex-direction:row!important;align-items:center;justify-content:space-between;padding:13px 0;border-top:1px solid #ffffff0c}.crm-setting-row input{accent-color:#71bcde;width:17px;height:17px}.crm-dialog-note{font-size:11px!important;color:#959eb6!important;margin-top:13px!important}.crm-notification-list{list-style:none;margin:0 0 15px;padding:0;display:flex;flex-direction:column;gap:20px}.crm-notification-list li{display:flex;flex-direction:column;gap:5px}.crm-notification-list b{font-weight:550}.crm-notification-list span{color:#9fa9c4;font-size:11px}.crm-notification-list .crm-blue-action{align-self:flex-start}.crm-dialog-profile{display:flex;align-items:center;gap:15px;margin-bottom:20px}.crm-dialog-profile .crm-avatar{width:45px;height:45px}.crm-dialog-profile p{font-size:11px;margin:0}.crm-saved-message{border:1px solid #527477;border-radius:8px;padding:12px;margin-bottom:15px;background:#0e343733;overflow-wrap:anywhere}.crm-saved-message b{font-size:11px;color:#84cfcb}.crm-saved-message p{white-space:pre-wrap;margin:4px 0 0}.crm-report-values{margin:20px 0;display:flex;flex-direction:column;gap:9px}.crm-report-values>div{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #ffffff0c;padding-bottom:9px}.crm-report-values dt{color:#aeb9cc}.crm-report-values dd{margin:0;font-weight:650}.crm-status{position:absolute;z-index:3;left:50%;bottom:15px;transform:translateX(-50%);display:flex;align-items:center;gap:10px;max-width:90%;border-radius:9px;padding:0;background:#111d2ff2;color:#cde7ee;border:0;font-size:11px;box-shadow:0 4px 20px #0005}.crm-status-visible{padding:9px 13px;border:1px solid #527b9780}.crm-status button{display:grid;place-items:center;flex-shrink:0;background:none;border:0;padding:0;color:#b6d1df}.crm-status .crm-icon{width:13px;height:13px}
.crm-bar-enter{transform-origin:center 201px;animation:crm-bars-in .62s cubic-bezier(.2,.8,.3,1) both;animation-delay:var(--crm-delay,0ms)}.crm-donut-enter{animation:crm-donut-in .8s ease both;animation-delay:var(--crm-delay,0ms)}.crm-line-enter{stroke-dasharray:100;animation:crm-line-in .9s ease both}.crm-capsule-enter{transform-origin:center bottom;animation:crm-bars-in .6s ease both;animation-delay:var(--crm-delay,0ms)}.crm-progress-enter{transform-origin:left;animation:crm-progress-in .7s ease both}.crm-root[data-running=false] .crm-bar-enter,.crm-root[data-running=false] .crm-donut-enter,.crm-root[data-running=false] .crm-line-enter,.crm-root[data-running=false] .crm-capsule-enter,.crm-root[data-running=false] .crm-progress-enter,.crm-root[data-running=false] .crm-view{animation-play-state:paused}.crm-root[data-contrast=true] .crm-panel{border-color:#aaaac085}.crm-thumbnail{padding:0;min-height:0!important;aspect-ratio:1.66;pointer-events:none;font-size:11px}.crm-thumb-viewport{position:absolute;inset:0}.crm-thumbnail .crm-shell{width:1080px;min-height:650px;margin:0;aspect-ratio:auto;transform:scale(calc(100cqw / 1080px));transform-origin:top left;border-radius:22px}.crm-thumbnail .crm-content{padding:15px 18px 18px;gap:12px}.crm-thumbnail .crm-view{min-height:0}.crm-thumbnail .crm-overview-top{min-height:290px}.crm-thumbnail .crm-overview-bottom{min-height:220px}.crm-thumbnail .crm-panel{border-radius:15px}.crm-thumbnail .crm-heading h2{font-size:17px}.crm-thumbnail .crm-heading p{font-size:8px}.crm-thumbnail .crm-integration-grid{min-height:295px}.crm-thumbnail .crm-performance-middle{min-height:276px}.crm-thumbnail .crm-customer-charts>.crm-panel{min-height:330px}.crm-thumbnail .crm-nav-item{width:33px;height:33px}.crm-thumbnail .crm-rail{gap:22px;padding:17px 0}.crm-thumbnail .crm-rail nav{gap:13px}.crm-thumbnail .crm-category-panel .crm-donut-wrap{min-height:190px}
@keyframes crm-view-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}@keyframes crm-bars-in{from{transform:scaleY(0);opacity:.25}to{transform:scaleY(1);opacity:1}}@keyframes crm-donut-in{from{opacity:0;stroke-dasharray:0 100}to{opacity:1;stroke-dasharray:var(--crm-dash,85 15)}}@keyframes crm-line-in{from{stroke-dashoffset:100;opacity:.2}to{stroke-dashoffset:0;opacity:1}}@keyframes crm-progress-in{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@container glassy-crm (max-width:850px){.crm-shell{min-height:530px}.crm-content{padding:11px;gap:8px}.crm-heading>div:first-child{align-items:flex-start;flex-direction:column;gap:1px}.crm-heading h2{font-size:1.4em}.crm-heading p{font-size:.65em}.crm-panel{padding:10px;border-radius:11px}.crm-overview-top{min-height:230px}.crm-overview-bottom{min-height:190px}.crm-donut-wrap{min-height:138px}.crm-legend-item{font-size:.57em}.crm-view-orders{grid-template-columns:29% 40% 1fr;gap:8px;min-height:406px}.crm-panel-heading h3{font-size:.87em}.crm-subtitle{font-size:.65em}.crm-order-status{font-size:.55em;padding:2px 4px}.crm-order-row{padding:8px 3px;gap:2px}.crm-velocity-panel{min-height:300px}.crm-small-stats{gap:6px;min-height:96px}.crm-small-stat{padding:9px;gap:13px}.crm-small-stat strong{font-size:1.25em}.crm-small-stat small{font-size:.58em}.crm-mini-legend{font-size:.57em;gap:3px}.crm-progress-row p{font-size:.66em}.crm-hub-list p{font-size:.61em}.crm-telemetry{gap:6px;min-height:150px}.crm-list-metrics p{font-size:.62em}.crm-view-customers{min-height:415px;grid-template-columns:35% 1fr;gap:8px}.crm-vip-panel{min-height:290px}.crm-vip-person{gap:7px}.crm-customer-avatar{width:32px;height:32px}.crm-vip-person h3{font-size:.93em}.crm-vip-person p,.crm-vip-person b{font-size:.65em}.crm-product-tags{gap:4px}.crm-product-tags span{font-size:.58em}.crm-customer-bottom{gap:8px;min-height:132px}.crm-region-list p{font-size:.63em}.crm-customer-charts>.crm-panel{min-height:265px}.crm-executive-metric strong{font-size:1.15em}.crm-executive-metric small{font-size:.51em}.crm-executive-metrics{gap:6px}.crm-compliance{gap:5px}.crm-compliance-item{font-size:.62em;gap:5px}.crm-performance-middle{min-height:230px;gap:8px}.crm-performance-middle .crm-mini-legend{display:none}.crm-ledger{gap:14px}.crm-view-performance{min-height:415px}.crm-thumbnail .crm-shell{min-height:650px}.crm-thumbnail .crm-content{padding:15px 18px 18px;gap:12px}.crm-thumbnail .crm-heading>div:first-child{flex-direction:row;align-items:baseline}.crm-thumbnail .crm-panel{padding:13px}.crm-thumbnail .crm-heading p{font-size:8px}.crm-thumbnail .crm-overview-top{min-height:290px}.crm-thumbnail .crm-overview-bottom{min-height:220px}.crm-thumbnail .crm-view-orders{grid-template-columns:28% 42% 1fr;gap:11px;min-height:470px}.crm-thumbnail .crm-small-stats{min-height:116px}.crm-thumbnail .crm-small-stat strong{font-size:1.45em}.crm-thumbnail .crm-velocity-panel{min-height:340px}.crm-thumbnail .crm-view-customers{min-height:470px}.crm-thumbnail .crm-customer-charts>.crm-panel{min-height:330px}.crm-thumbnail .crm-vip-panel{min-height:328px}.crm-thumbnail .crm-customer-bottom{min-height:166px}.crm-thumbnail .crm-view-performance{min-height:470px}.crm-thumbnail .crm-performance-middle{min-height:276px}}
@container glassy-crm (max-width:600px){.crm-shell{aspect-ratio:auto;grid-template-columns:41px 1fr;min-height:650px}.crm-content{padding:10px;gap:11px}.crm-topbar{flex-wrap:wrap;gap:6px}.crm-search{width:calc(100% - 93px);min-width:100px;height:29px}.crm-today{order:3;flex-basis:100%;font-size:9px;margin-left:2px}.crm-tools{gap:6px}.crm-tool{width:25px;height:25px}.crm-avatar,.crm-profile{width:25px;height:25px}.crm-rail{padding:15px 0}.crm-nav-item{width:27px;height:29px}.crm-nav-active:after{right:-5px}.crm-logo .crm-icon{width:21px;height:21px}.crm-logo span{display:none}.crm-heading{align-items:flex-start;flex-wrap:wrap}.crm-heading>div:first-child{width:100%}.crm-heading h2{font-size:14px;white-space:normal}.crm-heading p{font-size:8px}.crm-date-tools{gap:4px}.crm-date-tools select{max-width:80px;padding:0 5px;font-size:9px}.crm-calendar{width:25px;height:27px}.crm-overview-top{grid-template-columns:1fr;gap:10px}.crm-stat-grid{min-height:225px;gap:9px}.crm-metric{padding:11px}.crm-metric-bottom{padding-top:23px}.crm-metric-bottom{flex-wrap:wrap;gap:3px}.crm-metric-bottom strong{font-size:18px}.crm-metric-title{font-size:10px}.crm-metric small{font-size:8px}.crm-badge{font-size:8px}.crm-revenue-panel{min-height:200px}.crm-overview-bottom{grid-template-columns:1fr 1fr;gap:9px}.crm-summary-card{min-height:152px}.crm-summary-card strong{font-size:24px}.crm-summary-card p{font-size:8px;line-height:1.6}.crm-category-panel{grid-column:1/-1;min-height:190px}.crm-panel-heading h3{font-size:11px}.crm-donut-wrap{justify-content:center;gap:12px;min-height:160px}.crm-legend-item{font-size:8px}.crm-donut-wrap>svg{width:38%}.crm-view-orders{grid-template-columns:1fr;gap:11px}.crm-dispatch-panel{min-height:380px}.crm-order-row{padding:10px}.crm-order-row b,.crm-order-row small{font-size:9px}.crm-order-row>div>span{font-size:11px}.crm-order-status{font-size:9px}.crm-filter-tabs button,.crm-filter-tabs>span{font-size:9px;padding:5px 8px}.crm-dispatch-button{margin-top:18px}.crm-velocity-panel{min-height:320px}.crm-small-stats{min-height:110px}.crm-carrier-panel{min-height:280px}.crm-progress-row p,.crm-hub-list p{font-size:10px}.crm-integration-grid{grid-template-columns:repeat(2,1fr);gap:9px}.crm-integration{min-height:155px}.crm-integration h3{font-size:11px}.crm-integration>p{font-size:9px}.crm-integration footer{font-size:8px}.crm-ecosystem-bottom{grid-template-columns:1fr}.crm-ecosystem-bottom>.crm-panel{min-height:230px}.crm-mini-legend{font-size:8px;flex-wrap:wrap;white-space:normal}.crm-telemetry{min-height:170px;gap:16px}.crm-list-metrics p{font-size:10px}.crm-view-customers{grid-template-columns:1fr}.crm-vip-panel{min-height:320px}.crm-customer-avatar{width:42px;height:42px}.crm-vip-person h3{font-size:14px}.crm-vip-person p,.crm-vip-person b{font-size:10px}.crm-product-tags span{font-size:9px}.crm-vip-panel>footer>*{font-size:10px}.crm-customer-charts>.crm-panel{min-height:270px}.crm-customer-bottom{min-height:180px;grid-template-columns:1fr}.crm-customer-bottom>.crm-panel{min-height:170px}.crm-region-list p{font-size:10px}.crm-executive>header{flex-wrap:wrap}.crm-quarter-actions{margin-top:6px}.crm-executive-metrics{grid-template-columns:repeat(2,1fr);gap:18px;padding-top:30px}.crm-executive-metric>span{font-size:9px}.crm-executive-metric strong{font-size:16px}.crm-executive-metric small{font-size:7px}.crm-executive-metric p{font-size:8px}.crm-performance-middle{grid-template-columns:1fr}.crm-performance-middle>.crm-panel{min-height:245px}.crm-ledger{padding:12px 0;gap:18px}.crm-compliance{grid-template-columns:repeat(2,1fr);gap:15px;padding:15px}.crm-compliance-item{font-size:9px}.crm-thumbnail .crm-shell{grid-template-columns:5.7% 1fr;min-height:650px}.crm-thumbnail .crm-topbar{flex-wrap:nowrap;gap:15px}.crm-thumbnail .crm-today{order:0;flex-basis:auto;font-size:.77em}.crm-thumbnail .crm-search{width:208px}.crm-thumbnail .crm-tools{gap:9px}.crm-thumbnail .crm-tool,.crm-thumbnail .crm-avatar,.crm-thumbnail .crm-profile{width:29px;height:29px}.crm-thumbnail .crm-heading{align-items:center}.crm-thumbnail .crm-heading h2{font-size:17px;white-space:nowrap}.crm-thumbnail .crm-heading p{font-size:8px}.crm-thumbnail .crm-date-tools select,.crm-thumbnail .crm-range-static{font-size:.78em}.crm-thumbnail .crm-overview-top{grid-template-columns:1fr 1.04fr}.crm-thumbnail .crm-stat-grid{min-height:0}.crm-thumbnail .crm-metric-bottom strong{font-size:1.65em}.crm-thumbnail .crm-metric-title{font-size:.85em}.crm-thumbnail .crm-metric small{font-size:.65em}.crm-thumbnail .crm-badge{font-size:.62em}.crm-thumbnail .crm-overview-bottom{grid-template-columns:1fr 1fr 1.78fr}.crm-thumbnail .crm-category-panel{grid-column:auto;min-height:0}.crm-thumbnail .crm-summary-card{min-height:0}.crm-thumbnail .crm-summary-card strong{font-size:1.9em}.crm-thumbnail .crm-summary-card p{font-size:.64em}.crm-thumbnail .crm-panel-heading h3{font-size:1em}.crm-thumbnail .crm-donut-wrap{gap:3px}.crm-thumbnail .crm-legend-item{font-size:.61em}.crm-thumbnail .crm-donut-wrap>svg{width:43%}.crm-thumbnail .crm-dispatch-panel{min-height:0}.crm-thumbnail .crm-dispatch-button{margin-top:auto}.crm-thumbnail .crm-order-row{padding:9px 7px}.crm-thumbnail .crm-order-row b,.crm-thumbnail .crm-order-row small{font-size:.71em}.crm-thumbnail .crm-order-row>div>span{font-size:.81em}.crm-thumbnail .crm-order-status{font-size:.6em}.crm-thumbnail .crm-filter-tabs>span{font-size:.65em}.crm-thumbnail .crm-carrier-panel{min-height:0}.crm-thumbnail .crm-progress-row p,.crm-thumbnail .crm-hub-list p{font-size:.72em}.crm-thumbnail .crm-integration-grid{grid-template-columns:repeat(3,1fr)}.crm-thumbnail .crm-integration{min-height:139px}.crm-thumbnail .crm-integration h3{font-size:.92em}.crm-thumbnail .crm-integration>p{font-size:.71em}.crm-thumbnail .crm-integration footer{font-size:.67em}.crm-thumbnail .crm-ecosystem-bottom{grid-template-columns:1.5fr 1fr}.crm-thumbnail .crm-ecosystem-bottom>.crm-panel{min-height:230px}.crm-thumbnail .crm-list-metrics p{font-size:.69em}.crm-thumbnail .crm-view-customers{grid-template-columns:35% 1fr}.crm-thumbnail .crm-customer-avatar{width:42px;height:42px}.crm-thumbnail .crm-vip-person h3{font-size:1.02em}.crm-thumbnail .crm-vip-person p{font-size:.75em}.crm-thumbnail .crm-vip-person b{font-size:.72em}.crm-thumbnail .crm-customer-bottom{grid-template-columns:.9fr 1.12fr;min-height:166px}.crm-thumbnail .crm-product-tags span{font-size:.64em}.crm-thumbnail .crm-vip-panel>footer>*{font-size:.71em}.crm-thumbnail .crm-region-list p{font-size:.72em}.crm-thumbnail .crm-executive>header{flex-wrap:nowrap}.crm-thumbnail .crm-quarter-actions{margin-top:0}.crm-thumbnail .crm-executive-metrics{grid-template-columns:repeat(4,1fr);padding-top:43px;gap:10px}.crm-thumbnail .crm-executive-metric>span{font-size:.67em}.crm-thumbnail .crm-executive-metric strong{font-size:1.35em}.crm-thumbnail .crm-executive-metric small{font-size:.62em}.crm-thumbnail .crm-executive-metric p{font-size:.58em}.crm-thumbnail .crm-performance-middle{grid-template-columns:1.56fr 1fr}.crm-thumbnail .crm-compliance{grid-template-columns:repeat(4,1fr)}.crm-thumbnail .crm-compliance-item{font-size:.7em}}
/* Desktop dimensions follow the reference's 650 × 392 glass shell. */
@container glassy-crm (min-width:601px){
  .crm-shell{aspect-ratio:1.66;min-height:0}
  .crm-content{min-height:0;padding:1.5cqw;font-size:clamp(8px,1.35cqw,14px);gap:1cqw}
  .crm-topbar{min-height:0;height:2.8cqw;gap:1.5cqw}
  .crm-search{width:18cqw;min-width:0;height:2.8cqw;padding:0 .9cqw}
  .crm-tools{gap:.8cqw}.crm-tool,.crm-avatar,.crm-profile{width:2.8cqw;height:2.8cqw}.crm-tool .crm-icon{width:1.5cqw;height:1.5cqw}
  .crm-heading{min-height:0;height:3cqw}.crm-heading>div:first-child{flex-direction:row;align-items:baseline;gap:.3cqw}.crm-heading h2{font-size:1.47em}.crm-heading p{font-size:.75em}
  .crm-date-tools select,.crm-range-static,.crm-calendar{height:2.7cqw;font-size:.78em}.crm-calendar{width:2.7cqw;padding:0}.crm-calendar .crm-icon{width:1.4cqw;height:1.4cqw}
  .crm-rail{padding:1.8cqw 0;gap:1.35cqw}.crm-logo .crm-icon{width:1.8cqw;height:1.8cqw}.crm-logo span{font-size:.7em}.crm-rail nav{gap:1cqw}.crm-nav-item{width:2.65cqw;height:2.65cqw;border-radius:.7cqw}.crm-nav-item .crm-icon{width:1.25cqw;height:1.25cqw}.crm-nav-active:after{right:-.6cqw;top:.65cqw;width:.25cqw;height:1.25cqw}
  .crm-view{min-height:0;gap:1cqw}.crm-panel{padding:1.15cqw;border-radius:1.45cqw}.crm-panel-heading{min-height:2.2cqw}.crm-panel-heading h3{font-size:1em}.crm-subtitle{font-size:.73em}
  .crm-overview-top{min-height:0;flex:1.14;gap:1cqw}.crm-stat-grid{gap:1cqw}.crm-metric{padding:1.1cqw}.crm-metric-bottom{padding-top:2cqw}.crm-metric-title{font-size:.85em}
  .crm-metric-bottom strong{font-size:1.65em}.crm-metric small{font-size:.65em}.crm-badge{font-size:.62em}.crm-arrow{width:1.95cqw;height:1.95cqw}.crm-arrow .crm-icon{width:1cqw;height:1cqw}
  .crm-chart{height:100%;max-height:100%;min-height:0;margin-top:0}.crm-overview-bottom{min-height:0;flex:.96;gap:1cqw}.crm-summary-card strong{font-size:1.9em}.crm-summary-card p{font-size:.64em}
  .crm-donut-wrap{min-height:0;gap:.4cqw;justify-content:flex-start;height:calc(100% - 2.2cqw)}.crm-donut-wrap>svg{width:43%;max-height:100%}.crm-legend{gap:.65cqw}.crm-legend-item{font-size:.72em}
  .crm-view-orders{grid-template-columns:28% 42% 1fr;grid-template-rows:minmax(0,1fr);gap:1cqw}.crm-velocity-column{gap:1cqw}.crm-velocity-panel{min-height:0;flex:3}.crm-line-chart{min-height:0;max-height:100%;margin-top:.4cqw}
  .crm-small-stats{min-height:0;gap:.8cqw;flex:1}.crm-small-stat{padding:1cqw;gap:1.2cqw}.crm-small-stat strong{font-size:1.45em}.crm-small-stat small{font-size:.64em}.crm-filter-tabs{margin:1.4cqw 0 .7cqw}
  .crm-order-row{padding:.9cqw .6cqw}.crm-order-status{font-size:.6em}.crm-progress-list{gap:1.65cqw;margin-top:2cqw}.crm-progress-row p{font-size:.72em;margin-bottom:.45cqw}.crm-progress-row>div{height:.4cqw}.crm-hub-list{gap:.6cqw;padding-top:2cqw}.crm-hub-list p{font-size:.72em}
  .crm-integration-grid{min-height:0;grid-template-rows:repeat(2,minmax(0,1fr));gap:1cqw;flex:1.12}.crm-integration{min-height:0}.crm-integration-top{margin-bottom:2.1cqw}.crm-integration footer{padding-top:1.5cqw}.crm-ecosystem-bottom{gap:1cqw;min-height:0;grid-template-rows:minmax(0,1fr);flex:1}.crm-ecosystem-bottom>.crm-panel{display:flex;flex-direction:column;min-height:0}.crm-telemetry{min-height:0;height:auto;flex:1;gap:1cqw}.crm-telemetry>svg{max-height:100%}.crm-list-metrics{gap:1cqw}.crm-list-metrics p{font-size:.69em}
  .crm-view-customers{grid-template-columns:35% 1fr;grid-template-rows:minmax(0,1fr);gap:1cqw}.crm-customer-column,.crm-customer-charts{min-height:0;gap:1cqw}.crm-vip-panel{min-height:0;flex:2.3}.crm-vip-person{padding:2.5cqw 0}.crm-vip-person h3{font-size:1.02em}.crm-vip-person p{font-size:.75em}.crm-vip-person b{font-size:.72em}
  .crm-customer-avatar{width:4cqw;height:4cqw;border-radius:.7cqw}.crm-vip-panel>footer{margin-top:2cqw}.crm-vip-panel>footer>*{font-size:.71em}.crm-product-tags span{font-size:.64em}.crm-customer-column .crm-small-stats{min-height:0;grid-template-rows:minmax(0,1fr);flex:1}
  .crm-customer-charts>.crm-panel{display:flex;flex-direction:column;min-height:0;flex:1.6}.crm-customer-bottom{min-height:0;grid-template-rows:minmax(0,1fr);flex:1;gap:1cqw}.crm-customer-bottom>.crm-panel{min-height:0}.crm-customer-charts .crm-line-chart{min-height:0;max-height:100%}.crm-region-list{gap:.9cqw;margin-top:1.4cqw}.crm-region-list p{font-size:.72em}.crm-gauge{max-height:100%;height:70%;min-height:0}
  .crm-executive{min-height:0;flex:.85}.crm-executive-metrics{gap:.9cqw;padding-top:2.8cqw}.crm-executive-metric strong{font-size:1.35em}.crm-executive-metric small{font-size:.62em}.crm-performance-middle{min-height:0;flex:1.45;gap:1cqw}.crm-performance-middle>.crm-panel{min-height:0}.crm-performance-middle .crm-chart{margin-top:.6cqw;max-height:100%}
  .crm-ledger{gap:1.3cqw;padding-top:.7cqw}.crm-compliance{min-height:0;flex:.4;gap:1cqw}.crm-compliance-item{font-size:.7em}.crm-performance-middle .crm-mini-legend{display:flex}
  .crm-blue-action,.crm-soft-action{min-height:2.7cqw;padding:.5cqw .85cqw}
  .crm-thumbnail .crm-shell{width:1080px;aspect-ratio:auto;min-height:650px}.crm-thumbnail .crm-content{font-size:11px;padding:15px 18px 18px;gap:12px}
}

/* Fullscreen hosts supply the height; the regular preview keeps its reference ratio. */
:is([data-fullscreen="true"] .crm-root,:fullscreen .crm-root,.crm-root:fullscreen):not(.crm-thumbnail){
  box-sizing:border-box;display:flex;flex-direction:column;height:100%;min-height:100%;padding:var(--crm-fullscreen-toolbar-space,60px) 0 0;overflow:hidden
}
:is([data-fullscreen="true"] .crm-root,:fullscreen .crm-root,.crm-root:fullscreen):not(.crm-thumbnail) .crm-shell{
  flex:1;width:100%;max-width:none;height:100%;min-height:0;margin:0;aspect-ratio:auto;grid-template-rows:minmax(0,1fr);border-radius:0
}
:is([data-fullscreen="true"] .crm-root,:fullscreen .crm-root,.crm-root:fullscreen):not(.crm-thumbnail) .crm-content{
  min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-gutter:stable;scrollbar-width:thin
}
:is([data-fullscreen="true"] .crm-root,:fullscreen .crm-root,.crm-root:fullscreen):not(.crm-thumbnail) .crm-rail{
  min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-width:thin
}
:is([data-fullscreen="true"] .crm-root,:fullscreen .crm-root,.crm-root:fullscreen):not(.crm-thumbnail) .crm-rail>*{
  flex-shrink:0
}
:is([data-fullscreen="true"] .crm-root,:fullscreen .crm-root,.crm-root:fullscreen):not(.crm-thumbnail) :is(.crm-topbar,.crm-heading){
  flex-shrink:0
}
:is([data-fullscreen="true"] .crm-root,:fullscreen .crm-root,.crm-root:fullscreen):not(.crm-thumbnail) .crm-view{
  flex:1 0 0;min-height:max(560px,40cqw)
}
@container glassy-crm (max-width:600px){
  :is([data-fullscreen="true"] .crm-root,:fullscreen .crm-root,.crm-root:fullscreen):not(.crm-thumbnail) .crm-view{flex:none;min-height:0}
}

.crm-root[data-motion=false] .crm-view,.crm-root[data-motion=false] .crm-bar-enter,.crm-root[data-motion=false] .crm-donut-enter,.crm-root[data-motion=false] .crm-line-enter,.crm-root[data-motion=false] .crm-capsule-enter,.crm-root[data-motion=false] .crm-progress-enter{animation:none!important;opacity:1!important}.crm-root[data-motion=false] .crm-bar-enter,.crm-root[data-motion=false] .crm-capsule-enter,.crm-root[data-motion=false] .crm-progress-enter{transform:none!important}.crm-root[data-motion=false] .crm-line-enter{stroke-dashoffset:0!important}
@media(prefers-reduced-motion:reduce){.crm-view,.crm-bar-enter,.crm-donut-enter,.crm-line-enter,.crm-capsule-enter,.crm-progress-enter{animation:none!important;opacity:1!important}.crm-bar-enter,.crm-capsule-enter,.crm-progress-enter{transform:none!important}.crm-line-enter{stroke-dashoffset:0!important}.crm-switch i{transition:none}}
@media print{body:has(.crm-print-report) *{visibility:hidden}body:has(.crm-print-report) .crm-print-report,body:has(.crm-print-report) .crm-print-report *{visibility:visible}.crm-print-report{position:fixed;inset:0;display:block;width:100%;max-height:none;border:0;background:white;color:#111;box-shadow:none;margin:0;padding:30px}.crm-print-report p,.crm-print-report dt{color:#333}.crm-print-report>header>.crm-tool,.crm-print-report .crm-print-button{display:none}.crm-print-report .crm-report-values>div{border-color:#ddd}.crm-print-report::backdrop{display:none}}
`;
