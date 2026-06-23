import numpy as np
from PIL import Image, ImageDraw, ImageFont
import os, math, sys

OUT = sys.argv[1] if len(sys.argv)>1 else "frames_out"
os.makedirs(OUT, exist_ok=True)
W, H = 360, 800
SS = 2                      # supersample factor
Wf, Hf = W*SS, H*SS
FPS = 30
DUR = 12.0
N = int(FPS*DUR)
FONT = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"

# ---- precompute coordinate grids (supersampled) ----
yy, xx = np.mgrid[0:Hf, 0:Wf].astype(np.float32)
nx = xx/Wf; ny = yy/Hf

# ---- palette of flowing color blobs (matches source: blue / gold / orange / red) ----
PAL = [
    (0.07,0.22,0.85),   # royal blue
    (0.02,0.10,0.45),   # deep navy
    (1.00,0.78,0.10),   # golden yellow
    (0.98,0.45,0.06),   # orange
    (0.85,0.16,0.10),   # red
    (0.20,0.40,0.95),   # bright blue
]
PAL = np.array(PAL, np.float32)

def hsl_to_rgb_arr(h,s,l):
    # vectorized hsl->rgb, inputs arrays 0..1
    def hue2(p,q,t):
        t = t % 1.0
        r = np.where(t<1/6, p+(q-p)*6*t,
            np.where(t<1/2, q,
            np.where(t<2/3, p+(q-p)*(2/3-t)*6, p)))
        return r
    q = np.where(l<0.5, l*(1+s), l+s-l*s)
    p = 2*l-q
    r = hue2(p,q,h+1/3); g = hue2(p,q,h); b = hue2(p,q,h-1/3)
    gray = l
    r = np.where(s<1e-6, gray, r); g = np.where(s<1e-6, gray, g); b = np.where(s<1e-6, gray, b)
    return np.stack([r,g,b],-1)

def rgb_to_hsl_arr(rgb):
    r,g,b = rgb[...,0],rgb[...,1],rgb[...,2]
    mx = np.max(rgb,-1); mn = np.min(rgb,-1); d = mx-mn
    l = (mx+mn)/2
    s = np.where(d<1e-6, 0.0, d/(1-np.abs(2*l-1)+1e-6))
    h = np.zeros_like(l)
    mask = d>1e-6
    rc = np.where(mx==r, ((g-b)/(d+1e-6))%6, 0)
    gc = np.where(mx==g, (b-r)/(d+1e-6)+2, 0)
    bc = np.where(mx==b, (r-g)/(d+1e-6)+4, 0)
    hh = np.where(mx==r, rc, np.where(mx==g, gc, bc))/6.0
    h = np.where(mask, hh%1.0, 0)
    return h,s,l

def background(t):
    # 4 large moving color fields, each slowly cycling through the vivid palette.
    # sharp falloff keeps each zone pure (blue / gold / orange / red) and blends
    # only along soft diagonal boundaries -> the flowing look of the source.
    acc = np.zeros((Hf,Wf,3), np.float32)
    wsum = np.zeros((Hf,Wf), np.float32)
    NP = len(PAL)
    centers = [
        (0.18+0.22*math.sin(t*0.40+0.0),   0.20+0.18*math.cos(t*0.31+1.0), 0.0),
        (0.85+0.16*math.sin(t*0.34+2.1),   0.28+0.20*math.cos(t*0.47+0.4), 1.7),
        (0.30+0.20*math.sin(t*0.27+3.4),   0.82+0.16*math.cos(t*0.38+2.7), 3.1),
        (0.78+0.18*math.sin(t*0.45+1.7),   0.80+0.16*math.cos(t*0.29+0.9), 4.5),
    ]
    rad = 0.42
    for i,(cx,cy,ph) in enumerate(centers):
        d2 = (nx-cx)**2 + (ny-cy)**2
        w = np.exp(-d2/(2*rad*rad)).astype(np.float32)
        w = w*w                                   # sharper -> purer zones
        f = (t*0.13 + ph) % NP                    # each field drifts through palette
        i0 = int(f) % NP; i1 = (i0+1) % NP; fr = f-int(f)
        col = PAL[i0]*(1-fr) + PAL[i1]*fr
        acc += w[...,None]*col[None,None,:]
        wsum += w
    rgb = acc/(wsum[...,None]+1e-6)
    h,s,l = rgb_to_hsl_arr(rgb)                    # boost saturation -> vivid zones
    rgb = hsl_to_rgb_arr(h, np.clip(s*1.35+0.05,0,1), np.clip(l*0.97+0.02,0,1))
    rgb = np.clip(rgb*(0.94+0.12*ny[...,None]), 0, 1)
    return rgb.astype(np.float32)

def luminance(rgb):
    return (0.2126*rgb[...,0]+0.7152*rgb[...,1]+0.0722*rgb[...,2])

# ---- text mask (rendered once, hi-res) ----
def make_text_mask():
    img = Image.new("L",(Wf,Hf),0)
    d = ImageDraw.Draw(img)
    f = ImageFont.truetype(FONT, int(46*SS))
    txt = "A new dawn"
    bb = d.textbbox((0,0),txt,font=f)
    tw = bb[2]-bb[0]; th = bb[3]-bb[1]
    x = (Wf-tw)//2 - bb[0]; y = int(Hf*0.46) - th//2 - bb[1]
    d.text((x,y),txt,fill=255,font=f)
    # small adaptive glyph (a ring + dot) below, like source
    fg = ImageFont.truetype(FONT, int(20*SS))
    g="✦"
    return np.asarray(img,np.float32)/255.0

TXTMASK = make_text_mask()

# small icon mask (a thin ring) below text
def make_icon_mask():
    img = Image.new("L",(Wf,Hf),0); d=ImageDraw.Draw(img)
    cx,cy = Wf//2, int(Hf*0.55); r=int(13*SS)
    d.ellipse([cx-r,cy-r,cx+r,cy+r], outline=255, width=int(3*SS))
    d.ellipse([cx-3*SS,cy-3*SS,cx+3*SS,cy+3*SS], fill=255)
    return np.asarray(img,np.float32)/255.0
ICONMASK = make_icon_mask()

def adaptive_text_color(bg):
    """Core effect: follow bg hue, push lightness toward readable extreme, slight sat boost."""
    h,s,l = rgb_to_hsl_arr(bg)
    # target lightness: away from bg luminance toward the legible extreme
    Lb = luminance(bg)
    target = np.where(Lb < 0.5, 1.0, 0.18)          # white on dark, deep tone on light
    strength = 0.55 + 0.35*np.abs(Lb-0.5)*2          # stronger push at extremes
    tL = np.clip(l*(1-strength) + target*strength, 0.05, 0.97)
    tS = np.clip(s*1.25 + 0.12, 0, 1)                # measured: text more saturated
    return hsl_to_rgb_arr(h, tS, tL)

def adaptive_icon_color(bg):
    # complementary / inverted hue like the source's little glyph
    h,s,l = rgb_to_hsl_arr(bg)
    Lb = luminance(bg)
    tL = np.where(Lb<0.5, 0.88, 0.30)
    return hsl_to_rgb_arr((h+0.5)%1.0, np.clip(s*1.3+0.2,0,1), tL)

def status_bar(draw_rgb):
    pass

# ---- mobile kiosk chrome drawn at final res ----
def draw_chrome(img):
    d = ImageDraw.Draw(img,"RGBA")
    # subtle top status bar
    f = ImageFont.truetype(FONT, 13)
    d.text((20,14),"9:41", fill=(255,255,255,235), font=f)
    # battery / signal (right)
    d.rounded_rectangle([322,15,344,27], radius=3, outline=(255,255,255,200), width=1)
    d.rectangle([345,18,347,24], fill=(255,255,255,200))
    d.rounded_rectangle([324,17,340,25], radius=2, fill=(255,255,255,220))
    # wifi dots
    for i,r in enumerate([2,4,6]):
        d.ellipse([300-i*8-r,20-r,300-i*8+r,20+r], fill=(255,255,255,180))
    fs = ImageFont.truetype(FONT, 12)
    sub = "Tap to begin"
    bb = d.textbbox((0,0),sub,font=fs)
    d.text(((W-(bb[2]-bb[0]))//2, int(H*0.62)), sub, fill=(255,255,255,150), font=fs)
    # home indicator
    d.rounded_rectangle([(W//2-50),H-16,(W//2+50),H-12], radius=2, fill=(255,255,255,180))

print(f"rendering {N} frames at {Wf}x{Hf} (ss{SS}) -> {W}x{H}")
for i in range(N):
    t = i/FPS * (2*math.pi/DUR) * (DUR/ (2*math.pi)) # keep t in seconds
    t = i/FPS
    bg = background(t)
    txtcol = adaptive_text_color(bg)
    iconcol = adaptive_icon_color(bg)
    # composite
    a = TXTMASK[...,None]
    comp = bg*(1-a) + txtcol*a
    ai = ICONMASK[...,None]
    comp = comp*(1-ai) + iconcol*ai
    comp = np.clip(comp*255,0,255).astype(np.uint8)
    im = Image.fromarray(comp,"RGB").resize((W,H), Image.LANCZOS)
    draw_chrome(im)
    im.save(f"{OUT}/f_{i:04d}.png")
    if i%30==0: print("  frame",i)
print("done")
