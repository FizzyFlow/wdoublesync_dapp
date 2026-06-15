<template>
    <div v-if="isLocalnet && connectedAddress" class="localnetFaucets">
        <q-btn
            :loading="isFaucetingSui"
            @click="requestSui"
            icon="water_drop"
            round
            color="blue"
            title="Get SUI from faucet"
        />
        <q-btn
            :loading="isFaucetingWal"
            @click="requestWal"
            label="WAL"
            round
            color="teal"
            title="Get WAL from faucet"
        />
    </div>
</template>

<script>
import { getAggregator } from '../WalrusMedia/includes/WalrusMediaClientsMaker.js';

/**
 * Localnet-only faucet buttons (SUI + WAL), fixed to the bottom-right corner.
 * Renders nothing unless the connected wallet is on a local network.
 *
 *   - SUI: drips via suiMaster.requestSuiFromFaucet() (the validator faucet).
 *   - WAL: POSTs to the LocalnodeWalrusTestServer's /v1/wal-faucet endpoint,
 *          which draws WAL from the localnet TestTreasury. The server URL is the
 *          aggregator URL resolved by WalrusMediaClientsMaker.
 *
 * Reads wallet state from the global `$store.sui`. Drop in anywhere: `<LocalnetFaucets />`.
 */
export default {
    name: 'LocalnetFaucets',
    // Emitted after a faucet request settles (payload: 'sui' | 'wal'); useful for
    // refreshing balances on the host page.
    emits: ['fauceted'],
    data() {
        return {
            isFaucetingSui: false,
            isFaucetingWal: false,
        };
    },
    computed: {
        connectedAddress() {
            return this.$store.sui.address;
        },
        connectedChain() {
            return this.$store.sui.connectedChain;
        },
        isLocalnet() {
            return this.connectedChain?.includes('localnet') || this.connectedChain?.includes('local');
        },
    },
    methods: {
        async requestSui() {
            this.isFaucetingSui = true;
            try {
                await this.$store.sui.suiMaster.requestSuiFromFaucet();
                this.$q?.notify?.({ type: 'positive', message: 'SUI sent from faucet', position: 'top' });
            } catch (err) {
                console.error('SUI faucet error:', err);
                this.$q?.notify?.({ type: 'negative', message: 'SUI faucet failed', position: 'top' });
            } finally {
                this.isFaucetingSui = false;
                this.$emit('fauceted', 'sui');
            }
        },
        async requestWal() {
            this.isFaucetingWal = true;
            try {
                // The localnet server exposes POST /v1/wal-faucet — draws 1 WAL from the
                // TestTreasury and transfers it to the address. Reach it via the aggregator URL.
                const base = await getAggregator(this.connectedChain);
                if (!base) throw new Error('no localnet aggregator URL');
                const res = await fetch(`${base}/v1/wal-faucet`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address: this.connectedAddress }),
                });
                if (!res.ok) throw new Error(`WAL faucet returned ${res.status}`);
                this.$q?.notify?.({ type: 'positive', message: 'WAL sent from faucet', position: 'top' });
            } catch (err) {
                console.error('WAL faucet error:', err);
                this.$q?.notify?.({ type: 'negative', message: 'WAL faucet failed', position: 'top' });
            } finally {
                this.isFaucetingWal = false;
                this.$emit('fauceted', 'wal');
            }
        },
    },
};
</script>

<style scoped>
/* fixed bottom-right; pages typically pin the wallet bar top-right, so no overlap */
.localnetFaucets {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
</style>
