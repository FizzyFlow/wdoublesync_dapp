<template>
    <q-list separator>
        <q-item
            v-for="(b, i) in boxes"
            :key="b.id"
            clickable
            :active="b.id === selectedId"
            active-class="layerList_active"
            @click="$emit('select', b.id)"
        >
            <q-item-section avatar>
                <q-icon
                    :name="isConn(b) ? 'timeline' : (b.icon || (b.shape === 'hex' ? 'hexagon' : 'crop_square'))"
                    :style="{ color: b.color || 'var(--q-primary)' }"
                />
            </q-item-section>
            <q-item-section>
                <q-item-label>{{ isConn(b) ? 'Connector' : (b.icon || (b.shape === 'hex' ? 'Hex' : 'Box')) }} {{ i + 1 }}</q-item-label>
                <q-item-label caption>
                    <template v-if="isConn(b)">line · {{ b.dashed ? 'dashed' : 'solid' }}</template>
                    <template v-else>{{ b.w }}×{{ b.d }}×{{ b.h }} @ ({{ b.x }}, {{ b.y }}, {{ b.z }})</template>
                </q-item-label>
            </q-item-section>
            <q-item-section side>
                <div class="row items-center no-wrap">
                    <q-btn flat dense round size="sm" :icon="b.hidden ? 'visibility_off' : 'visibility'"
                        @click.stop="$emit('toggle-hidden', b.id)" />
                    <q-btn flat dense round size="sm" icon="keyboard_arrow_up" :disable="i === 0"
                        @click.stop="$emit('move-up', b.id)" />
                    <q-btn flat dense round size="sm" icon="keyboard_arrow_down" :disable="i === boxes.length - 1"
                        @click.stop="$emit('move-down', b.id)" />
                    <q-btn flat dense round size="sm" icon="delete" color="negative"
                        @click.stop="$emit('remove', b.id)" />
                </div>
            </q-item-section>
        </q-item>

        <q-item v-if="!boxes.length">
            <q-item-section class="text-grey text-center">No boxes yet — use “Add”.</q-item-section>
        </q-item>
    </q-list>
</template>

<script>
export default {
    name: 'LayerList',
    props: {
        boxes: { type: Array, required: true },
        selectedId: { type: String, default: null },
    },
    emits: ['select', 'remove', 'toggle-hidden', 'move-up', 'move-down'],
    methods: {
        isConn(b) {
            return (Array.isArray(b.points) && b.points.length >= 2)
                || (Array.isArray(b.from) && Array.isArray(b.to));
        },
    },
};
</script>

<style scoped>
.layerList_active {
    background: color-mix(in srgb, var(--q-primary) 16%, transparent);
    color: var(--q-primary);
}
</style>
