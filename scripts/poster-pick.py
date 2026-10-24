# 動画から「ポスターに使う時刻」を1つ選んで標準出力に出す。
# 使い方: python3 scripts/poster-pick.py <video.mp4>
# 10fps・幅160で全フレームを抜き、各フレームを
#   情報量(輝度の標準偏差) + 明るい画素の割合 + ライム(#A5E02E近傍)の割合 で採点し、最大の時刻を返す。
# 先頭と末尾の0.3sは除く（入り/抜けの途中は絵にならない）。
import subprocess, sys, tempfile, os, glob
from PIL import Image, ImageStat

src = sys.argv[1]
d = tempfile.mkdtemp()
subprocess.run(["ffmpeg", "-loglevel", "error", "-i", src, "-vf", "fps=10,scale=160:-1", os.path.join(d, "%05d.png")], check=True)
fs = sorted(glob.glob(os.path.join(d, "*.png")))
best, bt = -1, 0.0
n = len(fs)
for i, f in enumerate(fs):
    t = i / 10.0
    if n > 8 and (t < 0.3 or t > (n - 3) / 10.0):
        continue
    im = Image.open(f).convert("RGB")
    g = im.convert("L")
    sd = ImageStat.Stat(g).stddev[0]
    px = list(im.getdata())
    bright = sum(1 for (r, gg, b) in px if r + gg + b > 300) / len(px)
    lime = sum(1 for (r, gg, b) in px if gg > 150 and r > 110 and b < 110 and gg > r) / len(px)
    score = sd + 60 * bright + 120 * lime
    if score > best:
        best, bt = score, t
for f in fs:
    os.remove(f)
os.rmdir(d)
print(f"{bt:.2f}")
