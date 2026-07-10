import type { MotionEntry } from "@/lib/types";
import { magneticHover } from "./magnetic-hover";
import { customCursor } from "./custom-cursor";
import { tilt } from "./tilt";
import { textScramble } from "./text-scramble";
import { underlineReveal } from "./underline-reveal";
import { spotlightHover } from "./spotlight-hover";
import { fillHover } from "./fill-hover";
import { liftHover } from "./lift-hover";
import { borderDraw } from "./border-draw";
import { imageTrail } from "./image-trail";
import { glitchHover } from "./glitch-hover";
import { textSlideSwap } from "./text-slide-swap";
import { scrollFadeIn } from "./scroll-fade-in";
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
import { frostedGlass } from "./frosted-glass";
import { accordion } from "./accordion";
import { tabIndicator } from "./tab-indicator";
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

// 掲載順(カテゴリ順=hover→scroll→text→transition→media→ui→loading)
const all: MotionEntry[] = [
  magneticHover,
  customCursor,
  tilt,
  textScramble,
  underlineReveal,
  spotlightHover,
  fillHover,
  liftHover,
  borderDraw,
  imageTrail,
  glitchHover,
  textSlideSwap,
  scrollFadeIn,
  parallax,
  scrollProgress,
  velocitySkew,
  textHighlight,
  scrollZoom,
  stickyPin,
  horizontalScroll,
  scrollSnap,
  sectionColorSwap,
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
  curtainWipe,
  crossfade,
  circleReveal,
  menuReveal,
  shutterTransition,
  zoomThrough,
  imageZoomHover,
  clipReveal,
  kenBurns,
  duotoneHover,
  imageParallaxHover,
  blurLoad,
  beforeAfter,
  mosaicReveal,
  frostedGlass,
  accordion,
  tabIndicator,
  modalPop,
  drawerSlide,
  toastSlide,
  tooltipPop,
  toggleSwitch,
  rippleTap,
  preloaderCounter,
  skeletonShimmer,
  loadingBar,
  spinnerRing,
  dotsPulse,
  circularProgress,
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
