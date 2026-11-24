"""Builds every app icon from the UpAiry wordmark (assets/brand/upairy-wordmark.png).
Run: python scripts/make-icons.py   (from the app folder)"""
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

# iOS / general app icon: white wordmark on green
place(Image.new("RGBA", (1024, 1024), GREEN), white, 0.78).convert("RGB").save(A / "icon.png")
# Android adaptive icon layers: keep the mark inside the safe zone (about the middle 60%)
Image.new("RGBA", (512, 512), GREEN).save(A / "android-icon-background.png")
place(Image.new("RGBA", (512, 512), (0, 0, 0, 0)), white, 0.56).save(A / "android-icon-foreground.png")
place(Image.new("RGBA", (432, 432), (0, 0, 0, 0)), white, 0.56).save(A / "android-icon-monochrome.png")
# Splash: green wordmark on the cream background (background colour set in app.json)
place(Image.new("RGBA", (1024, 1024), (0, 0, 0, 0)), green, 0.72).save(A / "splash-icon.png")

# The first letter "U" alone, for tiny icons where the full word can't be read
cols = [x for x in range(mark.width) if any(mark.getpixel((x, y)) > 128 for y in range(mark.height))]
gap = next(x for x in range(cols[0] + 10, mark.width) if x not in set(cols))
u = mark.crop((0, 0, gap, mark.height))
u = u.crop(u.getbbox())
# Android notification icon: white on transparent, 96px
place(Image.new("RGBA", (96, 96), (0, 0, 0, 0)), ink((255, 255, 255, 255), u), 0.6).save(A / "notification-icon.png")
# Browser favicon: white U on green
place(Image.new("RGBA", (48, 48), GREEN), ink((255, 255, 255, 255), u), 0.55).save(A / "favicon.png")
print("icons written to", A)
