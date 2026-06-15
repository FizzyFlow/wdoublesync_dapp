<template>
    <q-dialog :model-value="modelValue" @update:model-value="(v) => $emit('update:modelValue', v)">
        <q-card style="width: 660px; max-width: 92vw">
            <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">Export — Vue template</div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>
            <q-card-section>
                <q-input
                    type="textarea"
                    filled readonly autogrow
                    :model-value="code"
                    input-style="font-family: monospace; font-size: 12px; line-height: 1.5;"
                />
            </q-card-section>
            <q-card-actions align="right">
                <q-btn flat label="Copy" icon="content_copy" color="primary" @click="copy" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script>
import { copyToClipboard } from 'quasar';

export default {
    name: 'CodeExportDialog',
    props: {
        modelValue: { type: Boolean, default: false },
        code: { type: String, default: '' },
    },
    emits: ['update:modelValue'],
    methods: {
        copy() {
            copyToClipboard(this.code).then(() => {
                this.$q.notify({ message: 'Template copied', color: 'positive', icon: 'check', timeout: 1200 });
            });
        },
    },
};
</script>
