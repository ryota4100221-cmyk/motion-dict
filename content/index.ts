import type { MotionEntry } from "@/lib/types";
import { magneticHover } from "./magnetic-hover";
import { customCursor } from "./custom-cursor";
import { tilt } from "./tilt";
import { textScramble } from "./text-scramble";
import { underlineReveal } from "./underline-reveal";
import { spotlightHover } from "./spotlight-hover";
import { fillHover } from "./fill-hover";
import { liftHover } from "./lift-hover";
import { scrollFadeIn } from "./scroll-fade-in";
import { parallax } from "./parallax";
import { scrollProgress } from "./scroll-progress";
import { velocitySkew } from "./velocity-skew";
import { textHighlight } from "./text-highlight";
import { scrollZoom } from "./scroll-zoom";
import { splitTextReveal } from "./split-text-reveal";
import { typewriter } from "./typewriter";
import { counter } from "./counter";
import { marquee } from "./marquee";
import { blurReveal } from "./blur-reveal";
import { waveText } from "./wave-text";
import { curtainWipe } from "./curtain-wipe";
import { crossfade } from "./crossfade";
import { circleReveal } from "./circle-reveal";
import { menuReveal } from "./menu-reveal";
import { imageZoomHover } from "./image-zoom-hover";
import { clipReveal } from "./clip-reveal";
import { kenBurns } from "./ken-burns";
import { duotoneHover } from "./duotone-hover";

// 掲載順(カテゴリ順=hover→scroll→text→transition→media)
const all: MotionEntry[] = [
  magneticHover,
  customCursor,
  tilt,
  textScramble,
  underlineReveal,
  spotlightHover,
  fillHover,
  liftHover,
  scrollFadeIn,
  parallax,
  scrollProgress,
  velocitySkew,
  textHighlight,
  scrollZoom,
  splitTextReveal,
  typewriter,
  counter,
  marquee,
  blurReveal,
  waveText,
  curtainWipe,
  crossfade,
  circleReveal,
  menuReveal,
  imageZoomHover,
  clipReveal,
  kenBurns,
  duotoneHover,
];

export const entries: Record<string, MotionEntry> = Object.fromEntries(
  all.map((e) => [e.slug, e])
);

export const entryList: MotionEntry[] = all;

// 未実装slugのRELATEDチップ表示用フォールバック(将来カテゴリの追加時に使う)
export const plannedNames: Record<string, string> = {};

export const categoryLabels: Record<MotionEntry["category"], string> = {
  hover: "HOVER",
  scroll: "SCROLL",
  text: "TEXT",
  transition: "TRANSITION",
  media: "MEDIA",
  webgl: "WEBGL",
};
