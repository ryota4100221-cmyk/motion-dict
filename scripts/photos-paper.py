# デモ用の写真（public/demo/photo-01〜18.jpg）を「紙と活字」の題材で作り直す（2026-10-25 r7）。
# 使い方: python3 scripts/photos-paper.py [取得元の保存先ディレクトリ]
#   1) Unsplash の写真を Lorem Picsum 経由で原寸取得（picsum は Unsplash License の写真だけを配っている。出典 URL は PHOTO_CREDITS.md）
#   2) 1600×1000（16:10）に切り出し（fy = 縦の注視点 0〜1）
#   3) 粒子のあるモノクロに処理：
#      ・輝度だけを使う（R=G=B。色は一切残さない＝ライムは印だけ、写真に色を付けない）
#      ・0.4% / 99.6% で黒と白を拾い直し、黒の底を #0E0E0E（近黒 #0A0A0A より一段だけ上＝写真の黒がUIの黒と溶けない）、
#        紙の白の天井を #EBEBEB（無彩色。生成り #F4F4F1 に寄せない＝暖色に転ばない）に置く
#      ・ゆるいS字（中間調はそのまま、肩と足だけ締める）
#      ・細かい粒子：σ=6.5 の輝度ノイズを 0.55px だけ馴染ませる。中間調に強く、黒と白の端では弱く（フィルムの粒の乗り方）
#   乱数は写真ごとに固定（再実行で同じ粒になる）
import os, sys, urllib.request
import numpy as np
from PIL import Image, ImageFilter

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(REPO, "public", "demo")
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join("/tmp", "md-photos-src")
W, H = 1600, 1000

# (photo番号, picsum id, 縦の注視点, 横の注視点)
MANIFEST = [
    (1, 1073, 0.5, 0.5),   # 本のページを壁一面に貼った面（全面テクスチャ）
    (2, 24, 0.5, 0.5),     # 開いた本
    (3, 403, 0.5, 0.5),    # タイプライターの活字キー
    (4, 526, 0.5, 0.5),    # 木活字のアンパサンドと印刷物
    (5, 444, 0.5, 0.5),    # 螺旋の書架
    (6, 486, 0.52, 0.5),   # 紙を噛ませたタイプライター（白地）
    (7, 252, 0.5, 0.5),    # 分解したタイプライターの部品（白地）
    (8, 998, 0.5, 0.5),    # 紐で束ねた紙束とペン・インク壺
    (9, 464, 0.5, 0.5),    # 開いた冊子（作品集）
    (10, 885, 0.5, 0.5),   # タイプライターとノートの卓上
    (11, 533, 0.5, 0.5),   # 並べた鉛筆と刷りの看板
    (12, 534, 0.5, 0.5),   # 定規とノート
    (13, 802, 0.5, 0.5),   # 製図用紙と分度器
    (14, 832, 0.42, 0.5),  # 本を読む人
    (15, 882, 0.5, 0.5),   # 雑誌を開く手（真上から）
    (16, 528, 0.5, 0.5),   # 活版刷りの表紙のノート
    (17, 527, 0.5, 0.5),   # 製図用コンパス
    (18, 4, 0.6, 0.5),     # ノートに書く手
]

LO, HI = 14, 235  # 黒の底 #0E0E0E / 紙の白の天井 #EBEBEB


def fetch(pid: int) -> str:
    os.makedirs(SRC, exist_ok=True)
    p = os.path.join(SRC, f"{pid}.jpg")
    if not os.path.exists(p):
        import json
        info = json.load(urllib.request.urlopen(f"https://picsum.photos/id/{pid}/info"))
        urllib.request.urlretrieve(f"https://picsum.photos/id/{pid}/{info['width']}/{info['height']}", p)
    return p


def crop(im: Image.Image, fy: float, fx: float) -> Image.Image:
    w, h = im.size
    if w / h > W / H:
        cw, ch = round(h * W / H), h
    else:
        cw, ch = w, round(w * H / W)
    x = min(max(0, round(fx * w - cw / 2)), w - cw)
    y = min(max(0, round(fy * h - ch / 2)), h - ch)
    return im.crop((x, y, x + cw, y + ch)).resize((W, H), Image.LANCZOS)


def process(n: int, pid: int, fy: float, fx: float) -> None:
    im = Image.open(fetch(pid)).convert("RGB")
    im = crop(im, fy, fx)
    a = np.asarray(im).astype(np.float32) / 255.0
    lin = np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)
    y = 0.2126 * lin[..., 0] + 0.7152 * lin[..., 1] + 0.0722 * lin[..., 2]
    L = np.where(y <= 0.0031308, 12.92 * y, 1.055 * np.power(y, 1 / 2.4) - 0.055)
    lo, hi = np.percentile(L, 0.4), np.percentile(L, 99.6)
    x = np.clip((L - lo) / max(1e-3, hi - lo), 0, 1)
    s = x * x * (3 - 2 * x)
    x = x + 0.35 * (s - x)  # ゆるいS字
    v = LO + (HI - LO) * x
    rng = np.random.default_rng(1000 + n)
    noise = rng.normal(0, 6.5, size=v.shape).astype(np.float32)
    nimg = Image.fromarray(np.clip(noise * 8 + 128, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.55))
    noise = (np.asarray(nimg).astype(np.float32) - 128) / 8 * 1.6
    weight = 0.35 + 0.65 * (4 * x * (1 - x))  # 中間調に強く
    v = np.clip(v + noise * weight, 0, 255).astype(np.uint8)
    out = Image.fromarray(v).convert("RGB")
    out.save(os.path.join(OUT, f"photo-{n:02d}.jpg"), quality=80, optimize=True, progressive=True)


if __name__ == "__main__":
    for row in MANIFEST:
        process(*row)
        print("ok", f"photo-{row[0]:02d}.jpg", row[1])
