<template>
    <WalrusMediaBrowser
        v-if="rootFolder"
        ref="browser"
        :rootFolder="rootFolder"
        :readOnly="readOnly"
        :height="height"
        :rowHeight="rowHeight"
        :primaryColor="primaryColor"
        :isPolling="isPolling"
        @change="onChanged"
        @close="$emit('close')"
        @togglePolling="onTogglePolling"
    />
    <div v-else class="walrusMediaBrowserSyncLoading">
        <Spinner :size="36" />
        <div v-if="status === 'encrypted'" class="walrusMediaBrowserSyncHintWrapper">
            <span class="walrusMediaBrowserSyncHint">Waiting for Seal Session Key...</span>
            <SealSessionKeyButton
                v-if="suiMaster && packageId"
                :suiClient="suiClient"
                :packageId="packageId"
                :suiMaster="suiMaster"
                :sessionKey="sessionKey"
                @created="$emit('sessionKeyCreated', $event)"
                @cleared="$emit('sessionKeyCleared')"
                class="walrusMediaBrowserSyncButton"
            />
        </div>
    </div>
</template>

<script>
import EndlessVector from '@fizzyflow/endless-vector';
import { WDoubleSync } from '@fizzyflow/wdoublesync';
import WalrusMediaBrowser from './WalrusMediaBrowser.vue';
import WalrusMediaDoubleSyncFolder from './includes/WalrusMediaDoubleSyncFolder.js';
import SealSessionKeyButton from './helpers/SealSessionKeyButton.vue';
import Spinner from './helpers/Spinner.vue';
import { toRaw } from 'vue';

export default {
    name: 'WalrusMediaBrowserSync',
    components: {
        WalrusMediaBrowser,
        SealSessionKeyButton,
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
        suiMaster: {
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
    emits: ['ready', 'pushed', 'error', 'close', 'change', 'sessionKeyCreated', 'sessionKeyCleared'],
    data() {
        return {
            rootFolder: null,
            isSaving: false,
            status: 'loading',
            isPolling: false,
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
            this._knownLength = ev.length;
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
        onTogglePolling() {
            this.isPolling = !this.isPolling;
            if (this.isPolling) {
                this._startPolling();
            } else {
                this._stopPolling();
            }
        },
        _startPolling() {
            this._pollingBusy = false;
            this._pollingInterval = setInterval(() => this._doPoll(), 1000);
        },
        _stopPolling() {
            if (this._pollingInterval) {
                clearInterval(this._pollingInterval);
                this._pollingInterval = null;
            }
        },
        async _doPoll() {
            if (this._pollingBusy) return;
            this._pollingBusy = true;
            try {
                const ev = this._ev;
                const wdsync = this._wDoubleSync;
                if (!ev || !wdsync) return;

                ev.reInitialize();
                await ev.initialize();
                if (ev.length <= this._knownLength) return;

                const memFolder = await wdsync.restore();
                this._knownLength = ev.length;

                const newFolder = WalrusMediaDoubleSyncFolder.fromMemoryFolder(memFolder);
                newFolder.on('save', () => this.push());
                await newFolder.load();
                this._rawFolder = newFolder;

                wdsync.reInitialize();

                if (this.$refs.browser) {
                    await this.$refs.browser.reinitialize(newFolder);
                }
            } catch (err) {
                console.error('[BrowserSync] poll failed:', err);
            } finally {
                this._pollingBusy = false;
            }
        },
    },
    mounted() {
        if (this.packageId && this.suiClient) {
            this.initialize();
        }
    },
    unmounted() {
        this._stopPolling();
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
.walrusMediaBrowserSyncHintWrapper {
    display: flex;
    align-items: center;
    gap: 12px;
}

.walrusMediaBrowserSyncHint {
    font-size: 13px;
    color: #888;
}

.walrusMediaBrowserSyncButton {
    flex-shrink: 0;
}
</style>
