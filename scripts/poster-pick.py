# 動画から「ポスターに使う時刻」を1つ選んで標準出力に出す。
# 使い方: python3 scripts/poster-pick.py <video.mp4>
# 10fps・幅320で全フレームを抜き、
#   ① 演出が止まっているコマだけを候補にする（前後のコマとの差が小さい＝静止して読める状態）
#      候補＝動きの量が「全体の下位25%」かつ「最小値＋0.6」以下。常に動き続けるデモ（marquee 等）でも、いちばん落ち着いたコマが残る
#   ② 候補の中で 情報量(輝度の標準偏差) + 明るい画素の割合 + ライム(#A5E02E近傍)の割合 が最大の時刻を返す
# 先頭と末尾の0.3sは除く（入り/抜けの途中は絵にならない）。
# 2026-10-25 r7：旧版は①が無く、文字が組み替わっている途中（text-scramble）や
#   ボタンの上に擬似カーソルが乗った瞬間（「Rep●ay」）を「情報量が多い」として選んでいた（独立レビュー）。
#   擬似カーソルはそもそも録画 v2 の「ポスター用の2本目」（カーソル無し）から選ぶので、ここでは扱わない。
import subprocess, sys, tempfile, os, glob
import numpy as np
from PIL import Image

src = sys.argv[1]
d = tempfile.mkdtemp()
subprocess.run(["ffmpeg", "-loglevel", "error", "-i", src, "-vf", "fps=10,scale=320:-1", os.path.join(d, "%05d.png")], check=True)
fs = sorted(glob.glob(os.path.join(d, "*.png")))
ims = [np.asarray(Image.open(f).convert("RGB")).astype(np.int16) for f in fs]
for f in fs:
    os.remove(f)
os.rmdir(d)
n = len(ims)
if n == 0:
    print("0.00")
    sys.exit(0)
lum = [im.mean(axis=2) for im in ims]
diff = [0.0] + [float(np.abs(lum[i] - lum[i - 1]).mean()) for i in range(1, n)]
motion = [max(diff[i], diff[i + 1] if i + 1 < n else diff[i]) for i in range(n)]
idx = [i for i in range(n) if not (n > 8 and (i / 10.0 < 0.3 or i > n - 3))] or list(range(n))
ms = sorted(motion[i] for i in idx)
thr = min(ms[max(0, int(len(ms) * 0.25) - 1)], ms[0] + 0.6)
cand = [i for i in idx if motion[i] <= thr + 1e-9]
best, bt = -1e9, idx[0]
for i in cand:
    im = ims[i]
    g = lum[i]
    sd = float(g.std())
    r, gg, b = im[..., 0], im[..., 1], im[..., 2]
    bright = float(((r + gg + b) > 300).mean())
    lime = float(((gg > 150) & (r > 110) & (b < 110) & (gg > r)).mean())
    score = sd + 60 * bright + 120 * lime
    if score > best:
        best, bt = score, i
print(f"{bt / 10.0:.2f}")
