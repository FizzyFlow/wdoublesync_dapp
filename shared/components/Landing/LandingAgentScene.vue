<template>
    <div ref="sceneEl" class="agentScene" :class="{ 'agentScene--paused': !animating }" @mouseenter="kick">
    <IsoStack color="#5b9bff" :scale="18" :angle="28" :glow="isoGlow" :stroke-width="isoStrokeWidth" :fog="1" :forNear="2" :fogFar="-19">
        <IsoBox :z="-4.5" :w="3" :d="3" :h="3" :fillOpacity="0.1" icon="smart_toy" :panel="false" :iconSize="2.4" />
        <IsoBox :z="-1.5" :w="3" :d="0.5" :h="3" :radius="0.8" :fillOpacity="0.1" icon="code" :iconSize="2.4" :panel="false" :panelRadius="0" />
        <IsoBox :x="t0.x" :y="t0.y" :z="t0.z" :w="3" :d="0.2" :h="3" :radius="0.35" folder :fillOpacity="0.1" icon="image" :iconSize="2.7" :panel="false" :panelRadius="0.35" />
        <IsoBox :x="t1.x" :y="t1.y" :z="t1.z" :w="3" :d="0.2" :h="3" :radius="0.35" folder :fillOpacity="0.1" icon="storage" :iconSize="2.7" :panel="false" :panelRadius="0.35" />
        <IsoBox :x="t2.x" :y="t2.y" :z="t2.z" :w="3" :d="0.2" :h="3" :radius="0.35" folder :fillOpacity="0.1" icon="folder" :iconSize="2.7" :panel="false" :panelRadius="0.35" />
        <IsoBox :x="t3.x" :y="t3.y" :z="t3.z" :w="3" :d="0.2" :h="3" :radius="0.35" folder :fillOpacity="0.1" icon="schema" :iconSize="2.7" :panel="false" :panelRadius="0.35" />
        <IsoBox :x="t4.x" :y="t4.y" :z="t4.z" :w="3" :d="0.2" :h="3" :radius="0.35" folder :fillOpacity="0.1" icon="favorite" :iconSize="2.7" :panel="false" :panelRadius="0.35" />
        <IsoBox :flow="2" :from="f0" :to="TO_CENTER" elbow="screenH" :radius="0.6" dashed />
        <IsoBox :flow="2" :from="f1" :to="TO_CENTER" elbow="screenV" :radius="0.6" dashed />
        <IsoBox :flow="2" :from="f2" :to="TO_CENTER" elbow="screenV" :radius="0.6" dashed />
        <IsoBox :flow="2" :from="f3" :to="TO_CENTER" elbow="screenH" :radius="0.6" dashed />
        <IsoBox :flow="2" :from="f4" :to="TO_CENTER" elbow="screenH" :radius="0.6" dashed />
    </IsoStack>
    </div>
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
        return {
            animating: false,
            // how many tiles are currently drifting — ramped up one by one on
            // start so the scene wakes gradually instead of one heavy frame
            activeTiles: 0,
            // per-tile animation clocks: advance only while the tile is active,
            // so a stopped tile freezes in place and resumes from the same phase
            tileTimes: [0, 0, 0, 0, 0],
            TO_CENTER: [0, 0, 0.5],
        };
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
        // each tile derives its position from its own frozen-able clock; while a
        // clock isn't advancing the computed stays cached, props keep identical
        // references, and Vue skips re-rendering that IsoBox and its connector
        t0() {
            return drift(this.tileTimes[0], BASE.t0, 0);
        },
        t1() {
            return drift(this.tileTimes[1], BASE.t1, 1.3);
        },
        t2() {
            return drift(this.tileTimes[2], BASE.t2, 2.6);
        },
        t3() {
            return drift(this.tileTimes[3], BASE.t3, 3.9);
        },
        t4() {
            return drift(this.tileTimes[4], BASE.t4, 5.2);
        },
        f0() { return [this.t0.x, this.t0.y, this.t0.z]; },
        f1() { return [this.t1.x, this.t1.y, this.t1.z]; },
        f2() { return [this.t2.x, this.t2.y, this.t2.z]; },
        f3() { return [this.t3.x, this.t3.y, this.t3.z]; },
        f4() { return [this.t4.x, this.t4.y, this.t4.z]; },
    },
    methods: {
        // user activity (mouse move / scroll / hover): refresh the idle clock
        // and (re)start the loop if the scene is on screen. The actual start is
        // deferred to an idle moment — restarting synchronously inside a scroll
        // event forces the glow filters to re-rasterize mid-gesture and janks.
        kick() {
            this._lastActivity = performance.now();
            if (!this._visible || this._raf || this._startScheduled) return;
            this._startScheduled = true;
            const start = () => {
                this._startScheduled = false;
                if (this._visible) this.startLoop();
            };
            if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 300 });
            else window.setTimeout(start, 120);
        },
        // step activeTiles toward `target` one tile every 250ms, so both waking
        // up and winding down touch a single tile per step instead of the whole
        // scene in one frame
        ramp(target) {
            if (this._rampTimer) {
                window.clearInterval(this._rampTimer);
                this._rampTimer = null;
            }
            const step = () => {
                if (this.activeTiles === target) {
                    window.clearInterval(this._rampTimer);
                    this._rampTimer = null;
                    if (target === 0) this.animating = false;
                    return;
                }
                this.activeTiles += target > this.activeTiles ? 1 : -1;
            };
            this._rampTimer = window.setInterval(step, 250);
            step();
        },
        startLoop() {
            if (this._reduceMotion || this._raf) return;
            this.animating = true;
            this.ramp(5);

            // drift is slow — 20fps is visually identical to 60fps at a third of the CPU
            const frameInterval = 1000 / 20;
            const idleAfter = 3000; // stop after 3s without mouse/scroll activity
            let last = null;
            const loop = (ts) => {
                if (ts - this._lastActivity > idleAfter) {
                    this.stopLoop();
                    return;
                }
                this._raf = window.requestAnimationFrame(loop);
                if (last === null) { last = ts; return; }
                if (ts - last < frameInterval) return;
                const dt = (ts - last) / 1000;
                last = ts;
                // advance only the clocks of currently-active tiles
                for (let i = 0; i < this.activeTiles; i++) {
                    this.tileTimes[i] += dt;
                }
            };
            this._raf = window.requestAnimationFrame(loop);
        },
        // hard=true (scene off-screen / unmount): stop everything at once.
        // hard=false (user idle): wind tiles down one by one, then pause dashes.
        stopLoop(hard = false) {
            if (this._raf) {
                window.cancelAnimationFrame(this._raf);
                this._raf = null;
            }
            if (hard) {
                if (this._rampTimer) {
                    window.clearInterval(this._rampTimer);
                    this._rampTimer = null;
                }
                this.activeTiles = 0;
                this.animating = false;
            } else {
                this.ramp(0);
            }
        },
    },
    mounted() {
        if (typeof window === 'undefined') return;
        this._reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (this._reduceMotion) return;

        this._visible = false;
        this._lastActivity = 0;
        this._onActivity = () => this.kick();
        window.addEventListener('mousemove', this._onActivity, { passive: true });
        window.addEventListener('scroll', this._onActivity, { passive: true });

        // animate only while the scene is on screen, and only around user activity
        if ('IntersectionObserver' in window) {
            this._observer = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        this._visible = entry.isIntersecting;
                        if (entry.isIntersecting) this.kick(); // runs ~3s even without activity
                        else this.stopLoop(true);
                    }
                },
                { threshold: 0.15 }
            );
            this._observer.observe(this.$refs.sceneEl);
        } else {
            this._visible = true;
            this.kick();
        }
    },
    beforeUnmount() {
        if (this._observer) this._observer.disconnect();
        if (this._onActivity) {
            window.removeEventListener('mousemove', this._onActivity);
            window.removeEventListener('scroll', this._onActivity);
        }
        this.stopLoop(true);
    },
};
</script>

<!-- non-scoped: the dash-flow animation name is set via inline style inside IsoBox -->
<style>
.agentScene {
    width: 100%;
    height: 100%;
    /* isolate the scene's repaints from the rest of the page */
    contain: layout style paint;
}
/* keep the double drop-shadow glow on its own compositor layer so
   resuming the animation doesn't re-rasterize the blur on the main thread */
.agentScene .isoStack_scene { will-change: filter; }
.agentScene--paused [style*="isoBoxDashFlow"] { animation-play-state: paused !important; }
</style>
