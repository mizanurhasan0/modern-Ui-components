# Component Lab

**10 interactive UI components for React and Next.js**, built with TypeScript and Tailwind CSS 4. A portfolio of animated cards, carousels, forms, and immersive navigation—with working demos and reusable source code.

Browse the homepage’s animated thumbnails, open a component, try **Preview**, then switch to **Code** to copy or download it for your own project.

[Component catalog](#component-catalog) · [Screenshots](#screenshots) · [Run locally](#run-locally) · [Usage & props](docs/component-guide.md)

## Screenshots

Selected views captured during development. These show the gallery layout and an individual component’s Preview/Code interface; the catalog below lists all 10 components.

### Browse the collection

![Component gallery showing Solar Explorer and Animated Border Card, with more component cards below](docs/screenshots/component-gallery.png)

Each card introduces a component and opens its dedicated demo. The current homepage also includes autoplay thumbnails, search, category filters, and a **Pause previews** control.

### Explore a component

![Toon Carousel in the component playground, showing colorful character artwork and Preview and Code tabs](docs/screenshots/toon-carousel.jpg)

Try the full interaction in **Preview**, check desktop or mobile sizing, then open **Code** for the source.

## Component catalog

| Component | Type | What it does |
| --- | --- | --- |
| [Fan Image Slider](docs/component-guide.md#use-fan-image-slider-in-your-project) | Carousel | Fans out landscape photos with smooth selection, swipe and keyboard navigation, autoplay, and an enlarged image view. |
| [Trailhead Card](docs/component-guide.md#use-trailhead-card-in-your-project) | Card | Tilts a layered glass card with your pointer; includes save, trail details, and a checklist download. |
| [Character Reveal Cards](docs/component-guide.md#use-character-reveal-cards-in-your-project) | Cards | Lifts fantasy characters out of their covers on hover, focus, or touch, with a details dialog. |
| [Glowing Login](docs/component-guide.md#use-glowing-login-in-your-project) | Form | Expands a cyan-and-pink neon panel into sign-in, registration, and password-reset forms with validation. |
| [Solar Explorer](docs/component-guide.md#use-solar-explorer-in-your-project) | Navigation | Moves between nine worlds with textured planets, orbiting moons, and planet details. |
| [Animated Border Card](docs/component-guide.md#use-animated-border-card-in-your-project) | Profile card | Expands a profile framed by rotating neon borders, with follow and message actions. |
| [Destination Carousel](docs/component-guide.md#use-destination-carousel-in-your-project) | Carousel | Combines full-scene travel photography, sliding destination cards, autoplay, details, and local favorites. |
| [Toon Carousel](docs/component-guide.md#use-toon-carousel-in-your-project) | Carousel | Slides colorful character illustrations across oversized typography, with swipe, keyboard controls, and character details. |
| [Creative Login](docs/component-guide.md#use-creative-login-in-your-project) | Form · 3D | Pairs an animated Three.js character with a multi-step name-and-email form, review, and submission feedback. |
| [Glass OTP](docs/component-guide.md#use-glass-otp-in-your-project) | Verification form | Presents four-digit code entry in frosted glass, with animated states and a resend cooldown. |

## What’s included

- **Animated gallery:** lightweight thumbnail demos play while visible and pause when the browser tab is hidden. Visitors can pause all previews; reduced-motion preferences are respected.
- **Interactive playground:** each component has its own route, with Preview selected by default, a Code tab, and desktop/mobile preview controls.
- **Copyable source:** copy or download the complete component, including embedded assets where supplied. Long asset strings are folded in the viewer but included in the exported code.
- **Customizable behavior:** typed props and callbacks let you replace demo content and connect your own application logic.

Authentication, verification, messaging, and persistence run as local demos until you connect the relevant callbacks to your own service. See each component’s guide for exact behavior.

## Run locally

Use Node.js **20.9 or later** and npm.

```bash
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000), select a component, and try its preview.

```bash
npm run lint   # Check source quality
npm run build  # Create a production build
npm start      # Serve the production build
```

Stack: **Next.js 16.3.8 · React 19 · TypeScript · Tailwind CSS 4**. Creative Login also uses **Three.js**.

## Reuse a component

1. Open the component’s **Code** tab in the running app.
2. Copy or download its complete source into your React project.
3. Set up TypeScript and Tailwind CSS 4, install any dependencies listed in its guide, and import it:

```tsx
import FanImageSlider from "@/components/ui/fan-image-slider";

export default function GalleryPage() {
  return <FanImageSlider />;
}
```

Most components include their styles, icons, and artwork in the exported file. **Creative Login** requires `three` and `@types/three`; its Code tab bundles the separate renderer and assets into the portable export. **Destination Carousel** loads its default photos and display font remotely.

See the [component usage guide](docs/component-guide.md) for props, callback examples, dependencies, and asset credits.

## Project map

```text
app/                         Homepage and component routes
components/ui/               Component implementations
components/showcase/         Gallery, autoplay thumbnails, and Preview/Code interface
lib/component-registry.ts    Catalog descriptions and usage examples
lib/component-previews.ts    Demo and thumbnail registrations
lib/component-source.ts      Source export and asset bundling
public/                      Development artwork, models, and credits
docs/component-guide.md      Detailed usage and prop reference
docs/screenshots/            Screenshots used in this README
```

Want to extend the collection? Follow [Add another component](docs/component-guide.md#add-another-component).

## Design and artwork credits

Several experiments are inspired by supplied video references and community designs. Per-component references, artwork sources, and reuse notes are preserved in the [usage guide](docs/component-guide.md) and the relevant asset folders. Replace demo artwork with your own where appropriate.
