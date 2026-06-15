<template>
    <div class="walletStatusBar">
        <q-btn size="sm" flat dense :color="selectedChain === 'testnet' ? 'primary' : 'grey-5'" label="testnet" @click="switchAndConnect('testnet')" />
        <q-btn size="sm" flat dense :color="selectedChain === 'localnet' ? 'primary' : 'grey-5'" label="localnet" @click="switchAndConnect('localnet')" />
        <q-btn v-if="!connectedAddress && selectedChain" size="sm" dense color="primary" label="Connect" @click="connect" />
        <transition name="wsb-fade">
            <span v-if="wrongChainWarning" class="wsb-wrongchain">wrong chain in wallet</span>
        </transition>
        <template v-if="connectedAddress">
            <span class="wsb-address" :title="connectedAddress">{{ shortAddress }}</span>
            <div class="wsb-disconnect" @click="disconnect" title="Disconnect wallet">&times;</div>
        </template>
        <SignInWithSui v-if="selectedChain" :defaultChain="selectedChain" :persist="true" @suiMaster="onSuiMaster" @disconnected="onDisconnected" @wrongchain="onWrongChain" ref="sui" :visible="false" />
        <DarkChanger v-if="showDarkChanger" class="wsb-dark" size="sm" round color="primary" />
    </div>
</template>

<script>
import { SignInWithSui } from 'vue-sui';
import DarkChanger from 'shared/components/LayoutElements/DarkChanger.vue';

export default {
    name: 'WalletStatusBar',
    components: {
        SignInWithSui,
        DarkChanger,
    },
    props: {
        // show the dark-mode toggle at the end of the bar
        showDarkChanger: { type: Boolean, default: false },
    },
    data() {
        return {
            selectedChain: '',
            wrongChainWarning: false,
        };
    },
    computed: {
        connectedAddress() {
            return this.$store.sui.address;
        },
        connectedChain() {
            return this.$store.sui.connectedChain;
        },
        shortAddress() {
            const a = this.connectedAddress;
            if (!a) return '';
            return a.slice(0, 6) + '...' + a.slice(-4);
        },
    },
    methods: {
        disconnect() {
            this.$store.sui.disconnect();
        },
        connect() {
            this.$refs.sui?.connect();
        },
        switchAndConnect(chain) {
            this.$q.localStorage.set('preferredChain', chain);
            this.selectedChain = chain;
            this.$nextTick(() => {
                this.$refs.sui?.connect();
            });
        },
        onWrongChain() {
            if (this._wrongChainTimeout) clearTimeout(this._wrongChainTimeout);
            this._wrongChainTimeout = setTimeout(() => {
                this._wrongChainTimeout = null;
                if (!this.connectedAddress) {
                    this.wrongChainWarning = true;
                    setTimeout(() => { this.wrongChainWarning = false; }, 1500);
                }
            }, 500);
        },
        onSuiMaster(suiMaster) {
            if (this._wrongChainTimeout) {
                clearTimeout(this._wrongChainTimeout);
                this._wrongChainTimeout = null;
            }
            this.wrongChainWarning = false;
            this.$store.sui.setSuiMaster(suiMaster);
        },
        onDisconnected() {
            this.$store.sui.address = null;
            this.$store.sui.connectedChain = null;
            this.$store.sui.suiMaster = null;
        },
    },
    mounted() {
        const stored = this.$q.localStorage.getItem('preferredChain');
        if (stored) {
            this.selectedChain = stored;
        }

        this.$store.sui.$onAction((params) => {
            if (params.name === 'request') {
                this.connect();
            }
        });
        this.$store.sui.$onAction((params) => {
            if (params.name === 'disconnect') {
                this.$refs.sui?.disconnect();
            }
        });
    },
};
</script>

<style>
    .walletStatusBar {
        position: fixed;
        bottom: 12px;
        left: 12px;
        z-index: 100;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    /* dark toggle sits after everything, with a little breathing room */
    .wsb-dark {
        margin-left: 10px;
    }

    .wsb-address {
        font-size: 11px;
        color: #666;
        font-family: monospace;
        cursor: default;
    }

    .wsb-disconnect {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #e0e0e0;
        color: #666;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        line-height: 1;
        cursor: pointer;
    }

    .wsb-disconnect:hover {
        background: #ef5350;
        color: #fff;
    }

    .wsb-wrongchain {
        font-size: 10px;
        color: #ef5350;
        white-space: nowrap;
    }

    .wsb-fade-enter-active,
    .wsb-fade-leave-active {
        transition: opacity 0.3s;
    }

    .wsb-fade-enter-from,
    .wsb-fade-leave-to {
        opacity: 0;
    }
</style>
