# ポスター全件のコンタクトシート（目で見比べる用）。
# 使い方: python3 scripts/poster-sheet.py <postersディレクトリ> <出力.jpg> [見出し]
# 並び順は public/entries.json（＝一覧の順）。擬似カーソルの白丸（poster-cursor-check.py と同じ判定）が出たコマは赤枠で囲む。
import sys, os, json, importlib.util
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("pcc", os.path.join(HERE, "poster-cursor-check.py"))
pcc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pcc)

src, out = sys.argv[1], sys.argv[2]
title = sys.argv[3] if len(sys.argv) > 3 else src
slugs = [e["slug"] for e in json.load(open(os.path.join(HERE, "..", "public", "entries.json")))]
cols, tw, th, lab = 14, 256, 144, 16
rows = (len(slugs) + cols - 1) // cols
head = 40
sheet = Image.new("RGB", (cols * tw, head + rows * (th + lab)), (244, 244, 241))
d = ImageDraw.Draw(sheet)
hits = 0
for i, s in enumerate(slugs):
    x, y = (i % cols) * tw, head + (i // cols) * (th + lab)
    p = os.path.join(src, f"{s}.jpg")
    if not os.path.exists(p):
        d.text((x + 4, y + 4), "missing", fill=(200, 0, 0))
        continue
    im = Image.open(p).convert("RGB")
    sc = tw / im.width
    dots = pcc.detect(p)
    t = im.resize((tw, th), Image.LANCZOS)
    sheet.paste(t, (x, y))
    if dots:
        hits += 1
        for (cy, cx) in dots:
            r = 12
            d.ellipse((x + cx * sc - r, y + cy * sc - r, x + cx * sc + r, y + cy * sc + r), outline=(230, 30, 30), width=3)
        d.rectangle((x, y, x + tw - 1, y + th - 1), outline=(230, 30, 30), width=3)
    d.text((x + 3, y + th + 2), f"{i + 1:03d} {s}", fill=(10, 10, 10))
d.text((10, 12), f"{title}   /   {len(slugs)} posters   /   white dot (pseudo cursor) detected: {hits}", fill=(10, 10, 10))
sheet.save(out, quality=82)
print(out, "white-dot:", hits)
