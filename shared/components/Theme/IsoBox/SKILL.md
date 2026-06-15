---
name: isobox-isostack
description: How to compose isometric SVG illustrations with the IsoStack + IsoBox components (shared/components/Theme/IsoBox). Use when building or editing isometric diagrams, stacked-platform/tile/hex art, billboard panels, or dotted/elbow connector lines with these components, or when adding props to them.
---

# IsoStack + IsoBox

A tiny isometric-illustration toolkit. **IsoStack** is the SVG scene/container; **IsoBox** is one parametric primitive drawn inside it (a box, hex, billboard panel, or connector line). Everything is pure SVG — no 3D lib.

- Files: `shared/components/Theme/IsoBox/IsoStack.vue`, `IsoBox.vue` (+ `IsoVault` was removed).
- Live editor: route `/iso-editor` (build scenes visually, export Vue template).
- Showcase: `/showcase` → **Iso Stack** / **Iso Box** tabs.
- Quasar note: in this repo `shared/` components must use **kebab-case** tags for auto-import (`<q-icon>`, not `<QIcon>`). IsoBox uses `<q-icon>` internally for the same reason — but icons inside IsoBox are drawn as a Material-icons glyph in a `<foreignObject>`, not q-icon.

## Golden rules

1. **IsoBox only works inside an IsoStack.** It renders an SVG `<g>` and `inject`s the projection/colour context (`iso`) that IsoStack `provide`s. Standalone it falls back to a trivial projection and looks wrong.
2. **Paint order = document order**, back-to-front. List children bottom/back first, front/top last (the renderer does not z-sort).
3. **Children inherit** `color`, `strokeWidth`, `fillOpacity`, and `solid` from the IsoStack unless the IsoBox sets its own (those props default to `null` = inherit).
4. The `viewBox` is fixed-ish (`-190 -150 380 270`). Tall compositions overflow it — raise IsoStack `viewBox` or lower `scale`.

## Coordinate system

Grid axes: **x** runs right-and-down on screen, **y** left-and-down, **z** straight up. Projection (in `IsoStack.project`):

```
sx = (x - y) * cos(angle) * scale
sy = ((x + y) * sin(angle) - z) * scale
```

So **nearer the viewer = larger `x + y + 2·sin(angle)·z`** — the projection's view direction is `(1, 1, 2·sin angle)` (= `(1,1,1)` at 30°), so height counts toward nearness too. This combined depth drives the fog fade (a tall box reads as nearer, not over-fogged). `scale` = pixels per grid unit; `angle` = isometric tilt (default 30°).

## IsoStack props

| prop | default | notes |
|---|---|---|
| `color` | `var(--q-primary)` | stroke colour; inherited by children |
| `strokeWidth` | `1.4` | px (non-scaling); inherited |
| `fillOpacity` | `0.06` | faint face fill (0 = pure wireframe); inherited |
| `glow` | `7` | outer drop-shadow glow px (0 disables) |
| `fog` | `0` | atmospheric fade (0 off → 1 far side dissolves) |
| `fogNear` / `fogFar` | `6` / `-8` | grid-depth (`x+y`) treated as nearest/farthest for fog |
| `scale` | `20` | px per grid unit |
| `angle` | `30` | iso angle (degrees) |
| `solid` | `false` | boxes fill faces opaquely (with `surface`) to occlude what's behind; inherited |
| `surface` | `var(--q-surface-1)` | occlusion fill colour for solid mode |
| `viewBox` | `-190 -150 380 270` | override for taller/wider scenes |
| `ariaLabel` | … | SVG aria-label |

Default slot = the scene (IsoBox children). With no slot, a sample scene (three stacked platforms) is drawn. The IsoStack root `<div class="isoStack">` is `width:100%`; give it a height (e.g. wrapper `height` + `.isoStack { height: 100% }`) so the SVG has a size.

## IsoBox props

**Geometry:** `x` `y` `z` (grid position, default 0), `w` `d` `h` (size; default 4/4/1).

**Appearance:** `color`/`strokeWidth`/`fillOpacity`/`solid` (null = inherit from IsoStack), `opacity` (1, overall multiplier — use <1 for ghost/reflection copies), `hidden` (false → draw faint dashed back edges).

**Top-face grid:** `grid` (0 = none; number of subdivisions), `gridOpacity` (0.4). Only renders on a **flat square box** (radius 0, shape `box`, not straight); follows a `crop` chamfer.

**Shape:** `shape` (`'box'` | `'hex'`), `radius` (0 = sharp; >0 renders the box as rounded front/back **card** faces), `crop` (chamfer the nearest corner by N grid units → flat wall facing viewer), `folder` (when rounded, a folder-tab profile on the top edge).

**Icon:** `icon` (Material icon ligature on the front face), `iconSrc` (image/SVG URL drawn on the face instead of a glyph — e.g. a brand logo; same projection/size/rotation, overrides `icon`), `iconSize` (1.3 grid units), `iconRotation` (0, in-plane spin °), `iconFace` (`auto` = the wider vertical face per w vs d | `left` = +y face / down-left | `right` = +x face / down-right | `top` = laid flat on the top face), `panel` (true → rounded outline behind icon), `panelRadius` (0.4).

**Billboard:** `straight` (false) — see modes.

**Connector:** `points`, `from`/`to`, `elbow`, `dashed`, `dash` — see modes.

## The five render modes

A single IsoBox picks exactly one, in this precedence:

1. **Connector** — if `points` (≥2) or both `from`/`to` are set. Draws a poly-line, ignores box geometry. (Highest precedence.)
2. **Straight / billboard** — `straight: true`. Flat front face squarely facing the viewer + a top face receding upward (front-above view; no left/right sides). Rounded (`radius>0`) → front + faint back **rounded squares** instead. Icon drawn upright. **Default `<slot>`**: in straight mode the front face is an axis-aligned screen rect, so any HTML placed in the default slot renders (un-skewed, clipped to the face, in a `<foreignObject>`) inside the front face — use it for labels, counters, mini-UI. (Slot is ignored in the other modes, where the face is sheared.) Straight width is `w·scale` (angle-independent); set **`foreshorten`** to instead scale width by `cos(angle)` so it tracks front-facing walls / `crop` edges (a `crop`-chamfer front edge has screen width `2·crop·cos(angle)·scale`, so `w = 2·crop` + `foreshorten` stays flush as the angle changes). **`faceFade`** (0–1) feathers the front-face edges to transparent (a CSS mask on all four sides) so the face fill / slotted HTML blends out at the edges. **`face`** (default true) draws the panel (outline/fill/top); set `false` to drop the box edges entirely and render only the icon / slot HTML.
3. **Hex** — `shape: 'hex'`. Hexagonal faces. A short hex (`h < w` **and** `h < d`) lies flat as a floor tile; otherwise an upright hex card.
4. **Rounded card** — `radius > 0` (and not hex/straight). Front/back faces as rounded rectangles.
5. **Box** — default. Rectangular prism wireframe + faint top/left/right faces.

### Connector details

- `points`: explicit waypoints `[[x,y,z], …]` (grid space). `radius` rounds the bends.
- `from` + `to`: endpoints; auto-routes a single-bend **L**. `elbow` chooses the turn:
  - `auto` (largest grid delta) / `x` / `y` / `z` → corner routed in **grid** space.
  - `screenH` / `screenV` → corner placed at the axis-aligned **screen** intersection of the projected endpoints, giving a true **90° on the viewport** regardless of iso angle (`screenH` = horizontal segment first, `screenV` = vertical first). The corner deliberately leaves the iso floor.
- `dashed: true` → dotted (round-cap dots scaled to stroke width); `dash` overrides with a custom `stroke-dasharray`.

## Recipes

Stacked platform + cube:
```vue
<IsoStack color="#5b9bff" :scale="20" :glow="8" :fog="0.25">
  <IsoBox :x="0" :y="0" :z="0"   :w="8" :d="8" :h="0.6" :grid="3" :fill-opacity="0.05" />
  <IsoBox :x="0" :y="0" :z="0.6" :w="2.4" :d="2.4" :h="2.4" :fill-opacity="0.12" />
</IsoStack>
```

Rounded icon card / folder tile:
```vue
<IsoBox :w="2.6" :d="1.2" :h="3.2" :radius="0.5" folder icon="code" :fill-opacity="0.1" />
```

Hex floor tile with a flat icon:
```vue
<IsoBox shape="hex" :w="6" :d="6" :h="0.9" :radius="0.25" icon="hub" :icon-size="1.4" />
```

Billboard panel facing the viewer:
```vue
<IsoBox :w="2.6" :d="2.6" :h="2.6" :radius="0.4" icon="bolt" straight :fill-opacity="0.1" />
```

Dotted elbow connector with a flat 90° corner:
```vue
<IsoBox :from="[-2.5, 0, 0.7]" :to="[2.5, 0, 3.1]" elbow="screenH" dashed :radius="0.6" />
```

## Gotchas

- **Grid not showing:** `grid` only draws on a square `box` with `radius 0`, not on hex/rounded/straight boxes.
- **Box too tall / clipped:** content exceeds the fixed `viewBox` — raise IsoStack `viewBox` or lower `scale`.
- **Self-reference recursion:** if you build a *showcase/wrapper* component, don't name it `IsoBox`/`IsoStack` while also registering the real ones — Vue resolves a component's own `name` first and infinite-loops. Use a distinct name (e.g. `IsoBoxShowcase`).
- **Editor is the source of truth for examples:** the `/iso-editor` "Export" dialog generates ready-to-paste `<IsoStack>…</IsoStack>` markup, omitting any prop left at its default.
- **Keep prop docs in sync:** when adding an IsoBox/IsoStack prop, also update `IsoEditor/sceneModel.js` (defaults, `makeBox`, `BOX_KEY_ORDER`/code-gen), `IsoEditor/BoxInspector.vue` (a control), and `IsoBox.showcase.vue` / `IsoStack.showcase.vue` (`apiJson` + a demo).
