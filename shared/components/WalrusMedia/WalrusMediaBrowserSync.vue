<template>
    <WalrusMediaBrowser
        v-if="rootFolder"
        :rootFolder="rootFolder"
        :readOnly="readOnly"
        :height="height"
        :rowHeight="rowHeight"
        :primaryColor="primaryColor"
        @change="onChanged"
        @close="$emit('close')"
    />
    <div v-else class="walrusMediaBrowserSyncLoading">
        <Spinner :size="36" />
        <span v-if="status === 'encrypted'" class="walrusMediaBrowserSyncHint">Waiting for Seal Session Key...</span>
    </div>
</template>

<script>
import EndlessVector from '@fizzyflow/endless-vector';
import { WDoubleSync } from 'wdoublesync';
import WalrusMediaBrowser from './WalrusMediaBrowser.vue';
import WalrusMediaDoubleSyncFolder from './includes/WalrusMediaDoubleSyncFolder.js';
import Spinner from './helpers/Spinner.vue';
import { toRaw } from 'vue';

export default {
    name: 'WalrusMediaBrowserSync',
    components: {
        WalrusMediaBrowser,
        Spinner,
    },
    props: {
        endlessVectorId: {
            type: String,
            required: true,
        },
        packageId: {
            type: String,
            required: true,
        },
        suiClient: {
            type: Object,
            required: true,
        },
        walrusClient: {
            type: Object,
            required: false,
            default: null,
        },
        signAndExecuteTransaction: {
            type: Function,
            required: false,
            default: null,
        },
        senderAddress: {
            type: String,
            required: false,
            default: null,
        },
        aggregatorUrl: {
            type: String,
            required: false,
            default: null,
        },
        sealClient: {
            type: Object,
            required: false,
            default: null,
        },
        sessionKey: {
            type: Object,
            required: false,
            default: null,
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
    emits: ['ready', 'pushed', 'error', 'close', 'change'],
    data() {
        return {
            rootFolder: null,
            isSaving: false,
            status: 'loading',
        };
    },
    computed: {
        readOnly() {
            return !this.signAndExecuteTransaction;
        },
    },
    methods: {
        _collectItems(ev) {
            const items = [];
            for (let i = 0; i < ev._items.length; i++) {
                const item = ev._items[i];
                const entry = {
                    index: ev.length - ev._items.length + i,
                    type: item.type,
                    size: item.size,
                    _raw: item,
                };
                if (item.type === 'blob' && item._blobData) {
                    const b = item._blobData;
                    entry.certifiedEpoch = b.certified_epoch ?? b.certifiedEpoch ?? null;
                    entry.endEpoch = b.storage?.end_epoch ?? b.storage?.endEpoch ?? b.end_epoch ?? b.endEpoch ?? null;
                }
                items.push(entry);
            }
            return items;
        },
        async initialize() {
            try {
                const ev = new EndlessVector({
                    suiClient: toRaw(this.suiClient),
                    id: this.endlessVectorId,
                    packageId: this.packageId,
                    signAndExecuteTransaction: this.signAndExecuteTransaction || undefined,
                    walrusClient: toRaw(this.walrusClient) || undefined,
                    senderAddress: this.senderAddress || undefined,
                    aggregatorUrl: this.aggregatorUrl || undefined,
                    sealClient: toRaw(this.sealClient) || undefined,
                    sessionKey: toRaw(this.sessionKey) || undefined,
                });

                this._ev = ev;
                await ev.initialize();

                if (ev.sealEncryptedKey) {
                    this.status = 'encrypted';
                    this.$emit('ready', {
                        patchCount: ev.length,
                        totalBytes: ev.binaryLength,
                        isEncrypted: true,
                        items: this._collectItems(ev),
                    });
                    if (this.sessionKey) {
                        await this._continueWithSync(ev);
                    }
                    return;
                }

                await this._continueWithSync(ev);
            } catch (err) {
                console.error('[BrowserSync] initialize failed:', err);
                this.status = 'error';
                this.$emit('error', err);
            }
        },
        async _continueWithSync(ev) {
            this._wDoubleSync = new WDoubleSync({ endlessVector: ev });
            await this._wDoubleSync.initialize();

            const memFolder = await this._wDoubleSync.restore();
            const folder = WalrusMediaDoubleSyncFolder.fromMemoryFolder(memFolder);
            await folder.load();

            folder.on('save', () => this.push());

            this._rawFolder = folder;
            this.rootFolder = folder;
            this.status = 'ready';
            this.$emit('ready', {
                patchCount: ev.length,
                totalBytes: ev.binaryLength,
                isEncrypted: !!ev.sealEncryptedKey,
                items: this._collectItems(ev),
            });
        },
        async push() {
            if (this.isSaving || this.readOnly) return;
            this.isSaving = true;
            this.status = 'syncing';
            try {
                const result = await this._wDoubleSync.push(this._rawFolder);
                const ev = this._wDoubleSync._ev;
                await ev.initialize();
                result.totalBytes = ev.binaryLength;
                result.patchCount = ev.length;
                result.items = ev._items.map((item, i) => ({
                    index: ev.length - ev._items.length + i,
                    type: item.type,
                    size: item.size,
                    _raw: item,
                }));
                this.status = 'ready';
                this.$emit('pushed', result);
            } catch (err) {
                console.error('[BrowserSync] push failed:', err);
                this.status = 'error';
                this.$emit('error', err);
            } finally {
                this.isSaving = false;
            }
        },
        onChanged() {
            clearTimeout(this._changeDebounce);
            this._changeDebounce = setTimeout(() => {
                this.$emit('change');
            }, 300);
        },
    },
    mounted() {
        if (this.packageId && this.suiClient) {
            this.initialize();
        }
    },
    watch: {
        packageId() {
            if (this.packageId && this.suiClient && !this.rootFolder) {
                this.initialize();
            }
        },
        suiClient() {
            if (this.packageId && this.suiClient && !this.rootFolder) {
                this.initialize();
            }
        },
        async sessionKey(key) {
            if (key && this._ev && this.status === 'encrypted') {
                this._ev.seal._sessionKey = toRaw(key);
                try {
                    await this._continueWithSync(this._ev);
                } catch (err) {
                    console.error('[BrowserSync] continue failed:', err);
                    this.status = 'error';
                    this.$emit('error', err);
                }
            }
        },
    },
};
</script>

<style scoped>
.walrusMediaBrowserSyncLoading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    min-height: 200px;
}
.walrusMediaBrowserSyncHint {
    font-size: 13px;
    color: #888;
}
</style>
