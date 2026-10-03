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
  Record<string, ComponentType<{ className?: string }>>
> = {
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
