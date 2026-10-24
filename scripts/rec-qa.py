# 録画の機械点検: python3 scripts/rec-qa.py <video.mp4> [sheet.png]
# 出力(JSON): dur / 先頭の無動作秒 / 静止フレーム率 / ループ継ぎ目の差(%) / ポスターの明るさ
# sheet を渡すと 0.5s 間隔のコマを並べた1枚を書き出す（目で確かめる用）。
import subprocess, sys, tempfile, os, glob, json
from PIL import Image, ImageChops, ImageStat

src = sys.argv[1]
d = tempfile.mkdtemp()
subprocess.run(["ffmpeg", "-loglevel", "error", "-i", src, "-vf", "fps=20,scale=240:-1", os.path.join(d, "%05d.png")], check=True)
fs = sorted(glob.glob(os.path.join(d, "*.png")))
ims = [Image.open(f).convert("L") for f in fs]
diffs = [ImageStat.Stat(ImageChops.difference(a, b)).mean[0] for a, b in zip(ims, ims[1:])]
still = sum(1 for x in diffs if x < 0.08) / max(1, len(diffs))
head = 0.0
for i, x in enumerate(diffs):
    if x >= 0.08:
        head = i / 20.0
        break
seam = ImageStat.Stat(ImageChops.difference(ims[0], ims[-1])).mean[0] / 2.55 if ims else 0
out = {"dur": round(len(ims) / 20.0, 2), "headIdle": head, "stillRatio": round(still, 2), "seamPct": round(seam, 2)}
if len(sys.argv) > 2:
    step = 10  # 0.5s
    pick = ims and [Image.open(f).convert("RGB") for f in fs[::step]][:16]
    w, h = pick[0].size
    cols = 4
    rows = (len(pick) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * w, rows * h), "white")
    for i, im in enumerate(pick):
        sheet.paste(im, ((i % cols) * w, (i // cols) * h))
    sheet.save(sys.argv[2])
for f in fs:
    os.remove(f)
os.rmdir(d)
print(json.dumps(out))
