<template>
    <WalrusMediaModal
        :isOpen="true"
        :title="item.name"
        @close="onClose"
    >
        <textarea
            class="textEditorArea"
            v-model="text"
            :readonly="readOnly"
            ref="textarea"
        ></textarea>
        <template #actions>
            <button class="modalButton modalButtonCancel" @click="onClose">Cancel</button>
            <button class="modalButton modalButtonOk" @click="onSave" v-if="!readOnly">Save</button>
        </template>
    </WalrusMediaModal>
</template>

<script>
import WalrusMediaModal from './WalrusMediaModal.vue';
import { toRaw } from 'vue';

export default {
    name: 'WalrusMediaTextEditor',
    components: {
        WalrusMediaModal,
    },
    props: {
        item: {
            type: Object,
            required: true,
        },
        readOnly: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['saved', 'close'],
    data() {
        return {
            text: '',
        };
    },
    mounted() {
        this.text = toRaw(this.item).getTextContent();
        this.$nextTick(() => {
            if (this.$refs.textarea) {
                this.$refs.textarea.focus();
            }
        });
    },
    methods: {
        onSave() {
            toRaw(this.item).setTextContent(this.text);
            this.$emit('saved');
        },
        onClose() {
            this.$emit('close');
        },
    },
}
</script>

<style scoped>
.textEditorArea {
    width: 100%;
    min-width: 500px;
    height: 400px;
    font-family: monospace;
    font-size: 13px;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    resize: vertical;
    outline: none;
    box-sizing: border-box;
    line-height: 1.5;
}

.textEditorArea:focus {
    border-color: #1976d2;
}

@media screen and (max-width: 600px) {
    .textEditorArea {
        min-width: unset;
        width: 100%;
    }
}
</style>
