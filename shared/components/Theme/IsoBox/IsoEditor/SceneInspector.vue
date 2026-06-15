<template>
    <div class="q-px-md q-py-md q-gutter-y-sm">
        <ColorField v-model="stack.color" label="Stroke color" />
        <ColorField v-model="stack.surface" label="Surface (solid fills)" />
        <div class="iso_sliderRow"><span>Scale</span><q-slider v-model="stack.scale" :min="4" :max="40" :step="1" label /></div>
        <div class="iso_sliderRow"><span>Angle</span><q-slider v-model="stack.angle" :min="0" :max="60" :step="1" label /></div>
        <div class="iso_sliderRow"><span>Glow</span><q-slider v-model="stack.glow" :min="0" :max="30" :step="1" label /></div>
        <div class="iso_sliderRow"><span>Fog</span><q-slider v-model="stack.fog" :min="0" :max="1" :step="0.05" label /></div>
        <div class="row q-col-gutter-sm">
            <q-input class="col" dense filled type="number" label="Fog near" v-model.number="stack.fogNear" />
            <q-input class="col" dense filled type="number" label="Fog far" v-model.number="stack.fogFar" />
        </div>
        <div class="iso_sliderRow"><span>Stroke</span><q-slider v-model="stack.strokeWidth" :min="0.5" :max="4" :step="0.1" label /></div>
        <div class="iso_sliderRow"><span>Fill</span><q-slider v-model="stack.fillOpacity" :min="0" :max="0.4" :step="0.01" label /></div>
        <q-toggle v-model="stack.solid" label="Solid mode (occlusion fills)" />
        <q-input dense filled label="viewBox" v-model="stack.viewBox" hint="minX minY width height" />
        <q-input dense filled label="aria-label" v-model="stack.ariaLabel" />
    </div>
</template>

<script>
import ColorField from './ColorField.vue';

export default {
    name: 'SceneInspector',
    components: { ColorField },
    props: {
        stack: { type: Object, required: true },
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
</style>
