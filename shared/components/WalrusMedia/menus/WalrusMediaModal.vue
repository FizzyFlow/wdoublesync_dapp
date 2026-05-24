<template>
    <div class="modalOverlay walrusMediaModal" :class="{ 'visible': isOpen }" @click="onClose">
        <div class="modalDialog" @click.stop>
            <h3 class="modalTitle" v-if="title">{{ title }}</h3>
            <div class="modalContent">
                <slot></slot>
            </div>
            <div class="modalActions" v-if="$slots.actions">
                <slot name="actions"></slot>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'WalrusMediaModal',
    props: {
        isOpen: {
            type: Boolean,
            required: true,
        },
        title: {
            type: String,
            default: '',
        },
    },
    emits: ['close'],
    methods: {
        onClose() {
            this.$emit('close');
        },
    },
}
</script>

<style scoped>
.modalOverlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, visibility 0.2s;
}

.modalOverlay.visible {
    opacity: 1;
    visibility: visible;
}

.modalDialog {
    background-color: white;
    border-radius: 8px;
    padding: 12px 16px;
    min-width: 320px;
    max-width: 90%;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    transform: scale(0.9);
    transition: transform 0.2s ease;
}

.modalOverlay.visible .modalDialog {
    transform: scale(1);
}

.modalTitle {
    margin: 0 0 10px 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
}

.modalContent {
    flex: 1;
    overflow-y: auto;
}

.modalActions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 10px;
}
</style>

<style>
/* Global styles for modal buttons - not scoped so child components can use them */
.walrusMediaModal .modalButton {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s ease;
}

.walrusMediaModal .modalButton:hover {
    opacity: 0.9;
}

.walrusMediaModal .modalButton:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.walrusMediaModal .modalButtonCancel {
    background-color: #f5f5f5;
    color: #333;
}

.walrusMediaModal .modalButtonOk {
    background-color: #1976d2;
    color: white;
}

.walrusMediaModal .modalInput {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    box-sizing: border-box;
    outline: none;
    transition: border-color 0.2s ease;
}

.walrusMediaModal .modalInput:focus {
    border-color: #1976d2;
}
</style>
