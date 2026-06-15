<template>
    <span class="evwInfo">
        <q-icon name="help_outline" size="15px" class="evwInfo_icon" />
        <q-tooltip
            anchor="bottom middle"
            self="top middle"
            :offset="[0, 6]"
            :delay="100"
            class="evwInfo_tip"
        >
            <div class="evwInfo_title">
                <q-icon name="hub" size="18px" class="evwInfo_titleIcon" />
                EndlessVectorWalrus
            </div>
            <p class="evwInfo_text">
                An append-only, versioned vector stored on Sui. WDoubleSync splits
                your files into content-defined chunks and pushes only the changed
                chunks as compressed patches — giving efficient incremental sync,
                full version history, and recoverable state. Large blobs live on
                Walrus, and data can be encrypted client-side with Seal.
            </p>
        </q-tooltip>
    </span>
</template>

<script>
export default {
    name: 'EvwInfo',
};
</script>

<style scoped>
.evwInfo {
    display: inline-flex;
    vertical-align: middle;
    cursor: help;
}

.evwInfo_icon {
    color: var(--lp-accent, #2f6fe0);
}
</style>

<!-- global (non-scoped): the tooltip is teleported to <body>, so scoped style
     attributes don't reliably reach it. --lp-* tokens aren't reachable there
     either, so colours are explicit with a dark-mode override. -->
<style>
.q-tooltip.evwInfo_tip {
    max-width: 500px;
    padding: 22px 24px;
    color: #16223a;
    background: linear-gradient(180deg, #ffffff 0%, #f3f7ff 100%);
    border: 1px solid rgba(40, 70, 130, 0.16);
    border-radius: 16px;
    box-shadow: 0 12px 36px -10px rgba(20, 40, 80, 0.28);
    font-size: 12.5px;
}

.body--dark .q-tooltip.evwInfo_tip {
    color: #e8edf5;
    background: linear-gradient(180deg, #121b29 0%, #0d141f 100%);
    border-color: rgba(130, 160, 210, 0.16);
    box-shadow: 0 12px 36px -10px rgba(0, 0, 0, 0.7);
}

.evwInfo_tip .evwInfo_title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-display, inherit);
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 8px;
}

.evwInfo_tip .evwInfo_titleIcon {
    color: #2f6fe0;
}

.body--dark .evwInfo_tip .evwInfo_titleIcon {
    color: #4f8ef7;
}

.evwInfo_tip .evwInfo_text {
    font-size: 12.5px;
    line-height: 1.55;
    color: #46546b;
    margin: 0;
}

.body--dark .evwInfo_tip .evwInfo_text {
    color: #aab6c8;
}
</style>
