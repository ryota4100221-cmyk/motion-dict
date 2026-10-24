// ライブデモの中で録画の台本（rec/<slug>.json）を再生する。
// 詳細ページでスライダーを動かしても、カーソルがスライダーの上にあるのでホバー型・クリック型のデモは
// 何も起きず「値を変えた結果」が見えなかった（独立レビュー3：16本中6本が操作後3秒間まったく静止）。
// そこで値が落ち着いたら、録画と同じ操作をページ内の合成イベントで流して見せる。
//
// 限界：合成イベントでは CSS の :hover は付かない（35デモがボタンの装飾に :hover を使っている）。
// 主役の動きは JS で駆動しているデモが大半なので、それで足りる。本物の操作が来たら即中断する。

type Pt = [number, number];
export type RecStep = {
  do: string;
  at?: Pt;
  sel?: string;
  dur?: number;
  ms?: number;
  r?: number;
  ry?: number;
  turns?: number;
  from?: Pt;
  to?: Pt;
  fromSel?: string;
  toSel?: string;
  pre?: number;
  dx?: number;
  dy?: number;
  times?: number;
  gap?: number;
  text?: string;
  delay?: number;
  key?: string;
};
export type RecSpec = { zoom?: number; cursor?: boolean; settle?: number; before?: RecStep[]; steps?: RecStep[] };

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function playSpec(spec: RecSpec, opts: { cursor?: boolean } = {}) {
  let aborted = false;
  const W = () => innerWidth;
  const H = () => innerHeight;
  const clamp = (p: Pt): Pt => [Math.min(W() - 1, Math.max(1, p[0])), Math.min(H() - 1, Math.max(1, p[1]))];
  const P = (p: Pt): Pt => [p[0] * W(), p[1] * H()];
  let cur: Pt = [W() * 0.5, H() - 1];
  let down = false;
  let lastEl: Element | null = null;

  // 疑似カーソル（白い点）
  const dot = document.createElement("div");
  dot.style.cssText =
    "position:fixed;left:0;top:0;width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 0 0 1.5px rgba(10,10,10,.75),0 2px 8px rgba(0,0,0,.45);pointer-events:none;z-index:2147483647;transform:translate(-50%,-50%);opacity:0;transition:opacity .15s";
  if (opts.cursor !== false && spec.cursor !== false) document.body.appendChild(dot);
  const put = (p: Pt) => {
    dot.style.left = p[0] + "px";
    dot.style.top = p[1] + "px";
  };

  const fire = (type: string, p: Pt, el?: Element | null, extra: Record<string, unknown> = {}) => {
    const target = el || document.elementFromPoint(p[0], p[1]) || document.body;
    const o = { clientX: p[0], clientY: p[1], bubbles: true, cancelable: true, composed: true, view: window, buttons: down ? 1 : 0, ...extra };
    if (type.startsWith("pointer")) {
      try {
        target.dispatchEvent(new PointerEvent(type, { ...o, pointerId: 1, pointerType: "mouse", isPrimary: true }));
      } catch {}
    } else target.dispatchEvent(new MouseEvent(type, o));
    return target;
  };
  // 下にある要素が変わったら over/out（React の onMouseEnter/Leave はこれで動く）
  const moveTo = (p: Pt) => {
    put(p);
    const el = document.elementFromPoint(p[0], p[1]);
    if (el !== lastEl) {
      if (lastEl) {
        fire("pointerout", p, lastEl, { relatedTarget: el });
        fire("mouseout", p, lastEl, { relatedTarget: el });
        fire("pointerleave", p, lastEl);
        fire("mouseleave", p, lastEl);
      }
      if (el) {
        fire("pointerover", p, el, { relatedTarget: lastEl });
        fire("mouseover", p, el, { relatedTarget: lastEl });
        fire("pointerenter", p, el);
        fire("mouseenter", p, el);
      }
      lastEl = el;
    }
    fire("pointermove", p, el);
    fire("mousemove", p, el);
  };

  const wait = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));
  const frames = (d: number, fn: (k: number) => void) =>
    new Promise<void>((res) => {
      const s = performance.now();
      const step = (now: number) => {
        if (aborted) return res();
        const k = Math.min(1, (now - s) / Math.max(1, d));
        fn(k);
        if (k < 1) requestAnimationFrame(step);
        else res();
      };
      requestAnimationFrame(step);
    });

  const find = (sel: string): Element | null => {
    let nth = 0;
    let s = sel;
    const m = s.match(/^(.*?)\s*>>\s*nth=(\d+)$/);
    if (m) {
      s = m[1];
      nth = Number(m[2]);
    }
    if (s.startsWith("text=")) {
      const t = s.slice(5).replace(/^["']|["']$/g, "");
      const all = Array.from(document.querySelectorAll("button, a, [role=button], span, div, p, li, label"));
      const hits = all.filter((e) => e.textContent?.trim() === t || (e.children.length === 0 && e.textContent?.includes(t)));
      return hits[nth] || null;
    }
    try {
      return document.querySelectorAll(s)[nth] || null;
    } catch {
      return null;
    }
  };
  const target = (s: RecStep): Pt => {
    if (s.sel) {
      const el = find(s.sel);
      if (el) {
        const r = el.getBoundingClientRect();
        return [r.left + r.width / 2, r.top + r.height / 2];
      }
    }
    if (s.at) return P(s.at);
    return [W() / 2, H() / 2];
  };
  const outside = (p: Pt) => p[0] < 0 || p[0] > W() || p[1] < 0 || p[1] > H();

  const glide = async (raw: Pt, d: number) => {
    const to = clamp(raw);
    if (!outside(raw)) dot.style.opacity = "1";
    const from = cur;
    await frames(d, (k) => {
      const e = ease(k);
      moveTo([from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e]);
    });
    cur = to;
    if (outside(raw)) {
      dot.style.opacity = "0";
      if (lastEl) {
        fire("pointerleave", to, lastEl);
        fire("mouseleave", to, lastEl);
        fire("mouseout", to, lastEl);
        lastEl = null;
      }
    }
  };
  const press = (p: Pt) => {
    down = true;
    fire("pointerdown", p);
    fire("mousedown", p);
  };
  const release = (p: Pt, click = true) => {
    down = false;
    const el = fire("pointerup", p);
    fire("mouseup", p);
    if (click) (el as HTMLElement).click?.();
  };
  const scroller = (p: Pt): Element => {
    let el: Element | null = document.elementFromPoint(p[0], p[1]);
    while (el && el !== document.body) {
      const cs = getComputedStyle(el);
      if (/(auto|scroll)/.test(cs.overflowY + cs.overflowX) && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)) return el;
      el = el.parentElement;
    }
    return document.scrollingElement || document.documentElement;
  };

  const run = async (steps: RecStep[]) => {
    for (const s of steps) {
      if (aborted) return;
      const d = s.do;
      if (d === "wait") await wait(s.ms || 500);
      else if (d === "move") await glide(target(s), s.dur || 600);
      else if (d === "leave") await glide(s.at ? P(s.at) : [W() * 0.5, H() * 1.15], s.dur || 500);
      else if (d === "orbit") {
        const c = target(s);
        const r = (s.r || 0.12) * W();
        const ry = s.ry || 0.7;
        const turns = s.turns || 1;
        await glide([c[0] + r, c[1]], 250);
        await frames(s.dur || 1600, (k) => {
          const t = k * Math.PI * 2 * turns;
          moveTo([c[0] + Math.cos(t) * r, c[1] + Math.sin(t) * r * ry]);
        });
      } else if (d === "click") {
        const c = target(s);
        await glide(c, s.dur || 450);
        press(c);
        await wait(90);
        release(c);
      } else if (d === "drag") {
        const a = s.fromSel ? target({ do: "", sel: s.fromSel }) : P(s.from || [0.3, 0.5]);
        const b = s.toSel ? target({ do: "", sel: s.toSel }) : P(s.to || [0.7, 0.5]);
        await glide(a, s.pre ?? 400);
        press(a);
        await glide(b, s.dur || 900);
        release(b, false);
      } else if (d === "wheel") {
        if (s.at || s.sel) await glide(target(s), 300);
        for (let i = 0; i < (s.times || 10) && !aborted; i++) {
          const el = scroller(cur);
          el.dispatchEvent(new WheelEvent("wheel", { deltaX: s.dx || 0, deltaY: s.dy || 60, clientX: cur[0], clientY: cur[1], bubbles: true, cancelable: true }));
          el.scrollBy({ left: s.dx || 0, top: s.dy || 60 });
          await wait(s.gap || 40);
        }
      } else if (d === "type") {
        const el = (s.sel ? find(s.sel) : document.activeElement) as HTMLInputElement | null;
        if (el && "value" in el) {
          el.focus();
          const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")?.set;
          for (const ch of s.text || "") {
            if (aborted) return;
            setter?.call(el, el.value + ch);
            el.dispatchEvent(new Event("input", { bubbles: true }));
            await wait(s.delay || 90);
          }
        }
      } else if (d === "clear") {
        const el = (s.sel ? find(s.sel) : null) as HTMLInputElement | null;
        if (el && "value" in el) {
          const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")?.set;
          setter?.call(el, "");
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
      } else if (d === "key") {
        const t = document.activeElement || document.body;
        t.dispatchEvent(new KeyboardEvent("keydown", { key: s.key, bubbles: true }));
        t.dispatchEvent(new KeyboardEvent("keyup", { key: s.key, bubbles: true }));
      }
    }
  };

  // 本物の操作が来たら止める（見ている人の手を優先）
  const stop = (e: Event) => {
    if (e.isTrusted) abort();
  };
  const abort = () => {
    aborted = true;
    dot.remove();
    removeEventListener("pointerdown", stop, true);
    removeEventListener("pointermove", stop, true);
    removeEventListener("wheel", stop, true);
    removeEventListener("keydown", stop, true);
  };
  addEventListener("pointerdown", stop, true);
  addEventListener("pointermove", stop, true);
  addEventListener("wheel", stop, true);
  addEventListener("keydown", stop, true);

  const done = (async () => {
    await run(spec.before || []);
    await run(spec.steps || []);
    await wait(300);
    abort();
  })();
  return { abort, done };
}
