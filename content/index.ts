import type { MotionEntry } from "@/lib/types";
import { magneticHover } from "./magnetic-hover";
import { customCursor } from "./custom-cursor";
import { tilt } from "./tilt";
import { textScramble } from "./text-scramble";
import { underlineReveal } from "./underline-reveal";
import { spotlightHover } from "./spotlight-hover";
import { fillHover } from "./fill-hover";
import { directionalHover } from "./directional-hover";
import { liftHover } from "./lift-hover";
import { focusDim } from "./focus-dim";
import { borderDraw } from "./border-draw";
import { imageTrail } from "./image-trail";
import { glitchHover } from "./glitch-hover";
import { textSlideSwap } from "./text-slide-swap";
import { scrollFadeIn } from "./scroll-fade-in";
import { perspectiveReveal } from "./perspective-reveal";
import { parallax } from "./parallax";
import { scrollProgress } from "./scroll-progress";
import { velocitySkew } from "./velocity-skew";
import { textHighlight } from "./text-highlight";
import { scrollZoom } from "./scroll-zoom";
import { stickyPin } from "./sticky-pin";
import { horizontalScroll } from "./horizontal-scroll";
import { scrollSnap } from "./scroll-snap";
import { sectionColorSwap } from "./section-color-swap";
import { splitTextReveal } from "./split-text-reveal";
import { typewriter } from "./typewriter";
import { counter } from "./counter";
import { marquee } from "./marquee";
import { blurReveal } from "./blur-reveal";
import { waveText } from "./wave-text";
import { wordRotate } from "./word-rotate";
import { outlineFill } from "./outline-fill";
import { gradientShine } from "./gradient-shine";
import { numberRoll } from "./number-roll";
import { splitFlap } from "./split-flap";
import { curtainWipe } from "./curtain-wipe";
import { crossfade } from "./crossfade";
import { circleReveal } from "./circle-reveal";
import { menuReveal } from "./menu-reveal";
import { shutterTransition } from "./shutter-transition";
import { zoomThrough } from "./zoom-through";
import { imageZoomHover } from "./image-zoom-hover";
import { clipReveal } from "./clip-reveal";
import { kenBurns } from "./ken-burns";
import { duotoneHover } from "./duotone-hover";
import { imageParallaxHover } from "./image-parallax-hover";
import { blurLoad } from "./blur-load";
import { beforeAfter } from "./before-after";
import { mosaicReveal } from "./mosaic-reveal";
import { accordion } from "./accordion";
import { tabIndicator } from "./tab-indicator";
import { stepper } from "./stepper";
import { modalPop } from "./modal-pop";
import { drawerSlide } from "./drawer-slide";
import { toastSlide } from "./toast-slide";
import { tooltipPop } from "./tooltip-pop";
import { toggleSwitch } from "./toggle-switch";
import { rippleTap } from "./ripple-tap";
import { preloaderCounter } from "./preloader-counter";
import { skeletonShimmer } from "./skeleton-shimmer";
import { loadingBar } from "./loading-bar";
import { spinnerRing } from "./spinner-ring";
import { dotsPulse } from "./dots-pulse";
import { circularProgress } from "./circular-progress";

import { hoverPreview } from "./hover-preview";
import { hoverWave } from "./hover-wave";
import { imageSwapHover } from "./image-swap-hover";
import { mouseParallax } from "./mouse-parallax";
import { scrollSpy } from "./scroll-spy";
import { stackingCards } from "./stacking-cards";
import { smoothScroll } from "./smooth-scroll";
import { headerShrink } from "./header-shrink";
import { footerReveal } from "./footer-reveal";
import { scrollMarquee } from "./scroll-marquee";
import { trackingIn } from "./tracking-in";
import { textFlip } from "./text-flip";
import { markerLine } from "./marker-line";
import { rotatingBadge } from "./rotating-badge";
import { splitScreen } from "./split-screen";
import { sharedElement } from "./shared-element";
import { lightbox } from "./lightbox";
import { carousel } from "./carousel";
import { cardShuffle } from "./card-shuffle";
import { logoMarquee } from "./logo-marquee";
import { lineDraw } from "./line-draw";
import { blobMorph } from "./blob-morph";
import { grainOverlay } from "./grain-overlay";
import { frostedGlass } from "./frosted-glass";
import { pressFeedback } from "./press-feedback";
import { flipCard } from "./flip-card";
import { floatingLabel } from "./floating-label";
import { dropdownReveal } from "./dropdown-reveal";
import { menuToggle } from "./menu-toggle";
import { errorShake } from "./error-shake";
import { staggerGrid } from "./stagger-grid";
import { liquidFill } from "./liquid-fill";
import { bootSequence } from "./boot-sequence";

// 掲載順(カテゴリ順=hover→scroll→text→transition→media→ui→loading)
const all: MotionEntry[] = [
  magneticHover,
  customCursor,
  tilt,
  textScramble,
  underlineReveal,
  spotlightHover,
  fillHover,
  directionalHover,
  liftHover,
  focusDim,
  borderDraw,
  imageTrail,
  glitchHover,
  textSlideSwap,
  hoverPreview,
  hoverWave,
  imageSwapHover,
  mouseParallax,
  scrollFadeIn,
  perspectiveReveal,
  parallax,
  scrollProgress,
  velocitySkew,
  textHighlight,
  scrollZoom,
  stickyPin,
  horizontalScroll,
  scrollSnap,
  sectionColorSwap,
  scrollSpy,
  stackingCards,
  smoothScroll,
  headerShrink,
  footerReveal,
  scrollMarquee,
  splitTextReveal,
  typewriter,
  counter,
  marquee,
  blurReveal,
  waveText,
  wordRotate,
  outlineFill,
  gradientShine,
  numberRoll,
  splitFlap,
  trackingIn,
  textFlip,
  markerLine,
  rotatingBadge,
  curtainWipe,
  crossfade,
  circleReveal,
  menuReveal,
  shutterTransition,
  zoomThrough,
  splitScreen,
  sharedElement,
  imageZoomHover,
  clipReveal,
  kenBurns,
  duotoneHover,
  imageParallaxHover,
  blurLoad,
  beforeAfter,
  mosaicReveal,
  lightbox,
  carousel,
  cardShuffle,
  logoMarquee,
  lineDraw,
  blobMorph,
  grainOverlay,
  frostedGlass,
  accordion,
  tabIndicator,
  stepper,
  modalPop,
  drawerSlide,
  toastSlide,
  tooltipPop,
  toggleSwitch,
  rippleTap,
  pressFeedback,
  flipCard,
  floatingLabel,
  dropdownReveal,
  menuToggle,
  errorShake,
  preloaderCounter,
  skeletonShimmer,
  loadingBar,
  spinnerRing,
  dotsPulse,
  circularProgress,
  staggerGrid,
  liquidFill,
  bootSequence,
];

export const entries: Record<string, MotionEntry> = Object.fromEntries(
  all.map((e) => [e.slug, e])
);

export const entryList: MotionEntry[] = all;

// 未実装slugのRELATEDチップ表示用フォールバック(将来カテゴリの追加時に使う)
export const plannedNames: Record<string, string> = {};

// 英語表記は「先頭のみ大文字」(頭字語のUI等は例外)
export const categoryLabels: Record<MotionEntry["category"], string> = {
  hover: "Hover",
  scroll: "Scroll",
  text: "Text",
  transition: "Transition",
  media: "Media",
  ui: "UI",
  loading: "Loading",
  webgl: "WebGL",
};
