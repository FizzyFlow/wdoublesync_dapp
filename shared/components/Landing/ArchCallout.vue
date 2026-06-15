<template>
    <div class="archCallout">
        <q-icon :name="icon" size="18px" class="archCallout_icon" :style="{ color }" />
        <div class="archCallout_body">
            <div class="archCallout_title">{{ title }}</div>
            <div class="archCallout_sub">{{ sub }}</div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ArchCallout',
    props: {
        icon: { type: String, required: true },
        title: { type: String, required: true },
        sub: { type: String, default: '' },
        color: { type: String, default: '#5b9bff' },
    },
};
</script>

<style scoped>
.archCallout {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    max-width: 230px;
    padding: 11px 15px;
    border-radius: 12px;
    background: rgba(12, 18, 30, 0.85);
    border: 1px solid rgba(120, 150, 210, 0.22);
    box-shadow: 0 8px 24px -12px rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
}

.archCallout_title {
    font-size: 13px;
    font-weight: 600;
    color: #e8edf5;
    line-height: 1.2;
}

.archCallout_sub {
    font-size: 11px;
    line-height: 1.35;
    color: #8a94a6;
    margin-top: 2px;
}
</style>
