<template>
    <q-input
        :model-value="modelValue || ''"
        @update:model-value="onInput"
        :label="label"
        :placeholder="allowInherit ? 'inherit' : ''"
        dense filled
        :clearable="allowInherit"
        @clear="$emit('update:modelValue', null)"
    >
        <template #prepend>
            <div class="colorField_swatch" :style="{ background: modelValue || 'transparent' }"></div>
        </template>
        <template #append>
            <q-icon name="colorize" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-color
                        :model-value="pickerValue"
                        @update:model-value="(v) => $emit('update:modelValue', v)"
                        no-header-tabs
                        default-view="palette"
                    />
                </q-popup-proxy>
            </q-icon>
        </template>
    </q-input>
</template>

<script>
export default {
    name: 'ColorField',
    props: {
        modelValue: { type: String, default: null },
        label: { type: String, default: 'Color' },
        allowInherit: { type: Boolean, default: false },
    },
    emits: ['update:modelValue'],
    computed: {
        pickerValue() {
            return /^#/.test(this.modelValue || '') ? this.modelValue : '#5b9bff';
        },
    },
    methods: {
        onInput(v) {
            this.$emit('update:modelValue', v === '' ? null : v);
        },
    },
};
</script>

<style scoped>
.colorField_swatch {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    border: 1px solid rgba(128, 128, 128, 0.5);
}
</style>
