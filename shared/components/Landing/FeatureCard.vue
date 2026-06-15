<template>
    <q-card flat class="featureCard" :style="cssVars">
        <div class="featureCard_icon">
            <q-icon :name="icon" size="40px" />
        </div>
        <div class="featureCard_title">{{ title }}</div>
        <div class="featureCard_desc">{{ description }}</div>
        <div class="featureCard_art">
            <slot />
        </div>
    </q-card>
</template>

<script>
export default {
    name: 'FeatureCard',
    props: {
        icon: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, default: '' },
        // accent colour for the icon glow — any CSS colour or theme var
        color: { type: String, default: 'var(--q-primary)' },
    },
    computed: {
        cssVars() {
            return { '--feat-color': this.color };
        },
    },
};
</script>

<style scoped>
.featureCard {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 32px 24px 8px;
    border-radius: 16px;
    background: var(--lp-card-bg, linear-gradient(180deg, rgba(255, 255, 255, 0.035) 0%, rgba(255, 255, 255, 0.012) 100%));
    border: 1px solid var(--lp-card-border, rgba(130, 160, 210, 0.14));
    box-shadow: var(--lp-card-shadow, inset 0 1px 0 rgba(255, 255, 255, 0.04));
}

.featureCard_icon {
    color: var(--feat-color);
    margin-bottom: 18px;
    filter: drop-shadow(0 0 12px color-mix(in srgb, var(--feat-color) 55%, transparent));
}

.featureCard_title {
    font-family: var(--font-display, inherit);
    font-size: 18px;
    font-weight: 600;
    color: var(--lp-text, #e8edf5);
    margin-bottom: 12px;
}

.featureCard_desc {
    font-size: 13px;
    line-height: 1.65;
    color: var(--lp-text-3, #8a94a6);
    max-width: 240px;
}

/* the isometric illustration sits at the bottom of the card */
.featureCard_art {
    margin-top: auto;
    width: 100%;
    padding-top: 16px;
}
</style>
