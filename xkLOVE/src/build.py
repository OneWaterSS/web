import base64, glob, os, re, sys

ROOT = r"C:\Users\JT\Desktop\LOVE"
IMG_DIR = os.path.join(ROOT, "img")
TPL = os.path.join(ROOT, "src", "template.html")
OUT_DIR = os.path.join(ROOT, "site")
OUT = os.path.join(OUT_DIR, "index.html")

# 照片编号 -> 占位符
WANT = {
    167: "IMG_MOON",    # 月亮夜景
    169: "IMG_SHADOW",  # 两个人的影子
    150: "IMG_HEART",   # 双手比心
    152: "IMG_TICKET",  # 电影票根
    159: "IMG_LETTER",  # 手写信 · 第一页
    180: "IMG_LETTER2", # 手写信 · 第二页
}

found = {}
for path in glob.glob(os.path.join(IMG_DIR, "*.jpg")):
    m = re.search(r"_(\d+)_\d+\.jpg$", os.path.basename(path))
    if not m:
        continue
    idx = int(m.group(1))
    if idx in WANT:
        with open(path, "rb") as f:
            raw = f.read()
        found[idx] = "data:image/jpeg;base64," + base64.b64encode(raw).decode()

missing = [k for k in WANT if k not in found]
if missing:
    print("MISSING:", missing)
    sys.exit(1)

with open(TPL, "r", encoding="utf-8") as f:
    html = f.read()

for idx, key in WANT.items():
    ph = "{{%s}}" % key
    if ph not in html:
        print("PLACEHOLDER NOT FOUND:", ph)
        sys.exit(1)
    html = html.replace(ph, found[idx])

os.makedirs(OUT_DIR, exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(html)

size = os.path.getsize(OUT)
print("built:", OUT)
print("size: %.2f MB" % (size / 1024 / 1024))
for idx, key in sorted(WANT.items()):
    print("  %s <- #%d  (%.0f KB)" % (key, idx, len(found[idx]) * 0.75 / 1024))
