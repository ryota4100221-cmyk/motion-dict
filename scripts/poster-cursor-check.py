# ポスターに録画用の擬似カーソル（#__pw_cursor）が焼き込まれていないかを機械で調べる（2026-10-25 r7）。
# 使い方: python3 scripts/poster-cursor-check.py <poster.jpg ...>   （ディレクトリを渡すと中の *.jpg 全部）
# 擬似カーソル＝直径14px（録画は DPR2 で 28px）の白い円＋1.5pxの墨の縁。
#   ① 半径 r_in の円の内側がすべて白（各チャンネル 236 以上）
#   ② 半径 ≈15px（×DPR）の輪の上が暗い（平均輝度 < 150 かつ 32方位の 8割以上が < 170）
#   を両方満たす点を「白丸」として数える。白い紙の面は②で、白い文字は①で落ちる。
# 出力: 1行1ファイル「hits 件数 x,y …」。最後に合計。白丸が1件でもあれば終了コード1。
import sys, os, glob
import numpy as np
from PIL import Image

def box_sum(a, r):
    c = np.pad(a, ((1, 0), (1, 0))).cumsum(0).cumsum(1)
    k = 2 * r + 1
    out = np.zeros_like(a, dtype=np.int64)
    s = c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]
    out[r:r + s.shape[0], r:r + s.shape[1]] = s
    return out

def detect(path):
    im = Image.open(path).convert("RGB")
    s = im.width / 1440.0  # 1440幅＝DPR2 の等倍
    a = np.asarray(im).astype(np.int16)
    lum = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])
    white = (a.min(axis=2) >= 236).astype(np.int64)
    r_in = max(2, int(round(8 * s)))  # 半径8px(×DPR)の正方形が真っ白
    full = (2 * r_in + 1) ** 2
    cand = np.argwhere(box_sum(white, r_in) == full)
    hits = []
    R = 15.0 * s
    ang = np.linspace(0, 2 * np.pi, 32, endpoint=False)
    H, W = lum.shape
    for y, x in cand[:: max(1, len(cand) // 20000 + 1)]:
        ys = np.clip(np.round(y + np.sin(ang) * R).astype(int), 0, H - 1)
        xs = np.clip(np.round(x + np.cos(ang) * R).astype(int), 0, W - 1)
        ring = lum[ys, xs]
        if ring.mean() < 150 and (ring < 170).mean() >= 0.8:
            if all(abs(y - hy) > 20 * s or abs(x - hx) > 20 * s for hy, hx in hits):
                hits.append((int(y), int(x)))
    return hits

if __name__ == "__main__":
    files = []
    for p in sys.argv[1:]:
        files += sorted(glob.glob(os.path.join(p, "*.jpg"))) if os.path.isdir(p) else [p]
    total = 0
    for f in files:
        h = detect(f)
        total += 1 if h else 0
        if h:
            print(f"hits {len(h)} {os.path.basename(f)} " + " ".join(f"{x},{y}" for y, x in h))
    print(f"checked {len(files)} posters / with white dot: {total}")
    sys.exit(1 if total else 0)
