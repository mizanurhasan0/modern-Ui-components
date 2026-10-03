# Component Lab

A personal collection of carefully crafted, interactive React components. Browse the gallery, open a component, try its preview, and copy the same source that powers the demo.

Built with Next.js 16.3.8, React 19, TypeScript, and Tailwind CSS 4.

- **Fan Image Slider** — a layered fan of landscape photographs with keyboard and swipe navigation, optional playback, and an enlarged image view.
- **Trailhead Card** — a glass card with floating layers, pointer and keyboard tilt, and local save, details, and checklist actions.
- **Character Reveal Cards** — fantasy cover artwork that tilts back as its characters emerge on hover, focus, or touch.
- **Glowing Login** — an expanding neon form with sign-in, sign-up, and password-reset flows.
- **Solar Explorer** — an interactive journey through nine worlds with textured planets, orbiting moons, and detail dialogs.
- **Animated Border Card** — an expanding profile card with rotating neon borders, an illustrated avatar, and follow/message actions.
- **Destination Carousel** — an immersive travel showcase with expanding destination cards, animated landscapes, and local favorites.
- **Toon Carousel** — a colorful character showcase with oversized typography, animated slide transitions, and interactive character details.
- **Creative Login** — an animated character and a multi-step form for entering, reviewing, and submitting a name and email.
- **Glass OTP** — a four-digit verification experience with frosted glass, orbiting digits, and animated verification states.

The home page shows every registered component in a responsive gallery, with search and category filters. Each component has a dedicated page that opens on **Preview**, with a **Code** tab for copying or downloading its exact source.

## Run locally

```bash
npm install
npm run dev
```

Visit [localhost:3000](http://localhost:3000). Run `npm run lint` to check the code and `npm run build` for a production build.

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

The default Unsplash photographs follow the image list in [Aayush Duhan's Card Fan Carousel reference](https://github.com/wundercorp/awesome-components/blob/main/components/a/aayush-duhan/card-fan-carousel/default/rendered.html). Their original image URLs are recorded in [`public/fan-slider/sources.json`](public/fan-slider/sources.json). The interaction is independently implemented in React, and optimized WebP copies are embedded in the component. **Copy code** and **Download** include the complete images even when long data strings are folded in the source viewer.

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

The default cover, title, and character images come from [Ggayane's CSS experiments](https://github.com/Ggayane/css-experiments/tree/master/cards); the original title artwork prints a credit to Chris Mason. Asset sources and optimized filenames are recorded in [`public/character-reveal/source-credits.json`](public/character-reveal/source-credits.json). The React interaction is independently implemented. Character descriptions are illustrative demo copy, not book synopses.

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
4. Optionally register a static, non-interactive preview in `componentThumbnails`. It should accept an optional `className`. The gallery uses a generic illustration when no thumbnail is registered.

Keep the metadata registry free of component imports and server APIs. It drives component counts and generated routes, while the preview maps supply the actual React components. The Code tab reads the registered component file on the server, so the copied code stays in sync with the preview. Unknown slugs return a 404.

Before changing Next.js integration, read the relevant guide in `node_modules/next/dist/docs/` as described in `AGENTS.md`.
