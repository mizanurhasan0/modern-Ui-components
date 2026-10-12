# Component usage guide

[← Back to the collection](../README.md)

Detailed setup, props, interaction notes, and artwork credits for every component.

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

Import `BasketballUpload` from the standalone source. It includes a file picker, drag-and-drop target, hoop artwork, and local progress feedback.

```tsx
import BasketballUpload from "@/components/ui/basketball-upload";

export default function UploadPage() {
  return <BasketballUpload />;
}
```

Choose a file or drop it onto the court to play the upload animation. The default action is a local demonstration; pass `onUpload` to connect the selected file to your storage service.

| Prop | Type | Default / behavior |
| --- | --- | --- |
| `onUpload` | `(file: File) => void \| Promise<void>` | Optional upload callback. Resolving marks the local item as uploaded; rejecting shows an error. |
| `accept` | `string` | `"*/*"` |
| `multiple` | `boolean` | `true` |
| `initialUploadedCount` | `number` | `2` |
| `className` | `string` | Optional container classes. |

Exported type: `BasketballUploadProps`.

## Use Red Bull Card in your project

Import `RedBullCard` from the standalone source. The card uses inline SVG artwork and CSS effects, so it needs no image assets or animation package.

```tsx
import RedBullCard from "@/components/ui/redbull-card";

export default function ProductPage() {
  return <RedBullCard />;
}
```

The glowing badge opens into a product card and collapses again. The animation respects reduced-motion preferences; select the card control to pause automatic playback and switch states manually. `onShopNow` runs when the shop action is selected.

| Prop | Type | Default / behavior |
| --- | --- | --- |
| `title` | `string` | `"REDBULL"` |
| `description` | `string` | Short energy drink product description. |
| `autoPlay` | `boolean` | `true`; disabled automatically when reduced motion is requested. |
| `onShopNow` | `() => void` | Optional shop action callback. |
| `className` | `string` | Optional container classes. |

Exported type: `RedBullCardProps`.

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
