<template>
    <div 
        class="rowsContainer" 
        :class="{rowsContainerActive: isOnFront}"
        :style="{zIndex: zIndex, minHeight: height, maxHeight: height, '--row-height': rowHeight }" ref="rowsContainer">
        <WalrusMediaBrowserRow v-for="(item, index) in rows" :row="item" :primaryColor="primaryColor" :key="item.id" :disposed="rowsDisposed[index]" ref="rows"
            @itemClick="onItemClick"  />
        <WalrusMediaContextMenu ref="contextMenu" @delete="onDeleteItem" @mkdir="onMakeDir" @newFile="onNewFile" @refresh="onRefresh" />
    </div>
</template>

<script>
import WalrusMediaBrowserRow from './WalrusMediaBrowserRow.vue';
import WalrusMediaContextMenu from './menus/WalrusMediaContextMenu.vue';
import { toRaw, shallowReactive, reactive } from 'vue';

export default {
    name: 'WalrusMediaFolderView',
    components: {
        WalrusMediaBrowserRow,
        WalrusMediaContextMenu,
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
            rowsDisposed: reactive([]),
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
        onDeleteItem({ name }) {
            this.walrusMediaFolder.removeChild(name);
        },
        onMakeDir() {
            this.$emit('mkdir');
        },
        onNewFile() {
            this.$emit('newFile');
        },
        onRefresh() {
            this.$emit('refresh');
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
            if (rowIndex >= 0 && rowIndex < this.rowsDisposed.length) {
                this.rowsDisposed[rowIndex] = true;
            }
        },
        restoreRow(rowIndex) {
            if (rowIndex >= 0 && rowIndex < this.rowsDisposed.length) {
                this.rowsDisposed[rowIndex] = false;
            }
        },
        measureRowHeight() {
            // All rows are uniform fixed height, so derive it straight from the DOM.
            // scrollHeight / rowCount is exact and immune to $refs ordering, media-query
            // height changes, and not-yet-rendered rows. Only cache a real (>0) value.
            const container = this.$refs.rowsContainer;
            if (container && this.rows.length > 0 && container.scrollHeight > 0) {
                this.cachedRowHeight = container.scrollHeight / this.rows.length;
            }
            // Fall back to a sane default only until the DOM is measurable; never cache it.
            return this.cachedRowHeight || 200;
        },
        isRowVisible(rowIndex) {
            const container = this.$refs.rowsContainer;
            if (!container || rowIndex < 0 || rowIndex >= this.rows.length) {
                return false;
            }

            const rowHeight = this.measureRowHeight();
            const rowTop = rowIndex * rowHeight;
            const rowBottom = rowTop + rowHeight;

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

            const rowHeight = this.measureRowHeight();

            const firstVisibleRow = Math.floor(nScrollTop / rowHeight);
            const lastVisibleRow = Math.ceil((nScrollTop + nContainerHeight) / rowHeight);

            this.firstRowToKeep = Math.max(0, firstVisibleRow - 3);
            this.lastRowToKeep = Math.min(this.rows.length - 1, lastVisibleRow + 3);
        },
        onScrolled() {
            if (this.__scrollRaf) return;
            this.__scrollRaf = requestAnimationFrame(() => {
                this.__scrollRaf = null;
                const container = this.$refs.rowsContainer;
                if (!container) return;
                const scrollTop = container.scrollTop;
                if (this.__lastScrolledTop !== undefined && Math.abs(this.__lastScrolledTop - scrollTop) <= 200) {
                    return;
                }
                this.__lastScrolledTop = scrollTop;
                this.recalculateVisibles(scrollTop, container.clientHeight);
                for (let i = 0; i < this.rows.length; i++) {
                    if (i < this.firstRowToKeep || i > this.lastRowToKeep) {
                        this.disposeRow(i);
                    } else {
                        this.restoreRow(i);
                    }
                }
            });
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
            this.walrusMediaFolder.on('rowRemoved', this.__onRowRemoved);
        },
        detachEventsFromFolder() {
            this.walrusMediaFolder.off('rowAdded', this.__onRowAdded);
            this.walrusMediaFolder.off('rowRemoved', this.__onRowRemoved);
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
            this.rowsDisposed.push(true);
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
            this.rowsDisposed.push(true);
            this.recalculateVisibles();
            if (this.rows.length - 3 <= this.lastRowToKeep) {
                let i = this.rows.length - 1;
                this.$nextTick(() => {
                    this.restoreRow(i);
                });
            }
        };
        this.__onRowRemoved = (row) => {
            const idx = this.rows.indexOf(row);
            if (idx !== -1) {
                this.rows.splice(idx, 1);
                this.rowsDisposed.splice(idx, 1);
            }
            delete this.rowsIds[row.id];
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
        this.$refs.contextMenu.attachTo(this.$refs.rowsContainer);
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
        if (this.__scrollRaf) {
            cancelAnimationFrame(this.__scrollRaf);
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
    overflow-y: auto;
    scroll-behavior: smooth;

    opacity: 0;
    transition: opacity .3s;

    scrollbar-width: none;
}

.rowsContainer::-webkit-scrollbar {
    display: none;
}

.rowsContainer.rowsContainerActive {
    opacity: 1;
}
</style>
