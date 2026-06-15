<template>
    <header class="landingHeader">
        <div class="landingHeader_inner">
            <a class="landingHeader_brand" href="/" @click.prevent="$emit('home')">
                <img src="/logo.png" class="landingHeader_logo" alt="WDoubleSync logo" />
                <span class="landingHeader_word">
                    <span class="landingHeader_word--main">WDouble</span><span class="landingHeader_word--accent">Sync</span>
                </span>
            </a>
        </div>
    </header>
</template>

<script>
export default {
    name: 'LandingHeader',
    emits: ['home'],
};
</script>

<style scoped>
.landingHeader {
    position: relative;
    z-index: 2;
    /* padding on the outer element (inner is the centered max-width box) so the
       brand lines up with the hero/sections, which use the same structure */
    padding: 0 24px;
}

.landingHeader_inner {
    display: flex;
    align-items: center;
    max-width: 1600px;
    margin: 0 auto;
}

.landingHeader_brand {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    -webkit-tap-highlight-color: transparent;
}

.landingHeader_logo {
    height: 34px;
    width: auto;
    display: block;
    filter: drop-shadow(0 0 10px color-mix(in srgb, var(--lp-accent) 35%, transparent));
}

.landingHeader_word {
    font-family: var(--font-display, inherit);
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.5px;
    line-height: 1;
    /* gradient wordmark — main text → accent, clipped to the glyphs */
    background: linear-gradient(95deg, var(--lp-text) 0%, var(--lp-text) 35%, var(--lp-accent) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
}

.landingHeader_word--accent {
    /* the accent half also carries a subtle glow for emphasis */
    text-shadow: 0 0 18px color-mix(in srgb, var(--lp-accent) 30%, transparent);
}

@media (max-width: 599px) {
    .landingHeader_word {
        font-size: 20px;
    }

    .landingHeader_logo {
        height: 28px;
    }
}
</style>
