# Cover image prompts

For blog and email covers. Written for **Nano Banana / GPT-image**-class models — they
follow long prose, respect named hex codes reasonably well, and tolerate the amount of
constraint below. Midjourney will ignore most of the hex codes; if you move there, keep
the colour *descriptions* and drop the codes.

Not a generated file. Every colour in it is a real token from `build/palette.mjs` — the
primitive path is in a comment beside each one, so you can check it against the
Primitives section of the showcase.

---

## 1. The palette block

This is the part that makes a cover on-brand. Paste it into every prompt, unchanged.

```
PALETTE — use only these values.

  Ground        #F7F5F4   warm off-white
  Paper         #FFFFFF   pure white, for lift only
  Accent        #FF3D01   vivid orange-red — the one saturated element
  Accent deep   #D53100 · #A92500 · #7F1900   for depth in the accent only
  Tints         #FFECE7 · #FFD8CE · #FFB3A0 · #FF8A6F   pale peach to coral
  Violet        #D1C4FD · #8E6FD8   the single cool note
  Ink           #070605   warm near-black
  Warm greys    #EFEDEC · #D5D3D2 · #A9A7A6 · #5F5D5C · #211F1D

THREE RULES ABOUT THIS PALETTE — they matter more than the codes.

1. Every neutral is warm-biased. #F7F5F4 is off-white with a faint pink cast, not
   grey. #070605 is a warm near-black, not #000000. Do not substitute cool or
   neutral greys, and do not use pure black anywhere.

2. #FF3D01 is a RED-orange — tomato, vermilion, hue near 34°. It is not amber, not
   #FF6600, not gold, not coral. Keep it on the red side.

3. The accent is a signal, not a colour scheme. It may occupy at most 20% of the
   canvas and must be the only fully saturated thing in the frame. The violet is a
   single accent note, 5% at most. If you can see more than two saturated colours,
   there is one too many.
```

---

## 2. Negative constraints

Also paste every time. This block is doing as much work as the palette one — it's the
list of things these models reach for uninvited, and every item is a reason a cover
looks generated.

```
DO NOT INCLUDE:
  purple-to-blue gradients · glassmorphism · frosted glass panels · glowing or
  coloured drop shadows · neon · lens flare · bokeh sparkles · chrome or liquid
  metal · glossy 3D blobs · iridescent foil · dark-mode-by-default backgrounds

  circuit boards · glowing brains · humanoid robots · neural-network node diagrams ·
  binary digits · holographic HUDs · isometric server rooms · anything that says
  "AI" by pointing at hardware

  stock-photo people at laptops · emoji · icon grids · numbered 01/02/03 markers ·
  watermarks · logos · signatures · UI chrome · borders or frames around the image

  and no text, letters, numerals or glyphs of any kind — including in the background,
  on any object, or as texture.
```

---

## 3. Sizes

| Use | Prompt this | Why |
|---|---|---|
| Blog / OG card | `1200 × 630` | Open Graph and Twitter both crop to about this |
| Email header | `1200 × 400` | Renders at 600px wide; 3:1 survives an inbox |
| Article hero | `1600 × 900` | Room to crop later |

**Email specifically.** It'll be seen at roughly 300–600px wide, sometimes on a dark
background, often with images blocked entirely until the reader opts in. So: keep the
composition readable when it's 300px wide, avoid fine detail, and never let the image
be the only place important information appears. Add `composition must remain legible
when scaled to 300px wide` to the prompt.

---

## 4. The prompts

Three directions. Each has a text-free version (default) and a text-bearing version.
Replace `{SUBJECT}` with what the piece is about, in plain words — "a new video model
launching", "how our render queue works", "pricing getting simpler".

### A · Brand mesh — soft gradient fields

Closest to what the product already looks like; builds on your `gradient/mesh-*`
tokens. Most forgiving direction — abstract fields rarely come out mangled. Also the
most common AI-cover look, so the palette is what distinguishes it. Good default for
email.

**A1 — text-free**

```
A 1200 × 630 abstract cover image for an article about {SUBJECT}.

Soft out-of-focus colour fields bleeding into one another on a warm off-white
ground — two or three fields only, generous empty space around them. One denser
core of vivid orange-red sits off-centre, roughly a third in from one edge, and
everything else falls away into pale peach and blush. A single small violet field
at the opposite edge for cool relief.

Matte and airy, like backlit paper or dye diffusing in water. No visible banding,
no hard edges, no vignette. Feels like light rather than like plastic.

[PALETTE BLOCK]
[NEGATIVE BLOCK]
```

**A2 — headline baked in**

```
[everything from A1, then:]

Set the headline "{TITLE}" across the lower-left third in a chunky geometric sans
— tight tracking, slightly squarish counters, heavy weight; Bricolage Grotesque if
you know it, otherwise the closest thing to a bold Archivo or Inter Display. Warm
near-black #070605. Left-aligned, two lines maximum, generous margin. Spelling
must be exact. No other text anywhere.
```

### B · Flat editorial vector

Hard-edged geometry on warm off-white. More distinctive and much less
AI-looking — closer to a good tech-magazine cover. Needs more re-rolls, because these
models add gradients and shadows unless told twice. Best for blog posts you want to
look considered.

**B1 — text-free**

```
A 1200 × 630 flat editorial illustration for an article about {SUBJECT}.

Two or three hard-edged geometric forms on a warm off-white ground — a clipped
arc, a stack of thin parallel bars, one circle cut by the frame edge. Completely
flat fills: no gradients, no shadows, no texture, no outlines. One form is vivid
orange-red; the rest are pale peach and warm grey.

Asymmetric and weighted to one third of the canvas, with more empty space than
feels comfortable. Swiss poster restraint — confident, quiet, nothing decorative.
Shapes should suggest {SUBJECT} obliquely; do not illustrate it literally.

Every fill is one flat colour. If a shape has a gradient in it, that is wrong.

[PALETTE BLOCK]
[NEGATIVE BLOCK]
```

**B2 — headline baked in**

```
[everything from B1, then:]

Set the headline "{TITLE}" in the left half, in a chunky geometric sans with tight
tracking and heavy weight — Bricolage Grotesque if known, otherwise closest to a
bold Archivo or Inter Display. Warm near-black #070605, left-aligned, two lines
maximum. The geometric forms occupy the right half and must not overlap the text.
Spelling must be exact. No other text anywhere.
```

### C · Cinematic frame

Leans on what you actually sell. Reads as a still from something rather than as
decoration — which is the point, for a text-to-video product. Drifts off-palette most
easily, so the grading clause is doing real work. Use for launch posts and model pages.

**C1 — text-free**

```
A single cinematic frame, 1200 × 630, evoking {SUBJECT}.

Anamorphic feel, shallow depth of field, one clear subject and a lot of falloff.
Practical lights in frame — sodium lamps, a shopfront sign, headlights through
rain — reading vivid orange-red. Deep warm near-black shadows that keep detail.
One cool violet rim light or reflection, small, as the only cool note.

COLOUR GRADE: the whole frame is graded to the palette below. Warm highlights,
warm shadows, no teal-and-orange, no green cast, no cool blue night look. Blacks
lift to a warm near-black, never pure black. Film grain very fine or absent.

Environment over people. If a figure appears, they are small, back-lit and not the
subject; no recognisable faces.

[PALETTE BLOCK]
[NEGATIVE BLOCK]
```

**C2 — headline baked in**

```
[everything from C1, then:]

Leave the lower third comparatively dark and empty. Set the headline "{TITLE}"
there in a chunky geometric sans, heavy weight, tight tracking — Bricolage
Grotesque if known, otherwise closest to a bold Archivo. Pure white #FFFFFF,
left-aligned, two lines maximum. It must sit on the darkest part of the frame with
clear separation. Spelling must be exact. No other text anywhere.
```

---

## 5. Steering it

Knobs worth turning before you re-roll from scratch:

| Want | Change |
|---|---|
| Calmer | Cut to two shapes / one colour field. Raise the empty space. |
| More energetic | `the accent form is cropped hard by the frame edge` |
| Warmer | Push the tints: `#FFD8CE and #FFB3A0 carry more of the canvas` |
| Cooler / more serious | Swap the violet note for warm grey `#5F5D5C`, drop tints |
| Reads too "AI" | Direction B, and add `no gradients anywhere, including subtle ones` |
| Sits badly next to the logo | `keep the top-left 200 × 120 region empty` |

**Keeping a run coherent.** Generate one cover you like, then feed it back as a style
reference for the rest with `match the palette, density and finish of the attached
image; same treatment, different composition`. That holds a series together far better
than re-running the same prompt.

---

## 6. Before you ship it

- Is `#FF3D01` the only fully saturated thing in the frame?
- Is the off-white actually warm? Hold it next to `#F7F5F4`. Cool grey is the most
  common failure and the easiest to miss on a warm monitor.
- Is the orange still red-orange, or has it drifted to amber?
- Any text you didn't ask for — on an object, in the texture, in a corner?
- Shrink it to 300px wide. Does it still read?
- For email: does it work on both a white and a dark background? Many clients invert.
- Alt text written? Images are blocked by default in a lot of inboxes, so the alt text
  is the cover for a meaningful share of readers.

---

## 7. The honest caveat

No prompt will match your tokens exactly. These models don't hit a named hex reliably,
and neither Bricolage Grotesque nor Geist is a typeface any of them actually has — the
text-bearing variants above produce a *lookalike*, which is fine for a fast email
header and not fine for a launch announcement.

For exactness, the covers want generating rather than prompting: an HTML or SVG template
reading `dist/tokens.css`, with the headline set in the real webfont and the shapes
driven by the same `gradient/mesh-*` tokens the product uses. Deterministic, correct to
the byte, and re-renderable when the palette moves. Worth building if covers become a
weekly job rather than an occasional one.
