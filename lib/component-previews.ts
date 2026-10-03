import GalleryFlip, { GalleryFlipThumbnail } from "@/components/ui/gallery-flip";
import SneakerOrbit, { SneakerOrbitThumbnail } from "@/components/ui/sneaker-orbit";
import ScorpionCursor, { ScorpionCursorThumbnail } from "@/components/ui/scorpion-cursor";
import LoveTypography, { LoveTypographyThumbnail } from "@/components/ui/love-typography";
import SlidingAuth, { SlidingAuthThumbnail } from "@/components/ui/sliding-auth";
import DeliveryButton, { DeliveryButtonThumbnail } from "@/components/ui/delivery-button";
import GlassProductCard, { GlassProductCardThumbnail } from "@/components/ui/glass-product-card";
import VersoAuth, { VersoAuthThumbnail } from "@/components/ui/verso-auth";
import HoverProductCards, { HoverProductCardsThumbnail } from "@/components/ui/hover-product-cards";
import PeriodicExplorer, { PeriodicExplorerThumbnail } from "@/components/ui/periodic-explorer";
import KeyboardCards, { KeyboardCardsThumbnail } from "@/components/ui/keyboard-cards";
import GlowingLogin, { GlowingLoginThumbnail } from "@/components/ui/glowing-login";
import CharacterRevealCards, { CharacterRevealCardsThumbnail } from "@/components/ui/character-reveal-cards";
import TrailheadCard, { TrailheadCardThumbnail } from "@/components/ui/trailhead-card";
import FanImageSlider, { FanImageSliderThumbnail } from "@/components/ui/fan-image-slider";
import type { ComponentType } from "react";
import SolarExplorer, {
  SolarExplorerThumbnail,
} from "@/components/ui/solar-explorer";
import AnimatedBorderCard, {
  AnimatedBorderCardThumbnail,
} from "@/components/ui/animated-border-card";
import DestinationCarousel, {
  DestinationCarouselThumbnail,
} from "@/components/ui/destination-carousel";
import ToonCarousel, {
  ToonCarouselThumbnail,
} from "@/components/ui/toon-carousel";
import GlassOtp, { GlassOtpThumbnail } from "@/components/ui/glass-otp";
import CreativeLogin, {
  CreativeLoginThumbnail,
} from "@/components/ui/creative-login";

/** Interactive demos are separate from serializable catalog metadata. */
export const componentPreviews: Partial<Record<string, ComponentType>> = {
  "gallery-flip": GalleryFlip,
  "sneaker-orbit": SneakerOrbit,
  "scorpion-cursor": ScorpionCursor,
  "love-typography": LoveTypography,
  "sliding-auth": SlidingAuth,
  "delivery-button": DeliveryButton,
  "glass-product-card": GlassProductCard,
  "verso-auth": VersoAuth,
  "hover-product-cards": HoverProductCards,
  "periodic-explorer": PeriodicExplorer,
  "keyboard-cards": KeyboardCards,

  "glowing-login": GlowingLogin,
  "character-reveal-cards": CharacterRevealCards,
  "trailhead-card": TrailheadCard,
  "fan-image-slider": FanImageSlider,
  "solar-explorer": SolarExplorer,
  "animated-border-card": AnimatedBorderCard,
  "destination-carousel": DestinationCarousel,
  "toon-carousel": ToonCarousel,
  "creative-login": CreativeLogin,
  "glass-otp": GlassOtp,
};

/** Thumbnails are optional; the gallery can fall back to a generic illustration. */
export const componentThumbnails: Partial<
  Record<string, ComponentType<{ className?: string; previewStep?: number }>>
> = {
  "gallery-flip": GalleryFlipThumbnail,
  "sneaker-orbit": SneakerOrbitThumbnail,
  "scorpion-cursor": ScorpionCursorThumbnail,
  "love-typography": LoveTypographyThumbnail,
  "sliding-auth": SlidingAuthThumbnail,
  "delivery-button": DeliveryButtonThumbnail,
  "glass-product-card": GlassProductCardThumbnail,
  "verso-auth": VersoAuthThumbnail,
  "hover-product-cards": HoverProductCardsThumbnail,
  "periodic-explorer": PeriodicExplorerThumbnail,
  "keyboard-cards": KeyboardCardsThumbnail,

  "glowing-login": GlowingLoginThumbnail,
  "character-reveal-cards": CharacterRevealCardsThumbnail,
  "trailhead-card": TrailheadCardThumbnail,
  "fan-image-slider": FanImageSliderThumbnail,
  "solar-explorer": SolarExplorerThumbnail,
  "animated-border-card": AnimatedBorderCardThumbnail,
  "destination-carousel": DestinationCarouselThumbnail,
  "toon-carousel": ToonCarouselThumbnail,
  "creative-login": CreativeLoginThumbnail,
  "glass-otp": GlassOtpThumbnail,
};
