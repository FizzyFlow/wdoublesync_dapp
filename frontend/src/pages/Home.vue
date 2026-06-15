<template>
    <div>
        <div class="homeBlock">
            <img src="/logo.png" height="180"/>
            <h1>EndlessVectorWalrus</h1>

            <p class="homeDescription">
                A sample dApp demonstrating <strong>EndlessVectorWalrus</strong> and <strong>WDoubleSync</strong> libraries
                for decentralized file storage, version control, sync and backup.
            </p>
            <p class="homeDescription">
                An abstract virtual file system accepts files and synchronizes its state
                on-chain via <strong>Sui + Walrus</strong>. WDoubleSync uses Content-Defined Chunking (CDC) to compute
                minimal binary diffs between folder snapshots, then pushes only the changed chunks
                as compressed patches into an append-only EndlessVector — enabling efficient incremental sync
                with full state reconstruction at any version.
            </p>

            <div class="galleryActions">
                <q-checkbox v-model="encryptWithSeal" label="Encrypt with Seal" dense class="sealCheckbox" />

                <q-btn class="sampleGalleryButton" @click="createNewGallery" :loading="isCreating" :disable="!connectedAddress || !signAndExecuteTransaction">
                    Create New EndlessVectorWalrus
                </q-btn>

                <div class="orDivider">or open existing</div>

                <q-input
                    v-model="inputVectorId"
                    dense outlined
                    placeholder="EndlessVectorWalrus Object ID (0x...)"
                    class="vectorIdInput"
                />
                <q-btn class="sampleGalleryButton" @click="openGallery" :disable="!connectedAddress || !inputVectorId">
                    Open EndlessVectorWalrus
                </q-btn>
            </div>
        </div>

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

        <WalletStatusBar />
    </div>
</template>

<script>
import WalletStatusBar from '../components/WalletStatusBar.vue';
import EndlessVector from '@fizzyflow/endless-vector';
import { getPackageId, normalizeNetworkName, makeSealClient } from 'shared/components/WalrusMedia/includes/WalrusMediaClientsMaker.js';

export default {
    name: 'Home',
    path: '/home',
    components: {
        WalletStatusBar,
    },
    data() {
        return {
            inputVectorId: '',
            isCreating: false,
            isFauceting: false,
            packageId: null,
            encryptWithSeal: false,
        }
    },
    methods: {
        async createNewGallery() {
            this.isCreating = true;
            try {
                const signAndExecuteTransaction = async(tx) => {
                    console.log(this.$store.sui.suiMaster);
                    return this.$store.sui.suiMaster.signAndExecuteTransaction({ transaction: tx });
                };

                const createParams = {
                    suiClient: this.suiClient,
                    packageId: this.packageId,
                    signAndExecuteTransaction: signAndExecuteTransaction,
                };
                if (this.encryptWithSeal) {
                    createParams.sealClient = await makeSealClient(this.connectedChain, this.suiClient);
                }
                console.log(''+signAndExecuteTransaction);
                const ev = await EndlessVector.create(createParams);
                this.$router.push('/vector#' + this.networkName + ':' + ev.id);
            } catch (err) {
                console.error('Failed to create gallery:', err);
            } finally {
                this.isCreating = false;
            }
        },
        openGallery() {
            if (this.inputVectorId) {
                this.$router.push('/vector#' + this.networkName + ':' + this.inputVectorId.trim());
            }
        },
        async requestFaucet() {
            this.isFauceting = true;
            try {
                await this.$store.sui.suiMaster.requestSuiFromFaucet();
            } catch (err) {
                console.error('Faucet error:', err);
            } finally {
                this.isFauceting = false;
            }
        },
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
        signAndExecuteTransaction() {
            if (!this.$store.sui.suiMaster?.address) return null;
            console.log(this.$store.sui.suiMaster);
            return (tx) => this.$store.sui.suiMaster.signAndExecuteTransaction({ transaction: tx });
        },
        isLocalnet() {
            return this.connectedChain?.includes('localnet') || this.connectedChain?.includes('local');
        },
        networkName() {
            return normalizeNetworkName(this.connectedChain);
        },
    },
    watch: {
        connectedChain: {
            immediate: true,
            async handler(chain) {
                if (chain) {
                    this.packageId = await getPackageId(chain);
                }
            },
        },
    },
    mounted() {
    },
}
</script>

<style>
    .homeBlock {
        text-align: center;
        margin-top: 50px;
    }

    .homeDescription {
        max-width: 620px;
        margin: 10px auto;
        font-size: 14px;
        line-height: 1.6;
        color: #444;
        text-align: left;
    }

    .galleryActions {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        margin-top: 20px;
    }

    .vectorIdInput {
        width: 400px;
        max-width: 90vw;
    }

    .sampleGalleryButton {
        margin-top: 0px;
        padding: 3px 10px;
        font-size: 12px;
        line-height: 14px;
        background-color: var(--q-primary);
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        transition: background-color 0.2s ease;
        font-family: inherit;
        font-weight: 600;
    }

    .sampleGalleryButton:hover {
        background-color: color-mix(in srgb, var(--q-primary) 90%, transparent);
    }

    .orDivider {
        font-size: 12px;
        color: #888;
        margin: 5px 0;
    }

    .faucetButton {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 100;
    }

</style>
