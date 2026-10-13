# Component usage guide

[← Back to the collection](../README.md)

Detailed setup, props, interaction notes, and artwork credits for every component.

## Use Glassy CRM Dashboard in your project

Copy **Glassy CRM Dashboard → Code** into `components/ui/glassy-crm-dashboard.tsx`. The exported file includes its glass surfaces, SVG charts, icons, embedded avatar photos, interaction logic, and scoped stylesheet helper. Use React, TypeScript, and Tailwind CSS 4; no dashboard, chart, or icon package is required.

```tsx
import GlassyCrmDashboard from "@/components/ui/glassy-crm-dashboard";

export default function DashboardPage() {
  return <GlassyCrmDashboard userName="Alex" initialView="overview" />;
}
```

The dark workspace follows the supplied recording: a compact icon sidebar, translucent panels, purple revenue columns, cyan data curves, a multicolor category donut, and quarterly capsule bars. Navigate between **Overview**, **Orders & Fulfillment**, **Connected Ecosystem**, **Customer Intelligence**, and **Performance & Audit**. The component uses local sample records by default. Full screen preview fills the available viewport and allows scrolling on narrow or short screens.

Search by order ID, product, or customer; typing from other views opens Orders & Fulfillment. Within Connected Ecosystem, search filters services by name or category. Order filters show all, pending, or shipped records. **Dispatch Active Batch** advances the entire non-shipped queue, including records hidden by search or filters. Connected Ecosystem lets you toggle sample integrations; the customer view includes local message and reward actions. Chart points reveal values on hover, focus, or tap. Settings, notifications, profile, date, and report controls open local dialogs.

| Prop | Type | Default / purpose |
| --- | --- | --- |
| `userName` | `string` | `"User"`; name shown in the overview greeting. |
| `dateLabel` | `string` | `"Today, Mon 22 Nov"`; replace the fixed reference date in the header. |
| `initialView` | `CrmDashboardView` | `"overview"`; select one of the five views on mount. |
| `initialRange` | `CrmDateRange` | `"month"`; initial reporting range. |
| `orders` | `readonly CrmOrder[]` | Supply order records; defaults to four samples. Incoming updates are reflected in the queue. |
| `revenue` | `readonly number[]` | Supply up to 12 nonnegative chart values; defaults to eight samples. |
| `integrations` | `readonly CrmIntegration[]` | Supply connected services and their enabled states; incoming updates are reflected. |
| `onViewChange` | `(view: CrmDashboardView) => void` | Receive sidebar navigation changes. |
| `onDateRangeChange` | `(range: CrmDateRange) => void` | Receive changes to the reporting range. |
| `onOrderDispatch` | `(orders: readonly CrmOrder[], signal: AbortSignal) => void \| Promise<void>` | Dispatch all non-shipped records through your service. Reject to show retry feedback. |
| `onIntegrationChange` | `(id: string, enabled: boolean) => void` | Receive an integration's updated local enabled state. |
| `onExport` | `(report: CrmDashboardReport) => void` | Handle report export in your application. |
| `className` | `string` | Additional classes for the component container. |

`GlassyCrmDashboardProps`, `CrmOrderStatus`, and `CrmDashboardReport` are also exported. `CrmDashboardReport` contains `view`, `range`, `quarter`, `orders`, `revenue`, and `integrations`. `CrmDashboardView` accepts `overview`, `orders`, `ecosystem`, `customers`, or `performance`; `CrmDateRange` accepts `week`, `month`, or `year`. A `CrmOrder` has `id`, `product`, `customer`, and a `status` of `"processing"`, `"verified"`, `"packing"`, `"in-dispatch"`, or `"shipped"`. A `CrmIntegration` has `id`, `name`, `category`, `statusLabel`, `latency`, `enabled`, and `color`.

Only `initialView` and `initialRange` configure the first mount. Name, date label, revenue, orders, and integrations respond to incoming props. Local order-status and enabled-state changes remain until the corresponding source value changes. Revenue is limited to 12 finite, nonnegative samples; an empty array uses the defaults. Week and year selections compare locally scaled revenue samples; the remaining reference charts and customer metrics use illustrative snapshots. Supply your own service and reporting logic when adapting the dashboard to live data.

Pass callbacks from a Client Component when using Next.js. Forward the supplied dispatch signal to your request so canceled or unmounted work can stop. Dispatch waits for your handler; a rejection leaves records unchanged and shows retry feedback. Without `onOrderDispatch`, pending records advance to In Dispatch, and those already in dispatch advance to Shipped within the local demo. Without `onExport`, **Export PDF** opens a quarterly report dialog with **Print / Save PDF**, which invokes the browser print flow; supply `onExport` to replace it with your own export service.

The named `GlassyCrmDashboardThumbnail({ className?, previewStep? })` export cycles through representative dashboard views through the homepage's shared playback controller. Each frame is inert, so selecting the card opens the full component. Reduced motion removes the decorative chart entrance animations.

## Use Skill Orbit Hero in your project

Copy **Skill Orbit Hero → Code** into `components/ui/skill-orbit-hero.tsx`. Styles are Tailwind utilities plus a few keyframes; no package is required.

```tsx
import SkillOrbitHero from "@/components/ui/skill-orbit-hero";

export default function HomePage() {
  return <SkillOrbitHero headingLevel={1} photoSrc="/me.jpg" />;
}
```

Your portrait sits inside two dashed orbits. Skills ride both rings together, with outer chips placed in the gaps between inner ones, so they never overlap at any angle. Hovering the orbit, focusing a chip, or pinning a detail pauses the rotation; each chip opens a short detail popover that stays inside the stage. Clicking pins it, and Escape or an outside click closes it.

| Prop | Type | Default / purpose |
| --- | --- | --- |
| `name`, `role`, `bio` | `string` | Intro copy; defaults describe a frontend developer. |
| `photoSrc`, `photoAlt`, `initials` | `string` | Portrait image, or an initials avatar when no photo is given. |
| `available` | `boolean` | `true`; shows the "Available for work" pill. |
| `stats` | `{ value: string; label: string }[]` | Short stat row under the intro. |
| `innerSkills`, `outerSkills` | `OrbitSkill[]` | Each skill has `name`, optional `detail`, and optional `color`. |
| `primaryAction`, `secondaryAction` | `{ label; href?; onClick? }` | Links when `href` is set, buttons otherwise. |
| `headingLevel` | `1 \| 2` | `2`; use `1` when the hero is the page heading. |
| `className` | `string` | Additional container classes. |

Reduced motion keeps the chips static and evenly spaced. The orbit pauses offscreen. `SkillOrbitHeroThumbnail({ className?, previewStep? })` turns the rings and highlights a different skill on each gallery frame.

## Use Code Profile Hero in your project

Copy **Code Profile Hero → Code** into `components/ui/code-profile-hero.tsx`. No package is required.

```tsx
import CodeProfileHero from "@/components/ui/code-profile-hero";

export default function HomePage() {
  return <CodeProfileHero />;
}
```

A dark editor types a `developer` object built from your `profile`, while a profile card beside it fills in line by line: avatar and name, role, experience, stack chips, focus, and availability. After the `render(<Profile />)` line the footer reports a compile and the card settles. **Replay** restarts the typing; **Skip** jumps to the result.

| Prop | Type | Default / purpose |
| --- | --- | --- |
| `profile` | `CodeProfile` | `name`, `role`, `stack`, plus optional `experience`, `focus`, `available`, `photoSrc`, `photoAlt`, `initials`. Omitted fields drop their code line and card part. |
| `typingSpeed` | `number` | `38` characters per second (clamped 4–400). |
| `loop` | `boolean` | `false`; replay automatically after a pause. |
| `primaryAction`, `secondaryAction` | `CodeProfileAction \| null` | Links or buttons under the card; `null` hides one. |
| `eyebrow` | `string` | Small line above the actions; an empty string hides it. |
| `onCompiled` | `() => void` | Called when the profile finishes compiling. |
| `className` | `string` | Additional container classes. |

Playback pauses offscreen and in hidden tabs. The typing is decorative and hidden from assistive technology; a visually hidden summary always provides the full profile, and a live region announces the compile. Reduced motion starts on the finished profile. `CodeProfileHeroThumbnail({ className?, previewStep? })` shows typing, assembling, compiled, and highlighted frames.

## Use ID Badge Hero in your project

Copy **ID Badge Hero → Code** into `components/ui/id-badge-hero.tsx`. The lanyard, badge, and barcode are drawn with Tailwind and SVG; no package is required.

```tsx
import IdBadgeHero from "@/components/ui/id-badge-hero";

export default function HomePage() {
  return <IdBadgeHero />;
}
```

A conference badge hangs from a lanyard beside your introduction. A damped spring pendulum keeps it swaying gently; drag it and release to watch it swing with your throw. Click, tap, Enter, or Space flips it in 3D to show skills, availability, location, and email. Arrow keys nudge the swing.

| Prop | Type | Default / purpose |
| --- | --- | --- |
| `profile` | `IdBadgeHeroProfile` | `name`, `role`, `skills`, plus optional `experience`, `bio`, `photoSrc`, `photoAlt`, `initials`, `location`, `email`, `available`. |
| `primaryAction`, `secondaryAction` | `IdBadgeHeroAction` | `{ label; href?; onClick? }`; the primary action uses `mailto:` when an email is set. |
| `headingLevel` | `1 \| 2` | `2`; use `1` when the hero is the page heading. |
| `className` | `string` | Additional container classes. |

The animation loop pauses offscreen and in hidden tabs. Reduced motion removes the sway and swing and flips without the 3D turn. `IdBadgeHeroThumbnail({ className?, previewStep? })` shows swinging and flipped frames.

## Use Lamp Login in your project

Copy **Lamp Login → Code** into `components/ui/lamp-login.tsx`. The SVG lamp, pull cord, glow, glass form, and scoped styles are all inside the file; no image or package is required.

```tsx
import LampLogin from "@/components/ui/lamp-login";

export default function LoginPage() {
  return <LampLogin />;
}
```

Drag the cord down and release (or click it, or focus it and press Enter/Space) to switch the lamp. When the light is on, the shade glows, a warm radial light fills the background, and the frosted sign-in card springs in; when it is off, the card fades out and is inert. The form includes required validation, a **Signing in…** state, an error alert, and a welcome view with **Sign out**.

| Prop | Type | Default / purpose |
| --- | --- | --- |
| `defaultOn` | `boolean` | `false`; start with the light on and the form visible. |
| `onToggle` | `(on: boolean) => void` | Called whenever the lamp is switched. |
| `onSubmit` | `(values: LampLoginValues) => void \| Promise<void>` | Receives `username` and `password`. Resolve to show success; reject with an `Error` to display its message. |
| `className` | `string` | Additional container classes. |

Without `onSubmit`, sign-in is simulated locally. Reduced motion removes the cord spring and form entrance. `LampLoginThumbnail({ className?, previewStep? })` shows off, switched-on, typing, and hover frames.

Visual reference: the supplied lamp login recording (CodeByGaurav). Its script was not shown, so the cord drag and spring are an original implementation of the visible behavior.

## Use Truck Pay Button in your project

Copy **Truck Pay Button → Code** into `components/ui/truck-pay-button.tsx`. The SVG truck, animation, and scoped styles are bundled; no package is required.

```tsx
import TruckPayButton from "@/components/ui/truck-pay-button";

export default function CheckoutPage() {
  return <TruckPayButton />;
}
```

Pressing the pill folds it into a road line. A small delivery truck loads parcels, rocks with its headlight on, and drives off; the pill returns as **Redirected ✓** with a drawn check. The truck keeps driving until both the minimum animation and your `onPay` promise have settled. A rejection shows **Try again**.

| Prop | Type | Default / purpose |
| --- | --- | --- |
| `label` | `string` | `"Yeah, I want that"`. |
| `successLabel` | `string` | `"Redirected"`. |
| `onPay` | `() => void \| Promise<void>` | Start your payment or redirect work; reject to show the retry state. |
| `onComplete` | `() => void` | Called after the success state appears. |
| `resetAfter` | `number \| null` | `2500` ms before returning to idle; `null` keeps the success state. |
| `className` | `string` | Additional container classes. |

The button stays focusable with `aria-disabled` during a run, repeated presses are ignored, and a polite live region announces progress and results. With reduced motion, the drive is skipped. `TruckPayButtonThumbnail({ className?, previewStep? })` shows idle, driving, leaving, and success frames.

Visual reference: the supplied truck payment-button recording. The brand logo from the recording is replaced with a neutral mark.

## Use Isometric Social Icons in your project

Copy **Isometric Social Icons → Code** into `components/ui/isometric-social-icons.tsx`. Icons are inline SVG and styles are scoped; no icon font or package is required.

```tsx
import IsometricSocialIcons from "@/components/ui/isometric-social-icons";

export default function SocialFooter() {
  return <IsometricSocialIcons />;
}
```

Four dark slabs sit on an isometric floor. Hovering or keyboard-focusing a link lifts its layer stack in its platform color in 0.3s; leaving lets it settle back over 1.5s.

| Prop | Type | Default / purpose |
| --- | --- | --- |
| `links` | `IsometricSocialLink[]` | Facebook, Twitter, Instagram, and LinkedIn. Each link has `id`, `label`, `href`, `color`, and an `icon` node. |
| `layers` | `number` | `5`; clamped from 2 to 8. |
| `newTab` | `boolean` | `true`; opens links with `target="_blank"` and `rel="noopener noreferrer"`. |
| `className` | `string` | Additional container classes. |

`DEFAULT_ISOMETRIC_SOCIAL_LINKS` is exported for extending the defaults. Reduced motion makes state changes instant. On very narrow containers the row becomes a 2×2 grid. `IsometricSocialIconsThumbnail({ className?, previewStep? })` raises each tile in turn.

Visual reference: the supplied isometric social icons recording (CodeByGaurav). Font Awesome glyphs are replaced with inline SVG paths.

## Use Character Deck Slider in your project

Copy **Character Deck Slider → Code** into `components/ui/character-deck-slider.tsx`. The scoped styles and the five default anime portraits are embedded in the export, so no public folder or extra package is required.

```tsx
import CharacterDeckSlider from "@/components/ui/character-deck-slider";

export default function CharactersPage() {
  return <CharacterDeckSlider />;
}
```

The active portrait sits in full color at the front of a vertical deck; two smaller grayscale cards peek above and two below. Every card animates between positions on the same `0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)` curve. Browse with the round up/down buttons, the pagination lines, a click on a peeking card, a vertical swipe or drag, or the arrow keys and Home/End while the deck is focused. A polite live region announces each change.

| Prop | Type | Default / purpose |
| --- | --- | --- |
| `items` | `CharacterDeckItem[]` | Five built-in characters. Each item has `id`, `name`, `title`, `image`, and optional `alt` and `imagePosition`. |
| `initialIndex` | `number` | `0`; clamped to the available items. |
| `loop` | `boolean` | `true`; set `false` to stop at the first and last card. |
| `onChange` | `(index: number, item: CharacterDeckItem) => void` | Called after every change. |
| `className` | `string` | Additional container classes. |

`CharacterDeckSliderThumbnail({ className?, previewStep? })` renders an inert deck at a different active card for each gallery frame. Reduced motion removes the card and caption transitions.

Visual reference: the supplied anime character card-deck recording. Its copyrighted series artwork is not reused; the default portraits are the same images used by Portrait Gallery. Replace them with your own artwork through `items`.

## Use Hologram Login in your project

Copy **Hologram Login → Code** into `components/ui/hologram-login.tsx`. The projector, light cone, glass panel, and scoped styles are pure CSS inside the file; no image or package is required.

```tsx
import HologramLogin from "@/components/ui/hologram-login";

export default function LoginPage() {
  return <HologramLogin />;
}
```

A translucent cyan panel floats above a dark emitter puck while a clip-path light cone pulses between them. The form has visually hidden labels, required validation with `aria-invalid`, a **Verifying…** state, an error alert, and a welcome screen with **Sign out**.

| Prop | Type | Default / purpose |
| --- | --- | --- |
| `title` | `string` | `"Login"`. |
| `onSubmit` | `(values: HologramLoginValues) => void \| Promise<void>` | Receives `username` and `password`. Resolve to show success; reject with an `Error` to display its message. |
| `className` | `string` | Additional container classes. |

Without `onSubmit`, the component simulates a local sign-in after about a second; it performs no remote authentication. Reduced motion stops the floating panel and pulsing rays. `HologramLoginThumbnail({ className?, previewStep? })` cycles through empty, typing, hover, and welcome frames.

Visual reference: the supplied hologram login recording (CodeByGaurav). Browser chrome, the code editor, and stickers in the recording are context only.

## Use Neon Ring Auth in your project

Copy **Neon Ring Auth → Code** into `components/ui/neon-ring-auth.tsx`. The circular cyan/magenta frame, inset form controls, SVG icons, rotating transition, and scoped styles are bundled in the export. No external animation or icon package is required.

```tsx
import NeonRingAuth from "@/components/ui/neon-ring-auth";

export default function LoginPage() {
  return <NeonRingAuth />;
}
```

The dark circular form is surrounded by cyan bloom and a traveling magenta edge. Login and sign-up trade places through a three-dimensional rotation. Password visibility, remember-me, recovery, validation, cancel, and retry are included. The inactive side of the form is inert and disabled so it cannot receive focus or submit.

| Prop | Type | Default / purpose |
| --- | --- | --- |
| `initialView` | `NeonAuthView` | `"login"`; also accepts `"signup"` or `"reset"`. |
| `onLogin` | `(credentials: NeonLoginCredentials, signal: AbortSignal) => void \| Promise<void>` | Receives `email`, `password`, and `remember`. |
| `onSignUp` | `(details: NeonSignUpDetails, signal: AbortSignal) => void \| Promise<void>` | Receives `fullName`, `email`, and `password`. |
| `onResetPassword` | `(details: NeonResetDetails, signal: AbortSignal) => void \| Promise<void>` | Receives the recovery `email`. |
| `className` | `string` | Additional container classes. |

Callbacks should resolve when the service accepts the action and reject to display an error. Pending submissions are protected from repeat clicks. **Cancel**, changing views, or unmounting aborts the supplied signal; abandoned completions do not update the current form. Pass callbacks from a Client Component and forward the signal to your network requests.

```tsx
"use client";

import NeonRingAuth, { type NeonLoginCredentials } from "@/components/ui/neon-ring-auth";

export default function ConnectedLogin() {
  async function login(details: NeonLoginCredentials, signal: AbortSignal) {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(details),
      signal,
    });
    if (!response.ok) throw new Error("Please check your email and password.");
  }
  return <NeonRingAuth onLogin={login} />;
}
```

The endpoint is supplied by your application. Without callbacks, the component reports explicit local demo success; it creates no account, sends no email, and performs no remote authentication. Initial view configures a newly mounted component. Native required/email/password validation and accessible names support ordinary keyboard use.

Decorative animation pauses when hidden or offscreen, and reduced motion removes the continuous ring and rotating transition. `NeonRingAuthThumbnail({ className?, previewStep? })` provides inert login, typing, hover, and sign-up scenes; homepage autoplay supplies each frame.

Visual reference: the supplied cyan circular login/sign-up recording. The interface uses CSS and inline SVG; browser/editor chrome and reaction stickers are recording context.

## Use Orbit Login in your project

Copy **Orbit Login → Code** into `components/ui/orbit-login.tsx`. The radial ticks, orange login panel, SVG field icons, and scoped styles are included in the exported file; no icon or animation package is required.

```tsx
import OrbitLogin from "@/components/ui/orbit-login";

export default function LoginPage() {
  return <OrbitLogin />;
}
```

The raised navy form and traveling orange tick segment follow the supplied login recording. Login, sign-up, and password recovery are usable local forms. Show/hide the password, choose a social action, or connect the async callbacks to your own service.

| Prop | Type | Default / purpose |
| --- | --- | --- |
| `initialView` | `OrbitAuthView` | `"login"`; may also be `"signup"` or `"reset"`. |
| `onLogin` | `(credentials: OrbitLoginCredentials, signal: AbortSignal) => void \| Promise<void>` | Receives `email` and `password`. |
| `onSignUp` | `(details: OrbitSignUpDetails, signal: AbortSignal) => void \| Promise<void>` | Receives `fullName`, `email`, and `password`. |
| `onResetPassword` | `(details: OrbitResetDetails, signal: AbortSignal) => void \| Promise<void>` | Receives the recovery `email`. |
| `onSocialAuth` | `(provider: OrbitSocialProvider, signal: AbortSignal) => void \| Promise<void>` | Receives `"facebook"`, `"x"`, or `"google"`; supply your provider integration. |
| `socialProviders` | `readonly OrbitSocialProvider[]` | Facebook/X/Google; pass `[]` to hide social actions. |
| `className` | `string` | Additional container classes. |

Callbacks must resolve on acceptance and reject on failure. Pending actions disable repeat submission and can be canceled. Switching forms or unmounting aborts the supplied signal; late completions do not update the abandoned view. Forward the signal to network requests and pass callbacks from a Client Component in Next.js.

```tsx
"use client";

import OrbitLogin, { type OrbitLoginCredentials } from "@/components/ui/orbit-login";

export default function ConnectedLogin() {
  async function login(credentials: OrbitLoginCredentials, signal: AbortSignal) {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      signal,
    });
    if (!response.ok) throw new Error("Please check your email and password.");
  }
  return <OrbitLogin onLogin={login} />;
}
```

The `/api/login` endpoint is application-defined. Without callbacks, success is explicitly labeled as a local demo; recovery sends no email, and social buttons perform no external sign-in. Native form validation and accessible labels are provided, and changing forms moves focus to the first input.

`OrbitLoginThumbnail({ className?, previewStep? })` contains inert login, typing, sign-up, and recovery frames. Reduced motion stops the decorative tick animation, and the gallery drives thumbnail autoplay.

Visual reference: the supplied orange login-card recording. All design elements are rendered with CSS and inline SVG; browser/editor framing and reaction stickers are excluded.

## Use Spider Reveal in your project

Copy **Spider Reveal → Code** into `components/ui/spider-reveal.tsx`. The masked/unmasked portraits, anomaly photographs, scoped styles, and stylesheet helper are bundled in the export. No separate image or animation package is required.

```tsx
import SpiderReveal from "@/components/ui/spider-reveal";

export default function DossierPage() {
  return <SpiderReveal />;
}
```

A moving spotlight reveals the human portrait beneath the mask. Tap the portrait on touch screens, or focus the scene and use Enter/Space to toggle the spotlight and arrow keys to move it. Escape hides the spotlight. **Initialize Override Sequence** reveals the whole portrait and changes the dossier's visual state. Scroll inside the scene to see the black **Known Anomalies** section; its cards open local detail panels.

| Prop | Type | Default / purpose |
| --- | --- | --- |
| `maskedImage` | `string` | Embedded reference masked portrait; replace it with an image or data URL. |
| `revealedImage` | `string` | Embedded human portrait; use the same framing as the masked image. |
| `subject` | `SpiderSubject` | `{ firstName: "Peter", lastName: "Parker", alias: "ARACHNID" }`. |
| `anomalies` | `readonly SpiderAnomaly[]` | Three reference-inspired cards; use unique IDs and your own content. |
| `revealRadius` | `number` | `140`; pixels at the reference width of 720px, bounded to 30–350 and scaled to the local scene. |
| `initialOverride` | `boolean` | `false`; initial full-portrait reveal state. |
| `onOverrideChange` | `(enabled: boolean) => void` | Receives override changes. |
| `onNavigate` | `(target: SpiderSystem) => void` | Connect `"systems"`, `"database"`, or `"diagnostics"` to your application. |
| `onAnomalySelect` | `(anomaly: SpiderAnomaly) => void` | Receives a selected card; the local detail panel also opens. |
| `className` | `string` | Additional container classes. |

Each `SpiderAnomaly` contains `id`, `name`, `classification`, and `description`, plus optional `image` and `accent`. The default Systems/Diagnostics actions open accessible native dialogs; Database scrolls to the anomalies. Dialog dismissal restores focus to its trigger. Pass callback props from a Client Component in Next.js.

```tsx
<SpiderReveal
  subject={{ firstName: "Your", lastName: "Name", alias: "DESIGNER" }}
  maskedImage="/portraits/masked.webp"
  revealedImage="/portraits/revealed.webp"
  revealRadius={150}
/>
```

The viewport and spotlight remain local to the component. A touch gesture can scroll the scene, and reduced motion removes decorative transitions. `SpiderRevealThumbnail({ className?, previewStep? })` renders inert spotlight, override, and anomaly scenes driven by the homepage autoplay controller.

Visual reference: the supplied **Hover Reveal / E.D.I.T.H** recording. The default raster artwork was extracted from its native video frames; compression and recorded distortion limit the detail. Replace the portraits and anomaly artwork with your own when adapting the dossier.

## Use Text Rain in your project

Copy **Text Rain → Code** into `components/ui/text-rain.tsx`. The glowing cloud, characters, scoped styles, and animation are included in the exported file, without a canvas or particle package.

```tsx
import TextRain from "@/components/ui/text-rain";

export default function RainPage() {
  return <TextRain characters="CREATIVE" color="#ffffff" />;
}
```

Glowing letters emerge from behind a wide, rounded white cloud over a charcoal stage. The two-second cycle moves each letter 290px during its first 70%, then shrinks it in place during the remaining 30%, following the supplied recording. Mixed letter sizes create the small sparkling points in the rain. Completed particles receive a fresh character and position without a JavaScript timer or frame loop. Deterministic first frames keep server and client rendering consistent.

| Prop | Type | Default / purpose |
| --- | --- | --- |
| `characters` | `string` | `"ABCDEFGHIJKLMNOPQRSTUVWXYZ"`; the character set used by the particles. |
| `color` | `string` | `"#ffffff"`; cloud and letter color. |
| `density` | `number` | `100`; bounded to 1–160 concurrent particles. |
| `speed` | `number` | `2`; seconds per cycle, bounded to 0.6–12. |
| `paused` | `boolean` | Optional controlled pause state. Update it in `onPausedChange`. |
| `defaultPaused` | `boolean` | `false`; initial uncontrolled pause state. |
| `showControls` | `boolean` | `false`; enable optional pause/play and replay controls. |
| `onPausedChange` | `(paused: boolean) => void` | Receives changes requested through the pause control. |
| `ariaLabel` | `string` | `"Glowing text rain"`; accessible name for the effect. |
| `className` | `string` | Additional container classes. |

Pass callbacks from a Client Component when using Next.js. CSS animation pauses while hidden or offscreen, and reduced motion provides a stable cloud and letter scene. Particle count and duration are bounded to keep the effect practical when embedded alongside other components.

`TextRainThumbnail({ className?, previewStep? })` uses the same cloud and falling-letter animation. It stays inert, owns no timer or event handlers, and pauses through the homepage's visibility and reduced-motion controls. Use `<TextRain showControls />` to enable playback controls on the full component.

Visual reference: the supplied CSS Text Rain video. The cloud is rendered with vector/CSS artwork; browser, creator, and code-editor framing are not component assets.

## Use Luxury Clock in your project

Copy **Luxury Clock → Code** into `components/ui/luxury-clock.tsx`. The dial, hands, crown mark, and scoped styles are bundled in the exported file. No clock package, remote logo, or asset folder is required.

```tsx
import LuxuryClock from "@/components/ui/luxury-clock";

export default function ClockPage() {
  return <LuxuryClock timeZone="Asia/Dhaka" />;
}
```

The teal stage, black dial, gold 12/3/6/9 numerals, white hour and minute hands, and fine glowing second hand follow the supplied clock video. The default display reads the browser's local time once each second. An accessible time label accompanies the visual dial.

| Prop | Type | Default / purpose |
| --- | --- | --- |
| `date` | `Date \| string \| number` | Supply a fixed instant to stop the live timer. Prefer an ISO timestamp with an explicit offset. |
| `timeZone` | `string` | An IANA zone, such as `"Asia/Dhaka"`; defaults to the browser's local zone. |
| `brand` | `string` | `"ROLEX"`; replace the reference label for your own design. |
| `ariaLabel` | `string` | `"Luxury analog clock"`; the reading is appended to this accessible name. |
| `className` | `string` | Additional container classes. |

```tsx
<LuxuryClock
  date="2026-10-12T10:10:30+06:00"
  timeZone="Asia/Dhaka"
  brand="YOUR STUDIO"
/>
```

A deterministic first frame avoids hydration differences. Live local time is read after mounting; a supplied fixed instant initially uses the supplied zone, or UTC until the local zone is available. The one-second timer pauses while the clock is hidden or offscreen and is released on unmount. Invalid zones fall back to UTC; an invalid fixed date falls back to live time.

`LuxuryClockThumbnail({ className?, previewStep? })` renders an inert dial with deterministic sample hand positions. The homepage controls its autoplay; it mounts no real clock timer.

Visual reference: the supplied black-and-gold analog clock recording. The crown is inline vector artwork, and the label is configurable.

## Use Portfolio Image Trail in your project

Copy **Portfolio Image Trail → Code** into `components/ui/portfolio-image-trail.tsx`. The portrait and technology artwork are embedded in the exported file, together with the scoped styles. No separate image folder or animation package is required.

```tsx
import PortfolioImageTrail from "@/components/ui/portfolio-image-trail";

export default function PortfolioPage() {
  return (
    <PortfolioImageTrail
      name="Your Name"
      initials="YN"
      workHref="#work"
      contactHref="mailto:hello@example.com"
    />
  );
}
```

Move the pointer across the cream hero, or drag on a touch screen, to reveal the fading blue image ribbon. The frosted card, lime action, central character and laptop, compact navigation, and technology labels follow the first supplied video. The reference footage provides the raster artwork; the interface and interactions are rendered as live elements.

Use `name`, `initials`, `role`, `headline`, `accentText`, `description`, `availability`, `technologies`, `localTime`, `location`, and `signature` to personalize the scene. Replace `portraitSrc`, `portraitAlt`, or `trailSrc` with your own artwork. Custom image URLs are supplied by your application; the default artwork is already included in the copied source.

`navigation` supplies links for `work`, `about`, `stack`, and `contact`. `workHref` and `contactHref` connect the two call-to-action buttons. Alternatively, supply `onNavigate(section)`, `onViewWork()`, or `onContact()` from a Client Component. With no destination or callback, the demo opens a local detail panel containing the matching project, about, technology, or contact information. Customize it through `projects`, `aboutText`, and `contactEmail`. Escape closes the panel and returns focus to its trigger.

The trail stays within its stage and releases animation frames, observers, and listeners on unmount. Hidden/offscreen scenes pause their rendering, and reduced motion keeps the interface usable without a continuously animated trail. `PortfolioImageTrailThumbnail({ className?, previewStep? })` contains an inert scene; the homepage controller supplies its preview frames.

## Use Liquid Cursor in your project

Copy **Liquid Cursor → Code** into `components/ui/liquid-cursor.tsx`. Its liquid effect, scoped styling, and portfolio views are included in the file; no cursor or animation dependency is required.

```tsx
import LiquidCursor from "@/components/ui/liquid-cursor";

export default function PortfolioPage() {
  return <LiquidCursor />;
}
```

The second supplied video starts on a white portfolio hero with three tightly spaced lines of oversized type. Moving the pointer creates a liquid shape with an elastic tail. Hovering a navigation item turns its highlight into a pill. Scroll or swipe inside the component to enter the dark gridded project section, where the cursor appears white and project rows reveal their details.

| Prop | Type | Default / purpose |
| --- | --- | --- |
| `brand` | `string` | `"PIXELFLOW"`; the studio label. |
| `headline` | `readonly string[]` | The three reference lines; each item occupies one line. |
| `projects` | `readonly LiquidCursorProject[]` | Three reference projects; each has a unique `id`, `title`, `discipline`, and `description`. |
| `onProjectSelect` | `(project: LiquidCursorProject) => void` | Receives the selected project when its detail preview opens. |
| `onContact` | `() => void` | Replaces the local contact panel with your own action. |
| `className` | `string` | Additional container classes. |

Pass callbacks from a Client Component in Next.js. The About and Updates navigation opens local information panels. Escape dismisses a panel and restores focus to its trigger.

The scene provides native buttons and keyboard navigation for both sections, with a usable touch layout. The custom cursor stays within the component and does not replace the native cursor on touch devices. Rendering pauses when the scene is hidden or offscreen and stops after the liquid settles. Reduced motion keeps the content and controls usable while removing continuous liquid movement.

`LiquidCursorThumbnail({ className?, previewStep? })` is an inert sample of the white hero and dark projects. The gallery controls its frames and pauses them with the rest of the collection.

## Use Aura Cart Animation in your project

Copy **Aura Cart Animation → Code** into `components/ui/aura-cart.tsx`. The component includes its product photography, icons, scoped styles, and gallery-to-detail animation. The Code export also includes the stylesheet helper, so the copied file needs no local helper or asset folder.

```tsx
import AuraCart from "@/components/ui/aura-cart";

export default function ShopPage() {
  return <AuraCart />;
}
```

The six-image AURA storefront opens a selected product into a cream detail page. Choose a color to crossfade its photograph, save a favorite, or select **Add to Cart** to send a small product image along a curved path into the bag. The bag count responds when the addition completes. Back returns to the product mosaic; the bag opens the local cart with remove and undo actions. Collections and Editorial open their own demo views unless you provide a navigation callback.

| Prop | Type | Default / purpose |
| --- | --- | --- |
| `products` | `readonly AuraCartProduct[]` | Six demo products. Supply your own products with unique IDs and at least one variant. |
| `initialProductId` | `string` | Optional product ID to open directly in the detail view. |
| `initialCart` | `readonly AuraCartLine[]` | The reference demo starts with two cart items. Custom products start with an empty cart unless you supply initial lines. Pass `[]` to start the default demo empty. |
| `initialSavedIds` | `readonly string[]` | `[]`; initial saved product IDs. |
| `currency` | `string` | `"USD"`; currency used to format product prices. |
| `onAddToCart` | `(selection: AuraCartSelection, signal: AbortSignal) => void \| Promise<void>` | Connect your cart service. The callback must resolve before the flight animation and local cart update proceed. |
| `onCartChange` | `(lines: readonly AuraCartLine[]) => void` | Receives the local cart after additions, removals, and undo. |
| `onSaveChange` | `(product: AuraCartProduct, saved: boolean) => void` | Receives saved-item changes so you can connect your own persistence. |
| `onNavigate` | `(target: AuraNavigationTarget) => void` | Handle `"shop"`, `"collections"`, or `"editorial"` navigation in your application. |
| `className` | `string` | Additional container classes. |

`AuraCartProduct` contains `id`, `name`, `price`, `description`, and `variants`, with optional `badge`, `rating`, and `reviewCount`. Prices use major currency units: `185` is displayed as `$185` with the default currency. Each `AuraCartVariant` contains `id`, `label`, `color`, and `image`. Replace `image` with your own image URL or data URL. `AuraCartSelection` contains the chosen `product`, `variant`, and `quantity: 1`; `AuraCartLine` has the same product and variant with a numeric quantity.

`AURA_CART_PRODUCTS` is also exported, so you can copy and customize the default catalog without rebuilding all six products.

The initial props configure newly mounted state. The default cart and saved items are local to the component and do not persist between page visits. Cart actions demonstrate the shopping interaction; provide your own server integration and checkout flow for a live store. Keep product and variant IDs stable when replacing content.

Pass callbacks from a Client Component in Next.js. This example starts with an empty cart and waits for an application-defined `/api/cart` endpoint:

```tsx
"use client";

import AuraCart, { type AuraCartSelection } from "@/components/ui/aura-cart";

export default function ConnectedShop() {
  async function addToCart(
    { product, variant, quantity }: AuraCartSelection,
    signal: AbortSignal,
  ) {
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        variantId: variant.id,
        quantity,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error("We could not add this item. Please try again.");
    }
  }

  return <AuraCart initialCart={[]} onAddToCart={addToCart} />;
}
```

Forward the supplied signal to requests so canceled or unmounted work can be aborted. A rejected or thrown callback leaves the cart count unchanged and shows an error instead of completing the success animation. Resolve the callback only after your service accepts the addition; returning `false` is not part of this API.

`AuraCartThumbnail({ className?, previewStep? })` supplies lightweight inert frames of the mosaic, product detail, and cart flight. The homepage controller drives autoplay and handles pausing. The full component adapts to its container and respects reduced-motion preferences.

Visual reference: the supplied **AURA Add to Cart Animation** video. Seven demo photographs were extracted from that recording and embedded in the component; image sharpness is limited by the video resolution. Product labels and prices are demonstration content. Replace them and the photographs with your own catalog when adapting the storefront.

## Use Liquid Glass Playground in your project

Copy **Liquid Glass Playground → Code** into `components/ui/liquid-glass-playground.tsx`. Its renderer, shaders, scoped styles, display fonts, and license notices are included in the exported file. No separate rendering package or asset folder is required.

```tsx
import LiquidGlassPlayground from "@/components/ui/liquid-glass-playground";

export default function PlaygroundPage() {
  return <LiquidGlassPlayground initialPreset="Lumen" />;
}
```

Drag the Inbox, Tasks, Player, Notes, and Files panels to rearrange them. Their rounded glass surfaces fuse on contact and separate as you pull them apart. Keyboard users can focus a panel and move it with the arrow keys; hold Shift for larger steps. Escape cancels an active drag. The layout controls arrange or scatter the panels and add or remove them; material controls tune motion, tint, refraction, and the luminous glass edge. Click empty stage space to send a pulse.

The six style presets are **Lumen, Studio, Slate, Aqua, Neon, and Entropy**. Motion presets include **Water, Gel, Honey, and Solid**. Both the background and surface renderer stay inside the component, including in a mobile-sized Preview.

| Prop | Type | Default / purpose |
| --- | --- | --- |
| `initialPreset` | `LiquidGlassStyle` | `"Lumen"`; choose a starting appearance. |
| `initialPanelCount` | `number` | `5`; starting number of panels, clamped to 1–available content (at most 10 custom panels). |
| `panels` | `readonly LiquidGlassPanel[]` | Replace the default panel content with items containing unique `id`, `title`, and `description`. |
| `quality` | `number` | `1.1`; maximum canvas pixel ratio, clamped to 0.65–1.5. Use a lower value to reduce GPU work. |
| `onLayoutChange` | `(positions: { id: string; x: number; y: number }[]) => void` | Receives visible panel positions within the local stage after dragging, keyboard movement, layout actions, and adding/removing panels. |
| `onSettingsChange` | `(settings: LiquidGlassSettings) => void` | Receives changes made with the appearance controls. |
| `className` | `string` | Additional container classes. |

Supply callbacks from a Client Component when using Next.js. `initialPreset` and `initialPanelCount` configure a newly mounted playground; they are not controlled values. Use stable unique panel IDs when replacing or reordering custom content. Use the existing Preview restart action to replay the starting configuration.

`LiquidGlassPlaygroundThumbnail({ className?, previewStep? })` is a lightweight inert scene with no GPU context, buttons, handlers, or timers. The existing homepage controller cycles its sample layouts and pauses when hidden, offscreen, manually paused, or under reduced motion.

The real lens/fusion effect requires **WebGL2**. A CSS glass fallback keeps the panels and controls usable when it is unavailable. Rendering pauses while offscreen or hidden; reduced motion removes continuous animation while keeping direct interactions usable. GPU resources and browser listeners are released when the component unmounts.

Design and rendering source: [Plasma UI by Crux Garden](https://github.com/CruxGarden/plasma-ui), also shown in the [original playground](https://cruxgarden.github.io/plasma-ui/). The original MIT notice and both fonts’ SIL Open Font Licenses are retained in the standalone export. The source renderer was adapted from viewport coordinates to a component-local canvas so it can be embedded in this portfolio.

## Use Neumorphic Navbar in your project

Copy **Neumorphic Navbar → Code** into `components/ui/neumorphic-navbar.tsx`. The rounded surfaces, soft shadows, sliding active highlight, responsive menu, and icons are included in the file; no navigation package or asset folder is required.

```tsx
import NeumorphicNavbar from "@/components/ui/neumorphic-navbar";

export default function Page() {
  return <NeumorphicNavbar />;
}
```

The default Brandly navigation contains Home, Products, Pricing, Blog, and Contact. Choosing a desktop item slides its raised highlight along the inset track. At a container width of 680px or less, the links and Get started action give way to a circular menu button. Opening it reveals a vertically stacked menu with an inset selected row. Selecting an item or clicking outside closes the menu; Escape closes it and returns focus to the menu button. Reduced motion removes transitions.

| Prop | Type | Default / purpose |
| --- | --- | --- |
| `items` | `readonly NeumorphicNavItem[]` | Five demo items. Each has a unique `id`, `label`, and optional real `href`. |
| `brand` | `string` | `"Brandly"`. |
| `brandHref` | `string` | Optional logo destination. |
| `onBrandClick` | `() => void` | Optional logo action. |
| `defaultActiveId` | `string` | Uncontrolled initial selection; defaults to the first item. |
| `activeId` | `string` | Controlled selection; update it in `onNavigate`. |
| `onNavigate` | `(item: NeumorphicNavItem) => void` | Receives the chosen navigation item. |
| `actionLabel` | `string \| null` | `"Get started"`; set `null` to hide the desktop action. |
| `actionHref` | `string` | Optional destination for the action. |
| `onAction` | `() => void` | Optional action callback. |
| `ariaLabel` | `string` | `"Main navigation"`; accessible name for the navigation. |
| `className` | `string` | Additional container classes. |

Items without `href` are selection buttons. Items with `href` are native links and keep ordinary browser behavior. The default Get started action has no destination; supply `actionHref` or `onAction` to connect it. If you use callbacks in Next.js, pass them from a Client Component:

```tsx
"use client";

import { useState } from "react";
import NeumorphicNavbar, { type NeumorphicNavItem } from "@/components/ui/neumorphic-navbar";

const items: NeumorphicNavItem[] = [
  { id: "work", label: "Work", href: "#work" },
  { id: "about", label: "About", href: "#about" },
  { id: "contact", label: "Contact", href: "#contact" },
];

export default function PortfolioNavigation() {
  const [activeId, setActiveId] = useState("work");
  return (
    <NeumorphicNavbar
      brand="Your studio"
      items={items}
      activeId={activeId}
      onNavigate={(item) => setActiveId(item.id)}
      actionLabel="Get in touch"
      actionHref="#contact"
    />
  );
}
```

`NeumorphicNavbarThumbnail({ className?, previewStep? })` is inert and contains no buttons, links, hooks, handlers, or timers. Its sample frames cycle through desktop selection and the mobile menu. The homepage controller handles autoplay and pausing.

The CSS and icons recreate the supplied **Neumorphism Navbar UI** video by **@wearepixelflow**. Brandly is the reference's demonstration brand.

## Use Verification Code in your project

Copy **Verification Code → Code** to `components/ui/verification-code.tsx`. The lock, input tiles, success orb, and scoped animation styles travel with the file; React and Tailwind CSS are the only requirements.

```tsx
import VerificationCode from "@/components/ui/verification-code";

export default function Example() {
  return <VerificationCode />;
}
```

Type or paste any four digits for the local demo. Inputs advance automatically; arrows move between digits, and Backspace in an empty field clears the previous digit. Completed tiles merge and bounce into a green check. Retry clears the code and restores focus. The resend button has a 30-second cooldown.

| Prop | Purpose |
| --- | --- |
| `onVerify(code)` | Return `boolean` or `Promise<boolean>` from your verification service. `false` shows a mismatch; throwing shows a retry message. Success animation starts only after validation returns `true`. |
| `onResend()` | Send a new code through your own service; supports asynchronous completion and visible error feedback. |
| `onVerified(code)` | Called after successful validation and the confirmation animation. |
| `resendDelay` | Resend cooldown in seconds, default `30`. |
| `className` | Additional container classes. |

Without these callbacks the component runs a local demonstration. Pass callbacks from a Client Component in Next.js and perform actual code validation and delivery on your server. Reduced motion skips the success choreography. `VerificationCodeThumbnail({ className?, previewStep? })` provides inert gallery frames.

## Use Gooey Checkbox in your project

```tsx
import GooeyCheckbox from "@/components/ui/gooey-checkbox";

export default function Example() {
  return <GooeyCheckbox name="accepted" value="yes" label="Accept terms" />;
}
```

The gray ring becomes a `#4c95f7` liquid splash with six droplets and a white drawn check. A native checkbox supplies form submission, `required` validation, reset, keyboard focus, and Space toggling. `checked` and `onCheckedChange(checked)` support controlled usage; `defaultChecked` supplies the uncontrolled initial state. It also accepts `disabled`, `label`, `className`, and other native input attributes. SVG and styles are embedded, with reduced-motion support. `GooeyCheckboxThumbnail` is an inert gallery illustration.

## Use Day / Night Toggle in your project

```tsx
import DayNightToggle from "@/components/ui/day-night-toggle";

export default function Example() {
  return <DayNightToggle />;
}
```

A smiling sun, clouds, stars, moon craters, a purple nightcap, and rising Zs recreate the second supplied video. Click or press Space to toggle; the caption and scene follow the switch. The optional recording loop changes modes every 4.5 seconds; manually switching stops it. Reduced motion removes the loop and transitions.

| Prop | Purpose |
| --- | --- |
| `checked` / `defaultChecked` | Controlled night state or uncontrolled initial state; `true` selects night. |
| `onCheckedChange(checked)` | Connect the switch to your application's theme. |
| `disabled` | Disable interaction. |
| `showCaption` / `showControls` | Show the greeting and recording-loop control, both default `true`. |
| `className` | Additional container classes. |

The file includes its artwork and styles. `DayNightToggleThumbnail` provides inert gallery frames. Callbacks should be supplied from a Client Component in Next.js.

## Use Hungry Delete in your project

```tsx
import HungryDelete from "@/components/ui/hungry-delete";

export default function Example() {
  return <HungryDelete />;
}
```

The cream stage, lime title, black offset panel shadow, and black/blue pills follow the first supplied video. Letters leap into an opening bin, the pill contracts into a spinning circle, and success increments the counter. The blue button demonstrates failure by spitting the letters back. Sound can be toggled; both paths are replayable and support reduced motion.

| Prop | Purpose |
| --- | --- |
| `onDelete()` | Async action for the black button; resolve for success, reject to restore the letters and show failure. Without it, the action is a local demo. |
| `onError(error)` | Optional error reporting callback for your real delete action. |
| `label` | Button text, default `"Delete"`. |
| `disabled` | Disable the action buttons. |
| `initialLettersEaten` | Initial counter, default `18`. |
| `initialSoundEnabled` | Initial sound toggle, default `true`. Audio only starts after interaction. |
| `className` | Additional container classes. |

All bin artwork, audio synthesis, and styles live in the single file. `HungryDeleteThumbnail` provides deterministic gallery frames. Supply callbacks from a Client Component in Next.js.

## Use Portrait Gallery in your project

Copy **Portrait Gallery → Code** into `components/ui/portrait-gallery.tsx`, then import the default component. The five portraits, Figtree font, and scoped styles are included in that file; no image host, asset folder, or animation package is required.

```tsx
import PortraitGallery from "@/components/ui/portrait-gallery";

export default function GalleryPage() {
  return <PortraitGallery />;
}
```

Hover or focus a portrait to expand it to three times the width of its neighbors. The other portraits become grayscale at 24% opacity, and its name slides into view after 400ms. Alternating vertical offsets and the black canvas follow the supplied video. Leaving the gallery restores the resting view unless a portrait was selected. Click, tap, Enter, or Space to keep one selected; Left/Right wrap through the portraits, and Home/End move to the first/last. Tab enters the group once and then moves out. Reduced motion removes transitions. Container-based sizing also works in the playground's mobile preview.

| Prop | Type | Default / purpose |
| --- | --- | --- |
| `items` | `readonly PortraitGalleryItem[]` | The five reference portraits. Replace them with your own images and names; an empty array shows an empty state. |
| `initialIndex` | `number \| null` | `null`, the equal-width resting view. Set `4` to start with Mitsui expanded. Applied on mount; finite indices are clamped to the collection. |
| `onSelect` | `(item: PortraitGalleryItem, index: number) => void` | Receives click, tap, Enter, or Space selection. Hover/focus only preview the portrait and do not call it. |
| `ariaLabel` | `string` | `"Character portrait gallery"`; accessible name for the collection. |
| `className` | `string` | Additional container classes. |

`PortraitGalleryItem` contains a unique `id`, `name`, `image` URL/data URL, and optional `imagePosition` (CSS `object-position`). IDs preserve selection if items reorder; removing a selected item restores a valid remaining preview or the resting state. Callbacks must be supplied from a Client Component in Next.js:

```tsx
"use client";

import PortraitGallery, { type PortraitGalleryItem } from "@/components/ui/portrait-gallery";

const portraits: PortraitGalleryItem[] = [
  { id: "studio", name: "Studio", image: "/images/studio.jpg" },
  { id: "garden", name: "Garden", image: "/images/garden.jpg", imagePosition: "50% 30%" },
];

export default function GalleryPage() {
  return (
    <PortraitGallery
      items={portraits}
      initialIndex={0}
      onSelect={(item) => console.log("Selected:", item.name)}
    />
  );
}
```

`PortraitGalleryThumbnail({ className?, previewStep? })` is inert and contains no buttons, hooks, handlers, or timers. The homepage controller cycles Mitsui → Tsuki → Kaito → Sora → Renji and already pauses when hidden, offscreen, manually paused, or under reduced motion.

Design and default portrait sources: [Character Showcase Gallery by pleasedonotdisturb](https://codepen.io/pleasedonotdisturb/pen/poqrZLZ), matching the supplied video. The source identifies the portraits as AI-generated character artwork. Use your own artwork when adapting the gallery to your brand. [Figtree](https://github.com/erikdkennedy/figtree) is distributed under the SIL Open Font License; its license is preserved in the exported component.

## Use Love Typography in your project

Copy **Love Typography → Code** into `components/ui/love-typography.tsx`, then import the default `LoveTypography` component. Its SVG artwork and animation styles are included; no animation package is required.

```tsx
import LoveTypography from "@/components/ui/love-typography";

export default function Example() {
  return <LoveTypography duration={8000} />;
}
```

The yellow scene cycles from “I LOVE YOU” to “I ♥ YOU”, “I ♥ U”, and a small heart. Pause and Replay control the sequence. Playback pauses offscreen and when the page is hidden; reduced motion shows a still frame.

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `autoPlay` | `boolean` | `true` | Start the sequence automatically. |
| `duration` | `number` | `8000` | Milliseconds per loop; minimum 3000. |
| `className` | `string` | — | Additional container classes. |

`LoveTypographyThumbnail` accepts `className` and `previewStep` for inert gallery frames. The artwork and motion were recreated in SVG/CSS from supplied video 4.

## Use Keyboard Cards in your project

Copy **Keyboard Cards → Code** into `components/ui/keyboard-cards.tsx`. Import the default `KeyboardCards` component to display LeafKey, TopoKey, and PandaKey.

```tsx
import KeyboardCards from "@/components/ui/keyboard-cards";

export default function Example() {
  return <KeyboardCards />;
}
```

On narrow screens, swipe horizontally through full-size keyboard cards. Hover or focus a card to lift its keyboard. Select a finish to change the keycap artwork, then select the keyboard to open its details. Escape or the close control dismisses the dialog and restores focus. These are illustrative keyboard concepts, with no checkout action.

| Prop | Type | Purpose |
| --- | --- | --- |
| `keyboards` | `readonly KeyboardCard[]` | Replace the three default concepts. |
| `onSelect` | `(keyboard: KeyboardCard, finish: KeyboardFinish) => void` | Replace the local details dialog. |
| `className` | `string` | Additional container classes. |

`KeyboardCard` contains `id`, `name`, `description`, `theme` (`leaf`, `topo`, or `panda`), and a `finishes` array of `{ name, color }` objects. `KeyboardCardsThumbnail` accepts `className` and `previewStep`. The detailed keyboards are procedural SVG recreations inspired by supplied video 11; they are not the original 3D model assets. No separate assets or packages are required.

## Use Sliding Auth in your project

Copy the complete source from the component’s **Code** tab. React, TypeScript, and Tailwind CSS 4 are required; styles and SVG artwork are included.

```tsx
import SlidingAuth from "@/components/ui/sliding-auth";
export default function Page() { return <SlidingAuth />; }
```

| Prop | Type | Default / behavior |
| --- | --- | --- |
| `initialMode` | `"login" \| "register"` | `"login"` |
| `onLogin` | `(values: SlidingLoginValues) => void \| Promise<void>` | Receives `{ username, password }`. Missing handler completes a local demo. |
| `onRegister` | `(values: SlidingRegistrationValues) => void \| Promise<void>` | Receives `{ username, email, password }`. Registration requires an email and at least 8 password characters. |
| `onResetPassword` | `(email: string) => void \| Promise<void>` | Forgot Password shows the email-reset flow. No default email is sent. |
| `onSocialSignIn` | `(provider: SlidingSocialProvider) => void \| Promise<void>` | Provider is `google`, `facebook`, `github`, or `linkedin`. Without a handler, each button announces its demo selection and integration requirement. |
| `className` | `string` | Optional container classes. |

Exported types: `SlidingAuthMode`, `SlidingSocialProvider`, `SlidingLoginValues`, `SlidingRegistrationValues`, `SlidingAuthProps`.

The blue panel expands across the card during the 900ms mode change. At a container width of 650px or below, the form becomes a vertical stack with the curved welcome panel moving between top and bottom. Invalid submission focuses the first invalid field; switching modes clears passwords and focuses the heading after the transition. Timers are cleaned up, pending submissions prevent duplicates, and reduced motion skips the transition delay.

`SlidingAuthThumbnail({ className?, previewStep? })` is inert and has no inputs, buttons, hooks, or timers. `previewStep` alternates login (0) and registration (1); CSS transitions show panel movement.

## Use Delivery Button in your project

Copy the complete source from the component’s **Code** tab. React, TypeScript, and Tailwind CSS 4 are required; styles and SVG artwork are included.

```tsx
import DeliveryButton from "@/components/ui/delivery-button";
export default function Page() { return <DeliveryButton />; }
```

| Prop | Type | Default / behavior |
| --- | --- | --- |
| `onOrder` | `() => void \| Promise<void>` | Missing handler plays a local demonstration and explicitly reports that no order was placed. |
| `label` | `string` | `"Complete Order"` |
| `successLabel` | `string` | `"Order Placed"` |
| `disabled` | `boolean` | `false` |
| `className` | `string` | Optional container classes. |

Exported type: `DeliveryButtonProps`.

Clicking loads a yellow parcel into a white truck with a red cab, closes the doors, lights the headlights, and reveals a dashed road before the green success check. Success waits for both the 7-second animation and `onOrder`; a longer callback shows Processing until it resolves. Rejection cancels animation timers and makes the button retryable. Duplicate orders are blocked while pending and after a successful real callback. The local demo offers Replay; real orders do not. Reduced motion skips animation delay and still awaits the callback. Unmounting cancels timers and ignores stale callback results.

`DeliveryButtonThumbnail({ className?, previewStep? })` is inert and has no buttons, hooks, or timers. Its four states are idle (0), loading (1), driving (2), and success (3), with state-driven CSS transitions and no running keyframe animations.

## Use Verso Auth in your project

Copy the complete source from the component’s **Code** tab. React, TypeScript, and Tailwind CSS 4 are required; styles and SVG artwork are included.

```tsx
import VersoAuth from "@/components/ui/verso-auth";
export default function Page() { return <VersoAuth />; }
```

| Prop | Type | Default / behavior |
| --- | --- | --- |
| `initialMode` | `"login" \| "register"` | `"login"` |
| `brandName` | `string` | `"VERSO"` |
| `onLogin` | `(values: VersoLoginValues) => void \| Promise<void>` | Receives `{ identifier, password, remember }`; identifier is the username-or-email field. |
| `onRegister` | `(values: VersoRegisterValues) => void \| Promise<void>` | Receives `{ name, email, password }`. Password requires at least 8 characters. |
| `onResetPassword` | `(email: string) => void \| Promise<void>` | Forgot Password opens the local reset form. No default email is sent. |
| `className` | `string` | Optional container classes. |

Exported types: `VersoAuthMode`, `VersoLoginValues`, `VersoRegisterValues`, `VersoAuthProps`.

Cream fields, an angled forest-green panel, serif welcome copy, and an approximately 950ms diagonal sweep reproduce the reference composition. The responsive stack activates at 580px container width. Show/hide password, the initially checked Keep me signed in control, registration, and reset flows all work. Remember is passed to the login callback; the component does not persist credentials. Missing handlers explicitly complete local demos without authenticating, creating accounts, or sending email. Pending requests prevent duplicate submissions; failed requests show retry feedback; timers are cleaned up. Reduced motion removes the sweep and focus delay.

`VersoAuthThumbnail({ className?, previewStep? })` is inert and has no inputs, buttons, hooks, or timers. Its two modes are login (0) and registration (1), using CSS clip-path and position transitions for the preview.

## Use Scorpion Cursor in your project

```tsx
import ScorpionCursor from "@/components/ui/scorpion-cursor";

<ScorpionCursor stroke="#e9eee9" initialPaused={false} />
```

Props: `className?: string`, `stroke?: string` (default `#e9eee9`), `initialPaused?: boolean` (default false).

Canvas pointer/touch movement and arrow keys guide the head; Space toggles pause; Escape/Home and the Reset button reset the pose. Pause preserves the current pose. The loop stops when geometry settles, when outside the viewport, when the document is hidden, on pause, and under reduced motion. It cancels its frame and disconnects resize/intersection/media/visibility listeners on unmount.

`ScorpionCursorThumbnail({className?, previewStep?})` renders inert SVG sample poses: no hooks, timers, canvas, or interactive controls. The artwork is a procedural interpretation of the supplied scorpion footage.

## Use Periodic Explorer in your project

```tsx
import PeriodicExplorer, { type PeriodicElement } from "@/components/ui/periodic-explorer";

<PeriodicExplorer
  initialLayout="sphere"
  onSelect={(element: PeriodicElement) => console.log(element.symbol)}
/>
```

Props: `className?: string`, `initialLayout?: "table" | "sphere" | "helix" | "grid"` (default table), `onSelect?: (element: PeriodicElement) => void` (notification in addition to the built-in details dialog). `PeriodicElement` contains `number`, `symbol`, `name`, `mass`, `category`, and `configuration`.

Drag empty scene space to rotate. Focus the scene and use the arrow keys to rotate or `+`/`-` to zoom; wheel zoom applies only after the scene or an element has focus, so ordinary page scrolling remains available before focusing it. Home and Reset restore the active layout. Tab into the element cards and use arrows or Home/End for roving keyboard navigation; Enter opens element details. Search matches element names, symbols, or atomic numbers and dims nonmatching cards.

The native modal opens after the selected element has committed, supports Escape/backdrop/close, and restores focus to its element card. Reduced motion removes the morph transitions. No animation loop or timer is used. ResizeObserver and the nonpassive scene-wheel listener are cleaned up on unmount.

`PeriodicExplorerThumbnail({className?, previewStep?})` renders inert CSS3D cards with transitions between sample states: the four preview steps correspond to table, sphere, helix, and grid.

Element records were embedded from the [PubChem periodic-table API](https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON). Each details card links to its primary PubChem element page. Table placement uses the conventional detached La–Lu and Ac–Lr rows, with explicit series placeholders in periods 6 and 7; group numbers are not assigned to the detached series. [IUPAC table conventions](https://iupac.org/what-we-do/periodic-table-of-elements/). Atomic masses are the values provided by PubChem; they are displayed as atomic mass in u, not as isotope-independent exact weights.

## Use Hover Product Cards in your project

```tsx
import HoverProductCards from "@/components/ui/hover-product-cards";

export default function ShopPreview() {
  return <HoverProductCards />;
}
```

Copy the entire single TSX file. Requires React, TypeScript, and Tailwind CSS; all scoped animation styles and default shoe artwork are included. No project imports, external image requests, or additional packages are required.

| Prop | Type | Purpose |
| --- | --- | --- |
| `products` | `readonly HoverProduct[]` | Replace the two default shoe cards. |
| `onBuy` | `(selection: HoverProductSelection) => void \| Promise<void>` | Handle `{ product, size, color }` in your application; reject to show retry feedback. |
| `className` | `string` | Optional container classes. |

Pass callbacks from a Client Component in Next.js. Without `onBuy`, Buy Now only records the current selection in component state and visibly reports that no purchase was made. The default does not create a cart, contact a checkout service, or charge anyone.

`HoverProduct` fields:

- Required: `id`, `name`, `image` strings, `sizes: readonly string[]`, and `colors: readonly HoverProductColor[]`.
- Optional: `imageAlt`, `brand`, `background`, and `imageClipPath` strings.
- `imageClipPath` is a CSS silhouette for the small original video crops; omit it for your own clean transparent product images.

`HoverProductColor` fields:

- Required: `name` and `color` strings.
- Optional: `image` (variant image URL/data URL) and `imageFilter` (CSS image filter).

`HoverProductSelection` contains the selected `product`, `size`, and `color`. All these interfaces and `HoverProductCardsProps` are exported.

Hover or keyboard focus lifts the shoe and reveals controls; tapping its image pins the controls open for touch interaction. Select a size before buying. A missing size shows an error and focuses the first size button. Color selection updates the accent circle, shoe variant, and submitted selection. Controls are unavailable while the callback is pending; duplicate submission is blocked. Successful submission disables Buy Now until a size or color changes. Rejected callbacks retain the selected options and allow retry. State updates from an in-flight callback are ignored after unmount.

The live layout wraps into full-size stacked cards in narrow containers, preserving legible copy and usable size/color targets. Reduced-motion preferences remove transitions.

`HoverProductCardsThumbnail({ className?, previewStep? })` is inert, contains no buttons or inputs, and has no hooks or timers. Its four state samples show the blue card expanded, a cyan variant, the red card expanded, and a pink variant. The image lift, color circle, and controls transition between states. The gallery owns playback.

Artwork provenance: the default blue and red Nike shoe pixels were cropped from the user's video 9 reference. The prepared transparent WebP crops are only 155×112 pixels; CSS polygons trim residual background fragments. Additional cyan/pink previews use CSS color filters on those same pixels. This limits sharpness at large display sizes; supply your own high-resolution transparent product images for larger production cards. No license claim is made.


## Use Gallery Flip in your project

Copy **Gallery Flip → Code** into `components/ui/gallery-flip.tsx`. Its scoped styles and 24 city photographs are embedded; no separate assets or packages are needed.

```tsx
import GalleryFlip from "@/components/ui/gallery-flip";

export default function Example() {
  return <GalleryFlip />;
}
```

Select a tile to reveal its photograph across the grid through a wave of flips. Select again or press Escape to return. Arrow keys, Home, and End move focus; Enter or Space selects. Empty photo arrays show a placeholder, and incomplete rows retain the full expanded image.

| Prop | Type | Purpose |
| --- | --- | --- |
| `photos` | `readonly GalleryFlipPhoto[]` | Replace the default 24 photographs with `{ id, src, alt }` objects. |
| `title` | `string` | Heading; defaults to `Gallery Flip`. |
| `className` | `string` | Additional container classes. |

`GalleryFlipThumbnail` accepts `className` and `previewStep`, showing the mosaic, a partial flip, and expanded scenes. The reference photo collection is published at [kiyutink.github.io](https://kiyutink.github.io/). Individual image sources are preserved in the [asset provenance file](../public/reference-products/ATTRIBUTION.json).

## Use Sneaker Orbit in your project

Copy **Sneaker Orbit → Code** into `components/ui/sneaker-orbit.tsx`. The CSS 3D scene, controls, and embedded product photographs travel with the file.

```tsx
import SneakerOrbit from "@/components/ui/sneaker-orbit";

export default function Example() {
  return <SneakerOrbit />;
}
```

Drag horizontally to rotate the shoe collection, or pause its automatic rotation. Arrow keys choose a product; Enter or Space opens its details. Brand, category, price, and color filters narrow the collection. The extra filter panel provides a labeled product selector. Escape, the backdrop, or the close control dismisses product details and restores focus.

| Prop | Type | Purpose |
| --- | --- | --- |
| `products` | `readonly SneakerProduct[]` | Supply your own catalog. |
| `autoRotate` | `boolean` | Allow automatic rotation; defaults to `true`. |
| `onBuy` | `(product: SneakerProduct) => void \| Promise<void>` | Connect the product action to your cart; reject to show retry feedback. |
| `className` | `string` | Additional container classes. |

`SneakerProduct` contains string fields `id`, `name`, `image`, `brand`, `category`, and `color`, plus numeric `price`. Use unique IDs. Without `onBuy`, the action only reports an addition to a local preview bag. Default names and prices are illustrative fixtures. `SneakerOrbitThumbnail` accepts `className` and `previewStep` for inert rotation, filter, and product-focus samples.

Fifteen photographs come from the supplied video, mostly around 90×60 pixels; larger product views therefore have limited sharpness. The additional [New Balance photograph from PNGimg.com](https://pngimg.com/image/5792) is supplied under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). Its attribution and processing notes are preserved in the source and [asset provenance file](../public/reference-products/ATTRIBUTION.json). Replace demonstration imagery with your own high-resolution product photographs when needed.

## Use Glass Product Card in your project

Copy **Glass Product Card → Code** into `components/ui/glass-product-card.tsx`. It includes the pastel glass styling and three transparent reference shoe images.

```tsx
import GlassProductCard from "@/components/ui/glass-product-card";

export default function Example() {
  return <GlassProductCard />;
}
```

Hover or select a thumbnail to change the shoe. Hover over the main image or use its keyboard/touch toggle to enlarge it. Choose a size before adding to the cart; missing selection focuses the first size. Pending actions block duplicate submissions, and rejected callbacks show retry feedback. Without a callback, the component updates a local preview-cart count.

| Prop | Type | Purpose |
| --- | --- | --- |
| `name` | `string` | Product heading; defaults to `Nike Air Zoom`. |
| `variants` | `readonly GlassProductVariant[]` | Replace the three color variations. |
| `sizes` | `readonly string[]` | Available sizes; defaults to `7`, `8`, `9`, and `10`. |
| `onAddToCart` | `(selection: GlassCartSelection) => void \| Promise<void>` | Connect a cart service; reject to display an error. |
| `className` | `string` | Additional container classes. |

`GlassProductVariant` contains `{ id, name, image }` strings. `GlassCartSelection` contains `{ variant, size }`. Empty variants show a placeholder; no available sizes disables the cart action. `GlassProductCardThumbnail` accepts `className` and `previewStep` for inert variation and zoom samples.

The exact publicly hosted reference images were optimized and embedded as WebP; source URLs are in the [asset provenance file](../public/reference-products/ATTRIBUTION.json). The original Gallery Flip and Glass Product Card images have no independently verified redistribution terms in this project. Use your own appropriately licensed artwork for reuse where needed. Pass all action callbacks from a Client Component in Next.js.

## Use Fan Image Slider in your project

Open **Fan Image Slider → Code** and copy or download the complete source into `components/ui/fan-image-slider.tsx`. Use React, TypeScript, and Tailwind CSS 4; the styles, icons, and ten optimized landscape photos are embedded in that file, with no additional packages or asset files needed.

```tsx
import FanImageSlider from "@/components/ui/fan-image-slider";

export default function GalleryPage() {
  return <FanImageSlider />;
}
```

Browse with the arrows, dots, side cards, arrow keys, Home/End, or a swipe. Select the centered photograph to open an enlarged view. The default interactions run locally. Autoplay is off by default; when enabled, it pauses during hover, focus, or an open image dialog and respects reduced-motion preferences.

| Prop | Type | Purpose |
| --- | --- | --- |
| `images` | `readonly FanImage[]` | Replace the ten embedded photographs. Each image has `id`, `src`, and `alt` string fields. |
| `initialIndex` | `number` | Set the initial zero-based index; defaults to `4`, the fifth image. |
| `autoPlay` | `boolean` | Enable automatic navigation and its pause control; defaults to `false`. |
| `interval` | `number` | Playback interval in milliseconds; defaults to `4000`, with a `2000` minimum. |
| `onSelect` | `(image: FanImage) => void` | Replace the enlarged image dialog when the centered image is activated. |
| `className` | `string` | Additional classes for the component container. |

`FanImage` and `FanImageSliderProps` are exported types. Pass `onSelect` from a Client Component in Next.js. The named `FanImageSliderThumbnail` export provides a static preview and accepts an optional `className`.

The default Unsplash photographs follow the image list in [Aayush Duhan's Card Fan Carousel reference](https://github.com/wundercorp/awesome-components/blob/main/components/a/aayush-duhan/card-fan-carousel/default/rendered.html). Their original image URLs are recorded in [`public/fan-slider/sources.json`](../public/fan-slider/sources.json). The interaction is independently implemented in React, and optimized WebP copies are embedded in the component. **Copy code** and **Download** include the complete images even when long data strings are folded in the source viewer.

## Use Trailhead Card in your project

Open **Trailhead Card → Code** and copy or download the complete source into `components/ui/trailhead-card.tsx`. It uses React, TypeScript, and Tailwind CSS 4. The glass surfaces, rings, icons, and sample chart are drawn with CSS and SVG; no image files or additional packages are needed.

```tsx
import TrailheadCard from "@/components/ui/trailhead-card";

export default function AdventurePage() {
  return <TrailheadCard />;
}
```

Move a pointer or touch the card to explore its depth. With the card focused, use the arrow keys to tilt and Home or Escape to reset. The heart saves a local state, the mountain opens an illustrative elevation profile, and **Open** shows an overview. The download control creates a local text trip checklist. The demo does not provide offline maps or live trail navigation.

| Prop | Type | Purpose |
| --- | --- | --- |
| `title` | `string` | Set the heading; defaults to `"Trailhead"`. |
| `description` | `string` | Replace the card's descriptive copy. |
| `initiallySaved` | `boolean` | Set the initial saved state; defaults to `false`. |
| `onSaveChange` | `(saved: boolean) => void \| Promise<void>` | Persist a save change; rejection preserves the previous state and shows feedback. |
| `onOpen` | `() => void` | Replace the built-in overview action. The elevation preview remains available. |
| `onDownload` | `() => void \| Promise<void>` | Replace the local checklist download; rejection shows feedback. |
| `className` | `string` | Additional classes for the component container. |

`TrailheadCardProps` is exported. Pass callbacks from a Client Component in Next.js. Without callbacks, actions stay local to the preview; the receiving application handles persistence and real trail data. The named `TrailheadCardThumbnail` export provides a static preview and accepts an optional `className`.

## Use Character Reveal Cards in your project

Open **Character Reveal Cards → Code** and copy or download the complete source into `components/ui/character-reveal-cards.tsx`. Use React, TypeScript, and Tailwind CSS 4. Both cards' cover, title, and transparent character artwork are embedded alongside the styles, so the component requires no separate asset folder or additional packages.

```tsx
import CharacterRevealCards from "@/components/ui/character-reveal-cards";

export default function CharactersPage() {
  return <CharacterRevealCards />;
}
```

Hover or focus a card to reveal its character; click or press Enter to open the local details dialog. On touch screens, tap once to reveal and again to open details. Escape closes the dialog, and focus returns to the selected card.

| Prop | Type | Purpose |
| --- | --- | --- |
| `cards` | `CharacterRevealCard[]` | Replace the default Dark Rider and Force Mage cards. |
| `onSelect` | `(card: CharacterRevealCard) => void` | Replace the built-in details dialog with your own action. |
| `className` | `string` | Additional classes for the component container. |

`CharacterRevealCard` and `CharacterRevealCardsProps` are exported types. Each card requires `id`, `title`, `description`, `coverImage`, and `characterImage` strings. Optional `subtitle`, `titleImage`, and `accent` fields customize its details and presentation. Use an image with transparency for `characterImage` to preserve the reveal effect. Pass `onSelect` from a Client Component in Next.js.

The named `CharacterRevealCardsThumbnail` export provides a static preview and accepts an optional `className`. Keep the embedded artwork constants when copying the complete file, or replace `cards` with your own image URLs.

The default cover, title, and character images come from [Ggayane's CSS experiments](https://github.com/Ggayane/css-experiments/tree/master/cards); the original title artwork prints a credit to Chris Mason. Asset sources and optimized filenames are recorded in [`public/character-reveal/source-credits.json`](../public/character-reveal/source-credits.json). The React interaction is independently implemented. Character descriptions are illustrative demo copy, not book synopses.

## Use Glowing Login in your project

Open **Glowing Login → Code** and copy or download the complete source into `components/ui/glowing-login.tsx`. It uses React, TypeScript, and Tailwind CSS 4, with animation styles and SVG icons included in the file; no additional packages are needed.

```tsx
import GlowingLogin from "@/components/ui/glowing-login";

export default function SignInPage() {
  return <GlowingLogin />;
}
```

The panel starts collapsed. Hover, focus, or tap its heading to expand it, then try sign in, sign up, or password reset. Each flow validates its fields and supports pending, success, and error feedback. Without callbacks, these are local demos: no account is accessed or created, and no reset email is sent.

| Prop | Type | Purpose |
| --- | --- | --- |
| `defaultExpanded` | `boolean` | Start with the form open; defaults to `false`. |
| `onSubmit` | `(values: GlowingLoginValues) => void \| Promise<void>` | Authenticate the submitted username and password. |
| `onSignUp` | `(values: GlowingSignUpValues) => void \| Promise<void>` | Create an account using the submitted username, email, and password. |
| `onForgotPassword` | `(email: string) => void \| Promise<void>` | Connect the reset flow to your service. |
| `className` | `string` | Additional classes for the component container. |

`GlowingLoginValues`, `GlowingSignUpValues`, and `GlowingLoginProps` are exported types. Login values contain `username` and `password`; sign-up values also contain `email`. Callbacks may be asynchronous and should throw or reject when the operation fails. Pass them from a Client Component in Next.js and perform authentication, account creation, and reset delivery in your own service. Password fields are cleared after a successful submission or when switching flows.

The named `GlowingLoginThumbnail` export provides a static preview and accepts an optional `className`.

## Use Solar Explorer in your project

1. Open **Solar Explorer → Code** and copy or download the complete component into `components/ui/solar-explorer.tsx`.
2. Use React, TypeScript, and Tailwind CSS 4 in the receiving project. The component includes its styles, icons, and embedded artwork; no additional packages or asset files are required.
3. Import it:

```tsx
import SolarExplorer from "@/components/ui/solar-explorer";

export default function SolarSystemPage() {
  return <SolarExplorer />;
}
```

Select a world from the navigation to change the scene. **Read More** opens its details in a dialog that can be dismissed with its close control or Escape. The initial scene is Mercury; use `initialPlanet="earth"` to start with Earth instead.

| Prop | Type | Purpose |
| --- | --- | --- |
| `initialPlanet` | `SolarPlanetId` | Choose the initial world; defaults to `"mercury"`. |
| `onSelectPlanet` | `(planet: SolarPlanet) => void` | Respond when the selected world changes. |
| `onReadMore` | `(planet: SolarPlanet) => void` | Replace the built-in details dialog with your own action. |
| `className` | `string` | Additional classes for the component container. |

`SolarPlanetId` and `SolarPlanet` are exported types. IDs are `mercury`, `venus`, `earth`, `mars`, `jupiter`, `saturn`, `uranus`, `neptune`, and `pluto`. Pass callbacks from a Client Component when using Next.js. The default navigation and details work locally without callbacks.

The named `SolarExplorerThumbnail` export renders a static gallery preview. It accepts optional `className` and `planet` props, with Earth as the default thumbnail. Keep the embedded image constants when copying the source so the artwork travels with the component.

The composition follows the supplied video and [Jamie Coulter's Solar Explorer](https://codepen.io/jcoulterdesign/pen/ZxXbeP), with an independent React implementation. Planet maps come from the [NASA/JPL Space Simulator archive](https://space.jpl.nasa.gov/tmaps/); individual credits and source pages are recorded in `public/solar/sources.json`. Several archive maps are artist illustrations. The Moon image is cropped from the supplied video and reused as illustrative satellite artwork. Scene sizes, spacing, and satellite surfaces are decorative rather than scientifically accurate.

## Use Animated Border Card in your project

1. Open **Animated Border Card → Code** and copy or download the complete component into `components/ui/animated-border-card.tsx`.
2. Use React, TypeScript, and Tailwind CSS 4 in the receiving project. Animation styles, icons, and the default avatar are included in the source; no additional packages or asset files are required.
3. Import it:

```tsx
import AnimatedBorderCard from "@/components/ui/animated-border-card";

export default function ProfilePage() {
  return <AnimatedBorderCard />;
}
```

Hover over the card, focus it with the keyboard, or tap the avatar to expand the profile. **Follow** toggles a local following state. **Message** opens a composer; without an `onMessage` callback, submitting a message saves it only for the current component session. No message is sent to another person by the default demo.

| Prop | Type | Purpose |
| --- | --- | --- |
| `imageSrc` | `string` | Replace the embedded avatar with your own image URL. |
| `displayName` | `string` | Customize the profile name. |
| `role` | `string` | Customize the profile subtitle. |
| `stats` | `{ posts: string \| number; followers: string \| number; following: string \| number }` | Set the three profile statistics. |
| `onFollow` | `(following: boolean) => void \| Promise<void>` | Save a follow/unfollow change to your service; throw to show an error. |
| `onMessage` | `(message: string) => void \| Promise<void>` | Send a message through your service; throw to show an error. |
| `className` | `string` | Additional classes for the component container. |

Both action callbacks support asynchronous work and show feedback if it fails. The following state changes after `onFollow` succeeds. Pass callbacks from a Client Component when using Next.js; the receiving application is responsible for persistence and message delivery.

The named `AnimatedBorderCardThumbnail` export provides a static gallery preview and accepts an optional `className`.

The default skeleton avatar is cropped from the user's supplied profile-card video and embedded as WebP. Replace `imageSrc` with your own profile image when using the component for a different person.

## Use Destination Carousel in your project

1. Open **Destination Carousel → Code** and copy or download the complete component into `components/ui/destination-carousel.tsx`.
2. Use React, TypeScript, and Tailwind CSS 4 in the receiving project. The component includes its styles and icons; no additional animation or icon package is required.
3. Import it:

```tsx
import DestinationCarousel from "@/components/ui/destination-carousel";

export default function DestinationsPage() {
  return <DestinationCarousel />;
}
```

Browse with the previous/next arrows, destination cards, arrow keys, or a swipe. Automatic playback is enabled by default, with a five-second interval and a pause control. **Discover location** opens destination details, and the bookmark control saves favorites for the current preview. These are local interactions; the component does not book trips or send data to a travel service.

The design follows the supplied video, with visual inspiration from [Timed Cards Opening by Dilum Sanjaya](https://codepen.io/dilums/pen/NWodZMd). Default destination photos are hosted on `assets.codepen.io`, and the Oswald display font is also loaded remotely, so the demo requires an internet connection for those assets. When reusing it, supply your own image URLs through `slides` and host the font yourself if you need an offline version. The component's React logic, icons, and animation styles are all included in the copied source.

| Prop | Type | Purpose |
| --- | --- | --- |
| `slides` | `DestinationSlide[]` | Replace the default destinations with your own photos and copy. |
| `initialIndex` | `number` | Choose the initially displayed destination. |
| `autoPlay` | `boolean` | Enable or disable automatic slide changes; defaults to `true`. |
| `interval` | `number` | Set the time between automatic slide changes in milliseconds; defaults to `5000`, with a `2000` minimum. |
| `onDiscover` | `(slide: DestinationSlide) => void` | Replace the built-in destination details with your own action. |
| `className` | `string` | Additional classes for the component container. |

`DestinationSlide` is an exported type with required `id`, `country`, `description`, and `image` string fields, plus a two-line `title: [string, string]`. Optional `imagePosition`, `bestTime`, and `experience` fields customize the photo crop and destination details. Pass `onDiscover` from a Client Component when using Next.js.

The named `DestinationCarouselThumbnail` export provides a static gallery preview and accepts an optional `className`.

## Use Toon Carousel in your project

1. Open **Toon Carousel → Code** and copy or download the complete component into `components/ui/toon-carousel.tsx`.
2. Use React, TypeScript, and Tailwind CSS 4 in the receiving project. Styles, icons, and character artwork are embedded in the source, so there are no additional packages or asset files to copy.
3. Import it:

```tsx
import ToonCarousel from "@/components/ui/toon-carousel";

export default function ShowcasePage() {
  return <ToonCarousel />;
}
```

The default slides recreate the reference's blue, orange, green, and pink character scenes. Browse with the previous/next buttons, arrow keys, or a swipe. **Discover** opens the current character's details. Autoplay is off by default; enable it with `autoPlay`. The component supports reduced motion and pauses automatic playback during interaction.

The character illustrations were recreated from the supplied video using the built-in image generation tool; they are not the original video assets. Optimized WebP copies and the generation prompts are kept in `public/toon/`. The component embeds those same images, so only the TSX file is needed when reusing it. In the Code tab, long embedded image strings are folded for readability; **Copy code** and **Download** always include the complete artwork.

| Prop | Type | Purpose |
| --- | --- | --- |
| `slides` | `readonly ToonSlide[]` | Replace the default scenes with your own artwork, copy, and colors. |
| `initialIndex` | `number` | Choose the initially displayed slide. |
| `autoPlay` | `boolean` | Enable or disable automatic slide changes. |
| `interval` | `number` | Set the time between automatic slide changes in milliseconds. |
| `onDiscover` | `(slide: ToonSlide) => void` | Replace the built-in details action with your own handler. |
| `className` | `string` | Additional classes for the component container. |

`ToonSlide` is an exported type with required `id`, `name`, `eyebrow`, `description`, `image`, and `background` string fields, plus an optional `accent` color. Images can be embedded data URLs or URLs to artwork in your own project. Pass `onDiscover` from a Client Component when using Next.js.

The named `ToonCarouselThumbnail` export provides a static gallery preview and accepts an optional `className`. The complete source includes the default image data; keep those constants when copying it, or replace the slides with your own assets.

## Use Creative Login in your project

1. Open **Creative Login → Code** and copy or download the complete component into `components/ui/creative-login.tsx`.
2. Use React, TypeScript, and Tailwind CSS 4 in the receiving project, and install Three.js:

```bash
npm install three
npm install --save-dev @types/three
```

3. Import it:

```tsx
import CreativeLogin from "@/components/ui/creative-login";

export default function LoginPage() {
  return <CreativeLogin />;
}
```

Without `onSubmit`, the form runs locally as a demo: enter your first name, surname, and email, review the details, then view the success state. No data is sent to a server and no account is created.

### Connect submissions

Supply `onSubmit` to send the validated values to your own service. The component waits for the callback, displays a pending state, and shows a retry message if the callback throws. In Next.js, pass callbacks from a Client Component:

```tsx
"use client";

import CreativeLogin, {
  type CreativeLoginValues,
} from "@/components/ui/creative-login";

export default function WelcomeForm() {
  async function submitDetails(values: CreativeLoginValues) {
    // Implement this endpoint in your application.
    const response = await fetch("/api/welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      throw new Error("Your details could not be saved. Please try again.");
    }
  }

  return <CreativeLogin onSubmit={submitDetails} />;
}
```

| Prop | Type | Purpose |
| --- | --- | --- |
| `onSubmit` | `(values: CreativeLoginValues) => void \| Promise<void>` | Receive `{ firstName, surname, email }`; throw on failure. |
| `className` | `string` | Additional classes for the component container. |
| `intro` | `boolean` | Play the character's entrance; defaults to `true`. Set `false` to show the form immediately. |

The named `CreativeLoginThumbnail` export provides a non-interactive gallery preview and accepts an optional `className`.

The character is rendered with Three.js using 3D models and animation clips. The Code tab combines the form and renderer into one component file, with the models, animations, lighting environment, fonts, and fallback image embedded as data URLs. Install the dependencies above before using that exported file; no separate asset folder is needed. Large embedded assets are folded in the source viewer, and copy/download includes their full contents.

The repository keeps the renderer and files in `public/creative-login/` separate for development. Copy from the **Code** tab to get the portable version. The visual and character reference is the [original Visme form](https://forms.visme.co/formsPlayer/g7ddqxx0-untitled-project?fullPage=true).

## Use Glass OTP in your project

1. Open **Glass OTP → Code** and copy the complete component into `components/ui/glass-otp.tsx`.
2. Use React, TypeScript, and Tailwind CSS 4 in the receiving project. The component includes its own animation styles and SVG artwork; no animation or icon package is required.
3. Import the component:

```tsx
import GlassOtp from "@/components/ui/glass-otp";

export default function VerificationPage() {
  return <GlassOtp />;
}
```

Adjust the import path to your project. The component uses React and browser APIs, so it can also run outside Next.js in a compatible React application.

### Connect real verification

Without `onVerify`, the component is an interactive demo that accepts any four digits. Supply your own server verification endpoint to use it in an authentication flow. Callbacks must be supplied from a Client Component in Next.js:

```tsx
"use client";

import GlassOtp from "@/components/ui/glass-otp";

export default function VerificationForm() {
  async function verifyCode(code: string): Promise<boolean> {
    // Implement this endpoint in your application.
    const response = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) return false;

    const result: { verified: boolean } = await response.json();
    return result.verified;
  }

  return <GlassOtp onVerify={verifyCode} />;
}
```

| Prop            | Type                                            | Default           | Purpose                                                            |
| --------------- | ----------------------------------------------- | ----------------- | ------------------------------------------------------------------ |
| `onVerify`      | `(code: string) => boolean \| Promise<boolean>` | Demo verification | Return `true` to verify. Return `false` or throw to show an error. |
| `onResend`      | `() => void \| Promise<void>`                   | Demo resend       | Connect to your own code delivery endpoint.                        |
| `resendSeconds` | `number`                                        | `45`              | Resend cooldown in seconds.                                        |
| `className`     | `string`                                        | —                 | Additional classes for the component container.                    |

The gallery also uses the named `GlassOtpThumbnail` export for its static preview. It accepts an optional `className`.

Each thumbnail also accepts an optional `previewStep` number to select a sample frame. It stays static when this prop does not change; the homepage supplies changing frames through its shared playback controller.

## Use Connect Social Bar in your project

Import `ConnectSocialBar` from the standalone source. The component includes its SVG icons, responsive layout, colored hover/focus effects, and reduced-motion handling.

```tsx
import ConnectSocialBar from "@/components/ui/connect-social-bar";

export default function Footer() {
  return <ConnectSocialBar />;
}
```

Selecting **CONNECT** reveals the seven links. Pass `links` to customize profile URLs and `email` to change the mail link. The default email is `eng.mizanur.hasan@gmail.com`; social URLs default to their platform home pages until replaced.

| Prop | Type | Default / behavior |
| --- | --- | --- |
| `links` | `Partial<Record<SocialNetwork, string>>` | Optional URLs for GitHub, X, LinkedIn, Instagram, YouTube, and Discord. |
| `email` | `string` | `eng.mizanur.hasan@gmail.com` |
| `className` | `string` | Optional container classes. |

Exported types: `ConnectSocialBarProps`, `SocialNetwork`.

## Use Basketball Upload in your project

Copy **Basketball Upload → Code** for a single reusable TSX file. It includes the file picker, drag-and-drop target, hoop artwork, scoped styles, and stylesheet helper.

```tsx
import BasketballUpload from "@/components/ui/basketball-upload";

export default function UploadPage() {
  return <BasketballUpload />;
}
```

The court starts idle. Choose a file or drop it onto the court to play the upload animation; `accept` and `multiple` apply to both paths. Drag the sample document, click it, or focus it and press Enter/Space for a local shot. Sample shots never call `onUpload`. Real selected files use your `onUpload` callback; without one, progress is simulated. A rejected upload keeps its error and filename visible until the next attempt, while queued files can continue. Select the same file again to retry. Timers, queued work, and late callback results are guarded on unmount.

| Prop | Type | Default / behavior |
| --- | --- | --- |
| `onUpload` | `(file: File) => void \| Promise<void>` | Optional upload callback. Resolving marks the local item as uploaded; rejecting shows an error. |
| `onError` | `(error: unknown, file: File) => void` | Reports a failed real upload. |
| `disabled` | `boolean` | `false`; prevents picking, dropping, and shooting. |
| `accept` | `string` | `"*/*"`; MIME types, MIME wildcards, or extensions, comma-separated. |
| `multiple` | `boolean` | `true` |
| `initialUploadedCount` | `number` | `2` |
| `className` | `string` | Optional container classes. |

Exported type: `BasketballUploadProps`. `BasketballUploadThumbnail({ className?, previewStep? })` supplies four inert gallery frames; it has no file controls, upload effects, or audio. The shared gallery clock handles pause, visibility, and reduced motion.

## Use Red Bull Card in your project

Copy **Red Bull Card → Code** for a single reusable TSX file. The real can photo, CSS effects, and stylesheet helper are included. The Code tab embeds the WebP photo directly, so copied components need no image folder or animation package. Product photography comes from [Red Bull’s official product page](https://www.redbull.com/int-en/energydrink/products/red-bull-energy-drink).

```tsx
import RedBullCard from "@/components/ui/redbull-card";

export default function ProductPage() {
  return <RedBullCard />;
}
```

The glowing badge opens into a product card and collapses again. Autoplay pauses offscreen, in a hidden tab, while hovered or focused, and when reduced motion is requested. Selecting Open, Close, or Shop Now stops autoplay so it cannot interrupt the interaction. Escape closes the card and returns focus to its toggle. Collapsed product content is inert. `onShopNow` runs when the shop action is selected; without it, a local status message explains that no destination is connected.

| Prop | Type | Default / behavior |
| --- | --- | --- |
| `title` | `string` | `"REDBULL"` |
| `description` | `string` | Short energy drink product description. |
| `autoPlay` | `boolean` | `true`; disabled automatically when reduced motion is requested. |
| `onShopNow` | `() => void` | Optional shop action callback. |
| `className` | `string` | Optional container classes. |

Exported type: `RedBullCardProps`. `RedBullCardThumbnail({ className?, previewStep? })` renders compact, card, and expanded gallery frames without interactive controls or playback effects.

## Project structure

```text
app/
  page.tsx                          Component collection
  components/[slug]/page.tsx         Individual preview and code pages
  not-found.tsx                     Missing-page experience
components/
  ui/fan-image-slider.tsx            Standalone photograph carousel
  ui/trailhead-card.tsx              Standalone interactive glass card
  ui/character-reveal-cards.tsx      Standalone layered character cards
  ui/glowing-login.tsx               Standalone neon login form
  ui/solar-explorer.tsx              Standalone solar system navigation
  ui/animated-border-card.tsx        Standalone expanding profile card
  ui/destination-carousel.tsx        Standalone travel carousel
  ui/toon-carousel.tsx               Standalone character carousel
  ui/creative-login.tsx              Standalone animated form
  ui/glass-otp.tsx                   Standalone verification component
  showcase/component-playground.tsx Preview/code interface
lib/
  component-registry.ts              Catalog metadata and usage examples
  component-previews.ts              Interactive demos and optional thumbnails
  component-source.ts                Server-only source reader
```

## Add another component

1. Add a self-contained component under `components/ui/`. Include a `"use client"` directive when it uses state, effects, or browser APIs. Keep styles and required artwork with the copied component.
2. Add its metadata, source path relative to `components/ui/`, usage example, demo note, and features to `lib/component-registry.ts`. Keep `fileName` consistent with the source file, and put the latest addition first to feature it in the navigation.
3. Import its preview in `lib/component-previews.ts` and add it to `componentPreviews` using the same slug. If the component requires props, register a demo wrapper that supplies them.
4. Optionally register a non-interactive preview in `componentThumbnails`. Accept optional `className` and `previewStep` props. Use `previewStep` to show sample states; the gallery handles visibility, playback, and reduced motion. Keep controls inert so the whole card opens its component page. The gallery uses a generic illustration when no thumbnail is registered.

Keep the metadata registry free of component imports and server APIs. It drives component counts and generated routes, while the preview maps supply the actual React components. The Code tab reads the registered component file on the server, so the copied code stays in sync with the preview. Unknown slugs return a 404.

Before changing Next.js integration, read the relevant guide in `node_modules/next/dist/docs/` as described in `AGENTS.md`.

## Component stylesheet resources

`ComponentStyles` registers scoped CSS through React 19's stylesheet resource handling. Identical CSS is deduplicated in the document head, and a content fingerprint gives edited CSS a fresh resource identity during development. This also avoids the reported hydration mismatch when a dark-mode browser extension adds `native-dark-class-modified` to inline style elements before React starts. Hydration warnings remain enabled for ordinary component markup. The Code tab embeds this small helper in every exported component, so copied files have no project-local stylesheet import.
