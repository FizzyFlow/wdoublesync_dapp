<template>
    <div class="landingShell">
        <LandingHeader @home="$emit('home')" />
        <slot />
    </div>
</template>

<script>
import LandingHeader from './LandingHeader.vue';

export default {
    name: 'LandingShell',
    components: { LandingHeader },
    emits: ['home'],
};
</script>

<style scoped>
/* ── theme tokens — light defaults; dark overrides below.
   These cascade to all slotted content (custom props inherit). ── */
.landingShell {
    --lp-bg: #eef3fb;
    --lp-glow-1: rgba(79, 142, 247, 0.10);
    --lp-glow-2: rgba(55, 224, 200, 0.07);
    --lp-text: #16223a;
    --lp-text-2: #46546b;
    --lp-text-3: #1f3b68;
    --lp-text-faint: #9aa6b8;
    --lp-accent: #2f6fe0;
    --lp-teal: #12a08f;
    --lp-card-bg: linear-gradient(180deg, #ffffff 0%, #f3f7ff 100%);
    --lp-card-border: rgba(40, 70, 130, 0.16);
    --lp-card-shadow: 0 1px 2px rgba(20, 40, 80, 0.06);
    --lp-panel-bg: #f2f6fc;
    --lp-panel-border: rgba(40, 70, 130, 0.16);
    --lp-badge-bg: rgba(40, 70, 130, 0.05);
    --lp-badge-border: rgba(40, 70, 130, 0.18);
    --lp-divider: rgba(40, 70, 130, 0.10);

    min-height: 100vh;
    background:
        radial-gradient(ellipse 70% 50% at 20% 0%, var(--lp-glow-1) 0%, transparent 60%),
        radial-gradient(ellipse 70% 50% at 85% 30%, var(--lp-glow-2) 0%, transparent 60%),
        var(--lp-bg);
    color: var(--lp-text);
    padding: 22px 0 56px;
    /* scaled illustrations / glow can bleed past the viewport edge — guard
       against horizontal scroll without affecting vertical scrolling */
    overflow-x: hidden;
    transition: background-color 0.3s ease, color 0.3s ease;
}

.body--dark .landingShell {
    --lp-bg: #070b14;
    --lp-glow-1: rgba(79, 142, 247, 0.12);
    --lp-glow-2: rgba(55, 224, 200, 0.08);
    --lp-text: #e8edf5;
    --lp-text-2: #aab6c8;
    --lp-text-3: #8a94a6;
    --lp-text-faint: #6f7c92;
    --lp-accent: #4f8ef7;
    --lp-teal: #37e0c8;
    --lp-card-bg: linear-gradient(180deg, rgba(255, 255, 255, 0.035) 0%, rgba(255, 255, 255, 0.012) 100%);
    --lp-card-border: rgba(130, 160, 210, 0.14);
    --lp-card-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
    --lp-panel-bg: rgba(8, 12, 22, 0.6);
    --lp-panel-border: rgba(130, 160, 210, 0.16);
    --lp-badge-bg: rgba(255, 255, 255, 0.03);
    --lp-badge-border: rgba(120, 150, 210, 0.22);
    --lp-divider: rgba(130, 160, 210, 0.10);
}
</style>
