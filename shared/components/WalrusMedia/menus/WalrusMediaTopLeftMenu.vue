<template>
    <div class="walrusMediaTopLeftMenu" :class="{ walrusMediaTopLeftMenuDisabled: readOnly }">
        <div class="pendingChangesChip" :style="{ backgroundColor: primaryColor }" @click="onChipClick">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <svg v-if="isImplementing" class="spinner" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" opacity="0.25"></circle>
                <path d="M12 2a10 10 0 0 1 10 10"></path>
            </svg>
            <span v-else-if="pendingChangesCount">{{ pendingChangesCount }}</span>
        </div>
        <input
            ref="fileInput"
            type="file"
            multiple
            accept="image/*,video/*,.txt,.md,.json,.js,.css,.html,.xml,.csv,.log"
            style="display: none;"
            @change="onFilesSelected"
        />
    </div>
</template>

<script>
import { shallowRef } from 'vue';

export default {
    name: 'WalrusMediaTopLeftMenu',
    props: {
        walrusMediaFolder: {
            type: Object,
            required: false,
        },
        primaryColor: {
            type: String,
            required: false,
            default: '#2196F3',
        },
        readOnly: {
            type: Boolean,
            required: false,
            default: false,
        },
    },
    emits: ['filesSelected'],
    data() {
        return {
            pendingChangesCount: 0,
            isImplementing: false,
            pendingChangesRef: shallowRef(null),
        }
    },
    watch: {
        walrusMediaFolder: {
            handler(newVal, oldVal) {
                this.storePendingChangesRef();
            },
            immediate: true,
        },
    },
    methods: {
        onChipClick() {
            if (this.readOnly) return;
            if (this.pendingChangesCount > 0) {
                this.handleImplementChanges();
            } else {
                this.$refs.fileInput.click();
            }
        },
        onFilesSelected(e) {
            const files = Array.from(e.target.files || []);
            if (files.length) {
                this.$emit('filesSelected', files);
            }
            e.target.value = '';
        },
        async handleImplementChanges() {
            if (this.walrusMediaFolder && !this.isImplementing) {
                this.isImplementing = true;
                try {
                    await this.walrusMediaFolder.implementChanges();
                } finally {
                    this.isImplementing = false;
                }
            }
        },
        storePendingChangesRef() {
            if (this.walrusMediaFolder && !this.pendingChangesRef) {
                this.pendingChangesRef = this.walrusMediaFolder.pendingChanges;
                this.__onPendingChangesChange = (change) => {
                    console.log('New change:', change);
                    this.pendingChangesCount = this.pendingChangesRef.pendingCount;
                };
                this.pendingChangesCount = this.pendingChangesRef.pendingCount;
                this.pendingChangesRef.on('change', this.__onPendingChangesChange);
            }
        },
    },
    mounted() {
        this.storePendingChangesRef();
    },
    beforeUnmount() {
        if (this.__onPendingChangesChange && this.pendingChangesRef) {
            this.pendingChangesRef.off('change', this.__onPendingChangesChange);
        }
    },
}
</script>

<style scoped>
.walrusMediaTopLeftMenu {
    position: sticky;
    height: 0;
    top: 0px;
    overflow: visible;
    z-index: 9150;
}

.pendingChangesChip {
    cursor: pointer;
    position: relative;
    top: calc(8px - 100%);
    left: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 24px;
    height: 34px;
    padding: 12px 12px;
    color: white;
    border-radius: 24px;
    font-size: 12px;
    font-weight: 600;
    z-index: 100;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    opacity: 0.9;
}

.pendingChangesChip:hover {
    opacity: 1.0;
}

.walrusMediaTopLeftMenuDisabled .pendingChangesChip {
    opacity: 0.5;
    cursor: not-allowed;
}


.pendingChangesChip svg {
    flex-shrink: 0;
}

.spinner {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>
