// ページ内のrAFループを1本に統合するための購読モデル。
// 各デモは addTick で参加し、返り値の関数で離脱する。
type Tick = (time: number) => void;

const subscribers = new Set<Tick>();
let running = false;

function loop(time: number) {
  if (subscribers.size === 0) {
    running = false;
    return;
  }
  for (const fn of subscribers) fn(time);
  requestAnimationFrame(loop);
}

export function addTick(fn: Tick): () => void {
  subscribers.add(fn);
  if (!running) {
    running = true;
    requestAnimationFrame(loop);
  }
  return () => {
    subscribers.delete(fn);
  };
}
