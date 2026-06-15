<template>
    <div class="isoCanvas" :style="canvasStyle" ref="canvasEl" @pointerdown="deselect">
        <IsoStack class="isoCanvas_svg" v-bind="stack">
            <IsoBox v-for="b in boxes" :key="b.id" v-bind="boxBind(b)">
                <div v-if="b.html" class="isoBoxEditor_html" v-html="b.html"></div>
            </IsoBox>
            <!-- selection gizmo: a bright, fill-less outline of the selected box -->
            <IsoBox v-if="selectedBox && !isConnector(selectedBox)" v-bind="gizmoBind(selectedBox)" />
        </IsoStack>

        <div class="isoCanvas_overlay">
            <button
                v-for="b in boxes"
                :key="b.id"
                class="isoHandle"
                :class="{ 'isoHandle--active': b.id === selectedId }"
                :style="handleStyle(b)"
                @pointerdown.stop="onHandleDown(b, $event)"
            >
                <q-tooltip v-if="b.id === selectedId" :delay="400">Drag to move · Shift = up/down</q-tooltip>
            </button>
        </div>
    </div>
</template>

<script>
import IsoStack from '../IsoStack.vue';
import IsoBox from '../IsoBox.vue';

export default {
    name: 'EditorCanvas',
    components: { IsoStack, IsoBox },
    props: {
        stack: { type: Object, required: true },
        boxes: { type: Array, required: true },
        selectedId: { type: String, default: null },
        snap: { type: Number, default: 0 }, // 0 = no snapping
    },
    emits: ['select'],
    computed: {
        rad() { return (this.stack.angle * Math.PI) / 180; },
        cos() { return Math.cos(this.rad); },
        sin() { return Math.sin(this.rad); },
        vb() {
            const p = (this.stack.viewBox || '-190 -150 380 270').trim().split(/\s+/).map(Number);
            return { minX: p[0], minY: p[1], w: p[2], h: p[3] };
        },
        canvasStyle() {
            return { aspectRatio: `${this.vb.w} / ${this.vb.h}` };
        },
        selectedBox() {
            return this.boxes.find((b) => b.id === this.selectedId) || null;
        },
    },
    methods: {
        proj(x, y, z) {
            const s = this.stack.scale;
            return [(x - y) * this.cos * s, ((x + y) * this.sin - z) * s];
        },
        isConnector(b) {
            return (Array.isArray(b.points) && b.points.length >= 2)
                || (Array.isArray(b.from) && Array.isArray(b.to));
        },
        // the point arrays a drag should offset (the live refs)
        connPoints(b) {
            return Array.isArray(b.points) ? b.points : [b.from, b.to];
        },
        // grid anchor used for the move handle
        anchor(b) {
            if (this.isConnector(b)) {
                const p = this.connPoints(b)[0];
                return [p[0], p[1], p[2] || 0];
            }
            return [b.x, b.y, b.z + b.h / 2];
        },
        handleStyle(b) {
            const a = this.anchor(b);
            const [sx, sy] = this.proj(a[0], a[1], a[2]);
            return {
                left: ((sx - this.vb.minX) / this.vb.w) * 100 + '%',
                top: ((sy - this.vb.minY) / this.vb.h) * 100 + '%',
            };
        },
        boxBind(b) {
            // strip editor-only keys (id, slot html) so they don't fall through as attrs
            const { id, html, ...rest } = b;
            return rest;
        },
        gizmoBind(b) {
            return {
                x: b.x, y: b.y, z: b.z, w: b.w, d: b.d, h: b.h,
                shape: b.shape, radius: b.radius, crop: b.crop, folder: b.folder,
                straight: b.straight, // match billboard shape so the outline isn't a skewed prism
                color: '#ffd54a', fillOpacity: 0, opacity: 1,
                strokeWidth: (this.stack.strokeWidth || 1.4) + 0.8,
            };
        },
        snapv(v) {
            if (this.snap > 0) return Math.round(v / this.snap) * this.snap;
            return Math.round(v * 100) / 100;
        },
        onHandleDown(b, e) {
            this.$emit('select', b.id);
            const rect = this.$refs.canvasEl.getBoundingClientRect();
            if (this.isConnector(b)) {
                const pts = this.connPoints(b);
                this._drag = { conn: true, pts, starts: pts.map((p) => p.slice()), sx: e.clientX, sy: e.clientY, rect };
            } else {
                this._drag = { conn: false, b, sx: e.clientX, sy: e.clientY, x: b.x, y: b.y, z: b.z, rect };
            }
            window.addEventListener('pointermove', this.onMove);
            window.addEventListener('pointerup', this.onUp);
        },
        onMove(e) {
            const d = this._drag;
            if (!d) return;
            const s = this.stack.scale;
            const dUx = (e.clientX - d.sx) / (d.rect.width / this.vb.w);
            const dUy = (e.clientY - d.sy) / (d.rect.height / this.vb.h);
            const dgx = 0.5 * (dUx / (this.cos * s) + dUy / (this.sin * s));
            const dgy = 0.5 * (dUy / (this.sin * s) - dUx / (this.cos * s));
            const dz = -dUy / s;
            if (d.conn) {
                // offset every waypoint together (Shift = vertical)
                d.pts.forEach((p, i) => {
                    if (e.shiftKey) {
                        p[2] = this.snapv((d.starts[i][2] || 0) + dz);
                    } else {
                        p[0] = this.snapv(d.starts[i][0] + dgx);
                        p[1] = this.snapv(d.starts[i][1] + dgy);
                    }
                });
            } else if (e.shiftKey) {
                d.b.z = this.snapv(d.z + dz);
            } else {
                d.b.x = this.snapv(d.x + dgx);
                d.b.y = this.snapv(d.y + dgy);
            }
        },
        onUp() {
            this._drag = null;
            window.removeEventListener('pointermove', this.onMove);
            window.removeEventListener('pointerup', this.onUp);
        },
        deselect() {
            this.$emit('select', null);
        },
    },
    beforeUnmount() {
        this.onUp();
    },
};
</script>

<style scoped>
.isoCanvas {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: 10px;
    background:
        radial-gradient(ellipse 70% 60% at 30% 10%, rgba(91, 155, 255, 0.10) 0%, transparent 60%),
        #0a0e16;
}

.isoCanvas_svg.isoStack {
    height: 100%;
}

/* slot HTML hosted inside a straight box's front face */
.isoBoxEditor_html {
    width: 100%;
    height: 100%;
}

.isoCanvas_overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.isoHandle {
    position: absolute;
    width: 14px;
    height: 14px;
    margin: 0;
    padding: 0;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 1.5px solid #cfe0ff;
    background: rgba(91, 155, 255, 0.55);
    pointer-events: auto;
    cursor: move;
    transition: background 0.1s ease, box-shadow 0.1s ease;
}

.isoHandle:hover {
    background: rgba(91, 155, 255, 0.85);
}

.isoHandle--active {
    width: 18px;
    height: 18px;
    background: #ffd54a;
    border-color: #fff;
    box-shadow: 0 0 0 3px rgba(255, 213, 74, 0.3);
}
</style>
