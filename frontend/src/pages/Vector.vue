<template>
    <LandingShell class="vectorPage" @home="goHome">
        <WalletStatusBar :show-dark-changer="true" />

        <div class="vector" v-if="vectorId">
        <div class="splitContainer">
            <div class="splitLeft">
                <WalrusMediaBrowserSync
                    ref="browserSync"
                    :endlessVectorId="vectorId"
                    :packageId="packageId"
                    :suiClient="suiClient"
                    :walrusClient="walrusClient"
                    :sealClient="sealClient"
                    :sessionKey="sessionKey"
                    :aggregatorUrl="aggregatorUrl"
                    :signAndExecuteTransaction="signAndExecuteTransaction"
                    :senderAddress="connectedAddress"
                    height="100%"
                    :rowHeight="'100px'"
                    @close="closeVector"
                    @pushed="onPushed"
                    @error="onError"
                    @ready="onReady"
                    @change="onChange"
                    primaryColor="var(--lp-accent)"
                />
            </div>
            <div class="splitRight">
                <div class="statusPanel">
                    <h2 class="statusPanel_title">
                        <q-icon name="insights" size="20px" class="statusPanel_titleIcon" />
                        <span class="statusPanel_titleText">Vector status</span>
                    </h2>

                    <div class="statusRow">
                        <span class="statusLabel">EndlessVectorWalrus ID</span>
                        <span class="statusValue statusMono">
                            {{ shortId(vectorId) }}
                            <a :href="explorerUrl" target="_blank" class="explorerLink" title="View on explorer">↗</a>
                        </span>
                    </div>

                    <div class="statusRow">
                        <span class="statusLabel">Network</span>
                        <span class="statusValue">{{ connectedChain }}</span>
                    </div>

                    <div class="statusRow">
                        <span class="statusLabel">Connected Wallet</span>
                        <span class="statusValue statusMono">
                            {{ connectedAddress ? shortId(connectedAddress) : 'read-only' }}
                            <span v-if="connectedAddress" class="balanceBadges">
                                <span v-if="suiBalance !== null" class="balanceBadge">{{ formatCoin(suiBalance) }} SUI</span>
                                <span v-if="walBalance !== null" class="balanceBadge">{{ formatCoin(walBalance) }} WAL</span>
                            </span>
                        </span>
                    </div>


                    <div class="statusRow" v-if="sealClient">
                        <span class="statusLabel">Seal</span>
                        <span class="statusValue">
                            <span :class="isEncrypted ? 'status-encrypted' : 'status-unencrypted'">{{ isEncrypted ? 'encrypted' : 'not encrypted' }}</span>
                            <SealSessionKeyButton
                                v-if="connectedAddress && isEncrypted"
                                :suiClient="suiClient"
                                :packageId="packageId"
                                :suiMaster="suiMaster"
                                @created="onSessionKeyCreated"
                                @cleared="onSessionKeyCleared"
                                class="sealSessionBtn"
                            />
                        </span>
                    </div>

                    <div class="statusRow">
                        <span class="statusLabel">Status</span>
                        <span class="statusValue" :class="'status-' + syncStatus">{{ syncStatus }}</span>
                    </div>

                    <div class="statusRow">
                        <span class="statusLabel">Pending changes</span>
                        <span class="statusValue">{{ pendingChanges }}</span>
                    </div>

                    <div class="statusRow">
                        <span class="statusLabel">On-chain Patches</span>
                        <span class="statusValue">{{ patchCount }}</span>
                    </div>

                    <div class="statusRow">
                        <span class="statusLabel">On-chain size
                            <span class="statusNote">snapshots + patches</span>
                        </span>
                        <span class="statusValue">{{ formatBytes(totalBytes) }}</span>
                    </div>

                    <div class="statusRow" v-if="filesystemSize > 0">
                        <span class="statusLabel">Filesystem size
                            <span class="statusNote">On-chain may be smaller due to shared chunks</span>
                        </span>
                        <span class="statusValue">{{ formatBytes(filesystemSize) }}</span>
                    </div>

                    <div class="statusRow" v-if="currentEpoch != null">
                        <span class="statusLabel">Current epoch
                            <span class="statusNote">Walrus system</span>
                        </span>
                        <span class="statusValue">{{ currentEpoch }}</span>
                    </div>

                    <div class="statusRow" v-if="minBlobEndEpoch != null">
                        <span class="statusLabel">Walrus end epoch
                            <span class="statusNote">soonest blob expiry</span>
                        </span>
                        <span class="statusValue statusValue--withAction">
                            <span>
                                {{ minBlobEndEpoch }}
                                <span class="statusNote statusNote--inline" v-if="currentEpoch != null">
                                    ({{ Math.max(0, minBlobEndEpoch - currentEpoch) }} epochs left)
                                </span>
                            </span>
                            <q-btn
                                dense flat round size="sm" icon="update"
                                class="extendBtn"
                                :loading="isExtending"
                                :disable="!signAndExecuteTransaction || isExtending"
                                title="Extend Walrus storage"
                            >
                                <q-menu anchor="bottom right" self="top right" @show="previewExtendCost">
                                    <div class="extendMenu">
                                        <div class="extendMenu_title">Extend storage</div>
                                        <q-input
                                            v-model.number="extendEpochs"
                                            type="number"
                                            dense outlined
                                            min="1"
                                            label="Epochs to add"
                                        />
                                        <div class="extendMenu_row">
                                            New end epoch:
                                            <strong>{{ minBlobEndEpoch + (Number(extendEpochs) || 0) }}</strong>
                                        </div>
                                        <div class="extendMenu_row" v-if="extendCost != null">
                                            Est. cost: <strong>{{ formatCoin(extendCost) }} WAL</strong>
                                        </div>
                                        <q-btn
                                            label="Extend"
                                            color="primary"
                                            dense
                                            class="extendMenu_go"
                                            :loading="isExtending"
                                            :disable="!Number(extendEpochs) || Number(extendEpochs) < 1"
                                            @click="extendBlobs"
                                        />
                                    </div>
                                </q-menu>
                            </q-btn>
                        </span>
                    </div>

                    <div class="statusRow" v-if="lastPushVersion">
                        <span class="statusLabel">Last push version</span>
                        <span class="statusValue">{{ lastPushVersion }}</span>
                    </div>

                    <div class="statusRow" v-if="lastError">
                        <span class="statusLabel">Last error</span>
                        <span class="statusValue statusError">{{ lastError }}</span>
                    </div>

                    <div class="statusActions">
                        <BlobButton
                            text="Sync to chain"
                            icon="cloud_upload"
                            color="var(--lp-accent)"
                            :disable="pendingChanges === 0 || !signAndExecuteTransaction || isSyncing"
                            @click="syncToChain"
                        />
                    </div>

                    <div class="itemsList" v-if="items.length">
                        <div class="itemsList_title">WDoubleSync Chunks</div>
                        <div class="itemRow" v-for="item in [...items].reverse()" :key="item.index" @click="selectedItem = item">
                            <span class="itemIndex">#{{ item.index }}</span>
                            <span class="itemType">{{ item.type === 'bytes' ? 'vector&lt;u8&gt;' : 'Walrus Blob' }}</span>
                            <span class="itemSize">{{ formatBytes(item.size) }}</span>
                            <span class="itemEpochs" v-if="item.type === 'blob' && item.certifiedEpoch != null">
                                e{{ item.certifiedEpoch }}<template v-if="item.endEpoch != null">&ndash;{{ item.endEpoch }}</template>
                            </span>
                        </div>
                    </div>

                    <q-inner-loading :showing="isSyncing" label="Syncing…" color="primary" class="statusLoading" />
                </div>
            </div>
        </div>
        </div>

        <div class="noVectorBlock" v-else>
            <h2 class="noVectorBlock_title">No vector ID specified</h2>
            <BlobButton text="Back to vectors" icon="arrow_forward" color="var(--lp-accent)" @click="$router.push('/select')" />
        </div>

        <EndlessVectorItemDetails
            :item="selectedItem"
            :isOpen="!!selectedItem"
            :isEncrypted="isEncrypted"
            @close="selectedItem = null"
        />

        <LocalnetFaucets @fauceted="fetchBalances" />
    </LandingShell>
</template>

<script>
import { toRaw } from 'vue';
import EndlessVector from '@fizzyflow/endless-vector';
import WalrusMediaBrowserSync from 'shared/components/WalrusMedia/WalrusMediaBrowserSync.vue';
import EndlessVectorItemDetails from '../components/EndlessVectorItemDetails.vue';
import SealSessionKeyButton from 'shared/components/WalrusMedia/helpers/SealSessionKeyButton.vue';
import WalletStatusBar from '../components/WalletStatusBar.vue';
import LandingShell from 'shared/components/Landing/LandingShell.vue';
import BlobButton from 'shared/components/Theme/BlobButton.vue';
import LocalnetFaucets from 'shared/components/Faucets/LocalnetFaucets.vue';
import { getPackageId, makeWalrusClient, getAggregator, makeSealClient } from 'shared/components/WalrusMedia/includes/WalrusMediaClientsMaker.js';

export default {
    name: 'Vector',
    path: '/vector',
    components: {
        WalrusMediaBrowserSync,
        EndlessVectorItemDetails,
        SealSessionKeyButton,
        WalletStatusBar,
        LandingShell,
        BlobButton,
        LocalnetFaucets,
    },
    data() {
        return {
            isSyncing: false,
            packageId: null,
            walrusClient: null,
            sealClient: null,
            aggregatorUrl: null,
            syncStatus: 'idle',
            pendingChanges: 0,
            lastPushVersion: null,
            lastError: null,
            patchCount: 0,
            totalBytes: 0,
            currentEpoch: null,
            extendEpochs: 10,
            extendCost: null,
            isExtending: false,
            items: [],
            selectedItem: null,
            isEncrypted: false,
            sessionKey: null,
            filesystemSize: 0,
            suiBalance: null,
            walBalance: null,
        }
    },
    computed: {
        parsedHash() {
            const hash = this.$route.hash;
            if (!hash) return { network: null, id: null };
            const raw = hash.slice(1);
            const colonIdx = raw.indexOf(':');
            if (colonIdx > 0 && !raw.startsWith('0x')) {
                return { network: raw.slice(0, colonIdx), id: raw.slice(colonIdx + 1) };
            }
            return { network: null, id: raw };
        },
        vectorId() {
            return this.parsedHash.id || null;
        },
        hashNetwork() {
            return this.parsedHash.network;
        },
        connectedAddress() {
            return this.$store.sui.address;
        },
        connectedChain() {
            return this.$store.sui.connectedChain;
        },
        suiClient() {
            return this.$store.sui.suiMaster?.client || null;
        },
        suiMaster() {
            return this.$store.sui.suiMaster || null;
        },
        signAndExecuteTransaction() {
            if (!this.$store.sui.suiMaster?.address) return null;
            return async (tx) => {
                const resp = await this.$store.sui.suiMaster.signAndExecuteTransaction({ transaction: tx });

                console.log('Transaction result:', resp);
                return resp.digest || null;
            };
        },
        networkName() {
            const chain = this.connectedChain || this.hashNetwork || '';
            const n = chain.toLowerCase().replace('sui:', '');
            if (n.includes('mainnet')) return 'mainnet';
            if (n.includes('testnet')) return 'testnet';
            if (n.includes('devnet')) return 'devnet';
            return 'local';
        },
        explorerUrl() {
            return `https://explorer.polymedia.app/object/${this.vectorId}?network=${this.networkName}`;
        },
        // Soonest Walrus storage expiry across the vector's blob items (min end_epoch),
        // or null when the vector holds no blobs.
        minBlobEndEpoch() {
            const ends = this.items
                .filter(it => it.type === 'blob' && it.endEpoch != null)
                .map(it => Number(it.endEpoch));
            return ends.length ? Math.min(...ends) : null;
        },
    },
    watch: {
        connectedChain: {
            immediate: true,
            async handler(chain) {
                const network = chain || this.hashNetwork;
                if (network) {
                    const [pkgId, wClient, aggUrl, sClient] = await Promise.all([
                        getPackageId(network),
                        makeWalrusClient(network, this.suiClient),
                        getAggregator(network),
                        makeSealClient(network, this.suiClient),
                    ]);
                    this.walrusClient = wClient;
                    this.aggregatorUrl = aggUrl;
                    this.packageId = pkgId;
                    this.sealClient = sClient;
                    this.fetchCurrentEpoch();
                }
            },
        },
        vectorId() {
            this.resetStatus();
        },
        connectedAddress: {
            immediate: true,
            handler() { this.fetchBalances(); },
        },
        walrusClient() {
            this.fetchCurrentEpoch();
        },
        extendEpochs() {
            // refresh the cost estimate while the extend menu is open
            this.previewExtendCost();
        },
    },
    methods: {
        onReady(stats) {
            this.syncStatus = 'ready';
            if (stats) {
                this.patchCount = stats.patchCount || 0;
                this.totalBytes = stats.totalBytes || 0;
                this.items = stats.items || [];
                this.isEncrypted = stats.isEncrypted || false;
            }
            this.updateFilesystemSize();
            this.fetchCurrentEpoch();
        },
        onChange() {
            this.pendingChanges++;
            this.syncStatus = 'modified';
            this.updateFilesystemSize();
        },
        onPushed(result) {
            this.lastPushVersion = result?.version || '?';
            this.patchCount = result?.patchCount || this.patchCount + 1;
            this.totalBytes = result?.totalBytes || this.totalBytes;
            this.items = result?.items || this.items;
            this.pendingChanges = 0;
            this.syncStatus = 'synced';
            this.lastError = null;
            this.fetchBalances();
            this.fetchCurrentEpoch();
        },
        onError(err) {
            this.lastError = err?.message || String(err);
            this.syncStatus = 'error';
        },
        async syncToChain() {
            const sync = this.$refs.browserSync;
            if (!sync) return;
            this.isSyncing = true;
            await sync.push();
            this.isSyncing = false;
        },
        resetStatus() {
            this.syncStatus = 'idle';
            this.pendingChanges = 0;
            this.lastPushVersion = null;
            this.lastError = null;
        },
        onSessionKeyCreated(sessionKey) {
            this.sessionKey = sessionKey;
        },
        onSessionKeyCleared() {
            this.sessionKey = null;
        },
        updateFilesystemSize() {
            const sync = this.$refs.browserSync;
            const folder = sync?._rawFolder;
            if (!folder) {
                this.filesystemSize = 0;
                return;
            }
            this.filesystemSize = this.calcFolderSize(folder);
        },
        calcFolderSize(folder) {
            let size = 0;
            for (const [, child] of folder._children) {
                if (child._children) {
                    size += this.calcFolderSize(child);
                } else if (child._content) {
                    size += child._content.length;
                }
            }
            return size;
        },
        shortId(id) {
            if (!id || id.length < 16) return id;
            return id.slice(0, 8) + '...' + id.slice(-6);
        },
        async fetchBalances() {
            const sm = this.suiMaster;
            if (!sm?.address) {
                this.suiBalance = null;
                this.walBalance = null;
                return;
            }
            try {
                this.suiBalance = await sm.getBalance();
            } catch { this.suiBalance = 0n; }
            try {
                const res = await sm.client.listBalances({ owner: sm.address });
                const walEntry = res.balances.find(b => b.coinType.includes('::wal::WAL'));
                this.walBalance = walEntry ? BigInt(walEntry.balance) : 0n;
            } catch { this.walBalance = 0n; }
        },
        // Build a write-capable EndlessVector for this vector, with raw (non-proxied)
        // clients so the SDK's private-field access works.
        _makeExtendEv() {
            return new EndlessVector({
                suiClient: toRaw(this.suiClient),
                id: this.vectorId,
                packageId: this.packageId,
                signAndExecuteTransaction: this.signAndExecuteTransaction || undefined,
                walrusClient: toRaw(this.walrusClient) || undefined,
                senderAddress: this.connectedAddress || undefined,
                aggregatorUrl: this.aggregatorUrl || undefined,
            });
        },
        // Target epoch the soonest-expiring blob will be extended to.
        extendTargetEpoch() {
            const n = Number(this.extendEpochs) || 0;
            return this.minBlobEndEpoch != null ? this.minBlobEndEpoch + n : null;
        },
        async previewExtendCost() {
            this.extendCost = null;
            const target = this.extendTargetEpoch();
            if (target == null || !this.walrusClient) return;
            try {
                const ev = this._makeExtendEv();
                this.extendCost = await ev.walrus.extendBlobsCostToEpoch(target);
            } catch (err) {
                console.error('Extend cost preview failed:', err);
            }
        },
        async extendBlobs() {
            const target = this.extendTargetEpoch();
            if (target == null) return;
            this.isExtending = true;
            try {
                const ev = this._makeExtendEv();
                await ev.walrus.extendBlobsToEpoch(target);
                // refresh epochs / items / balances from chain
                await ev.initialize();
                this.items = ev._items.map((item, i) => {
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
                    return entry;
                });
                this.fetchCurrentEpoch();
                this.fetchBalances();
                this.$q?.notify?.({ type: 'positive', message: `Extended storage to epoch ${target}`, position: 'top' });
            } catch (err) {
                console.error('Extend failed:', err);
                this.$q?.notify?.({ type: 'negative', message: 'Extend failed: ' + (err?.message || err), position: 'top' });
            } finally {
                this.isExtending = false;
                this.extendCost = null;
            }
        },
        async fetchCurrentEpoch() {
            if (!this.walrusClient) return;
            // WalrusClient uses private (#) fields, which break when accessed through a Vue
            // reactive Proxy — unwrap to the raw instance before calling its methods.
            const client = toRaw(this.walrusClient);
            try {
                // Canonical "current epoch" per the Walrus SDK is the staking state's epoch
                // (see WalrusClient — it reads stakingState.epoch as the current epoch).
                // systemState().committee.epoch can lag on localnet, so prefer staking.
                const staking = await client.stakingState();
                if (staking?.epoch != null) {
                    this.currentEpoch = Number(staking.epoch);
                    return;
                }
                const system = await client.systemState();
                this.currentEpoch = system?.committee?.epoch != null ? Number(system.committee.epoch) : null;
            } catch (err) {
                console.error('Failed to read Walrus current epoch:', err);
            }
        },
        formatCoin(balance) {
            if (balance === null) return '';
            const val = Number(balance) / 1e9;
            if (val >= 1000) return val.toFixed(0);
            if (val >= 1) return val.toFixed(2);
            return val.toFixed(4);
        },
        formatBytes(bytes) {
            if (bytes === 0) return '0 B';
            const units = ['B', 'KB', 'MB'];
            const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
            const val = bytes / Math.pow(1024, i);
            return val.toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
        },
        goHome() {
            this.$router.push('/');
        },
        closeVector() {
            this.$router.push('/select');
        },
    },
    mounted() {
        if (!this.connectedChain) {
            const network = this.hashNetwork || 'testnet';
            setTimeout(() => {
                if (!this.connectedChain) {
                    this.$store.sui.readOnlyToChain(network);
                }
            }, 500);
        }
    },
}
</script>

<style>
    /* wallet bar → top-right pill, matching the landing */
    .vectorPage .walletStatusBar {
        position: fixed;
        top: 18px;
        right: 24px;
        bottom: auto;
        left: auto;
        z-index: 100;
        gap: 4px;
        padding: 3px 8px;
        border-radius: 999px;
        border: 1px solid var(--lp-badge-border);
        background: var(--lp-badge-bg);
        backdrop-filter: blur(6px);
    }

    /* gutter on the outer element + centred max-width inner → aligns with the
       header/hero (which use the same structure) */
    .vector {
        padding: 0 24px;
        margin-top: 24px;
    }

    .splitContainer {
        display: flex;
        gap: 20px;
        max-width: 1600px;
        margin: 0 auto;
        height: calc(100vh - 174px);
        min-height: 480px;
    }

    .splitLeft {
        flex: 1;
        min-width: 0;
        height: 100%;
    }

    .splitRight {
        flex: 1;
        min-width: 0;
        height: 100%;
        overflow-y: auto;
    }

    .statusPanel {
        position: relative;
        padding: 24px;
        border-radius: 16px;
        border: 1px solid var(--lp-card-border);
        background: var(--lp-card-bg);
        box-shadow: var(--lp-card-shadow);
    }

    .statusPanel_title {
        display: flex;
        align-items: center;
        gap: 9px;
        font-family: var(--font-display, inherit);
        font-size: 19px;
        font-weight: 700;
        line-height: 18px;
        letter-spacing: -0.3px;
        margin: 0 0 16px;
    }

    .statusPanel_titleIcon {
        flex: none;
        color: var(--lp-accent);
        filter: drop-shadow(0 0 8px color-mix(in srgb, var(--lp-accent) 35%, transparent));
    }

    .statusPanel_titleText {
        background: linear-gradient(95deg, var(--lp-text) 0%, var(--lp-text) 35%, var(--lp-accent) 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        color: transparent;
    }

    .statusRow {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid var(--lp-divider);
    }

    .statusNote {
        display: block;
        font-size: 10px;
        color: var(--lp-text-faint);
        font-weight: 400;
    }

    .statusNote--inline {
        display: inline;
        margin-left: 4px;
    }

    .statusValue--withAction {
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }

    .extendMenu {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 210px;
    }

    .extendMenu_title {
        font-weight: 600;
        font-size: 13px;
    }

    .extendMenu_row {
        font-size: 12px;
        color: var(--lp-text-3);
    }

    .extendMenu_go {
        margin-top: 4px;
    }

    .statusLabel {
        font-size: 12px;
        color: var(--lp-text-3);
    }

    .statusValue {
        font-size: 12px;
        font-weight: 500;
        color: var(--lp-text);
    }

    .statusMono {
        font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
    }

    .statusError {
        color: #e53935;
    }

    .status-ready { color: #2e9e54; }
    .status-synced { color: #2e9e54; }
    .status-modified { color: #ff9800; }
    .status-syncing { color: #2196f3; }
    .status-error { color: #e53935; }
    .status-loading, .status-idle { color: var(--lp-text-3); }
    .status-encrypted { color: #2e9e54; }
    .status-unencrypted { color: var(--lp-text-3); }

    .balanceBadges {
        display: inline-flex;
        gap: 4px;
        margin-left: 6px;
    }

    .balanceBadge {
        font-size: 10px;
        padding: 1px 5px;
        border-radius: 999px;
        background: var(--lp-badge-bg);
        border: 1px solid var(--lp-badge-border);
        color: var(--lp-text-3);
        font-family: inherit;
    }

    .sealSessionBtn {
        margin-left: 8px;
    }

    .statusActions {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
        margin-top: 20px;
    }

    .statusLoading {
        border-radius: 16px;
    }

    .noVectorBlock {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 18px;
        text-align: center;
        margin-top: 120px;
    }

    .noVectorBlock_title {
        font-family: var(--font-display, inherit);
        font-size: 24px;
        font-weight: 700;
        color: var(--lp-text);
        margin: 0;
    }

    .explorerLink {
        color: var(--lp-accent);
        text-decoration: none;
        margin-left: 4px;
    }

    .explorerLink:hover {
        text-decoration: underline;
    }

    .itemsList {
        margin-top: 20px;
        border-top: 1px solid var(--lp-divider);
        padding-top: 16px;
        max-height: 300px;
        overflow-y: auto;
    }

    .itemsList_title {
        margin: 0 0 10px 0;
        font-size: 13px;
        font-weight: 600;
        color: var(--lp-text-2);
    }

    .itemRow {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 5px 8px;
        border-radius: 8px;
        font-size: 12px;
        font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
        cursor: pointer;
    }

    .itemRow:hover {
        background-color: var(--lp-badge-bg);
    }

    .itemIndex {
        color: var(--lp-text-3);
        min-width: 30px;
    }

    .itemType {
        color: var(--lp-accent);
        min-width: 50px;
    }

    .itemSize {
        color: var(--lp-text-faint);
    }

    .itemEpochs {
        color: var(--lp-teal);
        font-size: 11px;
    }
</style>
