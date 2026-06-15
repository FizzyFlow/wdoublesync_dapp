<template>
    <IsoStack color="#5b9bff" :scale="18" :angle="28" :glow="isoGlow" :stroke-width="isoStrokeWidth" :fog="1" :forNear="2" :fogFar="-19">
        <IsoBox :z="-4.5" :w="3" :d="3" :h="3" :fillOpacity="0.1" icon="smart_toy" :panel="false" :iconSize="2.4" />
        <IsoBox :z="-1.5" :w="3" :d="0.5" :h="3" :radius="0.8" :fillOpacity="0.1" icon="code" :iconSize="2.4" :panel="false" :panelRadius="0" />
        <IsoBox :x="t0.x" :y="t0.y" :z="t0.z" :w="3" :d="0.2" :h="3" :radius="0.35" folder :fillOpacity="0.1" icon="image" :iconSize="2.7" :panel="false" :panelRadius="0.35" />
        <IsoBox :x="t1.x" :y="t1.y" :z="t1.z" :w="3" :d="0.2" :h="3" :radius="0.35" folder :fillOpacity="0.1" icon="storage" :iconSize="2.7" :panel="false" :panelRadius="0.35" />
        <IsoBox :x="t2.x" :y="t2.y" :z="t2.z" :w="3" :d="0.2" :h="3" :radius="0.35" folder :fillOpacity="0.1" icon="folder" :iconSize="2.7" :panel="false" :panelRadius="0.35" />
        <IsoBox :x="t3.x" :y="t3.y" :z="t3.z" :w="3" :d="0.2" :h="3" :radius="0.35" folder :fillOpacity="0.1" icon="schema" :iconSize="2.7" :panel="false" :panelRadius="0.35" />
        <IsoBox :x="t4.x" :y="t4.y" :z="t4.z" :w="3" :d="0.2" :h="3" :radius="0.35" folder :fillOpacity="0.1" icon="favorite" :iconSize="2.7" :panel="false" :panelRadius="0.35" />
        <IsoBox :flow="2" :from="[t0.x, t0.y, t0.z]" :to="[0,0,0.5]" elbow="screenH" :radius="0.6" dashed />
        <IsoBox :flow="2" :from="[t1.x, t1.y, t1.z]" :to="[0,0,0.5]" elbow="screenV" :radius="0.6" dashed />
        <IsoBox :flow="2" :from="[t2.x, t2.y, t2.z]" :to="[0,0,0.5]" elbow="screenV" :radius="0.6" dashed />
        <IsoBox :flow="2" :from="[t3.x, t3.y, t3.z]" :to="[0,0,0.5]" elbow="screenH" :radius="0.6" dashed />
        <IsoBox :flow="2" :from="[t4.x, t4.y, t4.z]" :to="[0,0,0.5]" elbow="screenH" :radius="0.6" dashed />
    </IsoStack>
</template>

<script>
import IsoStack from '../Theme/IsoBox/IsoStack.vue';
import IsoBox from '../Theme/IsoBox/IsoBox.vue';

// base (resting) positions of the floating artifact tiles
const BASE = {
    t0: { x: -6.5, y: 0, z: -5.5 },    // image
    t1: { x: -5.5, y: -2.5, z: -0.5 }, // storage
    t2: { x: -0.5, y: -4.5, z: -0.5 }, // folder
    t3: { x: 2, y: -6, z: -3 },        // schema
    t4: { x: 0.5, y: -5.5, z: -8 },    // favorite
};

// gentle drift: each axis oscillates ±`amp` grid units on its own slow sine,
// phase-offset so the motion reads as an organic float rather than a slide
function drift(t, base, seed) {
    const amp = 0.5;
    const sp = 0.45; // angular speed (rad/s) — "very slowly"
    return {
        x: base.x + Math.sin(t * sp + seed) * amp,
        y: base.y + Math.sin(t * sp * 0.8 + seed + 1.7) * amp,
        z: base.z + Math.sin(t * sp * 1.15 + seed + 3.1) * amp,
    };
}

export default {
    name: 'LandingAgentScene',
    components: { IsoStack, IsoBox },
    data() {
        return { t: 0 };
    },
    computed: {
        // softer glow / heavier stroke in light mode so the wireframe reads
        // against a light background instead of blooming
        isoGlow() {
            return this.$q.dark.isActive ? 7 : 0;
        },
        isoStrokeWidth() {
            return this.$q.dark.isActive ? 1.3 : 2;
        },
        t0() {
            return drift(this.t, BASE.t0, 0);
        },
        t1() {
            return drift(this.t, BASE.t1, 1.3);
        },
        t2() {
            return drift(this.t, BASE.t2, 2.6);
        },
        t3() {
            return drift(this.t, BASE.t3, 3.9);
        },
        t4() {
            return drift(this.t, BASE.t4, 5.2);
        },
    },
    mounted() {
        if (typeof window === 'undefined') return;
        const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return;
        const loop = (ts) => {
            this.t = ts / 1000;
            this._raf = window.requestAnimationFrame(loop);
        };
        this._raf = window.requestAnimationFrame(loop);
    },
    beforeUnmount() {
        if (this._raf) window.cancelAnimationFrame(this._raf);
    },
};
</script>
