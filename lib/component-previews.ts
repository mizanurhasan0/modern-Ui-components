import LampLogin, { LampLoginThumbnail } from "@/components/ui/lamp-login";
import TruckPayButton, { TruckPayButtonThumbnail } from "@/components/ui/truck-pay-button";
import IsometricSocialIcons, { IsometricSocialIconsThumbnail } from "@/components/ui/isometric-social-icons";
import CharacterDeckSlider, { CharacterDeckSliderThumbnail } from "@/components/ui/character-deck-slider";
import HologramLogin, { HologramLoginThumbnail } from "@/components/ui/hologram-login";
import NeonRingAuth, { NeonRingAuthThumbnail } from "@/components/ui/neon-ring-auth";
import OrbitLogin, { OrbitLoginThumbnail } from "@/components/ui/orbit-login";
import SpiderReveal, { SpiderRevealThumbnail } from "@/components/ui/spider-reveal";
import TextRain, { TextRainThumbnail } from "@/components/ui/text-rain";
import LuxuryClock, { LuxuryClockThumbnail } from "@/components/ui/luxury-clock";
import AuraCart, { AuraCartThumbnail } from "@/components/ui/aura-cart";
import PortfolioImageTrail, {
  PortfolioImageTrailThumbnail,
} from "@/components/ui/portfolio-image-trail";
import LiquidCursor, {
  LiquidCursorThumbnail,
} from "@/components/ui/liquid-cursor";
import LiquidGlassPlayground, {
  LiquidGlassPlaygroundThumbnail,
} from "@/components/ui/liquid-glass-playground";
import NeumorphicNavbar, {
  NeumorphicNavbarThumbnail,
} from "@/components/ui/neumorphic-navbar";
import HungryDelete, {
  HungryDeleteThumbnail,
} from "@/components/ui/hungry-delete";
import DayNightToggle, {
  DayNightToggleThumbnail,
} from "@/components/ui/day-night-toggle";
import GooeyCheckbox, {
  GooeyCheckboxThumbnail,
} from "@/components/ui/gooey-checkbox";
import VerificationCode, {
  VerificationCodeThumbnail,
} from "@/components/ui/verification-code";
import PortraitGallery, {
  PortraitGalleryThumbnail,
} from "@/components/ui/portrait-gallery";
import GalleryFlip, {
  GalleryFlipThumbnail,
} from "@/components/ui/gallery-flip";
import SneakerOrbit, {
  SneakerOrbitThumbnail,
} from "@/components/ui/sneaker-orbit";
import ScorpionCursor, {
  ScorpionCursorThumbnail,
} from "@/components/ui/scorpion-cursor";
import LoveTypography, {
  LoveTypographyThumbnail,
} from "@/components/ui/love-typography";
import SlidingAuth, {
  SlidingAuthThumbnail,
} from "@/components/ui/sliding-auth";
import DeliveryButton, {
  DeliveryButtonThumbnail,
} from "@/components/ui/delivery-button";
import GlassProductCard, {
  GlassProductCardThumbnail,
} from "@/components/ui/glass-product-card";
import VersoAuth, { VersoAuthThumbnail } from "@/components/ui/verso-auth";
import HoverProductCards, {
  HoverProductCardsThumbnail,
} from "@/components/ui/hover-product-cards";
import PeriodicExplorer, {
  PeriodicExplorerThumbnail,
} from "@/components/ui/periodic-explorer";
import KeyboardCards, {
  KeyboardCardsThumbnail,
} from "@/components/ui/keyboard-cards";
import GlowingLogin, {
  GlowingLoginThumbnail,
} from "@/components/ui/glowing-login";
import CharacterRevealCards, {
  CharacterRevealCardsThumbnail,
} from "@/components/ui/character-reveal-cards";
import TrailheadCard, {
  TrailheadCardThumbnail,
} from "@/components/ui/trailhead-card";
import FanImageSlider, {
  FanImageSliderThumbnail,
} from "@/components/ui/fan-image-slider";
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
import ConnectSocialBar, {
  ConnectSocialBarThumbnail,
} from "@/components/ui/connect-social-bar";
import BasketballUpload, {
  BasketballUploadThumbnail,
} from "@/components/ui/basketball-upload";
import RedBullCard, {
  RedBullCardThumbnail,
} from "@/components/ui/redbull-card";

/** Interactive demos are separate from serializable catalog metadata. */
export const componentPreviews: Partial<Record<string, ComponentType>> = {
  "lamp-login": LampLogin,
  "truck-pay-button": TruckPayButton,
  "isometric-social-icons": IsometricSocialIcons,
  "character-deck-slider": CharacterDeckSlider,
  "hologram-login": HologramLogin,
  "neon-ring-auth": NeonRingAuth,
  "orbit-login": OrbitLogin,
  "spider-reveal": SpiderReveal,
  "text-rain": TextRain,
  "luxury-clock": LuxuryClock,
  "liquid-cursor": LiquidCursor,
  "portfolio-image-trail": PortfolioImageTrail,
  "aura-cart": AuraCart,
  "liquid-glass-playground": LiquidGlassPlayground,
  "neumorphic-navbar": NeumorphicNavbar,
  "hungry-delete": HungryDelete,
  "day-night-toggle": DayNightToggle,
  "gooey-checkbox": GooeyCheckbox,
  "verification-code": VerificationCode,

  "portrait-gallery": PortraitGallery,
  "connect-social-bar": ConnectSocialBar,
  "basketball-upload": BasketballUpload,
  "redbull-card": RedBullCard,
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
  "lamp-login": LampLoginThumbnail,
  "truck-pay-button": TruckPayButtonThumbnail,
  "isometric-social-icons": IsometricSocialIconsThumbnail,
  "character-deck-slider": CharacterDeckSliderThumbnail,
  "hologram-login": HologramLoginThumbnail,
  "neon-ring-auth": NeonRingAuthThumbnail,
  "orbit-login": OrbitLoginThumbnail,
  "spider-reveal": SpiderRevealThumbnail,
  "text-rain": TextRainThumbnail,
  "luxury-clock": LuxuryClockThumbnail,
  "aura-cart": AuraCartThumbnail,
  "liquid-cursor": LiquidCursorThumbnail,
  "portfolio-image-trail": PortfolioImageTrailThumbnail,
  "liquid-glass-playground": LiquidGlassPlaygroundThumbnail,
  "neumorphic-navbar": NeumorphicNavbarThumbnail,
  "hungry-delete": HungryDeleteThumbnail,
  "day-night-toggle": DayNightToggleThumbnail,
  "gooey-checkbox": GooeyCheckboxThumbnail,
  "verification-code": VerificationCodeThumbnail,
  "portrait-gallery": PortraitGalleryThumbnail,
  "connect-social-bar": ConnectSocialBarThumbnail,
  "basketball-upload": BasketballUploadThumbnail,
  "redbull-card": RedBullCardThumbnail,
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
