<template>
    <div class="jShowcase_row jShowcase_column isoShowcase_root">

        <div class="jShowcase_info">
            <code>IsoBox</code> is a single parametric brick. It must be placed inside an
            <code>IsoStack</code> (it inherits projection, colour, stroke and fog from that context).
            Position it with grid coordinates <code>x</code>/<code>y</code>/<code>z</code> and size it with
            <code>w</code>/<code>d</code>/<code>h</code>. See <strong>IsoStack</strong> for full scene composition.
        </div>

        <!-- Dimensions -->
        <div class="jShowcase_group">
            <span class="jShowcase_title">Dimensions (w · d · h)</span>
            <div class="isoDemo_grid">
                <div class="isoDemo_mini">
                    <IsoStack :scale="22">
                        <IsoBox :x="0" :y="0" :z="0" :w="3" :d="3" :h="3" />
                    </IsoStack>
                    <div class="isoDemo_caption">Cube · 3 × 3 × 3</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :scale="22">
                        <IsoBox :x="0" :y="0" :z="0" :w="6" :d="6" :h="0.8" />
                    </IsoStack>
                    <div class="isoDemo_caption">Slab · wide, short</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :scale="22">
                        <IsoBox :x="0" :y="0" :z="0" :w="1.6" :d="1.6" :h="6" />
                    </IsoStack>
                    <div class="isoDemo_caption">Column · tall</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :scale="22">
                        <IsoBox :x="0" :y="0" :z="0" :w="7" :d="2" :h="2" />
                    </IsoStack>
                    <div class="isoDemo_caption">Beam · w &gt; d</div>
                </div>
            </div>
        </div>

        <!-- Fill, grid, opacity -->
        <div class="jShowcase_group">
            <span class="jShowcase_title">Fill · grid · opacity</span>
            <div class="isoDemo_grid">
                <div class="isoDemo_mini">
                    <IsoStack :scale="22">
                        <IsoBox :x="0" :y="0" :z="0" :w="4" :d="4" :h="3" :fill-opacity="0" />
                    </IsoStack>
                    <div class="isoDemo_caption">fillOpacity = 0 · pure wireframe</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :scale="22">
                        <IsoBox :x="0" :y="0" :z="0" :w="4" :d="4" :h="3" :fill-opacity="0.25" />
                    </IsoStack>
                    <div class="isoDemo_caption">fillOpacity = 0.25</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :scale="22">
                        <IsoBox :x="0" :y="0" :z="0" :w="6" :d="6" :h="0.8" :grid="4" />
                    </IsoStack>
                    <div class="isoDemo_caption">grid = 4 · subdivided top</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :scale="22">
                        <IsoBox :x="0" :y="0" :z="0" :w="4" :d="4" :h="3" :opacity="0.3" />
                    </IsoStack>
                    <div class="isoDemo_caption">opacity = 0.3 · ghost</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :scale="22">
                        <IsoBox :x="0" :y="0" :z="0" :w="4" :d="4" :h="3" hidden :fill-opacity="0" />
                    </IsoStack>
                    <div class="isoDemo_caption">hidden · dashed back edges</div>
                </div>
            </div>
        </div>

        <!-- Rounding, folder & crop -->
        <div class="jShowcase_group">
            <span class="jShowcase_title">Rounding · folder · crop</span>
            <div class="isoDemo_grid">
                <div class="isoDemo_mini">
                    <IsoStack :scale="24">
                        <IsoBox :x="0" :y="0" :z="0" :w="2.6" :d="1.2" :h="3.2" :radius="0" :fill-opacity="0.1" />
                    </IsoStack>
                    <div class="isoDemo_caption">radius = 0 · sharp</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :scale="24">
                        <IsoBox :x="0" :y="0" :z="0" :w="2.6" :d="1.2" :h="3.2" :radius="0.5" :fill-opacity="0.1" />
                    </IsoStack>
                    <div class="isoDemo_caption">radius = 0.5 · rounded card</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :scale="24">
                        <IsoBox :x="0" :y="0" :z="0" :w="2.6" :d="1.2" :h="3.2" :radius="0.5" folder :fill-opacity="0.1" />
                    </IsoStack>
                    <div class="isoDemo_caption">folder · tabbed top edge</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :scale="22">
                        <IsoBox :x="0" :y="0" :z="0" :w="3" :d="3" :h="3" :crop="0.8" :fill-opacity="0.1" />
                    </IsoStack>
                    <div class="isoDemo_caption">crop = 0.8 · chamfered front corner</div>
                </div>
            </div>
        </div>

        <!-- Icons -->
        <div class="jShowcase_group">
            <span class="jShowcase_title">Icons</span>
            <div class="isoDemo_grid">
                <div class="isoDemo_mini">
                    <IsoStack :scale="24">
                        <IsoBox :x="0" :y="0" :z="0" :w="2.6" :d="1.2" :h="3.2" :radius="0.4" icon="code" :fill-opacity="0.1" />
                    </IsoStack>
                    <div class="isoDemo_caption">icon · with panel (default)</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :scale="24">
                        <IsoBox :x="0" :y="0" :z="0" :w="2.6" :d="1.2" :h="3.2" :radius="0.4" icon="lock" :panel="false" :fill-opacity="0.1" />
                    </IsoStack>
                    <div class="isoDemo_caption">panel = false · glyph only</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :scale="24">
                        <IsoBox :x="0" :y="0" :z="0" :w="2.6" :d="1.2" :h="3.2" :radius="0.4" icon="bolt" :icon-size="2.2" :fill-opacity="0.1" />
                    </IsoStack>
                    <div class="isoDemo_caption">iconSize = 2.2 · large glyph</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :scale="24">
                        <IsoBox :x="0" :y="0" :z="0" :w="2.6" :d="1.2" :h="3.2" :radius="0.4" folder icon="cloud" :fill-opacity="0.1" />
                    </IsoStack>
                    <div class="isoDemo_caption">folder + icon</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :scale="24">
                        <IsoBox :x="0" :y="0" :z="0" :w="2.6" :d="1.2" :h="3.2" :radius="0.4" icon="navigation" :icon-rotation="45" :fill-opacity="0.1" />
                    </IsoStack>
                    <div class="isoDemo_caption">iconRotation = 45° · in-plane spin</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :scale="24">
                        <IsoBox :x="0" :y="0" :z="0" :w="4.6" :d="0.2" :h="4.6" :radius="0.4" icon="bolt" straight :fill-opacity="0.1" />
                    </IsoStack>
                    <div class="isoDemo_caption">straight · flat, faces viewer</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :scale="22">
                        <IsoBox :x="0" :y="0" :z="0" :w="4.4" :d="0.1" :h="4.4" :radius="0.3" straight :fill-opacity="0.08">
                            <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;">
                                <div style="font-size:20px;font-weight:700;line-height:1;">42</div>
                                <div style="font-size:9px;letter-spacing:1px;opacity:0.7;">FILES</div>
                            </div>
                        </IsoBox>
                    </IsoStack>
                    <div class="isoDemo_caption">straight · HTML slot in front face</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :scale="22">
                        <IsoBox :x="0" :y="0" :z="0" :w="4" :d="4" :h="1.2" icon="hub" icon-face="top" :icon-size="1.4" :fill-opacity="0.1" />
                    </IsoStack>
                    <div class="isoDemo_caption">iconFace = "top" · flat on top</div>
                </div>
            </div>
        </div>

        <!-- Shape -->
        <div class="jShowcase_group">
            <span class="jShowcase_title">Shape</span>
            <div class="isoDemo_grid">
                <div class="isoDemo_mini">
                    <IsoStack :scale="22">
                        <IsoBox shape="box" :x="0" :y="0" :z="0" :w="3" :d="3" :h="3" :fill-opacity="0.1" />
                    </IsoStack>
                    <div class="isoDemo_caption">shape = "box" (default)</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :scale="24">
                        <IsoBox shape="hex" :x="0" :y="0" :z="-2.2" :w="4.4" :d="0.8" :h="4.4" :radius="0.3" icon="hub" :icon-size="1.4" :fill-opacity="0.12" />
                    </IsoStack>
                    <div class="isoDemo_caption">shape = "hex" · upright</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :scale="22">
                        <IsoBox shape="hex" :x="0" :y="0" :z="0" :w="6" :d="6" :h="0.9" :radius="0.25" icon="grid_view" :icon-size="2" :fill-opacity="0.12" />
                    </IsoStack>
                    <div class="isoDemo_caption">hex · flat floor tile (h &lt; w,d)</div>
                </div>
            </div>
        </div>

        <!-- Connectors -->
        <div class="jShowcase_group">
            <span class="jShowcase_title">Connectors (line type)</span>
            <div class="isoDemo_grid">
                <div class="isoDemo_mini">
                    <IsoStack :scale="20" color="#5b9bff">
                        <IsoBox :x="-2.5" :y="0" :z="0" :w="1.4" :d="1.4" :h="1.4" :fill-opacity="0.12" />
                        <IsoBox :x="2.5" :y="0" :z="2" :w="1.4" :d="1.4" :h="1.4" :fill-opacity="0.12" />
                        <IsoBox :from="[-2.5, 0, 0.7]" :to="[2.5, 0, 2.7]" />
                    </IsoStack>
                    <div class="isoDemo_caption">from / to · auto elbow · solid</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :scale="20" color="#4fc3e8">
                        <IsoBox :x="-2.5" :y="0" :z="0" :w="1.4" :d="1.4" :h="1.4" :fill-opacity="0.12" />
                        <IsoBox :x="2.5" :y="0" :z="2.4" :w="1.6" :d="1.6" :h="1.6" :radius="0.3" :fill-opacity="0.12" />
                        <IsoBox :from="[-2.5, 0, 0.7]" :to="[2.5, 0, 3.2]" dashed :radius="0.6" />
                    </IsoStack>
                    <div class="isoDemo_caption">dashed · rounded elbow</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :scale="17" color="#9b8cff">
                        <IsoBox :points="[[-3, 0, 0], [0, 0, 0], [0, 0, 3], [3, 0, 3]]" :radius="0.5" />
                    </IsoStack>
                    <div class="isoDemo_caption">waypoints · multi-bend</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :scale="20" color="#5ad1a0">
                        <IsoBox :x="-2.5" :y="0" :z="0" :w="1.4" :d="1.4" :h="1.4" :fill-opacity="0.12" />
                        <IsoBox :x="2.5" :y="0" :z="2.4" :w="1.4" :d="1.4" :h="1.4" :fill-opacity="0.12" />
                        <IsoBox :from="[-2.5, 0, 0.7]" :to="[2.5, 0, 3.1]" elbow="screenH" dashed :radius="0.6" />
                    </IsoStack>
                    <div class="isoDemo_caption">elbow = "screenH" · flat 90° on screen</div>
                </div>
                <div class="isoDemo_mini">
                    <IsoStack :scale="20" color="#f0a868">
                        <IsoBox :x="-2.5" :y="0" :z="0" :w="1.4" :d="1.4" :h="1.4" :fill-opacity="0.12" />
                        <IsoBox :x="2.5" :y="0" :z="2" :w="1.4" :d="1.4" :h="1.4" :fill-opacity="0.12" />
                        <IsoBox :from="[-2.5, 0, 0.7]" :to="[2.5, 0, 2.7]" dashed :radius="0.6" :flow="1.5" />
                    </IsoStack>
                    <div class="isoDemo_caption">dashed · flow = 1.5 (animated)</div>
                </div>
            </div>
        </div>

    </div>
</template>

<script>
import IsoStack from './IsoStack.vue';
import IsoBox from './IsoBox.vue';

const apiJson = {
    props: {
        x: { type: 'Number', desc: 'Grid X position of the box centre.', default: '0' },
        y: { type: 'Number', desc: 'Grid Y position of the box centre.', default: '0' },
        z: { type: 'Number', desc: 'Grid Z (height) of the box base.', default: '0' },
        w: { type: 'Number', desc: 'Width in grid units (along X).', default: '4' },
        d: { type: 'Number', desc: 'Depth in grid units (along Y).', default: '4' },
        h: { type: 'Number', desc: 'Height in grid units (along Z).', default: '1' },
        color: {
            type: 'String',
            desc: 'Stroke colour. Falls back to the parent IsoStack colour, then currentColor.',
            default: 'null',
        },
        strokeWidth: {
            type: 'Number',
            desc: 'Stroke width in px. Inherits from the parent IsoStack when null.',
            default: 'null',
        },
        fillOpacity: {
            type: 'Number',
            desc: 'Face-fill opacity. Inherits from the parent IsoStack when null.',
            default: 'null',
        },
        hidden: {
            type: 'Boolean',
            desc: 'Draw the hidden (back) edges as faint dashed lines.',
            default: 'false',
        },
        grid: {
            type: 'Number',
            desc: 'Number of subdivisions drawn on the top face (0 = none).',
            default: '0',
        },
        gridOpacity: {
            type: 'Number',
            desc: 'Opacity of the grid lines relative to the stroke.',
            default: '0.4',
        },
        opacity: {
            type: 'Number',
            desc: 'Overall opacity multiplier for the whole brick (for ghost / reflection copies).',
            default: '1',
        },
        solid: {
            type: 'Boolean',
            desc: 'Fill faces opaquely (with the inherited surface colour) so this box hides what is behind it. Inherits from the parent IsoStack when null.',
            default: 'null',
        },
        icon: {
            type: 'String',
            desc: 'Material icon ligature drawn on the front (vertical) face.',
            default: 'null',
        },
        panel: {
            type: 'Boolean',
            desc: 'Draw the rounded panel outline behind the icon.',
            default: 'true',
        },
        iconSrc: {
            type: 'String',
            desc: 'Image/SVG URL drawn on the face instead of a font glyph (e.g. a brand logo). Uses the same face projection / iconSize / iconRotation as `icon`; overrides `icon` when set.',
            default: 'null',
        },
        iconSize: {
            type: 'Number',
            desc: 'Icon glyph size, in grid units.',
            default: '1.3',
        },
        iconRotation: {
            type: 'Number',
            desc: 'Rotate the icon within the plane of the face it sits on (degrees, clockwise).',
            default: '0',
        },
        iconFace: {
            type: 'String',
            desc: 'Which face the icon sits on: auto (the wider vertical face, per w vs d), left (+y face, down-left), right (+x face, down-right), or top (laid flat on the top face).',
            values: ['auto', 'left', 'right', 'top'],
            default: 'auto',
        },
        panelRadius: {
            type: 'Number',
            desc: 'Panel corner radius, in grid units.',
            default: '0.4',
        },
        radius: {
            type: 'Number',
            desc: 'Round every visible corner of the box by this many grid units (0 = sharp). Renders the box as a rounded front/back card.',
            default: '0',
        },
        crop: {
            type: 'Number',
            desc: 'Chamfer the nearest corner by this many grid units, leaving a flat vertical wall facing the viewer (0 = sharp pointed corner).',
            default: '0',
        },
        shape: {
            type: 'String',
            desc: "'box' = rectangular prism; 'hex' = hexagonal front/back face. A short hex (h < w and h < d) lies flat as a floor tile.",
            values: ['box', 'hex'],
            default: 'box',
        },
        folder: {
            type: 'Boolean',
            desc: 'When rounded, give the front/back faces a folder-tab profile on the top edge.',
            default: 'false',
        },
        straight: {
            type: 'Boolean',
            desc: 'Billboard mode — draw a flat, front-facing card (no isometric skew) with the icon upright facing the viewer, positioned at the box’s projected centre.',
            default: 'false',
        },
        foreshorten: {
            type: 'Boolean',
            desc: 'Straight mode only — foreshorten the face width by cos(angle) so it tracks a front-facing wall / crop-chamfer edge as the scene angle changes (with w = 2·crop it stays flush to a crop platform front edge).',
            default: 'false',
        },
        faceFade: {
            type: 'Number',
            desc: 'Straight mode only — feather the front-face edges to transparent (0 = off, 1 = max). Masks all four sides so slotted HTML / fills blend out at the edges.',
            default: '0',
        },
        face: {
            type: 'Boolean',
            desc: 'Straight mode only — draw the face panel (outline/fill/top). Set false to render only the icon / slot HTML with no visible box edges.',
            default: 'true',
        },
        points: {
            type: 'Array',
            desc: 'Connector mode — waypoints [[x,y,z], …]. With ≥2 points the box renders as a poly-line instead of a box (ignores w/d/h/shape).',
            default: 'null',
        },
        from: {
            type: 'Array',
            desc: 'Connector start [x,y,z]. With `to` (and no `points`) an L-elbow is auto-routed.',
            default: 'null',
        },
        to: {
            type: 'Array',
            desc: 'Connector end [x,y,z].',
            default: 'null',
        },
        elbow: {
            type: 'String',
            desc: 'Elbow routing for from/to connectors: grid axis (auto/x/y/z), or screenH / screenV for a true 90° corner on the viewport (routed in screen space).',
            values: ['auto', 'x', 'y', 'z', 'screenH', 'screenV'],
            default: 'auto',
        },
        dashed: {
            type: 'Boolean',
            desc: 'Render the connector dotted/dashed instead of solid.',
            default: 'false',
        },
        dash: {
            type: 'String',
            desc: 'Custom stroke-dasharray; overrides the default dotted pattern when `dashed` is set.',
            default: 'null',
        },
        flow: {
            type: 'Number',
            desc: 'Animate the dashes flowing along the connector (animates stroke-dashoffset). Magnitude = speed in dash-periods per second, sign = direction; 0 = static. Requires `dashed` or a custom `dash`.',
            default: '0',
        },
    },
};

export default {
    name: 'IsoBoxShowcase',
    label: 'Iso Box',
    icon: 'view_in_ar',
    components: { IsoStack, IsoBox },
    apiJson,
    importName: 'IsoBox',
    importFrom: 'shared/components/Theme/IsoBox/IsoBox.vue',
};
</script>

<style scoped>
.isoDemo_grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    align-content: start;
    gap: 10px;
    width: 100%;
}

.isoDemo_mini {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 138px;
    padding: 6px;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--q-primary) 12%, transparent);
    background: color-mix(in srgb, var(--q-primary) 3%, transparent);
    overflow: hidden;
}

/* The IsoStack viewBox is large and tuned for the big default scene, so a single
   small box renders tiny and parked in the upper third. Pin the SVG to a fixed
   box, zoom into the content and nudge it down to recentre; the cell clips the
   rest. The cell's own fixed height keeps the section compact regardless of the
   SVG's intrinsic size. */
.isoDemo_mini :deep(.isoStack) {
    width: 100%;
    height: 96px;
    flex: none;
}

.isoDemo_mini :deep(.isoStack_svg) {
    height: 96px;
    overflow: hidden;
    transform: translateY(8px) scale(1.45);
    transform-origin: center;
}

.isoDemo_caption {
    font-size: 11px;
    line-height: 1.3;
    text-align: center;
    opacity: 0.75;
}

/*
 * GOTCHA — huge empty vertical gap below the first section.
 *
 * The showcase host (Varmory JComponentShowcase) renders this descriptor inside
 * a Quasar 50/50 row: the live demos on the left, the API/code panel on the
 * right (see JComponentShowcase.vue). Quasar's `.row` uses align-items:stretch,
 * so the demo column is stretched to match the (usually taller) API/code column.
 *
 * Varmory's `.jShowcase_row.jShowcase_column` makes our root a FLEX COLUMN. When
 * that flex column is stretched tall, the extra height is absorbed by the first
 * flex child (the first `.jShowcase_group`), which balloons and pushes the next
 * section way down — looking like a giant gap "between sections".
 *
 * FIX: take the root out of flex (`display: block`) so its children size to
 * their own content and can't be stretched. The `.isoShowcase_root` class is
 * only here to win specificity over Varmory's global `.jShowcase_row.jShowcase_column`
 * rule. Block flow has no `gap`, so re-add section spacing via margin-bottom.
 */
.jShowcase_row.jShowcase_column.isoShowcase_root {
    display: block;
}

.isoShowcase_root .jShowcase_group {
    margin-bottom: 20px;
}
</style>
