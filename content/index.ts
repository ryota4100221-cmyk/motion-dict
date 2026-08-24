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
import { headerInvert } from "./header-invert";
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
import { dragScroll } from "./drag-scroll";
import { cardShuffle } from "./card-shuffle";
import { logoMarquee } from "./logo-marquee";
import { lineDraw } from "./line-draw";
import { marchingAnts } from "./marching-ants";
import { cornerBrackets } from "./corner-brackets";
import { blobMorph } from "./blob-morph";
import { grainOverlay } from "./grain-overlay";
import { spriteSheet } from "./sprite-sheet";
import { frostedGlass } from "./frosted-glass";
import { gradientBorder } from "./gradient-border";
import { pressFeedback } from "./press-feedback";
import { flipCard } from "./flip-card";
import { floatingLabel } from "./floating-label";
import { dropdownReveal } from "./dropdown-reveal";
import { menuToggle } from "./menu-toggle";
import { errorShake } from "./error-shake";
import { staggerGrid } from "./stagger-grid";
import { liquidFill } from "./liquid-fill";
import { bootSequence } from "./boot-sequence";
import { rubberBand } from "./rubber-band";
import { hintNudge } from "./hint-nudge";
import { pulseRing } from "./pulse-ring";
import { confettiBurst } from "./confetti-burst";
import { bounceIn } from "./bounce-in";
import { motionPath } from "./motion-path";
import { progressiveBlur } from "./progressive-blur";
import { blockReveal } from "./block-reveal";
import { equalizerBars } from "./equalizer-bars";
import { scrollScrub } from "./scroll-scrub";
import { ambientFloat } from "./ambient-float";
import { radialCarousel } from "./radial-carousel";
import { shadowPop } from "./shadow-pop";
import { headerHideOnScroll } from "./header-hide-on-scroll";
import { scanlines } from "./scanlines";
import { openingCrawl } from "./opening-crawl";
import { liquidDistortion } from "./liquid-distortion";
import { crtPowerOff } from "./crt-power-off";
import { pillExpand } from "./pill-expand";
import { rowExpand } from "./row-expand";
import { moireDrift } from "./moire-drift";
import { rackFocus } from "./rack-focus";
import { asciiEffect } from "./ascii-effect";
import { gooeyEffect } from "./gooey-effect";
import { dvdBounce } from "./dvd-bounce";
import { flickerOn } from "./flicker-on";
import { dockMagnify } from "./dock-magnify";
import { storyProgress } from "./story-progress";
import { flyToCart } from "./fly-to-cart";
import { godRays } from "./god-rays";
import { quadtreeReveal } from "./quadtree-reveal";

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
  shadowPop,
  rowExpand,
  dockMagnify,
  scrollFadeIn,
  perspectiveReveal,
  parallax,
  scrollProgress,
  velocitySkew,
  textHighlight,
  scrollZoom,
  stickyPin,
  scrollScrub,
  horizontalScroll,
  scrollSnap,
  sectionColorSwap,
  scrollSpy,
  stackingCards,
  smoothScroll,
  headerShrink,
  headerHideOnScroll,
  headerInvert,
  footerReveal,
  scrollMarquee,
  progressiveBlur,
  rubberBand,
  splitTextReveal,
  blockReveal,
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
  openingCrawl,
  curtainWipe,
  crossfade,
  circleReveal,
  menuReveal,
  shutterTransition,
  crtPowerOff,
  zoomThrough,
  splitScreen,
  sharedElement,
  imageZoomHover,
  clipReveal,
  kenBurns,
  duotoneHover,
  imageParallaxHover,
  blurLoad,
  rackFocus,
  beforeAfter,
  mosaicReveal,
  quadtreeReveal,
  lightbox,
  carousel,
  dragScroll,
  cardShuffle,
  logoMarquee,
  lineDraw,
  marchingAnts,
  cornerBrackets,
  blobMorph,
  grainOverlay,
  scanlines,
  moireDrift,
  godRays,
  liquidDistortion,
  asciiEffect,
  spriteSheet,
  frostedGlass,
  gradientBorder,
  accordion,
  tabIndicator,
  gooeyEffect,
  stepper,
  storyProgress,
  radialCarousel,
  modalPop,
  bounceIn,
  drawerSlide,
  toastSlide,
  tooltipPop,
  pillExpand,
  toggleSwitch,
  equalizerBars,
  rippleTap,
  pressFeedback,
  confettiBurst,
  flyToCart,
  flipCard,
  floatingLabel,
  dropdownReveal,
  menuToggle,
  errorShake,
  hintNudge,
  pulseRing,
  ambientFloat,
  flickerOn,
  dvdBounce,
  preloaderCounter,
  skeletonShimmer,
  loadingBar,
  spinnerRing,
  dotsPulse,
  circularProgress,
  staggerGrid,
  motionPath,
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
