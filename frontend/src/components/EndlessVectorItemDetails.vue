<template>
    <div class="itemDetailsOverlay" :class="{ visible: isOpen }" @click="$emit('close')">
        <div class="itemDetailsDialog" @click.stop>
            <button class="itemDetailsClose" @click="$emit('close')">&times;</button>

            <h3 class="itemDetailsTitle">Item #{{ item?.index }}</h3>

            <div v-if="isLoading" class="itemDetailsLoading">Loading...</div>

            <div v-else-if="error" class="itemDetailsError">{{ error }}</div>

            <div v-else-if="details" class="itemDetailsBody">
                <div class="detailRow">
                    <span class="detailLabel">Storage type</span>
                    <span class="detailValue">{{ item?.type }}</span>
                </div>
                <div class="detailRow">
                    <span class="detailLabel">Raw size</span>
                    <span class="detailValue">{{ formatBytes(item?.size || 0) }}</span>
                </div>
                <div class="detailRow" v-if="details.compressed">
                    <span class="detailLabel">Compression</span>
                    <span class="detailValue">gzip ({{ formatBytes(details.compressedSize) }} → {{ formatBytes(details.originalSize) }})</span>
                </div>
                <div class="detailRow">
                    <span class="detailLabel">Patch type</span>
                    <span class="detailValue detailHighlight">{{ details.patchType }}</span>
                </div>
                <div class="detailRow" v-if="details.snapshotSize != null">
                    <span class="detailLabel">Snapshot size</span>
                    <span class="detailValue">{{ formatBytes(details.snapshotSize) }}</span>
                </div>
                <div class="detailRow" v-if="details.chunkCount != null">
                    <span class="detailLabel">Chunks</span>
                    <span class="detailValue">{{ details.chunkCount }}</span>
                </div>
                <div class="detailRow" v-if="details.prevHash">
                    <span class="detailLabel">Prev snapshot hash</span>
                    <span class="detailValue detailMono">{{ details.prevHash }}</span>
                </div>
                <div class="detailRow" v-if="details.opCount != null">
                    <span class="detailLabel">Operations</span>
                    <span class="detailValue">{{ details.opCount }}</span>
                </div>
                <div class="detailOps" v-if="details.ops && details.ops.length">
                    <div class="detailOp" v-for="(op, i) in details.ops" :key="i">
                        <span class="opKind" :class="'op-' + op.kind">{{ op.kind }}</span>
                        <span class="opPath">{{ op.path }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
const MAGIC_COMPRESSED = 0xCDCB02FF;
const MAGIC_PATCH = 0xCDCB0101;
const MAGIC_DIFF_PATCH = 0xCDCB0102;

const OP_KINDS = ['replace_file', 'add_file', 'add_empty_folder', 'remove'];

export default {
    name: 'EndlessVectorItemDetails',
    props: {
        item: { type: Object, default: null },
        isOpen: { type: Boolean, default: false },
        isEncrypted: { type: Boolean, default: false },
    },
    emits: ['close'],
    data() {
        return {
            isLoading: false,
            error: null,
            details: null,
        };
    },
    watch: {
        isOpen(val) {
            if (val && this.item) {
                this.loadDetails();
            } else {
                this.details = null;
                this.error = null;
            }
        },
    },
    methods: {
        async loadDetails() {
            this.isLoading = true;
            this.error = null;
            this.details = null;
            try {
                const raw = this.item._raw;
                if (!raw) throw new Error('No raw item reference');
                const bytes = await raw.bytes();
                this.details = await this.parseBytes(bytes);
            } catch (err) {
                this.error = err.message || String(err);
            } finally {
                this.isLoading = false;
            }
        },
        async parseBytes(bytes) {
            if (bytes.length < 4) return { patchType: 'Unknown (too small)' };

            const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
            const magic = dv.getUint32(0, true);

            if (magic === MAGIC_COMPRESSED) {
                const origSize = Number(dv.getBigUint64(8, true));
                const compressedSize = bytes.length - 16;
                const inner = await this.decompress(bytes.subarray(16));
                const innerDetails = inner ? await this.parseBytes(inner) : { patchType: 'Compressed (inner unknown)' };
                return {
                    ...innerDetails,
                    compressed: true,
                    originalSize: origSize,
                    compressedSize,
                };
            }

            if (magic === MAGIC_PATCH) {
                const snapshotLen = Number(dv.getBigUint64(8, true));
                const chunksLen = Number(dv.getBigUint64(16, true));
                let chunkCount = null;
                const chunksOffset = 24 + snapshotLen;
                if (bytes.length >= chunksOffset + 4) {
                    chunkCount = new DataView(bytes.buffer, bytes.byteOffset + chunksOffset, 4).getUint32(0, true);
                }
                return {
                    patchType: 'Full Snapshot',
                    snapshotSize: snapshotLen,
                    chunksLen,
                    chunkCount,
                    compressed: false,
                };
            }

            if (magic === MAGIC_DIFF_PATCH) {
                const prevHashBytes = bytes.slice(8, 40);
                const prevHash = Array.from(prevHashBytes).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16) + '...';
                const opsLen = dv.getUint32(40, true);
                const chunksLen = Number(dv.getBigUint64(44, true));
                let chunkCount = null;
                const chunksOffset = 52 + opsLen;
                if (bytes.length >= chunksOffset + 4) {
                    chunkCount = new DataView(bytes.buffer, bytes.byteOffset + chunksOffset, 4).getUint32(0, true);
                }
                const ops = this.parseOps(bytes, 52, opsLen);
                return {
                    patchType: 'Incremental Diff',
                    prevHash,
                    opsLen,
                    chunksLen,
                    chunkCount,
                    opCount: ops.length,
                    ops,
                    compressed: false,
                };
            }

            if (this.isEncrypted) {
                return { patchType: 'Encrypted (Seal)', compressed: false };
            }

            return { patchType: 'Unknown (magic: 0x' + magic.toString(16) + ')', compressed: false };
        },
        parseOps(bytes, offset, opsLen) {
            const ops = [];
            const end = offset + opsLen;
            let cur = offset;
            try {
                while (cur < end) {
                    const kind = bytes[cur]; cur++;
                    const pathDepth = bytes[cur]; cur++;
                    const segments = [];
                    for (let d = 0; d < pathDepth; d++) {
                        const nameLen = new DataView(bytes.buffer, bytes.byteOffset + cur, 2).getUint16(0, true);
                        cur += 2;
                        const name = new TextDecoder().decode(bytes.subarray(cur, cur + nameLen));
                        cur += nameLen;
                        segments.push(name);
                    }
                    if (kind === 0 || kind === 1) {
                        cur += 32; // fingerprint
                        const manifestLen = new DataView(bytes.buffer, bytes.byteOffset + cur, 4).getUint32(0, true);
                        cur += 4 + manifestLen;
                    }
                    ops.push({
                        kind: OP_KINDS[kind] || 'unknown',
                        path: '/' + segments.join('/'),
                    });
                }
            } catch (e) {
                // partial parse is fine
            }
            return ops;
        },
        async decompress(compressed) {
            try {
                const ds = new DecompressionStream('gzip');
                const writer = ds.writable.getWriter();
                const reader = ds.readable.getReader();
                writer.write(compressed);
                writer.close();
                const chunks = [];
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    chunks.push(value);
                }
                const totalLen = chunks.reduce((s, c) => s + c.length, 0);
                const result = new Uint8Array(totalLen);
                let offset = 0;
                for (const chunk of chunks) {
                    result.set(chunk, offset);
                    offset += chunk.length;
                }
                return result;
            } catch {
                return null;
            }
        },
        formatBytes(bytes) {
            if (bytes === 0) return '0 B';
            const units = ['B', 'KB', 'MB'];
            const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
            const val = bytes / Math.pow(1024, i);
            return val.toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
        },
    },
}
</script>

<style scoped>
.itemDetailsOverlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, visibility 0.2s;
}

.itemDetailsOverlay.visible {
    opacity: 1;
    visibility: visible;
}

.itemDetailsDialog {
    position: relative;
    background-color: white;
    border-radius: 8px;
    padding: 20px;
    min-width: 380px;
    max-width: 90vw;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.itemDetailsClose {
    position: absolute;
    top: 10px;
    right: 14px;
    border: none;
    background: none;
    font-size: 24px;
    cursor: pointer;
    color: #888;
    line-height: 1;
}

.itemDetailsClose:hover {
    color: #333;
}

.itemDetailsTitle {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
}

.itemDetailsLoading {
    color: #888;
    font-size: 14px;
    padding: 20px 0;
    text-align: center;
}

.itemDetailsError {
    color: #e53935;
    font-size: 13px;
    padding: 10px 0;
}

.itemDetailsBody {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.detailRow {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #eee;
}

.detailLabel {
    font-size: 12px;
    color: #888;
}

.detailValue {
    font-size: 12px;
    font-weight: 500;
    color: #333;
}

.detailHighlight {
    color: #1976d2;
    font-weight: 600;
}

.detailMono {
    font-family: monospace;
    font-size: 11px;
}

.detailOps {
    margin-top: 12px;
    border-top: 1px solid #eee;
    padding-top: 10px;
    max-height: 200px;
    overflow-y: auto;
}

.detailOp {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 0;
    font-size: 12px;
    font-family: monospace;
}

.opKind {
    min-width: 100px;
    font-weight: 600;
}

.op-add_file { color: #4caf50; }
.op-replace_file { color: #ff9800; }
.op-remove { color: #e53935; }
.op-add_empty_folder { color: #2196f3; }

.opPath {
    color: #555;
    word-break: break-all;
}
</style>
