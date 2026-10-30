export type ComponentEntry = {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  sourceFile: string;
  fileName: string;
  number: string;
  demoNote: string;
  features: { title: string; description: string }[];
  usage: string;
};

/** The catalog drives the gallery, detail pages, and available source files. */
export const components: ComponentEntry[] = [
  {
    slug: "isometric-cities",
    title: "Isometric Cities",
    description:
      "Ten glowing isometric city scenes drawn in SVG, from an office tower and a harbour crane to an airport, a power grid and a night diner. Every figure has its own controls, live status line, and six glow colours in dark or light.",
    category: "Effects",
    tags: ["Interactive", "Animated", "Customizable", "Accessible"],
    sourceFile: "isometric-cities.tsx",
    fileName: "isometric-cities.tsx",
    number: "057",
    demoNote:
      "Interactive demo · Pick a figure on the left, then use the controls under it: click floors, lanterns, cranes, signals or pumps, or press the listed keys. Swatches change the glow colour and the round button switches dark and light. Narrow screens stack all ten figures.",
    features: [
      {
        title: "Ten scenes, one file",
        description:
          "Tower, apartment block, lighthouse, harbour, metro, power grid, intersection, airport, observatory and diner are built from a small isometric toolkit: boxes, plates, cylinders, domes and labels laid flat on faces.",
      },
      {
        title: "Every figure does something",
        description:
          "Light floors, call the lift, sweep the beam, load the ship, dispatch trains, trip breakers, switch signals, land planes, open the dome or run the pumps. Each figure reports its state in a live status line.",
      },
      {
        title: "Glow you can recolour",
        description:
          "Sodium, tungsten, neon, signal, dusk and moon accents drive every lit window through CSS variables, with soft SVG bloom in dark mode and clean line art in light mode. Reduced motion stops the ambient animation.",
      },
    ],
    usage:
      'import IsometricCities from "@/components/ui/isometric-cities";\n\nexport default function CitiesPage() {\n  return <IsometricCities initialScene="airport" initialAccent="sodium" />;\n}\n\n// The open figure follows the URL hash (#airport).\n// Pass syncHash={false} to keep it in component state only.',
  },
  {
    slug: "glassy-login-v3",
    title: "Glassy Login Form v3",
    description:
      "A frosted-glass sign-in and sign-up card with chamfered corners. Switching forms melts the content away, slides the two corner tabs together, sends out a ripple, and reveals the new form.",
    category: "Forms",
    tags: ["Interactive", "Animated", "Customizable", "Accessible"],
    sourceFile: "glassy-login-v3.tsx",
    fileName: "glassy-login-v3.tsx",
    number: "056",
    demoNote:
      "Interactive demo · Select Sign Up or Sign In under the form to watch the liquid-glass switch. Fields validate locally and any valid entry succeeds; connect onSignIn and onSignUp to your backend. Reduced motion swaps the forms with a short crossfade.",
    features: [
      {
        title: "A switch you can watch",
        description:
          "The form blurs out, both corner tabs light up and travel to the centre, merge into one glowing tile, ripple outward, then settle back as the next form fades in line by line.",
      },
      {
        title: "Glass with a silhouette",
        description:
          "Backdrop blur is clipped to a chamfered outline with rounded joins, a gradient edge, and separate glass tabs in the cut corners. The chrome-and-neon scene behind it is drawn in SVG.",
      },
      {
        title: "Forms that work",
        description:
          "Labelled inputs, password reveal, inline validation under the title, busy and success states, provider buttons, and focus that lands on the new heading. Plus Jakarta Sans is bundled with the export.",
      },
    ],
    usage:
      'import GlassyLoginV3 from "@/components/ui/glassy-login-v3";\n\nexport default function LoginPage() {\n  return (\n    <GlassyLoginV3\n      onSignIn={async ({ email, password, remember }) => {\n        await signIn(email, password, remember);\n      }}\n      onSignUp={async ({ name, email, password }) => {\n        await createAccount(name, email, password);\n      }}\n      onSocialSignIn={(provider) => startOAuth(provider)}\n    />\n  );\n}\n\n// Reject from a callback to show its message under the title.\n// Omit the callbacks to try the local demo.',
  },
  {
    slug: "page-mascot",
    title: "Page Mascot",
    description:
      "A character for the top of your page that turns its head toward the reader's cursor and reacts when poked, with the fox drawn in six styles.",
    category: "Effects",
    tags: ["Interactive", "Animated", "Customizable", "Accessible"],
    sourceFile: "page-mascot.tsx",
    fileName: "page-mascot.tsx",
    number: "055",
    demoNote:
      "Interactive demo · Move your pointer and every mascot turns its head to follow it. Poke one for a reaction; poke four times quickly to make it dizzy. Pick a style below to show it at the top. Head tracking needs a mouse or trackpad.",
    features: [
      {
        title: "Nine directions, one glance",
        description:
          "The pointer's angle picks one of nine drawn head poses. A 70px dead zone and a little hysteresis let the head settle instead of flickering between poses.",
      },
      {
        title: "A reaction for every poke",
        description:
          "A poke blinks, then pays off with a heart, a sparkle, or a delighted face, with a squash-and-stretch bounce. Four quick pokes make it dizzy. Reduced motion skips the bounce.",
      },
      {
        title: "Two sheets per character",
        description:
          "Each character is a 3×3 directions sheet and a 3×3 reactions sheet, served from public/mascots. Original component and fox artwork by Kamran Ahmed under the MIT license.",
      },
    ],
    usage:
      'import { Mascot } from "@/components/ui/page-mascot";\n\nexport default function Page() {\n  return (\n    <Mascot\n      directions="/mascots/fox-directions.webp"\n      reactions="/mascots/fox-reactions.webp"\n    />\n  );\n}\n\n// Put both sheets in public/mascots.\n// The default export renders the full demo page.',
  },
  {
    slug: "clothing-color-customizer",
    title: "Clothing Color Customizer",
    description: "A clothing color studio with smooth front and back views, garment zoom, instant masked recoloring, and preserved fabric detail.",
    category: "Commerce",
    tags: ["Interactive", "Customizable", "Accessible"],
    sourceFile: "clothing-color-customizer.tsx",
    fileName: "clothing-color-customizer.tsx",
    number: "054",
    demoNote: "Interactive demo · Click the garment to switch smoothly between front and back photographs, then use the zoom controls to inspect the fabric. Choose a swatch or custom HEX; the color follows both views. Prepared masks preserve fabric details and protect the neck label, drawstrings, and eyelets. Every color change runs locally.",
    features: [
      { title: "Your own color studio", description: "Animated front and back views, garment zoom, preset swatches, a native picker, validated HEX input, style selection, and original-image reset." },
      { title: "Keep the fabric details", description: "Cached linear-light shading preserves folds and texture. White mask regions recolor while black or transparent regions protect backgrounds, labels, prints, and hardware." },
      { title: "Local and reusable", description: "A typed component and exported canvas hook process every color in your browser. Neutral product images give the best results; colored lights and complex materials cannot be reconstructed from one photo." },
    ],
    usage: 'import ClothingColorCustomizer from "@/components/ui/clothing-color-customizer";\n\nexport default function ProductPage() {\n  return (\n    <ClothingColorCustomizer\n      productTitle="Everyday cotton tee"\n      productImage="/products/tee-front.png"\n      garmentMask="/products/tee-front-mask.png"\n      backImage="/products/tee-back.png"\n      backGarmentMask="/products/tee-back-mask.png"\n      initialColor="#D4D2CC"\n    />\n  );\n}\n\n// Each image and its mask must have identical dimensions.\n// White = recolor; black or transparent = preserve.\n// Omit props to try the bundled photographic demo.',
  },
  {
    "slug": "classic-microcars",
    "title": "Classic Microcars",
    "description": "An editorial tour of three classic microcars, with sliding cutouts, condensed typography, and an inset photographic archive.",
    "category": "Carousels",
    "tags": [
      "Interactive",
      "Animated",
      "Customizable",
      "Accessible"
    ],
    "sourceFile": "classic-microcars.tsx",
    "fileName": "classic-microcars.tsx",
    "number": "053",
    "demoNote": "Interactive demo · Browse the cars with the timeline, arrow keys, or a swipe. Select Discover more to explore the photographic archive; close it with Escape. Replace the cars and galleries through typed props.",
    "features": [
      {
        "title": "An editorial automotive archive",
        "description": "BMW Isetta, Fiat Cinquecento, and Messerschmitt cutouts slide over matching taupe, lavender, and sage backdrops, with tall vector typography behind them."
      },
      {
        "title": "Discover the details",
        "description": "An inset photographic archive opens inside the scene, with three reference photographs, gallery pagination, and accessible closing controls."
      },
      {
        "title": "Made to reuse",
        "description": "Typed vehicle data, optional autoplay, swipe and keyboard navigation, focus management, and embedded artwork in copied source."
      }
    ],
    "usage": "import ClassicMicrocars from \"@/components/ui/classic-microcars\";\n\nexport default function Page() {\n  return <ClassicMicrocars />;\n}"
  },
  {
    "slug": "globe-travel-explorer",
    "title": "Globe Travel Explorer",
    "category": "Navigation",
    "number": "052",
    "description": "A luminous rotating Earth opens China’s destinations, then zooms into a scenic travel hero with a live booking form.",
    "demoNote": "Interactive demo · Select the globe to explore China, then open a destination. Choose dates and travelers to preview a trip request. Connect onBook to your travel service.",
    "features": [
      {
        "title": "Explore from orbit",
        "description": "The original rotating globe glows over a deep blue starfield before sliding into the country view."
      },
      {
        "title": "Travel into the scene",
        "description": "Destination cards and a globe zoom transition reveal the mountain landscape and oversized destination typography."
      },
      {
        "title": "A working trip form",
        "description": "Date validation, traveler selection, async booking callbacks, error feedback, keyboard navigation, and reduced-motion artwork."
      }
    ],
    "tags": [
      "Interactive",
      "Animated",
      "Customizable",
      "Accessible"
    ],
    "sourceFile": "globe-travel-explorer.tsx",
    "fileName": "globe-travel-explorer.tsx",
    "usage": "import GlobeTravelExplorer from \"@/components/ui/globe-travel-explorer\";\n\nexport default function Page() {\n  return <GlobeTravelExplorer />;\n}"
  },
  {
    "slug": "sapiens-character-builder",
    "title": "Sapiens Character Builder",
    "category": "Playgrounds",
    "number": "051",
    "description": "Remix a three-dimensional character with pose, clothing, and illustration-style controls on a coral studio canvas.",
    "demoNote": "Interactive demo · Select the character to open Remix, change clothing and poses, or export your composition as PNG or SVG. The shown running, standing, and cycling artwork comes from the reference; supply your own artwork to extend the set.",
    "features": [
      {
        "title": "A character to remix",
        "description": "The original illustrated runner changes clothing, hair, and shoes through a floating parts panel."
      },
      {
        "title": "Try a different pose",
        "description": "Running, standing, and cycling reference artwork combine with colorful, duotone, and outline presentation controls."
      },
      {
        "title": "Export your composition",
        "description": "Live PNG and SVG downloads, typed customization callbacks, keyboard controls, and responsive editing tools."
      }
    ],
    "tags": [
      "Interactive",
      "Animated",
      "Customizable",
      "Accessible"
    ],
    "sourceFile": "sapiens-character-builder.tsx",
    "fileName": "sapiens-character-builder.tsx",
    "usage": "import SapiensCharacterBuilder from \"@/components/ui/sapiens-character-builder\";\n\nexport default function Page() {\n  return <SapiensCharacterBuilder />;\n}"
  },
  {
    "slug": "swift-sneaker-store",
    "title": "Swift Sneaker Store",
    "category": "Commerce",
    "number": "050",
    "description": "Four sneaker panels expand into a warm, minimal storefront with product details, color choices, sizes, and a working shopping bag.",
    "demoNote": "Interactive demo · Hover or focus a sneaker, then select it to explore. Choose a size and add it to the demo bag. Connect onAddToCart to your store; no payment is taken.",
    "features": [
      {
        "title": "From collection to product",
        "description": "Four colored panels stretch around the selected sneaker and become a focused product and specifications view."
      },
      {
        "title": "A complete shopping interaction",
        "description": "Color selection, size validation, an async add-to-bag callback, shopping bag count, and readable status messages."
      },
      {
        "title": "Portable product artwork",
        "description": "Product cutouts from the supplied reference are embedded in copied source. Replace the products with your own catalog through typed props."
      }
    ],
    "tags": [
      "Interactive",
      "Animated",
      "Customizable",
      "Accessible"
    ],
    "sourceFile": "swift-sneaker-store.tsx",
    "fileName": "swift-sneaker-store.tsx",
    "usage": "import SwiftSneakerStore from \"@/components/ui/swift-sneaker-store\";\n\nexport default function Page() {\n  return <SwiftSneakerStore />;\n}"
  },
  {
    "slug": "chrome-profile-carousel",
    "title": "Chrome Profile Carousel",
    "category": "Carousels",
    "number": "049",
    "description": "Four personal browser worlds turn in 3D, with portraits, saved places, products, and bookmarks layered over matching colors.",
    "demoNote": "Interactive demo · Choose a profile, swipe, or use the arrow keys. Space pauses automatic playback. Replace the profiles and layer artwork through typed props.",
    "features": [
      {
        "title": "Four personal worlds",
        "description": "Original reference portraits, shopping cards, places, and bookmarks float above blue, coral, yellow, and green panels."
      },
      {
        "title": "A turn with depth",
        "description": "Perspective rotation, outgoing and incoming layers, and palette transitions follow the supplied motion reference."
      },
      {
        "title": "Ready to make your own",
        "description": "Custom profile data, autoplay controls, layer callbacks, keyboard navigation, swipe, and reduced-motion support."
      }
    ],
    "tags": [
      "Interactive",
      "Animated",
      "Customizable",
      "Accessible"
    ],
    "sourceFile": "chrome-profile-carousel.tsx",
    "fileName": "chrome-profile-carousel.tsx",
    "usage": "import ChromeProfileCarousel from \"@/components/ui/chrome-profile-carousel\";\n\nexport default function Page() {\n  return <ChromeProfileCarousel />;\n}"
  },
  {
    "slug": "glassy-crm-dashboard",
    "title": "Glassy CRM Dashboard",
    "description": "A dark glass workspace brings store metrics, fulfillment, connected services, customer insights, and financial performance into five coordinated views.",
    "category": "Dashboards",
    "tags": [
      "Interactive",
      "Animated",
      "Customizable",
      "Accessible"
    ],
    "sourceFile": "glassy-crm-dashboard.tsx",
    "fileName": "glassy-crm-dashboard.tsx",
    "number": "048",
    "demoNote": "Interactive demo · Explore five CRM views, search records, and adjust the reporting controls. Default records are local demonstration data; connect the typed callbacks to your own application.",
    "features": [
      {
        "title": "One connected workspace",
        "description": "Overview, Orders & Fulfillment, Connected Ecosystem, Customer Intelligence, and Performance & Audit share a compact glass navigation shell."
      },
      {
        "title": "Color makes the data readable",
        "description": "Purple revenue columns, cyan curves, a category donut, and quarterly capsule bars reproduce the reference dashboard presentation."
      },
      {
        "title": "Ready for your application",
        "description": "Copy the complete typed component with its scoped styles, inline chart artwork, configurable data, and interaction callbacks."
      }
    ],
    "usage": "import GlassyCrmDashboard from \"@/components/ui/glassy-crm-dashboard\";\n\nexport default function DashboardPage() {\n  return <GlassyCrmDashboard />;\n}"
  },
  {
    "slug": "skill-orbit-hero",
    "title": "Skill Orbit Hero",
    "description": "Your portrait sits at the center of two slow orbits while skills and highlights circle around it, pausing when visitors look closer.",
    "category": "Portfolio",
    "tags": [
      "Interactive",
      "Animated",
      "Accessible"
    ],
    "sourceFile": "skill-orbit-hero.tsx",
    "fileName": "skill-orbit-hero.tsx",
    "number": "047",
    "demoNote": "Interactive demo · Hover or focus a skill to pause the orbit and read its detail. Replace the name, portrait, and skills with your own through props.",
    "features": [
      {
        "title": "A profile in motion",
        "description": "Skills travel on two counter-rotating rings around the portrait, always upright and readable."
      },
      {
        "title": "Look closer",
        "description": "Hovering or focusing the orbit pauses it, and each skill reveals a short detail for curious visitors."
      },
      {
        "title": "Make it yours",
        "description": "Typed props for name, role, portrait, skills, and actions, with reduced-motion and keyboard support."
      }
    ],
    "usage": "import SkillOrbitHero from \"@/components/ui/skill-orbit-hero\";\n\nexport default function HomePage() {\n  return <SkillOrbitHero />;\n}"
  },
  {
    "slug": "code-profile-hero",
    "title": "Code Profile Hero",
    "description": "A code editor types out a developer profile object while a live card assembles itself beside it, line by line.",
    "category": "Portfolio",
    "tags": [
      "Interactive",
      "Animated",
      "Accessible"
    ],
    "sourceFile": "code-profile-hero.tsx",
    "fileName": "code-profile-hero.tsx",
    "number": "046",
    "demoNote": "Interactive demo · Watch the profile compile, then replay it or skip to the result. Supply your own profile data through props.",
    "features": [
      {
        "title": "Code becomes you",
        "description": "Each typed line fills in the matching part of the profile card: name, role, skills, and status."
      },
      {
        "title": "Feels like an editor",
        "description": "Syntax colors, line numbers, a blinking caret, and a compile step make it read like real code."
      },
      {
        "title": "Respectful playback",
        "description": "Replay and skip controls, an accessible static profile, and reduced-motion support are built in."
      }
    ],
    "usage": "import CodeProfileHero from \"@/components/ui/code-profile-hero\";\n\nexport default function HomePage() {\n  return <CodeProfileHero />;\n}"
  },
  {
    "slug": "id-badge-hero",
    "title": "ID Badge Hero",
    "description": "A conference-style ID badge swings on its lanyard beside your introduction; drag it to play and flip it to reveal your skills.",
    "category": "Portfolio",
    "tags": [
      "Interactive",
      "Animated",
      "Accessible"
    ],
    "sourceFile": "id-badge-hero.tsx",
    "fileName": "id-badge-hero.tsx",
    "number": "045",
    "demoNote": "Interactive demo · Drag the badge and let go to watch it swing, or click or press Enter to flip it. Replace the profile with your own through props.",
    "features": [
      {
        "title": "A badge with weight",
        "description": "A spring-driven lanyard sways on its own, follows your drag, and settles with a natural swing."
      },
      {
        "title": "Two sides of you",
        "description": "The front shows your photo, name, and role; flip it to reveal skills and availability."
      },
      {
        "title": "Ready for your portfolio",
        "description": "Typed props for profile, skills, and actions, plus keyboard flipping and reduced-motion support."
      }
    ],
    "usage": "import IdBadgeHero from \"@/components/ui/id-badge-hero\";\n\nexport default function HomePage() {\n  return <IdBadgeHero />;\n}"
  },
  {
    "slug": "lamp-login",
    "title": "Lamp Login",
    "description": "Pull the cord of a cream mushroom lamp to bathe a dark room in warm light and reveal a frosted glass sign-in card with a gold button.",
    "category": "Forms",
    "tags": [
      "Interactive",
      "Animated",
      "Accessible"
    ],
    "sourceFile": "lamp-login.tsx",
    "fileName": "lamp-login.tsx",
    "number": "044",
    "demoNote": "Interactive demo · Pull or click the lamp cord (or focus it and press Enter) to switch on the light, then sign in with any username and password. Sign-in runs locally until you connect onSubmit.",
    "features": [
      {
        "title": "Light as the interaction",
        "description": "Dragging the cord stretches it and springs back; the shade glows, warm light floods the room, and the form springs into view."
      },
      {
        "title": "A complete sign-in",
        "description": "Labelled fields, required validation, a signing-in state, error alerts, and a welcome view with sign-out are built in."
      },
      {
        "title": "Ready to connect",
        "description": "Typed onSubmit and onToggle callbacks, a defaultOn option, keyboard-operable cord, inert hidden form, and reduced-motion support."
      }
    ],
    "usage": "import LampLogin from \"@/components/ui/lamp-login\";\n\nexport default function LoginPage() {\n  return <LampLogin />;\n}"
  },
  {
    "slug": "truck-pay-button",
    "title": "Truck Pay Button",
    "description": "A bright pill folds into a road as a little delivery truck loads up, rolls off with its headlight on, and the button returns with a drawn checkmark.",
    "category": "Buttons",
    "tags": [
      "Interactive",
      "Animated",
      "Accessible"
    ],
    "sourceFile": "truck-pay-button.tsx",
    "fileName": "truck-pay-button.tsx",
    "number": "043",
    "demoNote": "Interactive demo · Press the button to watch the delivery run. Payment is simulated locally until you connect onPay; a rejected promise shows Try again.",
    "features": [
      {
        "title": "A tiny delivery story",
        "description": "The pill squashes into a road line, parcels arc into the truck, and it speeds away before the button reappears."
      },
      {
        "title": "Honest about async work",
        "description": "The truck keeps driving until both the minimum animation and your onPay promise settle, with success and retry states."
      },
      {
        "title": "Safe to reuse",
        "description": "Run guards, timer cleanup, live announcements, configurable labels and reset timing, and a reduced-motion path without the drive."
      }
    ],
    "usage": "import TruckPayButton from \"@/components/ui/truck-pay-button\";\n\nexport default function CheckoutPage() {\n  return <TruckPayButton />;\n}"
  },
  {
    "slug": "isometric-social-icons",
    "title": "Isometric Social Icons",
    "description": "Four dark isometric tiles lift into colorful layered stacks on hover or focus, then settle slowly back into the floor.",
    "category": "Social",
    "tags": [
      "Interactive",
      "Animated",
      "Accessible"
    ],
    "sourceFile": "isometric-social-icons.tsx",
    "fileName": "isometric-social-icons.tsx",
    "number": "042",
    "demoNote": "Interactive demo · Hover a tile, or Tab through the links, to raise its colored layer stack. Supply your own links, icons, and colors.",
    "features": [
      {
        "title": "Depth from pure CSS",
        "description": "A rotated, skewed row of slabs with shaded side faces creates an isometric floor without any 3D library."
      },
      {
        "title": "Fast up, slow down",
        "description": "Layers rise in a quick 0.3s burst and fade back over 1.5s, each tinted with its platform color."
      },
      {
        "title": "Real links, any platform",
        "description": "Semantic navigation, keyboard focus parity, configurable layer count, new-tab control, and typed link data."
      }
    ],
    "usage": "import IsometricSocialIcons from \"@/components/ui/isometric-social-icons\";\n\nexport default function SocialFooter() {\n  return <IsometricSocialIcons />;\n}"
  },
  {
    "slug": "character-deck-slider",
    "title": "Character Deck Slider",
    "description": "A white character card stacks anime portraits into a vertical deck: the active card blooms into color while neighbors fade to grayscale above and below.",
    "category": "Carousels",
    "tags": [
      "Interactive",
      "Animated",
      "Accessible"
    ],
    "sourceFile": "character-deck-slider.tsx",
    "fileName": "character-deck-slider.tsx",
    "number": "041",
    "demoNote": "Interactive demo · Use the round up/down buttons, click a peeking card or a pagination line, swipe the deck vertically, or focus it and use the arrow keys.",
    "features": [
      {
        "title": "A deck with depth",
        "description": "Five card positions scale, shift, and desaturate together on one smooth cubic-bezier curve, so every step feels physical."
      },
      {
        "title": "Every way to browse",
        "description": "Buttons, pagination lines, peeking-card clicks, vertical swipe, and arrow keys all move the same deck, with a polite live announcement."
      },
      {
        "title": "Bring your own cast",
        "description": "Typed items, an onChange callback, optional looping, and embedded default artwork keep the copied file ready to use."
      }
    ],
    "usage": "import CharacterDeckSlider from \"@/components/ui/character-deck-slider\";\n\nexport default function CharactersPage() {\n  return <CharacterDeckSlider />;\n}"
  },
  {
    "slug": "hologram-login",
    "title": "Hologram Login",
    "description": "A translucent cyan login panel floats above a glowing projector, beamed up by a pulsing cone of holographic light.",
    "category": "Forms",
    "tags": [
      "Interactive",
      "Animated",
      "Accessible"
    ],
    "sourceFile": "hologram-login.tsx",
    "fileName": "hologram-login.tsx",
    "number": "040",
    "demoNote": "Interactive demo · Enter any username and password and press Continue. Sign-in runs locally until you connect onSubmit to your own service.",
    "features": [
      {
        "title": "Projected from below",
        "description": "A CSS-only emitter puck and clip-path light cone pulse beneath a frosted, gently floating glass panel."
      },
      {
        "title": "A real form",
        "description": "Labelled fields, required validation, a verifying state, error alerts, and a welcome screen with sign-out are all built in."
      },
      {
        "title": "Connect your auth",
        "description": "Pass an async onSubmit: resolve to show success or reject to display your error message. Reduced motion stops the float and pulse."
      }
    ],
    "usage": "import HologramLogin from \"@/components/ui/hologram-login\";\n\nexport default function LoginPage() {\n  return <HologramLogin />;\n}"
  },
  {
    "slug": "neon-ring-auth",
    "title": "Neon Ring Auth",
    "description": "A glowing cyan and magenta circular frame surrounds dark inset form fields, rotating between login and account creation.",
    "category": "Forms",
    "tags": [
      "Interactive",
      "Animated",
      "Accessible"
    ],
    "sourceFile": "neon-ring-auth.tsx",
    "fileName": "neon-ring-auth.tsx",
    "number": "039",
    "demoNote": "Interactive demo · Switch between login and sign-up, reveal a password, or try account recovery. Connect the typed callbacks for real authentication.",
    "features": [
      {
        "title": "A luminous frame",
        "description": "Cyan bloom and a moving magenta edge surround the circular dark form, matching the supplied neon reference."
      },
      {
        "title": "Two sides of the form",
        "description": "Login and sign-up trade places through a rotating transition, with remember-me and password visibility controls."
      },
      {
        "title": "Ready for your service",
        "description": "Typed async actions, validation, cancellation, and error feedback keep the reusable component practical."
      }
    ],
    "usage": "import NeonRingAuth from \"@/components/ui/neon-ring-auth\";\n\nexport default function Page() {\n  return <NeonRingAuth />;\n}"
  },
  {
    "slug": "orbit-login",
    "title": "Orbit Login",
    "description": "An orange-accented login card sits inside a ring of rotating illuminated ticks, against a softly shaded navy background.",
    "category": "Forms",
    "tags": [
      "Interactive",
      "Animated",
      "Accessible"
    ],
    "sourceFile": "orbit-login.tsx",
    "fileName": "orbit-login.tsx",
    "number": "038",
    "demoNote": "Interactive demo · Try login, password visibility, recovery, and sign-up. Supply callbacks to connect authentication and social actions.",
    "features": [
      {
        "title": "An illuminated orbit",
        "description": "Rounded radial ticks travel around a raised navy card while orange highlights bring the form to life."
      },
      {
        "title": "A complete interaction",
        "description": "Accessible form fields, password visibility, recovery, and sign-up complement the social action buttons."
      },
      {
        "title": "Your authentication",
        "description": "Typed callbacks support real services, with pending, success, and error states in an independently reusable component."
      }
    ],
    "usage": "import OrbitLogin from \"@/components/ui/orbit-login\";\n\nexport default function Page() {\n  return <OrbitLogin />;\n}"
  },
  {
    "slug": "spider-reveal",
    "title": "Spider Reveal",
    "description": "A cinematic identity interface reveals the face beneath a masked portrait with a moving spotlight, glitch accents, and live mission panels.",
    "category": "Effects",
    "tags": [
      "Interactive",
      "Animated",
      "Accessible"
    ],
    "sourceFile": "spider-reveal.tsx",
    "fileName": "spider-reveal.tsx",
    "number": "035",
    "demoNote": "Interactive demo · Move your pointer or use the reveal control to uncover the portrait. Explore system panels, initialize the sequence, and open the anomaly cards.",
    "features": [
      {
        "title": "A hidden identity",
        "description": "A spotlight uncovers the portrait beneath the mask with bounded pointer and touch interactions and a keyboard alternative."
      },
      {
        "title": "A working command interface",
        "description": "Biometric styling, live coordinate feedback, system actions, and anomaly details turn the supplied cinematic scene into an interactive component."
      },
      {
        "title": "A portable scene",
        "description": "The reference artwork and scoped styles are included in the Code export, with typed customization and reduced-motion behavior."
      }
    ],
    "usage": "import SpiderReveal from \"@/components/ui/spider-reveal\";\n\nexport default function Page() {\n  return <SpiderReveal />;\n}"
  },
  {
    "slug": "text-rain",
    "title": "Text Rain",
    "description": "A luminous white cloud rains glowing characters over a charcoal stage, with falling letters that shrink and fade as they land.",
    "category": "Effects",
    "tags": [
      "Animated",
      "Accessible",
      "Customizable"
    ],
    "sourceFile": "text-rain.tsx",
    "fileName": "text-rain.tsx",
    "number": "037",
    "demoNote": "Animated demo · Glowing letters fall from behind the cloud and shrink at the bottom. Customize the characters, color, density, and speed; enable optional playback controls in your project.",
    "features": [
      {
        "title": "Letters in the rain",
        "description": "Glowing characters fall from a crisp cloud and fade out with the timing shown in the video."
      },
      {
        "title": "A controllable effect",
        "description": "Choose the character set, color, particle density, and duration; pause or replay the local scene."
      },
      {
        "title": "Considerate animation",
        "description": "Deterministic particles avoid hydration surprises, with reduced-motion and visibility handling."
      }
    ],
    "usage": "import TextRain from \"@/components/ui/text-rain\";\n\nexport default function Page() {\n  return <TextRain />;\n}"
  },
  {
    "slug": "luxury-clock",
    "title": "Luxury Clock",
    "description": "A black analog dial floats over a deep teal backdrop, with gold numerals, a glowing second hand, and a crown-inspired mark.",
    "category": "Displays",
    "tags": [
      "Animated",
      "Accessible",
      "Customizable"
    ],
    "sourceFile": "luxury-clock.tsx",
    "fileName": "luxury-clock.tsx",
    "number": "036",
    "demoNote": "Live demo · The dial follows your local time. Supply a fixed date, time zone, or brand when reusing the component.",
    "features": [
      {
        "title": "A precise dial",
        "description": "White hour and minute hands, a fine luminous second hand, and gold cardinal numerals follow the supplied clock design."
      },
      {
        "title": "Your time",
        "description": "Show live local time, choose a time zone, or supply a fixed date for a reproducible display."
      },
      {
        "title": "A self-contained detail",
        "description": "The dial, crown artwork, and scoped styles need no external clock or image package."
      }
    ],
    "usage": "import LuxuryClock from \"@/components/ui/luxury-clock\";\n\nexport default function Page() {\n  return <LuxuryClock />;\n}"
  },
  {
    slug: "liquid-cursor",
    title: "Liquid Cursor",
    description:
      "An elastic liquid cursor flows over oversized typography, stretches into navigation pills, and turns white as the portfolio changes to its dark project view.",
    category: "Effects",
    tags: ["Interactive", "Animated", "Accessible"],
    sourceFile: "liquid-cursor.tsx",
    fileName: "liquid-cursor.tsx",
    number: "034",
    demoNote:
      "Interactive demo · Move your pointer across the stage, hover a navigation item, and scroll or swipe to the projects. Keyboard controls and project selection are included.",
    features: [
      {
        title: "Motion with a little weight",
        description:
          "Connected liquid forms follow the pointer with inertia, stretching on movement and settling into a soft circle.",
      },
      {
        title: "Two sides of a portfolio",
        description:
          "A crisp white typography hero gives way to a dark project list, with an inverted cursor and fluid hover highlights.",
      },
      {
        title: "Built to be embedded",
        description:
          "The cursor stays inside the component, with customizable content, project callbacks, responsive layouts, and reduced-motion support.",
      },
    ],
    usage: `import LiquidCursor from "@/components/ui/liquid-cursor";

export default function PortfolioPage() {
  return <LiquidCursor />;
}`,
  },
  {
    slug: "portfolio-image-trail",
    title: "Portfolio Image Trail",
    description:
      "A character-led cream portfolio reveals a ribbon of blue technology artwork behind your pointer, framed by frosted navigation and bright lime accents.",
    category: "Effects",
    tags: ["Interactive", "Animated", "Accessible"],
    sourceFile: "portfolio-image-trail.tsx",
    fileName: "portfolio-image-trail.tsx",
    number: "033",
    demoNote:
      "Interactive demo · Move your pointer or drag across the hero to reveal the image trail. Try the navigation and the work or contact actions; supply your own content and callbacks for your portfolio.",
    features: [
      {
        title: "A trail of creative work",
        description:
          "Blue technology imagery follows a smooth fading pointer trail around the character portrait and laptop.",
      },
      {
        title: "The details from the reference",
        description:
          "Cream surfaces, compact frosted pills, monospaced labels, and a lime call to action recreate the supplied portfolio scene.",
      },
      {
        title: "A complete portable scene",
        description:
          "The exported component includes its artwork and scoped styles, with typed customization, keyboard actions, and reduced-motion behavior.",
      },
    ],
    usage: `import PortfolioImageTrail from "@/components/ui/portfolio-image-trail";

export default function PortfolioPage() {
  return <PortfolioImageTrail />;
}`,
  },
  {
    "slug": "aura-cart",
    "title": "Aura Cart Animation",
    "description": "A warm cream storefront turns a product mosaic into a focused shopping view, with color changes and a playful image flight into the bag.",
    "category": "Commerce",
    "tags": [
      "Interactive",
      "Animated",
      "Accessible"
    ],
    "sourceFile": "aura-cart.tsx",
    "fileName": "aura-cart.tsx",
    "number": "032",
    "demoNote": "Interactive demo · Open a product, choose a color, and add it to the bag. The default shopping flow runs locally until you connect your own callbacks.",
    "features": [
      {
        "title": "From collection to detail",
        "description": "A six-image product mosaic opens into editorial product details with a cream palette, serif typography, and smooth image transitions."
      },
      {
        "title": "A little shopping delight",
        "description": "The selected product image follows a curved path into the bag as its item count responds. Color choices crossfade the product photography."
      },
      {
        "title": "Made for your storefront",
        "description": "Typed product data and callbacks let you connect cart and saved-item behavior, with responsive layouts and reduced-motion support."
      }
    ],
    "usage": "import AuraCart from \"@/components/ui/aura-cart\";\n\nexport default function ShopPage() {\n  return <AuraCart />;\n}"
  },
  {
    "slug": "liquid-glass-playground",
    "title": "Liquid Glass Playground",
    "description": "A flowing teal workspace lets you drag refractive glass panels, fuse their surfaces, and adjust the material with live controls.",
    "category": "Effects",
    "tags": [
      "Interactive",
      "Animated",
      "WebGL"
    ],
    "sourceFile": "liquid-glass-playground.tsx",
    "fileName": "liquid-glass-playground.tsx",
    "number": "031",
    "demoNote": "Interactive demo · Drag a panel or focus it and use the arrow keys. Try the style, motion, and layout controls; click empty stage space to send a pulse.",
    "features": [
      {
        "title": "A liquid surface",
        "description": "The original Plasma UI shaders create rounded surface fusion, refraction, and luminous edges in a canvas contained within the component."
      },
      {
        "title": "Shape the workspace",
        "description": "Arrange, scatter, add, or remove panels and explore appearance presets, motion, tint, and material controls."
      },
      {
        "title": "Ready to reuse",
        "description": "The standalone source includes the renderer, fonts, styles, and license notices, with keyboard controls and a usable fallback when WebGL2 is unavailable."
      }
    ],
    "usage": "import LiquidGlassPlayground from \"@/components/ui/liquid-glass-playground\";\n\nexport default function PlaygroundPage() {\n  return <LiquidGlassPlayground />;\n}"
  },
  {
    "slug": "neumorphic-navbar",
    "title": "Neumorphic Navbar",
    "description": "A soft gray navigation bar combines raised surfaces, an inset link track, a sliding active highlight, and a rounded mobile menu.",
    "category": "Navigation",
    "tags": [
      "Interactive",
      "Animated",
      "Accessible"
    ],
    "sourceFile": "neumorphic-navbar.tsx",
    "fileName": "neumorphic-navbar.tsx",
    "number": "030",
    "demoNote": "Interactive demo · Choose a navigation item, or switch to Mobile preview to open the menu. Supply your own URLs or callbacks to connect the logo and Get started action.",
    "features": [
      {
        "title": "Soft depth",
        "description": "Raised gray surfaces and an inset navigation track recreate the reference’s light and shadow, with a precisely measured sliding highlight."
      },
      {
        "title": "A menu that fits",
        "description": "A circular disclosure opens the mobile navigation. Selection, outside clicks, and Escape dismiss it with appropriate focus behavior."
      },
      {
        "title": "Your destinations",
        "description": "Use real links, typed callbacks, and controlled selection to connect the standalone navbar to your application."
      }
    ],
    "usage": "import NeumorphicNavbar from \"@/components/ui/neumorphic-navbar\";\n\nexport default function Page() {\n  return <NeumorphicNavbar />;\n}"
  },
  {
    "slug": "verification-code",
    "title": "Verification Code",
    "description": "Four glossy blue input tiles tumble together and become a bouncing green check when your verification code is complete.",
    "category": "Forms",
    "tags": [
      "Interactive",
      "Animated",
      "Accessible"
    ],
    "sourceFile": "verification-code.tsx",
    "fileName": "verification-code.tsx",
    "number": "029",
    "demoNote": "Interactive demo \u00b7 Enter or paste any four digits to try the local demo. Supply onVerify and onResend callbacks to connect real verification.",
    "features": [
      {
        "title": "From code to confirmation",
        "description": "Blue input tiles merge and bounce into a glossy green success orb."
      },
      {
        "title": "Thoughtful input behavior",
        "description": "Paste a code, navigate with arrow keys, and move backward with Backspace."
      },
      {
        "title": "Connect your verification",
        "description": "Asynchronous verification, failure feedback, resend cooldown, and retry are included."
      }
    ],
    "usage": "import VerificationCode from \"@/components/ui/verification-code\";\n\nexport default function Example() {\n  return <VerificationCode />;\n}"
  },
  {
    "slug": "gooey-checkbox",
    "title": "Gooey Checkbox",
    "description": "A quiet gray ring bursts into a soft blue splash, pulls its droplets together, and draws a crisp white check.",
    "category": "Controls",
    "tags": [
      "Interactive",
      "Animated",
      "Accessible"
    ],
    "sourceFile": "gooey-checkbox.tsx",
    "fileName": "gooey-checkbox.tsx",
    "number": "028",
    "demoNote": "Interactive demo \u00b7 Click the checkbox or use Tab and Space. It supports native form submission, validation, and form resets.",
    "features": [
      {
        "title": "Fluid by design",
        "description": "Six droplets stretch and merge around the circular checkbox as the check draws in."
      },
      {
        "title": "A proper checkbox",
        "description": "A native input provides keyboard behavior, labels, form values, and validation."
      },
      {
        "title": "A small portable detail",
        "description": "SVG artwork and scoped animation styles are included in one file, with reduced-motion support."
      }
    ],
    "usage": "import GooeyCheckbox from \"@/components/ui/gooey-checkbox\";\n\nexport default function Example() {\n  return <GooeyCheckbox />;\n}"
  },
  {
    "slug": "day-night-toggle",
    "title": "Day / Night Toggle",
    "description": "A cheerful sun slips behind the clouds as a sleepy moon brings stars, a nightcap, and a quiet indigo sky.",
    "category": "Controls",
    "tags": [
      "Interactive",
      "Animated",
      "Accessible"
    ],
    "sourceFile": "day-night-toggle.tsx",
    "fileName": "day-night-toggle.tsx",
    "number": "027",
    "demoNote": "Interactive demo \u00b7 Click the switch or press Space to change modes. Enable the optional recording loop to watch the day and night sequence.",
    "features": [
      {
        "title": "A little daydream",
        "description": "A smiling sun, passing clouds, and a sleepy moon recreate the supplied interaction."
      },
      {
        "title": "One switch, two moods",
        "description": "The stage changes from icy blue daylight to a glowing star-filled night."
      },
      {
        "title": "Make it your theme switch",
        "description": "Use controlled or uncontrolled state and connect the change callback to your theme."
      }
    ],
    "usage": "import DayNightToggle from \"@/components/ui/day-night-toggle\";\n\nexport default function Example() {\n  return <DayNightToggle />;\n}"
  },
  {
    "slug": "hungry-delete",
    "title": "Hungry Delete",
    "description": "Two playful delete buttons swallow their letters into a hungry bin, then celebrate success or spit the word back out.",
    "category": "Buttons",
    "tags": [
      "Interactive",
      "Animated",
      "Accessible"
    ],
    "sourceFile": "hungry-delete.tsx",
    "fileName": "hungry-delete.tsx",
    "number": "026",
    "demoNote": "Interactive demo \u00b7 Press either Delete button to see the success or failure sequence. Toggle sound for a tiny audio cue; actions run locally until you supply a callback.",
    "features": [
      {
        "title": "Letters with personality",
        "description": "Each letter jumps into the bin before the pill collapses into a loading circle."
      },
      {
        "title": "Success and a second chance",
        "description": "The black button completes its action; the blue button demonstrates failure and recovery."
      },
      {
        "title": "Ready for your action",
        "description": "Connect an asynchronous callback to your own action, with pending, success, and failure feedback."
      }
    ],
    "usage": "import HungryDelete from \"@/components/ui/hungry-delete\";\n\nexport default function Example() {\n  return <HungryDelete />;\n}"
  },
  {
    slug: "portrait-gallery",
    title: "Portrait Gallery",
    description:
      "Five staggered anime portraits expand on hover, focus, or touch. The selected portrait gains color while a black name label slides into view.",
    category: "Galleries",
    tags: ["Interactive", "Animated", "Accessible"],
    sourceFile: "portrait-gallery.tsx",
    fileName: "portrait-gallery.tsx",
    number: "025",
    demoNote:
      "Interactive demo · Hover a portrait to expand it, or tap to keep it selected. Use Left/Right and Home/End when the gallery has keyboard focus.",
    features: [
      {
        title: "The reference composition",
        description:
          "Original portrait artwork, alternating vertical offsets, dimmed neighboring panels, and delayed name labels reproduce the supplied design.",
      },
      {
        title: "Every way to explore",
        description:
          "Pointer hover previews a portrait; touch and keyboard selection keep it open. Arrow keys move through the collection.",
      },
      {
        title: "One portable file",
        description:
          "Portraits, the Figtree font, and scoped styles are embedded. Pass your own items and selection callback without adding a package.",
      },
    ],
    usage: `import PortraitGallery from "@/components/ui/portrait-gallery";

export default function GalleryPage() {
  return <PortraitGallery />;
}`,
  },
  {
    slug: "connect-social-bar",
    title: "Connect Social Bar",
    description:
      "A glowing social bar reveals its links from a letter-spaced CONNECT pill. Hover or focus a channel to see its name and color.",
    category: "Social",
    tags: ["Interactive", "Accessible"],
    sourceFile: "connect-social-bar.tsx",
    fileName: "connect-social-bar.tsx",
    number: "024",
    demoNote:
      "Interactive demo · Select CONNECT to reveal the links. Update the URLs and email in the component props for your profiles.",
    features: [
      {
        title: "Reveal on demand",
        description:
          "A compact CONNECT pill opens into a row of seven social and contact links.",
      },
      {
        title: "A glow for every channel",
        description:
          "Hover or keyboard focus reveals a tooltip and a matching accent glow.",
      },
      {
        title: "Make the links yours",
        description:
          "Pass your profile URLs and email address through the component props.",
      },
    ],
    usage: `import ConnectSocialBar from "@/components/ui/connect-social-bar";

export default function Footer() {
  return <ConnectSocialBar />;
}`,
  },
  {
    slug: "basketball-upload",
    title: "Basketball Upload",
    description:
      "A playful file upload turns a dropped document into a basketball shot, with animated progress and a clear success state.",
    category: "Uploads",
    tags: ["Interactive", "Animated"],
    sourceFile: "basketball-upload.tsx",
    fileName: "basketball-upload.tsx",
    number: "023",
    demoNote:
      "Interactive demo · Choose or drop a file, then aim and release it into the hoop. Upload feedback is simulated locally.",
    features: [
      {
        title: "Drop it in",
        description:
          "Choose a file with the picker or drag it into the upload court.",
      },
      {
        title: "A playful upload path",
        description:
          "A document flies toward the hoop before its progress and success states appear.",
      },
      {
        title: "Ready to connect",
        description:
          "The included upload interaction is a local demo; connect the file callback to your storage service.",
      },
    ],
    usage: `import BasketballUpload from "@/components/ui/basketball-upload";

export default function UploadPage() {
  return <BasketballUpload />;
}`,
  },
  {
    slug: "redbull-card",
    title: "Red Bull Card",
    description:
      "A softly glowing product mark expands into a vivid Red Bull card, with a tilted real can photo, product details, and a shop action.",
    category: "Cards",
    tags: ["Animated", "Interactive"],
    sourceFile: "redbull-card.tsx",
    fileName: "redbull-card.tsx",
    number: "022",
    demoNote:
      "Interactive demo · Watch the mark expand and collapse, or select it to pause and control the card state.",
    features: [
      {
        title: "From mark to product",
        description:
          "A compact glowing badge opens to reveal a product card and a real Red Bull product photo.",
      },
      {
        title: "Ambient motion",
        description:
          "Subtle stars and blue light add atmosphere while respecting reduced-motion preferences.",
      },
      {
        title: "Connect your action",
        description:
          "Use the shop callback to connect the call to action to your own destination.",
      },
    ],
    usage: `import RedBullCard from "@/components/ui/redbull-card";

export default function ProductPage() {
  return <RedBullCard />;
}`,
  },
  {
    "slug": "gallery-flip",
    "title": "Gallery Flip",
    "description": "A grid of city photographs flips tile by tile into one scene, then unfolds back into the collection.",
    "category": "Galleries",
    "tags": [
      "Animated",
      "Interactive"
    ],
    "sourceFile": "gallery-flip.tsx",
    "fileName": "gallery-flip.tsx",
    "number": "021",
    "demoNote": "Interactive demo · Select a photo to reveal it across the grid; return to choose another.",
    "features": [
      {
        "title": "A ripple of photographs",
        "description": "A staggered three-dimensional flip travels through the photo grid."
      },
      {
        "title": "Choose the moment",
        "description": "Select individual tiles with a pointer, touch, or keyboard."
      },
      {
        "title": "Make it personal",
        "description": "Use your own images with the included standalone source."
      }
    ],
    "usage": "import GalleryFlip from \"@/components/ui/gallery-flip\";\n\nexport default function Example() {\n  return <GalleryFlip />;\n}"
  },
  {
    "slug": "sneaker-orbit",
    "title": "Sneaker Orbit",
    "description": "A rotating wall of sneakers turns a product catalog into a dimensional browsing experience.",
    "category": "Commerce",
    "tags": [
      "Animated",
      "Interactive"
    ],
    "sourceFile": "sneaker-orbit.tsx",
    "fileName": "sneaker-orbit.tsx",
    "number": "020",
    "demoNote": "Interactive demo · Explore the collection, filter the shoes, and select a pair. Purchase actions are local demos until connected.",
    "features": [
      {
        "title": "Products in perspective",
        "description": "A cylindrical arrangement gives the sneaker collection depth and movement."
      },
      {
        "title": "Find your pair",
        "description": "Use filters and inspect an individual shoe without leaving the demo."
      },
      {
        "title": "Connect your storefront",
        "description": "Customize product data and connect the selection action to your own checkout."
      }
    ],
    "usage": "import SneakerOrbit from \"@/components/ui/sneaker-orbit\";\n\nexport default function Example() {\n  return <SneakerOrbit />;\n}"
  },
  {
    "slug": "scorpion-cursor",
    "title": "Scorpion Cursor",
    "description": "A fine white skeleton follows your pointer across a black canvas, bending its spine, legs, and curling tail.",
    "category": "Effects",
    "tags": [
      "Animated",
      "Interactive"
    ],
    "sourceFile": "scorpion-cursor.tsx",
    "fileName": "scorpion-cursor.tsx",
    "number": "019",
    "demoNote": "Interactive demo · Move your pointer or touch the canvas to guide the creature.",
    "features": [
      {
        "title": "An articulated creature",
        "description": "A linked spine and branching legs follow the movement of the head."
      },
      {
        "title": "Made for movement",
        "description": "Guide the cursor with pointer or touch interactions."
      },
      {
        "title": "Contained and reusable",
        "description": "The effect stays within its component and respects reduced-motion preferences."
      }
    ],
    "usage": "import ScorpionCursor from \"@/components/ui/scorpion-cursor\";\n\nexport default function Example() {\n  return <ScorpionCursor />;\n}"
  },
  {
    "slug": "love-typography",
    "title": "Love Typography",
    "description": "A warm yellow stage transforms “I love you” into a tiny beating heart, framed by moving white bars.",
    "category": "Typography",
    "tags": [
      "Animated",
      "Interactive"
    ],
    "sourceFile": "love-typography.tsx",
    "fileName": "love-typography.tsx",
    "number": "018",
    "demoNote": "Interactive demo · Watch the lettering transform, pause it, or replay the sequence.",
    "features": [
      {
        "title": "Words become a heart",
        "description": "Lettering gives way to a red heart through four choreographed phases."
      },
      {
        "title": "Your pace",
        "description": "Pause or replay the sequence; offscreen animation and background tabs pause automatically."
      },
      {
        "title": "A small standalone animation",
        "description": "Inline SVG hearts and scoped CSS travel with the component. No animation package is needed."
      }
    ],
    "usage": "import LoveTypography from \"@/components/ui/love-typography\";\n\nexport default function Example() {\n  return <LoveTypography />;\n}"
  },
  {
    "slug": "sliding-auth",
    "title": "Sliding Auth",
    "description": "A soft blue panel glides between login and registration, with a rounded silhouette that adapts to mobile.",
    "category": "Forms",
    "tags": [
      "Animated",
      "Interactive"
    ],
    "sourceFile": "sliding-auth.tsx",
    "fileName": "sliding-auth.tsx",
    "number": "017",
    "demoNote": "Interactive demo · Switch between login and registration. Connect callbacks for real account operations.",
    "features": [
      {
        "title": "A moving welcome",
        "description": "A curved blue panel moves across the white form as the mode changes."
      },
      {
        "title": "Desktop to mobile",
        "description": "The horizontal composition becomes a vertical layout in narrow containers."
      },
      {
        "title": "Complete form states",
        "description": "Validation and submission feedback are included; connect your own authentication service."
      }
    ],
    "usage": "import SlidingAuth from \"@/components/ui/sliding-auth\";\n\nexport default function Example() {\n  return <SlidingAuth />;\n}"
  },
  {
    "slug": "delivery-button",
    "title": "Delivery Button",
    "description": "A complete-order button becomes a miniature delivery scene, loading a parcel and driving into a checked success state.",
    "category": "Buttons",
    "tags": [
      "Animated",
      "Interactive"
    ],
    "sourceFile": "delivery-button.tsx",
    "fileName": "delivery-button.tsx",
    "number": "016",
    "demoNote": "Interactive demo · Click Complete Order to play the truck sequence. No real order is placed by the demo.",
    "features": [
      {
        "title": "A delivery in miniature",
        "description": "A parcel, opening truck doors, headlights, and road markings animate inside the button."
      },
      {
        "title": "More than a click",
        "description": "Pending, completion, and retry states support asynchronous order callbacks."
      },
      {
        "title": "Easy to reuse",
        "description": "The truck artwork and scoped animation styles are included in a single file."
      }
    ],
    "usage": "import DeliveryButton from \"@/components/ui/delivery-button\";\n\nexport default function Example() {\n  return <DeliveryButton />;\n}"
  },
  {
    "slug": "glass-product-card",
    "title": "Glass Product Card",
    "description": "A colorful sneaker floats over frosted glass with a pastel glow, color choices, and compact size controls.",
    "category": "Commerce",
    "tags": [
      "Animated",
      "Interactive"
    ],
    "sourceFile": "glass-product-card.tsx",
    "fileName": "glass-product-card.tsx",
    "number": "015",
    "demoNote": "Interactive demo · Choose a color and size, then try the local cart action.",
    "features": [
      {
        "title": "Floating product detail",
        "description": "Layered translucent surfaces frame a shoe that lifts and tilts on interaction."
      },
      {
        "title": "Try a variation",
        "description": "Switch product colors and choose a size before adding to the cart."
      },
      {
        "title": "Ready to connect",
        "description": "Use your product imagery and connect the cart callback to your own store."
      }
    ],
    "usage": "import GlassProductCard from \"@/components/ui/glass-product-card\";\n\nexport default function Example() {\n  return <GlassProductCard />;\n}"
  },
  {
    "slug": "verso-auth",
    "title": "Verso Auth",
    "description": "Cream paper and deep forest green trade places through a diagonal transition between sign-in and account creation.",
    "category": "Forms",
    "tags": [
      "Animated",
      "Interactive"
    ],
    "sourceFile": "verso-auth.tsx",
    "fileName": "verso-auth.tsx",
    "number": "014",
    "demoNote": "Interactive demo · Switch modes, reveal the password, and try the form. Account operations are local until callbacks are supplied.",
    "features": [
      {
        "title": "A diagonal transition",
        "description": "An angled green panel sweeps across the card while the form changes sides."
      },
      {
        "title": "Editorial details",
        "description": "Serif welcome copy, understated fields, and warm cream surfaces match the reference mood."
      },
      {
        "title": "Usable form flows",
        "description": "Validation, password visibility, and submission feedback are part of the component."
      }
    ],
    "usage": "import VersoAuth from \"@/components/ui/verso-auth\";\n\nexport default function Example() {\n  return <VersoAuth />;\n}"
  },
  {
    "slug": "hover-product-cards",
    "title": "Hover Product Cards",
    "description": "Two sneaker cards lift their product images to reveal sizes, color choices, and a purchase action.",
    "category": "Commerce",
    "tags": [
      "Animated",
      "Interactive"
    ],
    "sourceFile": "hover-product-cards.tsx",
    "fileName": "hover-product-cards.tsx",
    "number": "013",
    "demoNote": "Interactive demo · Hover, focus, or tap a card, select options, and try its local purchase action.",
    "features": [
      {
        "title": "Reveal the details",
        "description": "The shoe rises as the colored background shifts and purchase controls appear."
      },
      {
        "title": "Pick your style",
        "description": "Independent size and color choices make each product card interactive."
      },
      {
        "title": "Bring your products",
        "description": "Customize the card data and supply an action for your own storefront."
      }
    ],
    "usage": "import HoverProductCards from \"@/components/ui/hover-product-cards\";\n\nexport default function Example() {\n  return <HoverProductCards />;\n}"
  },
  {
    "slug": "periodic-explorer",
    "title": "Periodic Explorer",
    "description": "The periodic table moves into a sphere, a helix, or a three-dimensional grid, with colorful element cards and details.",
    "category": "Navigation",
    "tags": [
      "Animated",
      "Interactive"
    ],
    "sourceFile": "periodic-explorer.tsx",
    "fileName": "periodic-explorer.tsx",
    "number": "012",
    "demoNote": "Interactive demo · Change layouts, rotate the scene, and select an element to inspect it.",
    "features": [
      {
        "title": "Four ways to explore",
        "description": "Transition between the table, sphere, helix, and grid layouts."
      },
      {
        "title": "Elements in focus",
        "description": "Select an element to inspect its identifying information."
      },
      {
        "title": "A reusable 3D scene",
        "description": "CSS transforms create spatial movement without an extra rendering dependency."
      }
    ],
    "usage": "import PeriodicExplorer from \"@/components/ui/periodic-explorer\";\n\nexport default function Example() {\n  return <PeriodicExplorer />;\n}"
  },
  {
    "slug": "keyboard-cards",
    "title": "Keyboard Cards",
    "description": "Three mechanical keyboards rise above green, dark, and monochrome product cards with changing keycap colors.",
    "category": "Cards",
    "tags": [
      "Animated",
      "Interactive"
    ],
    "sourceFile": "keyboard-cards.tsx",
    "fileName": "keyboard-cards.tsx",
    "number": "011",
    "demoNote": "Interactive demo · Hover or focus a keyboard, change its color swatches, and explore its details.",
    "features": [
      {
        "title": "Keys with depth",
        "description": "Detailed keyboard geometry floats above each product card."
      },
      {
        "title": "Three personalities",
        "description": "LeafKey, TopoKey, and PandaKey provide distinct palettes and compositions."
      },
      {
        "title": "Choose your finish",
        "description": "Change color variations and explore each card with pointer, touch, or keyboard."
      }
    ],
    "usage": "import KeyboardCards from \"@/components/ui/keyboard-cards\";\n\nexport default function Example() {\n  return <KeyboardCards />;\n}"
  },
{
  "slug": "fan-image-slider",
  "title": "Fan Image Slider",
  "description": "A fan of vivid landscapes. Layered photographs rotate, lift, and glide into focus with a fluid, tactile transition.",
  "category": "Carousels",
  "tags": [
    "Animated",
    "Interactive"
  ],
  "sourceFile": "fan-image-slider.tsx",
  "fileName": "fan-image-slider.tsx",
  "number": "010",
  "demoNote": "Interactive demo · Browse with arrows, dots, the keyboard, or a swipe. Select the centered image to open it.",
  "features": [
    {
      "title": "A different perspective",
      "description": "Ten landscape photographs form an overlapping fan, with a gentle lift as you explore."
    },
    {
      "title": "Choose your view",
      "description": "Navigate with the controls, swipe on touch screens, or use arrow keys. Open the selected photo for a closer look."
    },
    {
      "title": "Take the whole gallery",
      "description": "The standalone source includes optimized photos, styles, and interactions. Supply your own images to make it yours."
    }
  ],
  "usage": "import FanImageSlider from \"@/components/ui/fan-image-slider\";\n\nexport default function Example() {\n  return <FanImageSlider />;\n}"
},
{
  "slug": "trailhead-card",
  "title": "Trailhead Card",
  "description": "A little depth for your next adventure. A luminous glass card follows your pointer while floating rings and layered surfaces move in perspective.",
  "category": "Cards",
  "tags": [
    "Animated",
    "Interactive"
  ],
  "sourceFile": "trailhead-card.tsx",
  "fileName": "trailhead-card.tsx",
  "number": "009",
  "demoNote": "Interactive demo · Move your pointer or focus the card to explore its depth. Try the save, trail, download, and Open controls.",
  "features": [
    {
      "title": "Depth in the details",
      "description": "Icy gradients, translucent rings, and a floating glass surface recreate the reference’s layered composition."
    },
    {
      "title": "Made to move",
      "description": "Pointer movement tilts the card in three dimensions, with touch and keyboard controls and reduced-motion support."
    },
    {
      "title": "Ready for a new trail",
      "description": "Customize the card and connect its actions, or use the included local demo. The artwork is drawn in CSS and SVG."
    }
  ],
  "usage": "import TrailheadCard from \"@/components/ui/trailhead-card\";\n\nexport default function Example() {\n  return <TrailheadCard />;\n}"
},
{
  "slug": "character-reveal-cards",
  "title": "Character Reveal Cards",
  "description": "Stories that step out of their covers. Two fantasy characters emerge in three dimensions as their portrait cards tilt back into the scene.",
  "category": "Cards",
  "tags": [
    "Animated",
    "Interactive"
  ],
  "sourceFile": "character-reveal-cards.tsx",
  "fileName": "character-reveal-cards.tsx",
  "number": "008",
  "demoNote": "Interactive demo · Hover or focus to reveal a character. Tap once to reveal and again to open its details.",
  "features": [
    {
      "title": "Beyond the cover",
      "description": "Separate cover, title, and transparent character layers create a dimensional reveal."
    },
    {
      "title": "Explore each character",
      "description": "Hover, keyboard focus, and touch reveal the artwork; selecting a character opens its details."
    },
    {
      "title": "All the layers included",
      "description": "Copy the complete component with embedded artwork, then replace the cards and selection handler to fit your project."
    }
  ],
  "usage": "import CharacterRevealCards from \"@/components/ui/character-reveal-cards\";\n\nexport default function Example() {\n  return <CharacterRevealCards />;\n}"
},
{
  "slug": "glowing-login",
  "title": "Glowing Login",
  "description": "A neon invitation to sign in. Cyan and pink light travels around a deep charcoal frame that opens into a compact login form.",
  "category": "Forms",
  "tags": [
    "Animated",
    "Interactive"
  ],
  "sourceFile": "glowing-login.tsx",
  "fileName": "glowing-login.tsx",
  "number": "007",
  "demoNote": "Interactive demo · Expand the panel by hovering, focusing, or tapping. Sign in, recovery, and registration work locally until you connect callbacks.",
  "features": [
    {
      "title": "A frame in motion",
      "description": "Moving cyan and pink edges contrast with a deeply inset charcoal form and rounded controls."
    },
    {
      "title": "A complete local flow",
      "description": "Try sign in, password recovery, and registration with validation, pending states, and clear feedback."
    },
    {
      "title": "Connect your own service",
      "description": "Pass asynchronous handlers from a Client Component. Credentials are not sent anywhere by the default demo."
    }
  ],
  "usage": "import GlowingLogin from \"@/components/ui/glowing-login\";\n\nexport default function Example() {\n  return <GlowingLogin />;\n}"
},
  {
    slug: "solar-explorer",
    title: "Solar Explorer",
    description:
      "A journey through nine worlds. Textured planets, orbiting moons, and atmospheric transitions turn a navigation menu into a miniature solar system.",
    category: "Navigation",
    tags: ["Animated", "Interactive"],
    sourceFile: "solar-explorer.tsx",
    fileName: "solar-explorer.tsx",
    number: "006",
    demoNote:
      "Interactive demo · Choose a world to explore its scene, then select Read More for additional details.",
    features: [
      {
        title: "A world in motion",
        description:
          "Dramatic planet surfaces, atmospheric lighting, and orbiting moons give each destination its own character.",
      },
      {
        title: "Navigate the solar system",
        description:
          "Switch between nine worlds and open their details without leaving the component.",
      },
      {
        title: "Ready for your orbit",
        description:
          "Copy one component with its artwork and styles included, then customize its content for your own project.",
      },
    ],
    usage: `import SolarExplorer from "@/components/ui/solar-explorer";

export default function SolarSystemPage() {
  return <SolarExplorer />;
}`,
  },
  {
    slug: "animated-border-card",
    title: "Animated Border Card",
    description:
      "A compact profile with a vivid first impression. Rotating cyan and pink borders frame an illustrated avatar, then expand to reveal the person behind it.",
    category: "Cards",
    tags: ["Animated", "Interactive"],
    sourceFile: "animated-border-card.tsx",
    fileName: "animated-border-card.tsx",
    number: "005",
    demoNote:
      "Interactive demo · Hover, focus, or tap to expand. Follow and Message work locally; connect their callbacks to your own service.",
    features: [
      {
        title: "A glowing introduction",
        description:
          "Rotating neon borders and a layered avatar frame give the profile a distinctive animated treatment.",
      },
      {
        title: "More on interaction",
        description:
          "The compact card expands on hover, keyboard focus, or tap to reveal profile details and actions.",
      },
      {
        title: "Make it personal",
        description:
          "Keep the complete component in one file and replace the profile, avatar, and action handlers for your project.",
      },
    ],
    usage: `import AnimatedBorderCard from "@/components/ui/animated-border-card";

export default function ProfilePage() {
  return <AnimatedBorderCard />;
}`,
  },
  {
    slug: "destination-carousel",
    title: "Destination Carousel",
    description:
      "An invitation to explore. Immersive landscapes, expanding destination cards, and cinematic transitions bring every journey into focus.",
    category: "Carousels",
    tags: ["Animated", "Interactive"],
    sourceFile: "destination-carousel.tsx",
    fileName: "destination-carousel.tsx",
    number: "004",
    demoNote:
      "Interactive demo · Explore destinations, save favorites, and open their details. All actions stay in this preview; no bookings are made.",
    features: [
      {
        title: "A change of scenery",
        description:
          "Portrait destination cards expand into immersive landscapes, with staggered text and coordinated transitions.",
      },
      {
        title: "Explore at your pace",
        description:
          "Navigate with arrows, destination cards, the keyboard, or a swipe. Pause playback, save favorites, and discover destination details.",
      },
      {
        title: "Make it your own",
        description:
          "One reusable component includes the presentation and interactions. Add your own destinations and connect the discover action to your project.",
      },
    ],
    usage: `import DestinationCarousel from "@/components/ui/destination-carousel";

export default function DestinationsPage() {
  return <DestinationCarousel />;
}`,
  },
  {
    slug: "toon-carousel",
    title: "Toon Carousel",
    description:
      "A colorful character showcase with oversized type, playful 3D artwork, and fluid transitions. Explore a new personality with every slide.",
    category: "Carousels",
    tags: ["Animated", "Interactive"],
    sourceFile: "toon-carousel.tsx",
    fileName: "toon-carousel.tsx",
    number: "003",
    demoNote:
      "Interactive demo · Browse with the arrows, keyboard, or a swipe. Select Discover to learn about each character.",
    features: [
      {
        title: "Full of character",
        description:
          "Four colorful scenes combine expressive artwork, oversized typography, and coordinated background transitions.",
      },
      {
        title: "Explore your way",
        description:
          "Arrow controls, keyboard navigation, touch gestures, and a character details dialog make the showcase interactive.",
      },
      {
        title: "One file, ready to use",
        description:
          "The component includes its styles and artwork. Copy the source, supply your own slides, and customize the discover action.",
      },
    ],
    usage: `import ToonCarousel from "@/components/ui/toon-carousel";

export default function ShowcasePage() {
  return <ToonCarousel />;
}`,
  },
  {
    slug: "creative-login",
    title: "Creative Login",
    description:
      "A warm welcome, one detail at a time. Playful character animation and a considered form turn a simple introduction into a memorable interaction.",
    category: "Forms",
    tags: ["Animated", "Multi-step"],
    sourceFile: "creative-login.tsx",
    fileName: "creative-login.tsx",
    number: "002",
    demoNote:
      "Interactive demo · Enter your name and email to explore the flow. Connect onSubmit to your own service to save submissions.",
    features: [
      {
        title: "A little personality",
        description:
          "Animated character artwork and carefully timed transitions give a familiar form a distinctive personality.",
      },
      {
        title: "A complete interaction",
        description:
          "Enter your details, review them, and submit. Validation, loading, success, and retry states are included.",
      },
      {
        title: "Ready for your project",
        description:
          "Copy the component source, customize the presentation, and connect your own asynchronous submission callback.",
      },
    ],
    usage: `import CreativeLogin from "@/components/ui/creative-login";

export default function LoginPage() {
  return <CreativeLogin />;
}`,
  },
  {
    slug: "glass-otp",
    title: "Glass OTP",
    description:
      "A cinematic verification experience. Frosted glass, orbiting digits, and a little delight in every interaction.",
    category: "Inputs",
    tags: ["Animated", "Accessible"],
    sourceFile: "glass-otp.tsx",
    fileName: "glass-otp.tsx",
    number: "001",
    demoNote:
      "Interactive demo · Any 4 digits will work. Connect onVerify to your backend for real verification.",
    features: [
      {
        title: "Made to move",
        description:
          "Orbiting digits and fluid state transitions bring a familiar interaction to life, with support for reduced motion.",
      },
      {
        title: "Every detail considered",
        description:
          "Keyboard navigation, code pasting, clear feedback, and a resend timer make verification feel effortless.",
      },
      {
        title: "Yours to build with",
        description:
          "One self-contained React component. Copy the source, add your verification callback, and make it your own.",
      },
    ],
    usage: `import GlassOtp from "@/components/ui/glass-otp";

export default function VerificationPage() {
  return <GlassOtp />;
}`,
  },
];

export function getComponent(slug: string): ComponentEntry | undefined {
  return components.find((component) => component.slug === slug);
}
