import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { ParamValues } from "@/lib/types";

export type DemoComponent = ComponentType<{ params: ParamValues }>;

// 読み込みの一瞬もステージの高さを保ち、レイアウトシフトを防ぐ
function StagePlaceholder() {
  return (
    <div
      style={{
        height: 320,
        background: "var(--sumi)",
        borderRadius: "var(--radius)",
      }}
    />
  );
}

// デモは項目ごとに別chunkへ分割する。全デモを1バンドルに束ねると
// 項目数に比例してページJSが太るため、登録は必ず d(() => import(...)) で行う。
const d = (loader: () => Promise<{ default: DemoComponent }>): DemoComponent =>
  dynamic(loader, { loading: StagePlaceholder });

// デモ実装だけが項目ごとに固有。slug→デモの対応表。
export const demoRegistry: Record<string, DemoComponent> = {
  "magnetic-hover": d(() => import("./MagneticHover")),
  "custom-cursor": d(() => import("./CustomCursor")),
  tilt: d(() => import("./Tilt")),
  "text-scramble": d(() => import("./TextScramble")),
  "underline-reveal": d(() => import("./UnderlineReveal")),
  "spotlight-hover": d(() => import("./SpotlightHover")),
  "fill-hover": d(() => import("./FillHover")),
  "directional-hover": d(() => import("./DirectionalHover")),
  "lift-hover": d(() => import("./LiftHover")),
  "focus-dim": d(() => import("./FocusDim")),
  "scroll-fade-in": d(() => import("./ScrollFadeIn")),
  "perspective-reveal": d(() => import("./PerspectiveReveal")),
  parallax: d(() => import("./Parallax")),
  "scroll-progress": d(() => import("./ScrollProgress")),
  "velocity-skew": d(() => import("./VelocitySkew")),
  "text-highlight": d(() => import("./TextHighlight")),
  "scroll-zoom": d(() => import("./ScrollZoom")),
  "split-text-reveal": d(() => import("./SplitTextReveal")),
  typewriter: d(() => import("./Typewriter")),
  counter: d(() => import("./Counter")),
  marquee: d(() => import("./Marquee")),
  "blur-reveal": d(() => import("./BlurReveal")),
  "wave-text": d(() => import("./WaveText")),
  "curtain-wipe": d(() => import("./CurtainWipe")),
  crossfade: d(() => import("./Crossfade")),
  "circle-reveal": d(() => import("./CircleReveal")),
  "menu-reveal": d(() => import("./MenuReveal")),
  "image-zoom-hover": d(() => import("./ImageZoomHover")),
  "clip-reveal": d(() => import("./ClipReveal")),
  "ken-burns": d(() => import("./KenBurns")),
  "duotone-hover": d(() => import("./DuotoneHover")),
  "border-draw": d(() => import("./BorderDraw")),
  "image-trail": d(() => import("./ImageTrail")),
  "glitch-hover": d(() => import("./GlitchHover")),
  "text-slide-swap": d(() => import("./TextSlideSwap")),
  "sticky-pin": d(() => import("./StickyPin")),
  "horizontal-scroll": d(() => import("./HorizontalScroll")),
  "scroll-snap": d(() => import("./ScrollSnap")),
  "section-color-swap": d(() => import("./SectionColorSwap")),
  "word-rotate": d(() => import("./WordRotate")),
  "outline-fill": d(() => import("./OutlineFill")),
  "gradient-shine": d(() => import("./GradientShine")),
  "number-roll": d(() => import("./NumberRoll")),
  "shutter-transition": d(() => import("./ShutterTransition")),
  "zoom-through": d(() => import("./ZoomThrough")),
  "image-parallax-hover": d(() => import("./ImageParallaxHover")),
  "blur-load": d(() => import("./BlurLoad")),
  "before-after": d(() => import("./BeforeAfter")),
  "mosaic-reveal": d(() => import("./MosaicReveal")),
  "frosted-glass": d(() => import("./FrostedGlass")),
  accordion: d(() => import("./Accordion")),
  "tab-indicator": d(() => import("./TabIndicator")),
  stepper: d(() => import("./Stepper")),
  "modal-pop": d(() => import("./ModalPop")),
  "drawer-slide": d(() => import("./DrawerSlide")),
  "toast-slide": d(() => import("./ToastSlide")),
  "tooltip-pop": d(() => import("./TooltipPop")),
  "toggle-switch": d(() => import("./ToggleSwitch")),
  "ripple-tap": d(() => import("./RippleTap")),
  "preloader-counter": d(() => import("./PreloaderCounter")),
  "skeleton-shimmer": d(() => import("./SkeletonShimmer")),
  "loading-bar": d(() => import("./LoadingBar")),
  "spinner-ring": d(() => import("./SpinnerRing")),
  "dots-pulse": d(() => import("./DotsPulse")),
  "circular-progress": d(() => import("./CircularProgress")),
  "hover-preview": d(() => import("./HoverPreview")),
  "hover-wave": d(() => import("./HoverWave")),
  "image-swap-hover": d(() => import("./ImageSwapHover")),
  "mouse-parallax": d(() => import("./MouseParallax")),
  "scroll-spy": d(() => import("./ScrollSpy")),
  "stacking-cards": d(() => import("./StackingCards")),
  "smooth-scroll": d(() => import("./SmoothScroll")),
  "header-shrink": d(() => import("./HeaderShrink")),
  "footer-reveal": d(() => import("./FooterReveal")),
  "scroll-marquee": d(() => import("./ScrollMarquee")),
  "tracking-in": d(() => import("./TrackingIn")),
  "text-flip": d(() => import("./TextFlip")),
  "marker-line": d(() => import("./MarkerLine")),
  "rotating-badge": d(() => import("./RotatingBadge")),
  "split-screen": d(() => import("./SplitScreen")),
  "shared-element": d(() => import("./SharedElement")),
  lightbox: d(() => import("./Lightbox")),
  carousel: d(() => import("./Carousel")),
  "card-shuffle": d(() => import("./CardShuffle")),
  "logo-marquee": d(() => import("./LogoMarquee")),
  "line-draw": d(() => import("./LineDraw")),
  "blob-morph": d(() => import("./BlobMorph")),
  "grain-overlay": d(() => import("./GrainOverlay")),
  "press-feedback": d(() => import("./PressFeedback")),
  "flip-card": d(() => import("./FlipCard")),
  "floating-label": d(() => import("./FloatingLabel")),
  "dropdown-reveal": d(() => import("./DropdownReveal")),
  "menu-toggle": d(() => import("./MenuToggle")),
  "error-shake": d(() => import("./ErrorShake")),
  "stagger-grid": d(() => import("./StaggerGrid")),
  "liquid-fill": d(() => import("./LiquidFill")),
  "boot-sequence": d(() => import("./BootSequence")),
};
