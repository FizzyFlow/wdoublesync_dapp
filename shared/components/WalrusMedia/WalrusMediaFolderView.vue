<template>
    <div 
        class="rowsContainer" 
        :class="{rowsContainerActive: isOnFront}"
        :style="{zIndex: zIndex, minHeight: height, maxHeight: height, '--row-height': rowHeight }" ref="rowsContainer">
        <WalrusMediaBrowserRow v-for="(item, index) in rows" :row="item" :primaryColor="primaryColor" :key="item.id" ref="rows"
            @itemClick="onItemClick"  />
    </div>
</template>

<script>
import WalrusMediaBrowserRow from './WalrusMediaBrowserRow.vue';
import { toRaw, shallowReactive } from 'vue';

export default {
    name: 'WalrusMediaFolderView',
    components: {
        WalrusMediaBrowserRow,
    },
    props: {
        walrusMediaFolder: {
            type: Object,
            required: true,
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
    data() {
        return {
            isOnFront: false,
            zIndex: 9000,

            rows: shallowReactive([]),
            rowsIds: {},
            cachedRowHeight: null,
            firstRowToKeep: 0,
            lastRowToKeep: 0,
        }
    },
    watch: {
        rowHeight: function() {
            this.cachedRowHeight = null;
        },
        // walrusMediaFolder: function(newFolder, oldFolder) {
        //     console.log('WalrusMediaFolderView: walrusMediaFolder changed:', newFolder, oldFolder);
        //     this.rows = newFolder.rows || [];
        //     console.log('New rows:', this.rows);
        //     this.cachedRowHeight = null;
        //     this.firstRowToKeep = 0;
        //     this.lastRowToKeep = 0;
        //     this.detachEventsFromFolder(oldFolder);
        //     this.attachEventsToFolder(newFolder);
        // },
    },
    methods: {
        onItemClick(item) {
            this.$emit('itemClick', item);
        },
        async bringToFront() {
            this.isOnFront = true;
            await new Promise((res)=>setTimeout(res, 300));
            this.zIndex = 9001;
        },
        async sendToBack() {
            this.isOnFront = false;
            await new Promise((res)=>setTimeout(res, 300));
            this.zIndex = 9000;
        },
        disposeRow(rowIndex) {
            if (this.$refs.rows && this.$refs.rows[rowIndex]) {
                this.$refs.rows[rowIndex].dispose();
            }
        },
        restoreRow(rowIndex) {
            if (this.$refs.rows && this.$refs.rows[rowIndex]) {
                this.$refs.rows[rowIndex].restore();
            }
        },
        isRowVisible(rowIndex) {
            const container = this.$refs.rowsContainer;
            if (!container || rowIndex < 0 || rowIndex >= this.rows.length) {
                return false;
            }

            if (this.cachedRowHeight === null) {
                if (this.$refs.rows && this.$refs.rows[0] && this.$refs.rows[0].$el) {
                    this.cachedRowHeight = this.$refs.rows[0].$el.offsetHeight;
                } else {
                    this.cachedRowHeight = 200;
                }
            }

            const rowTop = rowIndex * this.cachedRowHeight;
            const rowBottom = rowTop + this.cachedRowHeight;

            const containerScrollTop = container.scrollTop;
            const containerScrollBottom = containerScrollTop + container.clientHeight;

            return rowBottom >= containerScrollTop && rowTop <= containerScrollBottom;
        },
        recalculateVisibles(scrollTop = null, containerHeight = null) {
            let nScrollTop = scrollTop;
            let nContainerHeight = containerHeight;
            if (scrollTop === null || containerHeight === null) {
                const container = this.$refs.rowsContainer;
                nScrollTop = container.scrollTop;
                nContainerHeight = container.clientHeight;
            }

            if (this.cachedRowHeight === null) {
                if (this.$refs.rows && this.$refs.rows[0] && this.$refs.rows[0].$el) {
                    this.cachedRowHeight = this.$refs.rows[0].$el.offsetHeight;
                } else {
                    this.cachedRowHeight = 200;
                }
            }

            const firstVisibleRow = Math.floor(nScrollTop / this.cachedRowHeight);
            const lastVisibleRow = Math.ceil((nScrollTop + nContainerHeight) / this.cachedRowHeight);

            this.firstRowToKeep = Math.max(0, firstVisibleRow - 3);
            this.lastRowToKeep = Math.min(this.rows.length - 1, lastVisibleRow + 3);
        },
        onScrolled(event) {
            const container = event.target;
            const scrollTop = container.scrollTop;
            if (!this.__lastScrolledTop || Math.abs(this.__lastScrolledTop - scrollTop) > 200) {
                this.__lastScrolledTop = scrollTop;

                this.recalculateVisibles(scrollTop, container.clientHeight);

                for (let i = 0; i < this.rows.length; i++) {
                    if (i < this.firstRowToKeep || i > this.lastRowToKeep) {
                        this.disposeRow(i);
                    } else {
                        this.restoreRow(i);
                    }
                }
            }
        },
        async loadPreviewsInterval() {
            const delayTillNext = 10;
            try {
                for (let i = this.firstRowToKeep; i <= this.lastRowToKeep; i++) {
                    if (this.$refs.rows && this.$refs.rows[i]) {
                        const rowItems = this.$refs.rows[i].getItemsElements();
                        if (!rowItems || !rowItems.length) continue;
                        for (let j = 0; j < rowItems.length; j++) {
                            if (rowItems[j] && !rowItems[j].previewInitialized) {
                                await rowItems[j].initializePreview();
                                this.__loadPreviewsTimeout = setTimeout(() => {
                                    this.loadPreviewsInterval();
                                }, delayTillNext);
                                return true;
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('Error loading previews:', e);
            }
            this.__loadPreviewsTimeout = setTimeout(() => {
                this.loadPreviewsInterval();
            }, delayTillNext);
        },
        attachEventsToFolder() {
            this.walrusMediaFolder.on('rowAdded', this.__onRowAdded);
        },
        detachEventsFromFolder() {
            this.walrusMediaFolder.off('rowAdded', this.__onRowAdded);
        },
        getRowsFromFolderData() {
        },
        scrollToBottom() {
            if (this.$refs.rowsContainer) {
                this.$refs.rowsContainer.scrollTop = this.$refs.rowsContainer.scrollHeight;
            }
        },
    },
    mounted() {
        this.loadPreviewsInterval();
        this.walrusMediaFolder.rows.map(r=>{ 
            this.rowsIds[r.id] = true;
            this.rows.push(r);
        });

        setTimeout(()=>{
            this.recalculateVisibles();
            if (this.rows.length - 3 <= this.lastRowToKeep) {
                let i = this.rows.length - 1;
                this.$nextTick(() => {
                    this.restoreRow(i);
                });
            }

            for (let i = 0; i < 10; i++) {
                this.restoreRow(i);
            }
        }, 200);
        
        console.log('Mounted WalrusMediaFolderView with rows:', this.rows, toRaw(this.walrusMediaFolder.rows));
        this.__onRowAdded = (row) => {
            console.log('Row added event received for row:', row.id);
            if (this.rowsIds[row.id]) {
                return;
            }
            this.rowsIds[row.id] = true;
            this.rows.push(row);
            this.recalculateVisibles();
            if (this.rows.length - 3 <= this.lastRowToKeep) {
                let i = this.rows.length - 1;
                this.$nextTick(() => {
                    this.restoreRow(i);
                });
            }
        };
        this.__onWindowResize = () => {
            this.cachedRowHeight = null;
        };
        window.addEventListener('resize', this.__onWindowResize);
        this.__onContainerScroll = (event) => {
            this.onScrolled(event);
        };
        this.attachEventsToFolder(this.walrusMediaFolder);
        this.$refs.rowsContainer.addEventListener('scroll', this.__onContainerScroll);
    },
    unmounted() {
        if (this.walrusMediaFolder && this.__onRowAdded) {
            this.walrusMediaFolder.off('rowAdded', this.__onRowAdded);
        }
        if (this.__onWindowResize) {
            window.removeEventListener('resize', this.__onWindowResize);
        }
        this.detachEventsFromFolder(this.walrusMediaFolder);
        if (this.__onContainerScroll && this.$refs.rowsContainer) {
            this.$refs.rowsContainer.removeEventListener('scroll', this.__onContainerScroll);
        }
        clearTimeout(this.__loadPreviewsTimeout);
    },
}
</script>

<style scoped>
.rowsContainer {
    left: 0px;
    right: 0px;
    position: absolute;
    max-height: 600px;
    overflow-y: scroll;
    scroll-behavior: smooth;
    padding-right: 0px;

    opacity: 0;
    transition: opacity .3s;
}

.rowsContainer.rowsContainerActive {
    opacity: 1;
}

/* Custom scrollbar styling */
.rowsContainer::-webkit-scrollbar {
    width: 10px;
}

.rowsContainer::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 5px;
}

.rowsContainer::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 5px;
}

.rowsContainer::-webkit-scrollbar-thumb:hover {
    background: #555;
}

/* Firefox scrollbar styling */
.rowsContainer {
    scrollbar-width: thin;
    scrollbar-color: #888 #f1f1f1;
}
</style>
