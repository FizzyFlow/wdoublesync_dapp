<template>
    <div
        class="sealSessionKeyButton"
        :class="{ active: hasSessionKey && !isExpired, expired: isExpired, glowing: !hasSessionKey && !isCreating }"
        @click="toggle"
        :title="buttonTitle"
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="keyIcon"
        >
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 0-7.778 7.778 5.5 5.5 0 0 0 7.778 0L15.5 15.5l.5.5 2-2 2 2 3-3-5-5z"></path>
        </svg>
        <svg
            v-if="hasSessionKey && !isExpired"
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="checkIcon"
        >
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    </div>
</template>

<script>
import { SessionKey } from '@mysten/seal';

export default {
    name: 'SealSessionKeyButton',
    props: {
        suiClient: { type: Object, required: true },
        packageId: { type: String, required: true },
        suiMaster: { type: Object, required: true },
    },
    emits: ['created', 'cleared'],
    data() {
        return {
            hasSessionKey: false,
            isCreating: false,
            isExpired: false,
        };
    },
    computed: {
        buttonTitle() {
            if (this.isCreating) return 'Creating session key...';
            if (this.isExpired) return 'Session key expired — click to renew';
            if (this.hasSessionKey) return 'Session key active — click to clear';
            return 'Create Seal session key';
        },
    },
    methods: {
        async toggle() {
            if (this.hasSessionKey && !this.isExpired) {
                this.clear();
            } else {
                await this.create();
            }
        },
        async create() {
            if (this.isCreating) return;
            this.isCreating = true;
            try {
                const address = this.suiMaster.address;
                const sessionKey = await SessionKey.create({
                    address,
                    packageId: this.packageId,
                    ttlMin: 5,
                    suiClient: this.suiClient,
                });

                const personalMessage = sessionKey.getPersonalMessage();
                let sig;
                if (this.suiMaster._keypair?.signPersonalMessage) {
                    ({ signature: sig } = await this.suiMaster._keypair.signPersonalMessage(personalMessage));
                } else {
                    ({ signature: sig } = await this.suiMaster._signer.signPersonalMessage({ message: personalMessage }));
                }
                await sessionKey.setPersonalMessageSignature(sig);

                this._sessionKey = sessionKey;
                this.hasSessionKey = true;
                this.isExpired = false;
                this._startExpiryCheck();
                this.$emit('created', sessionKey);
            } catch (err) {
                console.error('[SealSessionKey] create failed:', err);
            } finally {
                this.isCreating = false;
            }
        },
        clear() {
            this._sessionKey = null;
            this.hasSessionKey = false;
            this.isExpired = false;
            this._stopExpiryCheck();
            this.$emit('cleared');
        },
        _startExpiryCheck() {
            this._stopExpiryCheck();
            this._expiryTimer = setInterval(() => {
                if (this._sessionKey?.isExpired?.()) {
                    this.isExpired = true;
                    this._stopExpiryCheck();
                }
            }, 10000);
        },
        _stopExpiryCheck() {
            if (this._expiryTimer) {
                clearInterval(this._expiryTimer);
                this._expiryTimer = null;
            }
        },
    },
    beforeUnmount() {
        this._stopExpiryCheck();
    },
    created() {
        this._sessionKey = null;
        this._expiryTimer = null;
    },
};
</script>

<style>
.sealSessionKeyButton.glowing {
    animation: sealSessionKeyGlow 2s ease-in-out infinite;
}
@keyframes sealSessionKeyGlow {
    0%, 100% { border-color: #ccc; color: #666; background: #fff; }
    50% { border-color: #90caf9; color: #1976d2; background: #e3f2fd; }
}
</style>

<style scoped>
.sealSessionKeyButton {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fff;
    color: #666;
    cursor: pointer;
}

.sealSessionKeyButton:hover {
    border-color: #999;
    color: #333;
}

.sealSessionKeyButton.active {
    border-color: #4caf50;
    color: #4caf50;
    background: #f1f8e9;
}

.sealSessionKeyButton.expired {
    border-color: #ff9800;
    color: #ff9800;
    background: #fff8e1;
}

.keyIcon {
    flex-shrink: 0;
}

.checkIcon {
    flex-shrink: 0;
}
</style>
