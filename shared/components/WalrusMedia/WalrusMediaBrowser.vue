<template>

    <div
        class="walrusMediaBrowser"
        :class="{ 'draggingOver': isDragging }"
        @dragenter.prevent="handleDragEnter"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
    >
        <WalrusMediaTopLeftMenu :walrusMediaFolder="currentFolder1" :primaryColor="primaryColor" :readOnly="readOnly" @filesSelected="onFilesSelected" />

        <WalrusMediaTopRightMenu v-if="activeTab == 1" ref="topMenu1" :walrusMediaFolder="currentFolder1" :primaryColor="primaryColor" @close="onClose" :readOnly="readOnly" />
        <WalrusMediaTopRightMenu v-if="activeTab == 2" ref="topMenu2" :walrusMediaFolder="currentFolder2" :primaryColor="primaryColor" @close="onClose" :readOnly="readOnly" />

        <div :style="{height: height}" style="position: relative; overflow: hidden; z-index: 500;">
            <WalrusMediaFolderView
                v-if="currentFolder1"
                :walrusMediaFolder="currentFolder1"
                :height="height"
                :rowHeight="rowHeight"
                :primaryColor="primaryColor"
                ref="tab_1"
                @itemClick="onItemClick"
                @mkdir="onContextMakeDir"
                @newFile="onContextNewFile"
                @refresh="onContextRefresh"
            />
            <WalrusMediaFolderView
                v-if="currentFolder2"
                :walrusMediaFolder="currentFolder2"
                :height="height"
                :rowHeight="rowHeight"
                :primaryColor="primaryColor"
                ref="tab_2"
                @itemClick="onItemClick"
                @mkdir="onContextMakeDir"
                @newFile="onContextNewFile"
                @refresh="onContextRefresh"
            />
        </div>

        <WalrusMediaBottomLeftMenu :walrusMediaFolder="currentFolder1" :primaryColor="primaryColor" />

        <div class="dropzoneContent" :class="{ 'visible': isDragging }">
            <p>EndlessVectorWalrus</p>
            <p class="dropzoneHint">Drop files here</p>
        </div>

        <div class="initializingOverlay" :class="{ 'visible': isInitializing }">
            <Spinner :size="48" />
        </div>

        <WalrusMediaViewer
            :resource="viewingMediaItem"
            :walrusMediaFolder="activeTab == 1 ? currentFolder1 : currentFolder2"
            :browserWidth="browserWidth"
            :browserHeight="browserHeight"
            @hide="viewingMediaItem = null"
        />

        <WalrusMediaTextEditor
            v-if="editingTextItem"
            :item="editingTextItem"
            :readOnly="readOnly"
            @saved="onTextSaved"
            @close="editingTextItem = null"
        />

    </div>

</template>
<script>
import WalrusMediaDoubleSyncFolder from './includes/WalrusMediaDoubleSyncFolder.js';
import WalrusMediaFolderView from './WalrusMediaFolderView.vue';
import WalrusMediaTopLeftMenu from './menus/WalrusMediaTopLeftMenu.vue';
import WalrusMediaTopRightMenu from './menus/WalrusMediaTopRightMenu.vue';
import WalrusMediaBottomLeftMenu from './menus/WalrusMediaBottomLeftMenu.vue';
import WalrusMediaViewer from './WalrusMediaViewer.vue';
import WalrusMediaTextEditor from './menus/WalrusMediaTextEditor.vue';
import Spinner from './helpers/Spinner.vue';
import { shallowRef } from 'vue';


export default {
    name: 'WalrusMediaBrowser',
    components:{
        WalrusMediaFolderView,
        WalrusMediaTopLeftMenu,
        WalrusMediaTopRightMenu,
        WalrusMediaBottomLeftMenu,
        WalrusMediaViewer,
        WalrusMediaTextEditor,
        Spinner,
    },
    props: {
        rootFolder: {
            type: Object,
            required: true,
        },
        readOnly: {
            type: Boolean,
            required: false,
            default: false,
        },
        height: {
            type: String,
            required: false,
            default: '600px',
        },
        rowHeight: {
            type: String,
            required: false,
            default: '200px',
        },
        primaryColor: {
            type: String,
            required: false,
            default: '#2196F3',
        },
    },
    emits: ['close', 'change'],
    data() {
        return {
            isDragging: false,
            dragCounter: 0,

            currentFolder1: shallowRef(null),
            currentFolder2: shallowRef(null),
            isInitializing: true,

            activeTab: 1,
            viewingMediaItem: null,
            editingTextItem: null,
            browserWidth: 0,
            browserHeight: 0,
        }
    },
    methods: {
        updateBrowserDimensions() {
            this.browserWidth = this.$el?.offsetWidth || window.innerWidth;
            this.browserHeight = this.$el?.offsetHeight || window.innerHeight;
        },
        onClose() {
            this.$emit('close');
        },
        onItemClick(item) {
            if (item.isFolder) {
                this.goToFolder(item);
            } else if (item.isBackButton) {
                this.goToFolder(item.parent);
            } else if (item.isText) {
                this.editingTextItem = item;
            } else {
                this.viewingMediaItem = item;
            }
        },
        async goToFolder(folder) {
            if (this.activeTab == 1) {
                if (this.currentFolder2 && this.currentFolder2.fullPath != folder.fullPath) {
                    this.currentFolder2 = null;
                    await new Promise((res) => setTimeout(res, 10));
                }
                this.currentFolder2 = folder;
                folder.on('change', () => this.$emit('change'));
                await this.$nextTick();
                await this.currentFolder2.load();
                await Promise.all([ this.$refs.tab_1.sendToBack(), this.$refs.tab_2.bringToFront() ]);
                this.activeTab = 2;
            } else {
                if (this.currentFolder1 && this.currentFolder1.fullPath != folder.fullPath) {
                    this.currentFolder1 = null;
                    await new Promise((res) => setTimeout(res, 10));
                }
                this.currentFolder1 = folder;
                folder.on('change', () => this.$emit('change'));
                await this.$nextTick();
                await this.currentFolder1.load();
                await Promise.all([ this.$refs.tab_2.sendToBack(), this.$refs.tab_1.bringToFront() ]);
                this.activeTab = 1;
            }
        },
        handleDragEnter() {
            this.dragCounter++;
            this.isDragging = true;
        },
        handleDragOver() {},
        handleDragLeave() {
            this.dragCounter--;
            if (this.dragCounter === 0) {
                this.isDragging = false;
            }
        },
        handleDrop(e) {
            this.dragCounter = 0;
            this.isDragging = false;
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                files.forEach(file => this.dropFile(file));
            }
        },
        onFilesSelected(files) {
            files.forEach(file => this.dropFile(file));
        },
        async dropFile(file) {
            const isMedia = file.type.startsWith('image/') || file.type.startsWith('video/');
            const isText = file.type.startsWith('text/') || file.type === 'application/json';
            if (!isMedia && !isText) {
                return;
            }

            const activeFolder = this.activeTab == 1 ? this.currentFolder1 : this.currentFolder2;
            await activeFolder.pushMediaFile(file);
            this.$emit('change');

            this.$nextTick(() => {
                const tabRef = this.activeTab == 1 ? this.$refs.tab_1 : this.$refs.tab_2;
                if (tabRef) tabRef.scrollToBottom();
            });
        },
        onContextMakeDir() {
            const menu = this.activeTab == 1 ? this.$refs.topMenu1 : this.$refs.topMenu2;
            if (menu) menu.onMakeDir();
        },
        onContextNewFile() {
            const menu = this.activeTab == 1 ? this.$refs.topMenu1 : this.$refs.topMenu2;
            if (menu) menu.onNewFile();
        },
        onContextRefresh() {
            const menu = this.activeTab == 1 ? this.$refs.topMenu1 : this.$refs.topMenu2;
            if (menu) menu.onRefresh();
        },
        onTextSaved() {
            this.$emit('change');
            this.editingTextItem = null;
        },
        handlePaste(e) {
            if (!e.clipboardData || !e.clipboardData.items) return;
            for (const item of e.clipboardData.items) {
                if (item.type.startsWith('image/')) {
                    e.preventDefault();
                    const blob = item.getAsFile();
                    if (blob) {
                        const timestamp = Date.now();
                        const ext = blob.type.split('/')[1] || 'png';
                        const file = new File([blob], `pasted-image-${timestamp}.${ext}`, {
                            type: blob.type,
                            lastModified: timestamp,
                        });
                        this.dropFile(file);
                    }
                    break;
                }
            }
        },
        async initialize() {
            this.currentFolder1 = this.rootFolder;
            await this.currentFolder1.load();
            this.currentFolder1.on('change', () => this.$emit('change'));
            this.$nextTick(() => {
                if (this.$refs.tab_1) this.$refs.tab_1.bringToFront();
            });
            this.isInitializing = false;
        },
    },
    unmounted() {
        window.removeEventListener('resize', this.updateBrowserDimensions);
        window.removeEventListener('paste', this.handlePaste);
    },
    beforeMount() {
        if (!this.rootFolder) {
            throw new Error('WalrusMediaBrowser: "rootFolder" prop is required.');
        }
        this.initialize();
    },
    mounted() {
        this.updateBrowserDimensions();
        window.addEventListener('resize', this.updateBrowserDimensions);
        window.addEventListener('paste', this.handlePaste);
    }
}


</script>
<style lang="css">

.walrusMediaBrowser {
    position: relative;
    height: 100%;
    min-height: 300px;
    border: 2px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
    margin: 0;
    transition: all 0.3s ease;
    user-select: none;
    overflow: hidden;
    border-radius: 8px;
}

.walrusMediaBrowser.draggingOver {
    /* border-color: #4CAF50; */
    border: 2px dashed #4CAF50;
    background-color: rgba(76, 175, 80, 0.5);
}

.dropzoneContent {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.85);
    border-radius: 8px;
    text-align: center;
    z-index: 10;
    opacity: 0;
    border: none;
    pointer-events: none;
    transition: opacity 0.2s ease;
}

.dropzoneContent.visible {
    opacity: 1;
    pointer-events: auto;
}

.dropzoneHint {
    color: #666;
    font-size: 14px;
    margin-top: 10px;
}

.walrusMediaBrowser.draggingOver .dropzoneHint {
    color: #4CAF50;
    font-weight: bold;
}

.initializingOverlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.9);
    z-index: 1000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease-out;
}

.initializingOverlay.visible {
    opacity: 1;
    pointer-events: auto;
}

</style>
