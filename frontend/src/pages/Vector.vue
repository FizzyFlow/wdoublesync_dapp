<template>
    <div>
        <div class="splitContainer" v-if="vectorId">
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
                    @close="goHome"
                    @pushed="onPushed"
                    @error="onError"
                    @ready="onReady"
                    @change="onChange"
                    primaryColor="var(--q-secondary)"
                />
            </div>
            <div class="splitRight">
                <div class="statusPanel">
                    <h6>EndlessVectorWalrus Status</h6>

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

                    <div class="statusRow" v-if="lastPushVersion">
                        <span class="statusLabel">Last push version</span>
                        <span class="statusValue">{{ lastPushVersion }}</span>
                    </div>

                    <div class="statusRow" v-if="lastError">
                        <span class="statusLabel">Last error</span>
                        <span class="statusValue statusError">{{ lastError }}</span>
                    </div>

                    <div class="statusActions">
                        <q-btn
                            class="syncButton"
                            @click="syncToChain"
                            :loading="isSyncing"
                            :disable="pendingChanges === 0 || !signAndExecuteTransaction"
                        >
                            Sync to chain
                        </q-btn>

                        <q-btn
                            class="closeButton"
                            flat
                            @click="goHome"
                        >
                            Close
                        </q-btn>
                    </div>

                    <div class="itemsList" v-if="items.length">
                        <h6>WDoubleSync Chunks</h6>
                        <div class="itemRow" v-for="item in [...items].reverse()" :key="item.index" @click="selectedItem = item">
                            <span class="itemIndex">#{{ item.index }}</span>
                            <span class="itemType">{{ item.type === 'bytes' ? 'vector&lt;u8&gt;' : 'Walrus Blob' }}</span>
                            <span class="itemSize">{{ formatBytes(item.size) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="noVectorBlock" v-else>
            <h6>No vector ID specified</h6>
            <router-link to="/">Back to home</router-link>
        </div>

        <EndlessVectorItemDetails
            :item="selectedItem"
            :isOpen="!!selectedItem"
            :isEncrypted="isEncrypted"
            @close="selectedItem = null"
        />

        <q-btn
            v-if="isLocalnet && connectedAddress"
            class="faucetButton"
            :loading="isFauceting"
            @click="requestFaucet"
            icon="water_drop"
            round
            color="blue"
            title="Get SUI from faucet"
        />
        <q-btn
            v-if="isLocalnet && connectedAddress"
            class="walFaucetButton"
            :loading="isWalFauceting"
            @click="requestWalFaucet"
            icon="toll"
            round
            color="orange"
            title="Get WAL from faucet"
        />

        <WalletStatusBar />
    </div>
</template>

<script>
import WalrusMediaBrowserSync from 'shared/components/WalrusMedia/WalrusMediaBrowserSync.vue';
import EndlessVectorItemDetails from '../components/EndlessVectorItemDetails.vue';
import SealSessionKeyButton from 'shared/components/WalrusMedia/helpers/SealSessionKeyButton.vue';
import WalletStatusBar from '../components/WalletStatusBar.vue';
import { getPackageId, makeWalrusClient, getAggregator, makeSealClient } from 'shared/components/WalrusMedia/includes/WalrusMediaClientsMaker.js';

export default {
    name: 'Vector',
    path: '/vector',
    components: {
        WalrusMediaBrowserSync,
        EndlessVectorItemDetails,
        SealSessionKeyButton,
        WalletStatusBar,
    },
    data() {
        return {
            isFauceting: false,
            isWalFauceting: false,
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
        isLocalnet() {
            return this.connectedChain?.includes('localnet') || this.connectedChain?.includes('local');
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
        async requestFaucet() {
            this.isFauceting = true;
            try {
                await this.$store.sui.suiMaster.requestSuiFromFaucet();
            } catch (err) {
                console.error('Faucet error:', err);
            } finally {
                this.isFauceting = false;
                this.fetchBalances();
            }
        },
        async requestWalFaucet() {
            this.isWalFauceting = true;
            try {
                const res = await fetch('http://localhost:8099/v1/wal-faucet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address: this.connectedAddress }),
                });
                if (!res.ok) throw new Error(await res.text());
            } catch (err) {
                console.error('WAL faucet error:', err);
            } finally {
                this.isWalFauceting = false;
                this.fetchBalances();
            }
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
    .splitContainer {
        display: flex;
        height: calc(100vh - 40px);
        padding: 20px;
        gap: 20px;
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
        padding: 20px;
        border: 1px solid #333;
        border-radius: 8px;
        background: #ffffff;
    }

    .statusPanel h6 {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
    }

    .statusRow {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #2a2a2a;
    }

    .statusNote {
        display: block;
        font-size: 10px;
        color: #aaa;
        font-weight: 400;
    }

    .statusLabel {
        font-size: 12px;
        color: #888;
    }

    .statusValue {
        font-size: 12px;
        font-weight: 500;
    }

    .statusMono {
        font-family: monospace;
    }

    .statusError {
        color: #e53935;
    }

    .status-ready { color: #4caf50; }
    .status-synced { color: #4caf50; }
    .status-modified { color: #ff9800; }
    .status-syncing { color: #2196f3; }
    .status-error { color: #e53935; }
    .status-loading, .status-idle { color: #888; }
    .status-encrypted { color: #4caf50; }
    .status-unencrypted { color: #888; }

    .balanceBadges {
        display: inline-flex;
        gap: 4px;
        margin-left: 6px;
    }

    .balanceBadge {
        font-size: 10px;
        padding: 1px 5px;
        border-radius: 3px;
        background: #f0f0f0;
        color: #555;
        font-family: inherit;
    }

    .sealSessionBtn {
        margin-left: 8px;
    }

    .statusActions {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 20px;
    }

    .syncButton {
        background-color: var(--q-primary);
        color: white;
        font-weight: 600;
        font-size: 12px;
    }

    .syncButton:hover {
        background-color: color-mix(in srgb, var(--q-primary) 90%, transparent);
    }

    .closeButton {
        font-size: 12px;
        color: #888;
    }

    .noVectorBlock {
        text-align: center;
        margin-top: 100px;
    }

    .noVectorBlock a {
        color: #8f4500;
        margin-top: 10px;
        display: inline-block;
    }

    .faucetButton {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 100;
    }

    .walFaucetButton {
        position: fixed;
        bottom: 20px;
        right: 75px;
        z-index: 100;
    }

    .explorerLink {
        color: #8f4500;
        text-decoration: none;
        margin-left: 4px;
    }

    .explorerLink:hover {
        text-decoration: underline;
    }

    .itemsList {
        margin-top: 20px;
        border-top: 1px solid #2a2a2a;
        padding-top: 16px;
        max-height: 300px;
        overflow-y: auto;
    }

    .itemsList h6 {
        margin: 0 0 10px 0;
        font-size: 14px;
        font-weight: 600;
    }

    .itemRow {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 4px 0;
        font-size: 12px;
        font-family: monospace;
        cursor: pointer;
    }

    .itemRow:hover {
        background-color: #f5f5f5;
    }

    .itemIndex {
        color: #888;
        min-width: 30px;
    }

    .itemType {
        color: #4caf50;
        min-width: 50px;
    }

    .itemSize {
        color: #aaa;
    }
</style>
