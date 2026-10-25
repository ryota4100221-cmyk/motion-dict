#!/usr/bin/env python3
# 一覧（framer/MotionDictionaryV2.tsx）がポスターから使う値を、ポスターそのものから作る（2026-10-26）。
#   lqip ＝ ポスターを 96×54（LANCZOS）に縮めた WebP（quality 35）の base64。本画像が来るまで .ph の下地に敷く
#   dim  ＝ 暗すぎるポスターの明るさ補正。平均輝度（L）< 20 のとき min(1.9, 205 / p99)。1.0 以下（補正なし）は 0
#           lqip にも同じ補正を焼き込む（下地と本画像の明るさをそろえる）
# 規則は今までの定数（PF_LQIP / PF_DIM・196件）と同じ。照合（2026-10-26）：dim は 197/197 一致、
# lqip は画素の平均差 2.2/255（p90 3.6・最大 7.0。定数は前のエンコーダ設定で作られていて、バイト列は一致しない）
#
# 使い方: python3 scripts/poster-derive.py [slug ...]   （無指定で public/v2/posters/*.jpg 全件）
# 出力:   public/v2/derived/<slug>.json  {"lqip": "...", "dim": 1.9, "poster": "<sha1 12桁>"}
#         poster は元にしたポスターのハッシュ。export-entries-json がポスターと食い違っていたら警告する
#         （ポスターを撮り直したのにこれを流し忘れると、下地だけ古い絵になる）
import base64, hashlib, io, json, os, sys
from PIL import Image
import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "v2")
POST = os.path.join(ROOT, "posters")
OUT = os.path.join(ROOT, "derived")
os.makedirs(OUT, exist_ok=True)


def derive(slug):
    p = os.path.join(POST, slug + ".jpg")
    raw = open(p, "rb").read()
    src = Image.open(io.BytesIO(raw)).convert("RGB")
    lum = np.asarray(src.convert("L"), dtype=np.float32)
    mean, p99 = float(lum.mean()), float(np.percentile(lum, 99))
    dim = 0.0
    if mean < 20:
        v = min(1.9, 205 / max(p99, 1.0))
        dim = round(v, 2) if v > 1.0 else 0.0
    sm = src.resize((96, 54), Image.LANCZOS)
    if dim:
        sm = Image.fromarray(np.clip(np.asarray(sm, dtype=np.float32) * dim, 0, 255).round().astype(np.uint8))
    buf = io.BytesIO()
    sm.save(buf, "WEBP", quality=35)
    d = {"lqip": base64.b64encode(buf.getvalue()).decode(), "dim": dim, "poster": hashlib.sha1(raw).hexdigest()[:12]}
    json.dump(d, open(os.path.join(OUT, slug + ".json"), "w"))
    return d


slugs = sys.argv[1:] or sorted(f[:-4] for f in os.listdir(POST) if f.endswith(".jpg"))
bad = 0
for s in slugs:
    try:
        d = derive(s)
        print(f"[derive] {s}: dim={d['dim']} lqip={len(d['lqip'])}字")
    except Exception as e:  # ポスターが無い等。毎朝の流れでは非致命（一覧は下地なしで出る）
        bad += 1
        print(f"[derive] {s}: FAIL {e}", file=sys.stderr)
print(f"[derive] {len(slugs) - bad}/{len(slugs)} -> public/v2/derived/")
sys.exit(1 if bad else 0)
