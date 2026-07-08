import type { MotionEntry } from "@/lib/types";
import { magneticHover } from "./magnetic-hover";
import { customCursor } from "./custom-cursor";
import { tilt } from "./tilt";
import { textScramble } from "./text-scramble";
import { underlineReveal } from "./underline-reveal";
import { spotlightHover } from "./spotlight-hover";
import { scrollFadeIn } from "./scroll-fade-in";
import { parallax } from "./parallax";
import { scrollProgress } from "./scroll-progress";
import { velocitySkew } from "./velocity-skew";
import { splitTextReveal } from "./split-text-reveal";
import { typewriter } from "./typewriter";
import { counter } from "./counter";
import { marquee } from "./marquee";
import { curtainWipe } from "./curtain-wipe";
import { crossfade } from "./crossfade";
import { imageZoomHover } from "./image-zoom-hover";
import { clipReveal } from "./clip-reveal";

// 掲載順(カテゴリ順=hover→scroll→text→transition→media)
const all: MotionEntry[] = [
  magneticHover,
  customCursor,
  tilt,
  textScramble,
  underlineReveal,
  spotlightHover,
  scrollFadeIn,
  parallax,
  scrollProgress,
  velocitySkew,
  splitTextReveal,
  typewriter,
  counter,
  marquee,
  curtainWipe,
  crossfade,
  imageZoomHover,
  clipReveal,
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
