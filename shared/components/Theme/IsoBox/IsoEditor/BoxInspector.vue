<template>
    <div v-if="box">
        <q-list>
            <!-- ── connector / line element ── -->
            <q-expansion-item v-if="isConnector" default-opened icon="timeline" label="Connector">
                <div class="q-px-md q-pb-md q-gutter-y-sm">
                    <q-btn-toggle
                        :model-value="connMode" @update:model-value="setMode"
                        spread no-caps unelevated toggle-color="primary"
                        :options="[{ label: 'From / To', value: 'fromto' }, { label: 'Waypoints', value: 'points' }]"
                    />

                    <template v-if="connMode === 'fromto'">
                        <div class="text-caption text-grey">From</div>
                        <div class="row q-col-gutter-sm">
                            <q-input class="col" dense filled type="number" step="0.5" label="X" v-model.number="box.from[0]" />
                            <q-input class="col" dense filled type="number" step="0.5" label="Y" v-model.number="box.from[1]" />
                            <q-input class="col" dense filled type="number" step="0.5" label="Z" v-model.number="box.from[2]" />
                        </div>
                        <div class="text-caption text-grey">To</div>
                        <div class="row q-col-gutter-sm">
                            <q-input class="col" dense filled type="number" step="0.5" label="X" v-model.number="box.to[0]" />
                            <q-input class="col" dense filled type="number" step="0.5" label="Y" v-model.number="box.to[1]" />
                            <q-input class="col" dense filled type="number" step="0.5" label="Z" v-model.number="box.to[2]" />
                        </div>
                        <div class="text-caption text-grey q-mb-xs">Elbow axis</div>
                        <q-btn-toggle
                            v-model="box.elbow" spread no-caps unelevated toggle-color="primary"
                            :options="[{ label: 'Auto', value: 'auto' }, { label: 'X', value: 'x' }, { label: 'Y', value: 'y' }, { label: 'Z', value: 'z' }]"
                        />
                        <div class="text-caption text-grey q-mb-xs">Viewport 90° corner</div>
                        <q-btn-toggle
                            v-model="box.elbow" spread no-caps unelevated toggle-color="primary"
                            :options="[
                                { value: 'screenH', slot: 'h' },
                                { value: 'screenV', slot: 'v' },
                            ]"
                        >
                            <template #h><q-icon name="turn_right" /><q-tooltip>Horizontal first (flat 90° on screen)</q-tooltip></template>
                            <template #v><q-icon name="turn_left" /><q-tooltip>Vertical first (flat 90° on screen)</q-tooltip></template>
                        </q-btn-toggle>
                    </template>

                    <template v-else>
                        <div v-for="(pt, i) in box.points" :key="i" class="row q-col-gutter-sm items-center q-mb-xs">
                            <q-input class="col" dense filled type="number" step="0.5" label="X" v-model.number="pt[0]" />
                            <q-input class="col" dense filled type="number" step="0.5" label="Y" v-model.number="pt[1]" />
                            <q-input class="col" dense filled type="number" step="0.5" label="Z" v-model.number="pt[2]" />
                            <q-btn flat dense round size="sm" icon="close" :disable="box.points.length <= 2" @click="box.points.splice(i, 1)" />
                        </div>
                        <q-btn flat dense no-caps icon="add" label="Add point" @click="addPoint" />
                    </template>

                    <div class="iso_sliderRow"><span>Corner</span><q-slider v-model="box.radius" :min="0" :max="2" :step="0.05" label /></div>
                    <q-toggle v-model="box.dashed" label="Dashed (dotted)" />
                    <div v-if="box.dashed" class="iso_sliderRow"><span>Flow</span><q-slider v-model="box.flow" :min="-5" :max="5" :step="0.1" label markers :marker-labels="{ 0: '0' }" /></div>
                    <div v-if="box.dashed" class="text-caption text-grey">Animate the dashes along the path — sign sets direction, 0 = static.</div>
                </div>
            </q-expansion-item>
            <q-separator v-if="isConnector" />

            <q-expansion-item v-if="!isConnector" default-opened icon="open_with" label="Transform">
                <div class="q-px-md q-pb-md">
                    <div class="row q-col-gutter-sm">
                        <q-input class="col" dense filled type="number" step="0.5" label="X" v-model.number="box.x" />
                        <q-input class="col" dense filled type="number" step="0.5" label="Y" v-model.number="box.y" />
                        <q-input class="col" dense filled type="number" step="0.5" label="Z" v-model.number="box.z" />
                    </div>
                    <div class="row q-col-gutter-sm q-mt-xs">
                        <q-input class="col" dense filled type="number" step="0.5" label="W" v-model.number="box.w" />
                        <q-input class="col" dense filled type="number" step="0.5" label="D" v-model.number="box.d" />
                        <q-input class="col" dense filled type="number" step="0.5" label="H" v-model.number="box.h" />
                    </div>
                </div>
            </q-expansion-item>
            <q-separator />

            <q-expansion-item v-if="!isConnector" default-opened icon="category" label="Shape">
                <div class="q-px-md q-pb-md q-gutter-y-sm">
                    <q-btn-toggle
                        v-model="box.shape" spread no-caps unelevated
                        toggle-color="primary"
                        :options="[{ label: 'Box', value: 'box' }, { label: 'Hex', value: 'hex' }]"
                    />
                    <div class="iso_sliderRow"><span>Radius</span><q-slider v-model="box.radius" :min="0" :max="1" :step="0.05" label /></div>
                    <div class="iso_sliderRow"><span>Crop</span><q-slider v-model="box.crop" :min="0" :max="20" :step="0.05" label /></div>
                    <q-toggle v-model="box.folder" label="Folder tab" />
                    <q-toggle v-model="box.straight" label="Straight (flat, faces the viewer)" />
                    <q-toggle v-if="box.straight" v-model="box.foreshorten" label="Foreshorten width (match faces / crop edges)" />
                    <q-toggle v-if="box.straight" v-model="box.face" label="Show face panel (off = icon / HTML only)" />
                    <div v-if="box.straight" class="iso_sliderRow"><span>Edge fade</span><q-slider v-model="box.faceFade" :min="0" :max="1" :step="0.05" label /></div>
                    <q-input
                        v-if="box.straight"
                        v-model="box.html"
                        type="textarea"
                        filled dense autogrow clearable
                        label="Front-face HTML"
                        hint="Rendered inside the straight box face"
                        input-style="font-family: monospace; font-size: 12px;"
                    />
                    <div v-if="box.straight && box.html" class="iso_facePreview" v-html="box.html"></div>
                </div>
            </q-expansion-item>
            <q-separator />

            <q-expansion-item v-if="!isConnector" default-opened icon="grid_on" label="Grid">
                <div class="q-px-md q-pb-md q-gutter-y-sm">
                    <div class="iso_sliderRow"><span>Subdiv.</span><q-slider v-model="box.grid" :min="0" :max="8" :step="1" label label-always /></div>
                    <div class="iso_sliderRow"><span>Opacity</span><q-slider v-model="box.gridOpacity" :min="0" :max="1" :step="0.05" label /></div>
                    <div class="text-caption text-grey">Grid lines draw on the top face of a square box (radius 0, shape “box”).</div>
                </div>
            </q-expansion-item>
            <q-separator />

            <q-expansion-item default-opened icon="palette" label="Appearance">
                <div class="q-px-md q-pb-md q-gutter-y-sm">
                    <ColorField v-model="box.color" label="Color" :allow-inherit="true" />
                    <div class="iso_sliderRow"><span>Fill</span><q-slider v-model="box.fillOpacity" :min="0" :max="1" :step="0.01" label /></div>
                    <div class="iso_sliderRow"><span>Opacity</span><q-slider v-model="box.opacity" :min="0" :max="1" :step="0.01" label /></div>
                    <q-input dense filled type="number" step="0.1" label="Stroke width (blank = inherit)" v-model.number="box.strokeWidth" clearable />
                    <q-toggle :model-value="box.solid === true" @update:model-value="(v) => (box.solid = v || null)" label="Solid (occludes what's behind)" />
                    <q-toggle v-model="box.hidden" label="Show hidden edges" />
                </div>
            </q-expansion-item>
            <q-separator />

            <q-expansion-item v-if="!isConnector" icon="emoji_symbols" label="Icon">
                <div class="q-px-md q-pb-md q-gutter-y-sm">
                    <IconField v-model="box.icon" />
                    <q-input v-model="box.iconSrc" dense filled clearable label="Image URL (overrides icon)" hint="e.g. /walrus.png" />
                    <div class="iso_sliderRow"><span>Size</span><q-slider v-model="box.iconSize" :min="0.3" :max="3" :step="0.1" label /></div>
                    <div class="iso_sliderRow"><span>Rotation</span><q-slider v-model="box.iconRotation" :min="-180" :max="180" :step="5" label /></div>
                    <div v-if="box.icon" class="iso_sliderRow">
                        <span>Face</span>
                        <q-btn-toggle
                            v-model="box.iconFace" spread no-caps unelevated dense toggle-color="primary"
                            :options="[{ label: 'Auto', value: 'auto' }, { label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }, { label: 'Top', value: 'top' }]"
                        />
                    </div>
                    <div class="iso_sliderRow"><span>Panel r.</span><q-slider v-model="box.panelRadius" :min="0" :max="1" :step="0.05" label /></div>
                    <q-toggle v-model="box.panel" label="Panel outline behind icon" />
                </div>
            </q-expansion-item>
        </q-list>
    </div>

    <div v-else class="text-grey text-center q-pa-xl">
        <q-icon name="touch_app" size="32px" class="q-mb-sm" /><br />
        Select a box on the canvas or in Layers to edit it.
    </div>
</template>

<script>
import ColorField from './ColorField.vue';
import IconField from './IconField.vue';

export default {
    name: 'BoxInspector',
    components: { ColorField, IconField },
    props: {
        box: { type: Object, default: null },
    },
    computed: {
        isConnector() {
            if (!this.box) return false;
            return (Array.isArray(this.box.points) && this.box.points.length >= 2)
                || (Array.isArray(this.box.from) && Array.isArray(this.box.to));
        },
        connMode() {
            return Array.isArray(this.box?.points) ? 'points' : 'fromto';
        },
    },
    methods: {
        setMode(mode) {
            const b = this.box;
            if (mode === 'points') {
                if (!Array.isArray(b.points)) {
                    b.points = (b.from && b.to) ? [b.from.slice(), b.to.slice()] : [[0, 0, 0], [3, 0, 0]];
                }
                b.from = null;
                b.to = null;
            } else {
                if (!(b.from && b.to)) {
                    const p = b.points;
                    b.from = p ? p[0].slice() : [0, 0, 0];
                    b.to = p ? p[p.length - 1].slice() : [3, 0, 3];
                }
                b.points = null;
            }
        },
        addPoint() {
            const p = this.box.points;
            const last = p[p.length - 1];
            p.push([last[0] + 1, last[1], last[2]]);
        },
    },
};
</script>

<style scoped>
.iso_sliderRow {
    display: flex;
    align-items: center;
    gap: 12px;
}
.iso_sliderRow > span {
    flex: 0 0 64px;
    font-size: 12px;
    color: var(--q-text-muted, #888);
}
.iso_sliderRow > .q-slider {
    flex: 1;
}

/* live preview of the straight-box front-face HTML */
.iso_facePreview {
    border: 1px dashed color-mix(in srgb, var(--q-primary) 30%, transparent);
    border-radius: 6px;
    padding: 8px;
    background: rgba(10, 15, 26, 0.6);
    overflow: auto;
}
</style>
