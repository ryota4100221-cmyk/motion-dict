import type { ComponentType } from "react";
import type { ParamValues } from "@/lib/types";
import MagneticHover from "./MagneticHover";
import CustomCursor from "./CustomCursor";
import Tilt from "./Tilt";
import TextScramble from "./TextScramble";
import UnderlineReveal from "./UnderlineReveal";
import SpotlightHover from "./SpotlightHover";
import FillHover from "./FillHover";
import LiftHover from "./LiftHover";
import ScrollFadeIn from "./ScrollFadeIn";
import Parallax from "./Parallax";
import ScrollProgress from "./ScrollProgress";
import VelocitySkew from "./VelocitySkew";
import TextHighlight from "./TextHighlight";
import ScrollZoom from "./ScrollZoom";
import SplitTextReveal from "./SplitTextReveal";
import Typewriter from "./Typewriter";
import Counter from "./Counter";
import Marquee from "./Marquee";
import BlurReveal from "./BlurReveal";
import WaveText from "./WaveText";
import CurtainWipe from "./CurtainWipe";
import Crossfade from "./Crossfade";
import CircleReveal from "./CircleReveal";
import MenuReveal from "./MenuReveal";
import ImageZoomHover from "./ImageZoomHover";
import ClipReveal from "./ClipReveal";
import KenBurns from "./KenBurns";
import DuotoneHover from "./DuotoneHover";

export type DemoComponent = ComponentType<{ params: ParamValues }>;

// デモ実装だけが項目ごとに固有。slug→デモの対応表。
export const demoRegistry: Record<string, DemoComponent> = {
  "magnetic-hover": MagneticHover,
  "custom-cursor": CustomCursor,
  tilt: Tilt,
  "text-scramble": TextScramble,
  "underline-reveal": UnderlineReveal,
  "spotlight-hover": SpotlightHover,
  "fill-hover": FillHover,
  "lift-hover": LiftHover,
  "scroll-fade-in": ScrollFadeIn,
  parallax: Parallax,
  "scroll-progress": ScrollProgress,
  "velocity-skew": VelocitySkew,
  "text-highlight": TextHighlight,
  "scroll-zoom": ScrollZoom,
  "split-text-reveal": SplitTextReveal,
  typewriter: Typewriter,
  counter: Counter,
  marquee: Marquee,
  "blur-reveal": BlurReveal,
  "wave-text": WaveText,
  "curtain-wipe": CurtainWipe,
  crossfade: Crossfade,
  "circle-reveal": CircleReveal,
  "menu-reveal": MenuReveal,
  "image-zoom-hover": ImageZoomHover,
  "clip-reveal": ClipReveal,
  "ken-burns": KenBurns,
  "duotone-hover": DuotoneHover,
};
