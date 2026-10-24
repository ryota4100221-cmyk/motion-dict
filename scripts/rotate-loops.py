# ループ動画を「ポスターの時刻（見せ場）」から始まるように回す。ポスターも同じ瞬間の1枚目から作り直す（1440幅）。
# 一覧ではポスター→ホバーで動画、の切り替えで0秒の地味な状態へ巻き戻って見えていた（独立レビュー4）。
# 台本は「始まりと終わりが同じ状態」で撮っているので、[見せ場→終わり]+[始まり→見せ場] で繋いでも継ぎ目は元の切れ目と同じ。
# 使い方: python3 scripts/rotate-loops.py [slug ...]（無指定で全件）。meta/<slug>.json の posterAt を 0 に、rotatedFrom に元の値を残す。
import json, os, subprocess, sys, glob
ROOT = os.environ.get("MD_V2_OUT") or os.path.join(os.path.dirname(__file__), "..", "public", "v2")
slugs = sys.argv[1:] or [os.path.basename(p)[:-4] for p in sorted(glob.glob(os.path.join(ROOT, "videos", "*.mp4")))]
for s in slugs:
    mp = os.path.join(ROOT, "meta", f"{s}.json")
    meta = json.load(open(mp)) if os.path.exists(mp) else {}
    at = float(meta.get("posterAt", 0))
    v = os.path.join(ROOT, "videos", f"{s}.mp4")
    tmp = v + ".rot.mp4"
    if at > 0.05 and "rotatedFrom" not in meta:
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", v, "-filter_complex",
            f"[0:v]trim=start={at},setpts=PTS-STARTPTS[a];[0:v]trim=end={at},setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1[o]",
            "-map", "[o]", "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", tmp], check=True)
        os.replace(tmp, v)
        meta["rotatedFrom"] = at
    meta["posterAt"] = 0
    json.dump(meta, open(mp, "w"))
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", v, "-frames:v", "1", "-q:v", "3", os.path.join(ROOT, "posters", f"{s}.jpg")], check=True)
print("rotated", len(slugs))
