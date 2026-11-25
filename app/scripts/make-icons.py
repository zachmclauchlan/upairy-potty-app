"""Builds the UpAiry wordmark images (splash, notification icon, in-app logos) from assets/brand/upairy-wordmark.png.
Run: python scripts/make-icons.py   (from the app folder)

The app icon itself is NOT made here. icon.png, android-icon-foreground.png, android-icon-monochrome.png and
favicon.png are screenshots of assets/brand/app-icon.html (the "Potty Up" lettering with a sticker star, on light
green), and android-icon-background.png is that same light green, #CFEAC4."""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
A = ROOT / "assets"
GREEN = (62, 127, 51, 255)      # #3E7F33, the app's brand green
CREAM = (245, 244, 239, 255)    # #F5F4EF, the app background

src = Image.open(A / "brand" / "upairy-wordmark.png").convert("L")
# Dark ink becomes opaque, white paper becomes transparent.
alpha = ImageOps.invert(src).point(lambda v: 255 if v > 140 else int(v * 255 / 140))
box = alpha.getbbox()
mark = alpha.crop(box)


def ink(color, a=mark):
    out = Image.new("RGBA", a.size, color[:3] + (0,))
    out.putalpha(a)
    return out


def place(canvas, layer, width_frac, y_frac=0.5):
    w = int(canvas.width * width_frac)
    h = int(layer.height * w / layer.width)
    layer = layer.resize((w, h), Image.LANCZOS)
    canvas.alpha_composite(layer, ((canvas.width - w) // 2, int(canvas.height * y_frac - h / 2)))
    return canvas


white = ink((255, 255, 255, 255))
green = ink(GREEN)

# Splash: green wordmark on the cream background (background colour set in app.json)
place(Image.new("RGBA", (1024, 1024), (0, 0, 0, 0)), green, 0.72).save(A / "splash-icon.png")

# The first letter "U" alone, for tiny icons where the full word can't be read
cols = [x for x in range(mark.width) if any(mark.getpixel((x, y)) > 128 for y in range(mark.height))]
gap = next(x for x in range(cols[0] + 10, mark.width) if x not in set(cols))
u = mark.crop((0, 0, gap, mark.height))
u = u.crop(u.getbbox())
# Android notification icon: white on transparent, 96px
place(Image.new("RGBA", (96, 96), (0, 0, 0, 0)), ink((255, 255, 255, 255), u), 0.6).save(A / "notification-icon.png")
# In-app logo: the wordmark cropped tight on a transparent background, in black, white and brand green
for name, color in (("logo-black", (22, 24, 27, 255)), ("logo-white", (255, 255, 255, 255)), ("logo-green", GREEN)):
    m = ink(color)
    m = m.resize((m.width * 2, m.height * 2), Image.LANCZOS)  # 2x for sharp phone screens
    m.save(A / "brand" / f"{name}.png")
print("icons written to", A)
