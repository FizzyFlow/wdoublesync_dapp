<template>
    <section class="landingFeatures">
        <div class="landingFeatures_inner">

            <!-- Decentralized — grid platform with scattered nodes -->
            <div class="landingFeatures_col">
                <FeatureCard
                    icon="shield"
                    color="#4f8ef7"
                    title="Decentralized"
                    description="No single server. No single point of failure. Your data lives on Walrus, coordinated by Sui."
                >
                    <IsoStack color="#4f8ef7" :scale="20" :stroke-width="isoStrokeWidth" :fog="0.3" :glow="isoGlow">
                        <IsoBox :x="0" :y="0" :z="0" :w="7" :d="7" :h="0.5" :grid="3" :fill-opacity="0.05" />
                        <IsoBox :x="-1.5" :y="-1.5" :z="0.5" :w="1.7" :d="1.7" :h="1.7" :fill-opacity="0.12" />
                        <IsoBox :x="1.7" :y="-0.8" :z="0.5" :w="1.5" :d="1.5" :h="1.5" :fill-opacity="0.12" />
                        <IsoBox :x="0.2" :y="1.8" :z="0.5" :w="1.5" :d="1.5" :h="1.5" :fill-opacity="0.12" />
                    </IsoStack>
                </FeatureCard>
            </div>

            <!-- Private by default — stepped platform with a locked tile -->
            <div class="landingFeatures_col">
                <FeatureCard
                    icon="lock"
                    color="#5b8fd6"
                    title="Private by default"
                    description="Files are encrypted with Seal before they leave your device. Your wallet, your keys, your data."
                >
                    <IsoStack color="#5b8fd6" :scale="20" :stroke-width="isoStrokeWidth" :fog="0.3" :glow="isoGlow">
                        <IsoBox :x="0" :y="0" :z="0" :w="7" :d="7" :h="0.5" :fill-opacity="0.04" />
                        <IsoBox :x="0" :y="0" :z="0.5" :w="4.2" :d="4.2" :h="0.6" :fill-opacity="0.06" />
                        <IsoBox :x="0" :y="0" :z="1.1" :w="2" :d="0.1" :h="2.6" :radius="0.4" icon="lock" :icon-size="1.1" :fill-opacity="0.14" />
                    </IsoStack>
                </FeatureCard>
            </div>

            <!-- Versioned & recoverable — stacked version layers under a cube -->
            <div class="landingFeatures_col">
                <FeatureCard
                    icon="view_in_ar"
                    color="#37e0c8"
                    title="Versioned &amp; recoverable"
                    description="Every change is a version. Restore anytime, from any device or environment."
                >
                    <IsoStack color="#37e0c8" :scale="19" :stroke-width="isoStrokeWidth" :fog="0.3" :glow="isoGlow">
                        <IsoBox :x="0" :y="0" :z="0" :w="6.5" :d="6.5" :h="0.45" :fill-opacity="0.05" />
                        <IsoBox :x="0" :y="0" :z="0.8" :w="6.5" :d="6.5" :h="0.45" :fill-opacity="0.05" />
                        <IsoBox :x="0" :y="0" :z="1.6" :w="6.5" :d="6.5" :h="0.45" :fill-opacity="0.05" />
                        <IsoBox :x="0" :y="0" :z="2.4" :w="2.3" :d="2.3" :h="2.3" :fill-opacity="0.13" />
                    </IsoStack>
                </FeatureCard>
            </div>

            <!-- Portable everywhere — laptop, terminal, phone -->
            <div class="landingFeatures_col">
                <FeatureCard
                    icon="cloud_upload"
                    color="#4f8ef7"
                    title="Portable everywhere"
                    description="Access your data from the web, the CLI, or integrate the sync layer into your own code."
                >
                    <IsoStack color="#4f8ef7" :scale="17" :stroke-width="isoStrokeWidth" :fog="0.3" :glow="isoGlow">
                        <IsoBox :x="0" :y="0" :z="0" :w="9.5" :d="5" :h="0.4" :grid="0" :fill-opacity="0.04" />
                        <IsoBox :x="-3" :y="0" :z="0.4" :w="2.2" :d="0.3" :h="1.5" :radius="0.2" icon="laptop" :icon-size="0.9" :fill-opacity="0.1" />
                        <IsoBox :x="0" :y="0" :z="0.4" :w="2.2" :d="0.3" :h="2.1" :radius="0.2" icon="terminal" :icon-size="0.9" :fill-opacity="0.1" />
                        <IsoBox :x="3" :y="0" :z="0.4" :w="1.1" :d="0.3" :h="2.2" :radius="0.3" icon="smartphone" :icon-size="0.8" :fill-opacity="0.1" />
                    </IsoStack>
                </FeatureCard>
            </div>

        </div>
    </section>
</template>

<script>
import FeatureCard from './FeatureCard.vue';
import IsoStack from '../Theme/IsoBox/IsoStack.vue';
import IsoBox from '../Theme/IsoBox/IsoBox.vue';

export default {
    name: 'LandingFeatures',
    components: { FeatureCard, IsoStack, IsoBox },
    computed: {
        // softer glow / heavier stroke in light mode so the wireframes read
        // against a light background instead of blooming
        isoGlow() {
            return this.$q.dark.isActive ? 7 : 1;
        },
        isoStrokeWidth() {
            return this.$q.dark.isActive ? 1.3 : 1.1;
        },
    },
};
</script>

<style scoped>
.landingFeatures {
}

/* CSS grid (instead of Quasar's q-col-gutter row) so the outer card edges
   sit exactly at the container edges — aligning with the hero block above,
   which shares the same max-width / padding. */
.landingFeatures_inner {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    max-width: 1600px;
    margin: 0 auto;
}

.landingFeatures_col {
    min-width: 0;
}

@media (max-width: 1023px) {
    .landingFeatures_inner {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 599px) {
    .landingFeatures_inner {
        grid-template-columns: minmax(0, 1fr);
    }
}

/* The IsoStack root is width:100% with an SVG sized to fill it; give it a fixed
   height so every card's illustration occupies the same footprint. (.isoStack
   carries this component's scope id because it's authored here, so no :deep
   needed — its inner .isoStack_svg is height:100% and follows along.) */
.isoStack {
    height: 150px;
}
</style>
