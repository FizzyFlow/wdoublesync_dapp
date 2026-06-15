<template>
    <LandingShell class="selectPage" @home="goHome">
        <WalletStatusBar :show-dark-changer="true" />

        <section class="select">
            <div class="select_inner">
                <h1 class="select_title">
                    Pick up where you
                    <span class="select_title--accent">left off</span>
                </h1>
                <p class="select_sub">
                    Create a new encrypted, versioned vector — or open one you already own.
                </p>

                <div class="select_grid">
                    <!-- create new -->
                    <article class="select_card select_card--action">
                        <h2 class="select_cardTitle">
                            <q-icon name="add_circle" size="20px" class="select_cardTitle_icon" />
                            <span class="select_cardTitle_text">Create new</span>
                        </h2>
                        <p class="select_cardDesc" v-if="connectedAddress">
                            Spin up a fresh EndlessVectorWalrus<EvwInfo /> on
                            <strong>{{ networkName }}</strong>.
                        </p>
                        <p class="select_cardDesc" v-else>
                            Spin up a fresh EndlessVectorWalrus<EvwInfo /> — the network is
                            set by your wallet extension when you connect.
                        </p>
                        <q-checkbox
                            v-model="encryptWithSeal"
                            label="Encrypt with Seal"
                            dense
                            class="select_seal"
                        />
                        <BlobButton
                            :text="connectedAddress ? 'Create New Vector' : 'Connect Wallet'"
                            :icon="connectedAddress ? 'add' : 'account_balance_wallet'"
                            color="var(--lp-accent)"
                            class="select_btn"
                            :disable="isCreating || (!!connectedAddress && !canCreate)"
                            @click="createVector"
                        />
                        <q-inner-loading :showing="isCreating" label="Creating…" color="primary" class="select_loading" />
                    </article>

                    <!-- open by id -->
                    <article class="select_card select_card--action">
                        <h2 class="select_cardTitle">
                            <q-icon name="tag" size="20px" class="select_cardTitle_icon" />
                            <span class="select_cardTitle_text">Open by ID</span>
                        </h2>
                        <p class="select_cardDesc">Paste an EndlessVectorWalrus<EvwInfo /> object ID.</p>
                        <q-input
                            v-model="inputVectorId"
                            dense
                            outlined
                            placeholder="0x…"
                            class="select_input"
                            @keyup.enter="openById"
                        />
                        <BlobButton
                            text="Open Vector"
                            icon="arrow_forward"
                            color="var(--lp-accent)"
                            class="select_btn"
                            :disable="!inputVectorId.trim()"
                            @click="openById"
                        />
                    </article>

                    <!-- owned list -->
                    <article class="select_card select_card--list">
                        <div class="select_listHead">
                            <h2 class="select_cardTitle">
                                <q-icon name="inventory_2" size="20px" class="select_cardTitle_icon" />
                                <span class="select_cardTitle_text">Your vectors</span>
                            </h2>
                            <q-btn
                                flat dense round size="sm" icon="refresh"
                                :disable="!connectedAddress || loadingVectors"
                                @click="loadVectors"
                            />
                        </div>

                        <div v-if="!connectedAddress" class="select_empty">
                            Connect a wallet to see your vectors.
                        </div>
                        <div v-else-if="vectorsError" class="select_empty select_empty--err">{{ vectorsError }}</div>
                        <div v-else-if="!vectors.length && !loadingVectors" class="select_empty">
                            No vectors yet — create one above.
                        </div>
                        <ul v-else class="select_list">
                            <li
                                v-for="id in vectors"
                                :key="id"
                                class="select_row"
                                @click="pick(id)"
                            >
                                <q-icon name="hub" size="18px" class="select_rowIcon" />
                                <span class="select_rowId">{{ id }}</span>
                                <q-icon name="chevron_right" size="18px" class="select_rowArrow" />
                            </li>
                        </ul>

                        <q-inner-loading :showing="loadingVectors" color="primary" class="select_loading" />
                    </article>
                </div>
            </div>
        </section>

        <LocalnetFaucets />
    </LandingShell>
</template>

<script>
import LandingShell from 'shared/components/Landing/LandingShell.vue';
import BlobButton from 'shared/components/Theme/BlobButton.vue';
import LocalnetFaucets from 'shared/components/Faucets/LocalnetFaucets.vue';
import WalletStatusBar from '../components/WalletStatusBar.vue';
import EvwInfo from '../components/EvwInfo.vue';
import EndlessVector from '@fizzyflow/endless-vector';
import { getPackageId, normalizeNetworkName, makeSealClient } from 'shared/components/WalrusMedia/includes/WalrusMediaClientsMaker.js';

export default {
    name: 'Select',
    path: '/select',
    components: {
        LandingShell,
        BlobButton,
        LocalnetFaucets,
        WalletStatusBar,
        EvwInfo,
    },
    data() {
        return {
            inputVectorId: '',
            isCreating: false,
            encryptWithSeal: false,
            packageId: null,
            vectors: [],
            loadingVectors: false,
            vectorsError: '',
        };
    },
    computed: {
        connectedAddress() {
            return this.$store.sui.address;
        },
        connectedChain() {
            return this.$store.sui.connectedChain;
        },
        suiClient() {
            return this.$store.sui.suiMaster?.client || null;
        },
        networkName() {
            return normalizeNetworkName(this.connectedChain);
        },
        canCreate() {
            return !!(this.connectedAddress && this.suiClient && this.packageId);
        },
    },
    methods: {
        goHome() {
            this.$router.push('/');
        },
        async createVector() {
            // require a connected wallet first — prompt connect, then wait for
            // the client + packageId to become ready before creating
            if (!this.connectedAddress) {
                await this.$store.sui.request();
                for (let i = 0; i < 50 && !this.canCreate; i++) {
                    await new Promise((r) => setTimeout(r, 100));
                }
            }
            if (!this.canCreate) return;

            this.isCreating = true;
            try {
                const signAndExecuteTransaction = async (tx) =>
                    this.$store.sui.suiMaster.signAndExecuteTransaction({ transaction: tx });

                const createParams = {
                    suiClient: this.suiClient,
                    packageId: this.packageId,
                    signAndExecuteTransaction,
                };
                if (this.encryptWithSeal) {
                    createParams.sealClient = await makeSealClient(this.connectedChain);
                }
                const ev = await EndlessVector.create(createParams);
                this.$router.push('/vector#' + this.networkName + ':' + ev.id);
            } catch (err) {
                console.error('Failed to create vector:', err);
            } finally {
                this.isCreating = false;
            }
        },
        openById() {
            const id = this.inputVectorId.trim();
            // Sui object IDs are 0x followed by up to 64 hex chars
            if (!/^0x[0-9a-fA-F]{1,64}$/.test(id)) {
                this.$q.notify({
                    type: 'warning',
                    message: 'Enter a valid object ID (0x…).',
                    position: 'top',
                });
                return;
            }
            this.$router.push('/vector#' + this.networkName + ':' + id);
        },
        pick(id) {
            this.$router.push('/vector#' + this.networkName + ':' + id);
        },
        async loadVectors() {
            const suiMaster = this.$store.sui.suiMaster;
            if (!this.connectedAddress || !suiMaster || !this.packageId) {
                this.vectors = [];
                return;
            }
            this.loadingVectors = true;
            this.vectorsError = '';
            try {
                // suidouble SuiMaster.getOwnedObjects → gRPC listOwnedObjects for a
                // full struct type; forEach walks every page.
                const type = `${this.packageId}::endless_walrus::EndlessWalrusVector`;
                const res = await suiMaster.getOwnedObjects({ owner: this.connectedAddress, type });
                const ids = [];
                await res.forEach((obj) => {
                    if (obj && obj.id) ids.push(obj.id);
                });
                this.vectors = ids;
            } catch (e) {
                this.vectorsError = (e && e.message) || 'Failed to load vectors';
                this.vectors = [];
            } finally {
                this.loadingVectors = false;
            }
        },
    },
    watch: {
        connectedChain: {
            immediate: true,
            async handler(chain) {
                if (chain) {
                    this.packageId = await getPackageId(chain);
                    this.loadVectors();
                }
            },
        },
        connectedAddress() {
            this.loadVectors();
        },
    },
};
</script>

<style scoped>
/* wallet bar → top-right pill (like the hero badge) */
.selectPage :deep(.walletStatusBar) {
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

.select {
    padding: 32px 24px 0;
}

.select_inner {
    max-width: 1600px;
    margin: 0 auto;
}

.select_title {
    font-family: var(--font-display, inherit);
    font-size: 40px;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.5px;
    margin: 0 0 12px;
    color: var(--lp-text);
}

.select_title--accent {
    color: var(--lp-accent);
}

.select_sub {
    font-size: 16px;
    line-height: 1.6;
    color: var(--lp-text-2);
    margin: 0 0 32px;
}

.select_grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: start;
    gap: 20px;
    margin-bottom: 20px;
}

/* shared card chrome (matches the landing feature/use-case cards) */
.select_card {
    position: relative;
    display: flex;
    flex-direction: column;
    /* top padding == bottom padding → the title sits as far from the top as the
       action button sits from the bottom */
    padding: 24px 24px;
    border-radius: 16px;
    border: 1px solid var(--lp-card-border);
    background: var(--lp-card-bg);
    box-shadow: var(--lp-card-shadow);
}

/* QInnerLoading overlay rounded to match the card */
.select_loading {
    border-radius: 16px;
}

.select_cardTitle {
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

.select_cardTitle_icon {
    flex: none;
    color: var(--lp-accent);
    filter: drop-shadow(0 0 8px color-mix(in srgb, var(--lp-accent) 35%, transparent));
}

/* gradient wordmark like the header brand */
.select_cardTitle_text {
    background: linear-gradient(95deg, var(--lp-text) 0%, var(--lp-text) 35%, var(--lp-accent) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
}

.select_cardDesc {
    font-size: 13.5px;
    line-height: 1.6;
    color: var(--lp-text-3);
    margin: 0 0 16px;
}

.select_cardDesc strong {
    color: var(--lp-text-2);
}

.select_seal {
    color: var(--lp-text-2);
    margin-bottom: 16px;
}

.select_input {
    margin-bottom: 14px;
}

/* size to content + left-align (cards are flex columns that would otherwise
   stretch the button to full width) */
.select_btn {
    align-self: flex-start;
}

.select_hint {
    font-size: 12px;
    color: var(--lp-text-faint);
    margin: 10px 0 0;
    text-align: center;
}

/* owned list */
.select_listHead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.select_listHead .select_cardTitle {
    margin: 0;
}

.select_empty {
    font-size: 14px;
    color: var(--lp-text-3);
    padding: 18px 4px;
    text-align: center;
}

.select_empty--err {
    color: #ef5350;
}

.select_list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.select_row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid var(--lp-panel-border);
    background: var(--lp-badge-bg);
    color: var(--lp-text-2);
    cursor: pointer;
    transition: border-color 0.2s ease, color 0.2s ease, transform 0.15s ease;
}

.select_row:hover {
    border-color: color-mix(in srgb, var(--lp-accent) 55%, transparent);
    color: var(--lp-text);
    transform: translateY(-1px);
}

.select_rowIcon {
    flex: none;
    color: var(--lp-accent);
}

.select_rowId {
    flex: 1;
    min-width: 0;
    font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.select_rowArrow {
    flex: none;
    color: var(--lp-text-faint);
}

@media (max-width: 1023px) {
    .select_grid {
        grid-template-columns: minmax(0, 1fr);
    }
}

@media (max-width: 599px) {
    .select_title {
        font-size: 32px;
    }
}
</style>
