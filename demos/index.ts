import type { ComponentType } from "react";
import type { ParamValues } from "@/lib/types";
import MagneticHover from "./MagneticHover";
import CustomCursor from "./CustomCursor";
import Tilt from "./Tilt";
import TextScramble from "./TextScramble";
import UnderlineReveal from "./UnderlineReveal";
import SpotlightHover from "./SpotlightHover";
import ScrollFadeIn from "./ScrollFadeIn";
import Parallax from "./Parallax";
import ScrollProgress from "./ScrollProgress";
import VelocitySkew from "./VelocitySkew";
import SplitTextReveal from "./SplitTextReveal";
import Typewriter from "./Typewriter";
import Counter from "./Counter";
import Marquee from "./Marquee";
import CurtainWipe from "./CurtainWipe";
import Crossfade from "./Crossfade";
import ImageZoomHover from "./ImageZoomHover";
import ClipReveal from "./ClipReveal";

export type DemoComponent = ComponentType<{ params: ParamValues }>;

// デモ実装だけが項目ごとに固有。slug→デモの対応表。
export const demoRegistry: Record<string, DemoComponent> = {
  "magnetic-hover": MagneticHover,
  "custom-cursor": CustomCursor,
  tilt: Tilt,
  "text-scramble": TextScramble,
  "underline-reveal": UnderlineReveal,
  "spotlight-hover": SpotlightHover,
  "scroll-fade-in": ScrollFadeIn,
  parallax: Parallax,
  "scroll-progress": ScrollProgress,
  "velocity-skew": VelocitySkew,
  "split-text-reveal": SplitTextReveal,
  typewriter: Typewriter,
  counter: Counter,
  marquee: Marquee,
  "curtain-wipe": CurtainWipe,
  crossfade: Crossfade,
  "image-zoom-hover": ImageZoomHover,
  "clip-reveal": ClipReveal,
};
