<template>
    <section class="cta">
        <div class="cta_panel">
            <!-- decorative hexagon perspective floor (procedural SVG, see script) -->
            <svg
                class="cta_mesh"
                :viewBox="`0 0 ${viewW} ${viewH}`"
                preserveAspectRatio="none"
                aria-hidden="true"
            >
                <defs>
                    <linearGradient id="ctaMeshGrad" gradientUnits="userSpaceOnUse" x1="0" y1="86" x2="0" y2="222">
                        <stop offset="0" stop-color="currentColor" stop-opacity="0" />
                        <stop offset="0.45" stop-color="currentColor" stop-opacity="0.22" />
                        <stop offset="1" stop-color="currentColor" stop-opacity="0.95" />
                    </linearGradient>
                </defs>
                <g>
                    <polygon
                        v-for="(c, i) in hex.cells"
                        :key="`c${i}`"
                        :points="c"
                        fill="url(#ctaMeshGrad)"
                        opacity="0.16"
                    />
                </g>
                <path
                    :d="hex.edges"
                    fill="none"
                    stroke="url(#ctaMeshGrad)"
                    stroke-width="1"
                    vector-effect="non-scaling-stroke"
                />
            </svg>

            <div class="cta_inner">
                <!-- left: headline -->
                <div class="cta_lead">
                    <h2 class="cta_title">
                        Your data. Your rules.<br>
                        <span class="cta_title--accent">Always private. Always yours.</span>
                    </h2>
                    <p class="cta_sub">
                        WDoubleSync is the private, versioned, on-chain
                        filesystem for the decentralized future.
                    </p>
                </div>

                <!-- middle: primary actions -->
                <div class="cta_actions">
                    <BlobButton
                        text="Launch Web App"
                        icon="arrow_forward"
                        color="var(--lp-accent)"
                        block
                        @click="$emit('launch')"
                    />
                    <BlobButton
                        text="Install CLI"
                        icon="terminal"
                        color="var(--lp-text-3)"
                        block
                        @click="$emit('cli')"
                    />
                </div>

                <!-- right: external links -->
                <div class="cta_links">
                    <a
                        class="cta_link"
                        href="https://github.com/FizzyFlow"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <svg class="cta_link_icon" viewBox="0 0 24 24" aria-hidden="true">
                            <path fill="currentColor" d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.2 3.44 9.6 8.21 11.16.6.11.82-.25.82-.56v-2c-3.34.72-4.04-1.6-4.04-1.6-.55-1.36-1.34-1.73-1.34-1.73-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.22 1.84 1.22 1.07 1.8 2.81 1.28 3.5.98.11-.76.42-1.28.76-1.57-2.66-.3-5.47-1.3-5.47-5.79 0-1.28.47-2.33 1.23-3.15-.12-.3-.53-1.5.12-3.14 0 0 1-.32 3.3 1.2a11.5 11.5 0 016 0c2.3-1.52 3.3-1.2 3.3-1.2.65 1.64.24 2.84.12 3.14.77.82 1.23 1.87 1.23 3.15 0 4.5-2.81 5.48-5.49 5.77.43.37.81 1.1.81 2.22v3.29c0 .31.22.68.83.56C20.56 21.88 24 17.48 24 12.29 24 5.78 18.63.5 12 .5z" />
                        </svg>
                        <span class="cta_link_label">GitHub</span>
                        <q-icon name="code" size="18px" class="cta_link_arrow" />
                    </a>

                    <a
                        class="cta_link"
                        href="https://x.com/suidouble"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <svg class="cta_link_icon" viewBox="0 0 24 24" aria-hidden="true">
                            <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        <span class="cta_link_label">Follow on X</span>
                        <q-icon name="arrow_forward" size="18px" class="cta_link_arrow" />
                    </a>
                </div>
            </div>
        </div>
    </section>
</template>

<script>
import BlobButton from '../Theme/BlobButton.vue';

const VIEW_W = 1200;
const VIEW_H = 220;

// small deterministic PRNG so the terrain is stable across renders
function mulberry32(seed) {
    let t = seed >>> 0;
    return () => {
        t += 0x6d2b79f5;
        let x = Math.imul(t ^ (t >>> 15), 1 | t);
        x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
        return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
}

// Build a hexagon grid projected onto a receding ground plane (perspective
// floor). Hexes are tiled in world space (wx lateral, wz depth) then projected
// to screen so near cells are large and far cells shrink toward the horizon.
function buildHexFloor({ R, seed }) {
    const rng = mulberry32(seed);
    const W = VIEW_W;
    const H = VIEW_H;
    const r = (v) => Math.round(v * 10) / 10;
    const cx = W / 2;
    const horizonY = 42;
    const camK = H - horizonY;

    // perspective projection: world (wx, wz>0) → screen (sx, sy)
    const proj = (wx, wz) => {
        const z = Math.max(wz, 0.85);
        return [cx + (wx * W * 0.5) / z, horizonY + camK / z];
    };

    const dxw = 1.5 * R;
    const dzw = Math.sqrt(3) * R;
    const hexVerts = (cwx, cwz) => {
        const v = [];
        for (let k = 0; k < 6; k++) {
            const a = (Math.PI / 180) * (60 * k);
            v.push([cwx + R * Math.cos(a), cwz + R * Math.sin(a)]);
        }
        return v;
    };

    const seen = new Set();
    let edges = '';
    const wkey = (p) => `${Math.round(p[0] * 1000)},${Math.round(p[1] * 1000)}`;
    const addEdge = (a, b) => {
        const ka = wkey(a), kb = wkey(b);
        const key = ka < kb ? ka + '|' + kb : kb + '|' + ka;
        if (seen.has(key)) return;
        seen.add(key);
        const pa = proj(a[0], a[1]), pb = proj(b[0], b[1]);
        edges += `M${r(pa[0])} ${r(pa[1])}L${r(pb[0])} ${r(pb[1])}`;
    };

    const cells = [];
    let col = 0;
    // wide lateral range + per-hex culling → the plane reads as "infinite",
    // filling the full width at every depth instead of pinching to the centre
    for (let cwx = -6.5; cwx <= 6.5; cwx += dxw, col++) {
        const zoff = (col % 2) ? dzw / 2 : 0;
        for (let cwz = 0.9 + zoff; cwz <= 6.2; cwz += dzw) {
            const c = proj(cwx, cwz);
            if (c[0] < -140 || c[0] > W + 140) continue; // off-screen → skip
            const v = hexVerts(cwx, cwz);
            for (let k = 0; k < 6; k++) addEdge(v[k], v[(k + 1) % 6]);
            // faint highlight on a few nearer, on-screen cells
            if (cwz < 3.2 && Math.abs(c[0] - cx) < W * 0.46 && rng() < 0.1) {
                cells.push(v.map((p) => {
                    const s = proj(p[0], p[1]);
                    return `${r(s[0])},${r(s[1])}`;
                }).join(' '));
            }
        }
    }

    return { edges, cells };
}

export default {
    name: 'LandingCallToAction',
    components: { BlobButton },
    emits: ['launch', 'cli'],
    data() {
        return {
            viewW: VIEW_W,
            viewH: VIEW_H,
            // hexagon grid receding into perspective
            hex: buildHexFloor({ R: 0.14, seed: 23 }),
        };
    },
};
</script>

<style scoped>
.cta {
    padding: 24px 24px 48px;
}

/* panel matches the feature / use-case cards (shared --lp-* tokens) */
.cta_panel {
    position: relative;
    overflow: hidden;
    max-width: 1600px;
    margin: 0 auto;
    padding: 40px 44px;
    border-radius: 20px;
    border: 1px solid var(--lp-card-border);
    background: var(--lp-card-bg);
    box-shadow: var(--lp-card-shadow);
}

.cta_inner {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 44px;
}

/* ── left headline ── */
.cta_title {
    font-family: var(--font-display, inherit);
    font-size: 30px;
    font-weight: 700;
    line-height: 1.18;
    letter-spacing: -0.5px;
    color: var(--lp-text);
    margin: 0 0 12px;
}

.cta_title--accent {
    color: var(--lp-accent);
}

.cta_sub {
    font-size: 14px;
    line-height: 1.6;
    color: var(--lp-text-3);
    max-width: 360px;
    margin: 0;
}

/* ── middle actions ── */
.cta_actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 230px;
}

/* ── right links ── */
.cta_links {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 240px;
    padding-left: 44px;
    border-left: 1px solid var(--lp-divider);
}

.cta_link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 12px;
    border: 1px solid var(--lp-card-border);
    background: var(--lp-badge-bg);
    color: var(--lp-text-2);
    text-decoration: none;
    transition: border-color 0.2s ease, color 0.2s ease, transform 0.15s ease;
}

.cta_link:hover {
    border-color: color-mix(in srgb, var(--lp-accent) 55%, transparent);
    color: var(--lp-text);
    transform: translateY(-1px);
}

.cta_link_icon {
    flex: none;
    width: 22px;
    height: 22px;
    color: var(--lp-text);
}

.cta_link_label {
    flex: 1;
    min-width: 0;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
}

.cta_link_chip {
    flex: none;
    font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
    font-size: 12px;
    font-weight: 600;
    color: var(--lp-text-3);
    padding: 3px 9px;
    border-radius: 999px;
    border: 1px solid var(--lp-card-border);
}

.cta_link_arrow {
    flex: none;
    color: var(--lp-text-3);
    transition: transform 0.2s ease;
}

.cta_link:hover .cta_link_arrow {
    transform: translateX(3px);
    color: var(--lp-accent);
}

/* ── decorative hexagon floor mesh — landing primary accent ── */
.cta_mesh {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 150px;
    z-index: 0;
    display: block;
    pointer-events: none;
    color: var(--lp-accent);
}

/* ── responsive ── */
@media (max-width: 1023px) {
    .cta_inner {
        grid-template-columns: 1fr;
        gap: 28px;
    }

    .cta_links {
        padding-left: 0;
        border-left: none;
        padding-top: 28px;
        border-top: 1px solid var(--lp-divider);
    }

    .cta_actions,
    .cta_links {
        min-width: 0;
    }
}
</style>
