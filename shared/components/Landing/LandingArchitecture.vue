<template>
    <!--
      One isometric IsoStack scene (storage base → Sui/Walrus/Seal hex pillars →
      recoverable slab → WDoubleSync sync platform → data tray + file tiles).
      The callout chips are STRAIGHT (billboard) IsoBoxes hosting HTML slots, so they
      live in the scene (scale/glow/fog with it) and the dashed screen-elbow leaders
      meet them by construction. Only the on-scene text labels (sync / pillar names /
      storage) remain HTML overlays positioned with pct(gx,gy,gz) — the SAME projection
      the SVG uses. Tune by editing grid coords (not pixel %): see SCALE / ANGLE / VIEWBOX.
    -->
    <section class="arch" ref="root" :class="{ 'arch--paused': !linesActive }" @mouseenter="kick">
        <div class="arch_stage" :style="stageStyle">

<IsoStack :color="isoColor" :scale="11" :angle="27" :glow="isoGlow" :stroke-width="isoStrokeWidth" :fog="1" :fogNear="16" :fogFar="-10">
    <IsoBox :w="8" :d="8" :h="0.5" :fillOpacity="0.05" :grid="3" />
    <IsoBox :x="-0.5" :y="-0.5" :z="1.5" :w="9" :d="9" :crop="6" :fillOpacity="0.13" :opacity="0.74" :grid="5" :gridOpacity="0.3" />
    <IsoBox :x="-1" :y="-1" :z="5" :w="7" :d="7" :h="0.5" :fillOpacity="0.05" :grid="3" />
    <IsoBox :x="1" :y="1" :z="1.5" :w="12" :d="0" :radius="0.0" straight foreshorten :face="false" :fillOpacity="0.2" :opacity="0.78">
        <div style="font-size: 7px; text-align: center; line-height: 12px; font-weight: bold;"
            :style="{ color: labelColor, background: labelBg }">
            WDoubleSync Sync Platform
        </div>
    </IsoBox>
    <IsoBox :x="-0.5" :y="-0.5" :z="-4.5" :w="13" :d="13" :crop="4.9" :fillOpacity="0.05" :grid="6" :gridOpacity="0.3" />
    <IsoBox :x="-4" :y="4.5" :z="-3.5" :w="2" :d="2" :h="2" :fillOpacity="0.1" iconSrc="/sui.png" :iconSize="0.7" :panel="false" />
    <IsoBox :x="4.5" :y="-4" :z="-3.5" :w="2" :d="2.0001" :h="2" :fillOpacity="0.1" iconSrc="/seal.png" :iconSize="1" iconFace="right" :panel="false" />
    <IsoBox :x="3.4" :y="3.4" :z="-3.5" :w="2" :d="1.5" :h="2" straight :fillOpacity="0.1" iconSrc="/walrus.png" :iconSize="1" :panel="false" />
    <IsoBox :x="-2.5" :y="1" :z="5.5" :w="1.5" :d="1.5" :h="0.5" :fillOpacity="0.1" icon="article" :iconSize="1.1" :iconRotation="-45" iconFace="top" />
    <IsoBox :x="1" :y="1" :z="5.5" :w="1.5" :d="1.5" :h="0.5" :fillOpacity="0.1" icon="image" :iconSize="1.1" :iconRotation="-45" iconFace="top" />
    <IsoBox :x="1" :y="-2.5" :z="5.5" :w="1.5" :d="1.5" :h="0.5" :fillOpacity="0.1" icon="storage" :iconSize="1.1" :iconRotation="-45" iconFace="top" />
    <IsoBox :x="-2.5" :y="-2.5" :z="5.5" :w="1.5" :d="1.5" :h="0.5" :fillOpacity="0.1" icon="folder_open" :iconSize="1.1" :iconRotation="-45" iconFace="top" />

    <IsoBox :from="[-4,4.5,-1.5]" :to="[-3.5,4,0.5]" :flow="2" elbow="screenV" :radius="0.6" dashed />
    <IsoBox :from="[4.5,-4,-1.5]" :to="[4,-3.5,0.5]" :flow="2" elbow="screenV" :radius="0.6" dashed />
    <IsoBox :from="[3,3,-1.5]" :to="[3,3,0.5]" :flow="2" elbow="screenV" :radius="0.6" dashed />
    <IsoBox :x="3.5" :y="3.5" :z="-4.5" :w="9.5" :d="0" :radius="0.0" straight foreshorten :face="false" :fillOpacity="0.2" :opacity="0.78">
        <div style="font-size: 5px; text-align: center; line-height: 12px; font-weight: bold;"
            :style="{ color: labelColor, background: labelBg }">
            Decentralized Storage Layer
        </div>
    </IsoBox>
    <IsoBox :x="-3" :y="8" :z="7" :w="5" :d="0" :h="3" :radius="0.15" straight :fillOpacity="0.1">
        <div class="archChip">
            <q-icon name="lock" size="10px" class="archChip_icon" />
            <div>
                <div class="archChip_title">Your Data</div>
                <div class="archChip_sub">Encrypted &amp; Yours</div>
            </div>
        </div>
    </IsoBox>
    <IsoBox :from="[-3,8,8]" :flow="2" :to="[-4.5,4.5,2.5]" elbow="screenV" :radius="1.45" dashed />
    <IsoBox :x="-3.5" :y="10.5" :z="1" :w="5" :d="0" :h="3" :radius="0.15" straight :fillOpacity="0.1">
        <div class="archChip">
            <q-icon name="terminal" size="10px" class="archChip_icon" />
            <div>
                <div class="archChip_title">Access Anywhere</div>
                <div class="archChip_sub">Web · CLI · SDK · AI Agents</div>
            </div>
        </div>
    </IsoBox>
    <IsoBox :from="[-3.5,10.5,3.5]" :flow="2" :to="[-4.5,4.5,2]" elbow="screenV" :radius="1.45" dashed />
    <IsoBox :x="8" :y="-3.5" :z="6" :w="5" :d="0" :h="3" :radius="0.15" straight :fillOpacity="0.1">
        <div class="archChip">
            <q-icon name="view_in_ar" size="10px" class="archChip_icon" />
            <div>
                <div class="archChip_title">Versioned Filesystem</div>
                <div class="archChip_sub">Every change is tracked.</div>
            </div>
        </div>
    </IsoBox>
    <IsoBox :from="[8,-3.5,7]" :flow="2" :to="[4.5,-4.5,2.5]" elbow="screenV" :radius="1.45" dashed />
    <IsoBox :x="9.5" :y="-4.5" :z="-1" :w="5" :d="0" :h="3" :radius="0.15" straight :fillOpacity="0.1">
        <div class="archChip">
            <q-icon name="view_in_ar" size="10px" class="archChip_icon" />
            <div>
                <div class="archChip_title">Recoverable by Design</div>
                <div class="archChip_sub">Restore anytime from multiple sources.</div>
            </div>
        </div>
    </IsoBox>

    <IsoBox  :flow="2"  :from="[9.5,-4.5,1.5]" :to="[4.5,-4.5,2]" elbow="screenV" :radius="1.45" dashed />

    <IsoBox :x="1.5" :y="1.5" :h="0.2" shape="hex" :fillOpacity="0.12" icon="hub" :iconSize="1.2" />
</IsoStack>

        </div>
    </section>
</template>

<script>
import IsoStack from '../Theme/IsoBox/IsoStack.vue';
import IsoBox from '../Theme/IsoBox/IsoBox.vue';

const SCALE = 12;
const ANGLE = 30;
const VIEWBOX = '-230 -170 460 300';

export default {
    name: 'LandingArchitecture',
    components: { IsoStack, IsoBox },
    data() {
        const [minX, minY, w, h] = VIEWBOX.split(/\s+/).map(Number);
        // linesActive gates the dashed flow-line CSS animations — same
        // visibility + activity + 3s-idle rules as LandingAgentScene
        return { SCALE, ANGLE, VIEWBOX, vb: { minX, minY, w, h }, linesActive: false };
    },
    computed: {
        stageStyle() {
            return { aspectRatio: `${this.vb.w} / ${this.vb.h}` };
        },
        // darker stroke colour in light mode so the wireframe reads against a
        // light background instead of washing out
        isoColor() {
            return this.$q.dark.isActive ? '#5b9bff' : '#2f6fe0';
        },
        // softer glow / heavier stroke in light mode so the wireframe reads
        // against a light background instead of blooming
        isoGlow() {
            return this.$q.dark.isActive ? 7 : 7;
        },
        isoStrokeWidth() {
            return this.$q.dark.isActive ? 1.3 : 2;
        },
        // on-scene label chips: dark translucent in dark mode, light translucent
        // (with dark text) in light mode so they stay readable
        labelBg() {
            return this.$q.dark.isActive ? 'rgba(10, 15, 26, 0.42)' : 'rgba(236, 242, 250, 0.7)';
        },
        labelColor() {
            return this.$q.dark.isActive ? '#fff' : '#16223a';
        },
    },
    methods: {
        // same projection the IsoStack uses → overlays line up with grid anchors
        project(gx, gy, gz) {
            const a = (ANGLE * Math.PI) / 180;
            return [(gx - gy) * Math.cos(a) * SCALE, ((gx + gy) * Math.sin(a) - gz) * SCALE];
        },
        // map a grid point to a {left,top} % over the aspect-locked stage
        pct(gx, gy, gz) {
            const [sx, sy] = this.project(gx, gy, gz);
            return {
                left: ((sx - this.vb.minX) / this.vb.w) * 100 + '%',
                top: ((sy - this.vb.minY) / this.vb.h) * 100 + '%',
            };
        },
        // user activity (mouse move / scroll / hover): refresh the idle clock
        // and resume the dash-flow lines if the scene is on screen
        kick() {
            this._lastActivity = performance.now();
            if (this._visible) this.resumeLines();
        },
        resumeLines() {
            if (this._reduceMotion || this.linesActive) return;
            this.linesActive = true;
            // paused CSS animations keep their dash offset, so lines resume
            // exactly where they stopped; cheap 500ms poll decides idle stop
            this._idleTimer = window.setInterval(() => {
                if (performance.now() - this._lastActivity > 3000) this.pauseLines();
            }, 500);
        },
        pauseLines() {
            if (this._idleTimer) {
                window.clearInterval(this._idleTimer);
                this._idleTimer = null;
            }
            this.linesActive = false;
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

        if ('IntersectionObserver' in window) {
            this._observer = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        this._visible = entry.isIntersecting;
                        if (entry.isIntersecting) this.kick(); // runs ~3s even without activity
                        else this.pauseLines();
                    }
                },
                { threshold: 0.15 }
            );
            this._observer.observe(this.$refs.root);
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
        this.pauseLines();
    },
};
</script>

<!-- non-scoped: the dash-flow animation name is set via inline style inside IsoBox -->
<style>
.arch--paused [style*="isoBoxDashFlow"] { animation-play-state: paused !important; }
</style>

<style scoped>
.arch {
    padding: 24px 16px 48px;
}

.arch_stage {
    position: relative;
    width: 100%;
    max-width: 1080px;
    margin: 0 auto;
    /* the IsoStack svg is overflow:visible (glow paints outside). Clip ONLY the
       right edge (cut at 0) so it can't push the page wider, while the negative
       insets on the other three sides leave the glow / left bleed visible.
       (`overflow` can't clip a single side — clip-path can.) */
    clip-path: inset(-1000px 0 -1000px -1000px);
}

.arch_svg.isoStack {
    height: 100%;
}

/* overlays are centred on their grid anchor */
.arch_label,
.arch_pill,
.arch_store {
    position: absolute;
    transform: translate(-50%, -50%);
    pointer-events: none;
}

.arch_label--sync {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-display, inherit);
    font-size: 18px;
    font-weight: 600;
    color: #eaf1fb;
    white-space: nowrap;
}

.arch_logo {
    color: #8a7bff;
}

.arch_pill {
    font-size: 15px;
    font-weight: 600;
    color: #eaf1fb;
    white-space: nowrap;
}

.arch_store {
    font-size: 13px;
    letter-spacing: 1px;
    color: #9fb2cc;
    white-space: nowrap;
}

/* ── callout chip content (rendered inside a straight IsoBox front face) ── */
/* sizes are in SVG user units (scaled up ~2.3× to screen), so they read small here */
.archChip {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 8px 7px;
    background: rgba(10, 15, 26, 0.62);
}

.archChip_icon {
    flex: none;
    /* inherits the IsoBox face colour (currentColor) → tinted per chip */
}

.archChip_title {
    font-size: 4.5px;
    font-weight: 600;
    color: #eaf1fb;
    line-height: 1.0;
}

.archChip_sub {
    font-size: 4px;
    line-height: 1.1;
    color: #9fb2cc;
    margin-top: 3px;
}

/* ── built with footer ── */
.arch_builtWith {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 18px;
    max-width: 560px;
    margin: 12px auto 0;
    padding: 14px 24px;
    border-radius: 12px;
    border: 1px solid rgba(120, 150, 210, 0.16);
    background: rgba(255, 255, 255, 0.02);
}

.arch_builtWith_label {
    font-size: 13px;
    color: #9fb2cc;
}

.arch_builtWith_item {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: #eaf1fb;
}

.arch_builtWith_sep {
    height: 22px;
    background: rgba(120, 150, 210, 0.2);
}

</style>
