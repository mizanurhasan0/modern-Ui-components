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
