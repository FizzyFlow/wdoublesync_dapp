import { DoubleSyncFile } from 'wdoublesync';
import WalrusMediaNanoThumb from './WalrusMediaNanoThumb.js';

const MIME_BY_EXT = {
    'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
    'gif': 'image/gif', 'webp': 'image/webp', 'avif': 'image/avif',
    'svg': 'image/svg+xml', 'bmp': 'image/bmp', 'ico': 'image/x-icon',
    'mp4': 'video/mp4', 'webm': 'video/webm', 'mov': 'video/quicktime',
    'avi': 'video/x-msvideo', 'mkv': 'video/x-matroska', 'ogv': 'video/ogg',
    'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'ogg': 'audio/ogg',
    'flac': 'audio/flac', 'aac': 'audio/aac',
    'txt': 'text/plain', 'md': 'text/markdown', 'json': 'application/json',
    'js': 'text/javascript', 'css': 'text/css', 'html': 'text/html',
    'xml': 'text/xml', 'csv': 'text/csv', 'log': 'text/plain',
};

/**
 * Binary layout (all little-endian):
 *   [0]      version (1)
 *   [1]      flags: bit0 = has thumbnail
 *   [2..3]   width  (uint16)
 *   [4..5]   height (uint16)
 *   [6..9]   duration × 100 (uint32, 0 if none)
 *   [10..11] thumbnail length (uint16)
 *   [12 .. 12+thumbLen-1] thumbnail bytes
 *   [12+thumbLen ..] raw media content
 */
const HEADER_SIZE = 12;
const VERSION = 1;

let _idCounter = 0;

export default class WalrusMediaDoubleSyncFile extends DoubleSyncFile {
    constructor(name, content = new Uint8Array(0)) {
        super();
        if (typeof name !== 'string' || !name) throw new Error('WalrusMediaDoubleSyncFile: name required');
        this._name = name;
        this._content = content instanceof Uint8Array ? content : new Uint8Array(0);
        this._parsed = null;
        this._previewUrls = {};
        this._folder = null;
        this.id = 'dsf_' + (++_idCounter) + '_' + Math.random().toString(36).substring(2, 8);
    }

    // ── DoubleSyncFile interface ──

    get name() { return this._name; }
    async getContent() { return this._content; }
    async getSize() { return this._content.length; }

    async setContent(bytes) {
        if (!(bytes instanceof Uint8Array)) throw new Error('setContent: bytes must be Uint8Array');
        this._content = bytes;
        this._parsed = null;
        this._revokeUrls(); // content changed — old blob URL is stale
    }

    // ── UI compatibility (used by row builder / row item / viewer) ──

    get isFolder() { return false; }
    get isBackButton() { return false; }
    get folder() { return this._folder; }

    get mimeType() {
        const ext = this._name.split('.').pop()?.toLowerCase();
        return MIME_BY_EXT[ext] || 'application/octet-stream';
    }

    get isImage() { return this.mimeType.startsWith('image/'); }
    get isVideo() { return this.mimeType.startsWith('video/'); }
    get isAudio() { return this.mimeType.startsWith('audio/'); }
    get isText() {
        const m = this.mimeType;
        return m.startsWith('text/') || m === 'application/json';
    }

    getTextContent() { return new TextDecoder().decode(this.mediaContent); }

    setTextContent(str) {
        const bytes = new TextEncoder().encode(str);
        const rebuilt = WalrusMediaDoubleSyncFile.create(this._name, bytes, {});
        this._content = rebuilt._content;
        this._parsed = null;
        this._revokeUrls();
    }

    get width() { return this._parse().width; }
    get height() { return this._parse().height; }
    get duration() { return this._parse().duration; }
    get thumbnail() { return this._parse().thumbnail; }

    get ratio() {
        const { width, height } = this._parse();
        if (width && height) return width / height;
        return 1;
    }

    get mediaContent() { return this._parse().media; }

    get durationFormatted() {
        const dur = this.duration;
        if (!dur) return null;
        const total = Math.floor(dur);
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = total % 60;
        if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    /**
     * Returns a preview URL at the given size. For the doublesync-backed file:
     * - 'nano': data URL from the embedded nano thumbnail
     * - 'low'/'micro'/'high': object URL from the full media content
     */
    async getPreviewURL(size) {
        if (size === 'nano') {
            const thumb = this.thumbnail;
            if (thumb && thumb.length >= 3) {
                return WalrusMediaNanoThumb.restore(thumb);
            }
            return this._getMediaObjectUrl();
        }
        return this._getMediaObjectUrl();
    }

    dispose() {
        // Intentionally don't revoke blob URLs here. The underlying data lives in
        // _content regardless, so revoking doesn't free memory — it just breaks any
        // <img>/<video> elements still referencing the URL (viewer, other tab buffer).
    }

    // ── Static builders ──

    static create(name, mediaBytes, meta = {}) {
        const { width = 0, height = 0, duration = 0, thumbnail = null } = meta;
        const thumbBytes = thumbnail instanceof Uint8Array ? thumbnail : new Uint8Array(0);
        const thumbLen = thumbBytes.length;

        const buf = new Uint8Array(HEADER_SIZE + thumbLen + mediaBytes.length);
        const view = new DataView(buf.buffer);

        buf[0] = VERSION;
        buf[1] = thumbLen > 0 ? 1 : 0;
        view.setUint16(2, width, true);
        view.setUint16(4, height, true);
        view.setUint32(6, Math.round((duration || 0) * 100), true);
        view.setUint16(10, thumbLen, true);
        if (thumbLen) buf.set(thumbBytes, HEADER_SIZE);
        buf.set(mediaBytes, HEADER_SIZE + thumbLen);

        return new WalrusMediaDoubleSyncFile(name, buf);
    }

    static fromRaw(name, content) {
        return new WalrusMediaDoubleSyncFile(name, content);
    }

    // ── Internal ──

    _getMediaObjectUrl() {
        if (this._previewUrls.media) return this._previewUrls.media;
        const media = this.mediaContent;
        if (!media || !media.length) return '';
        const blob = new Blob([media], { type: this.mimeType });
        const url = URL.createObjectURL(blob);
        this._previewUrls.media = url;
        return url;
    }

    _revokeUrls() {
        for (const url of Object.values(this._previewUrls)) {
            if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
        }
        this._previewUrls = {};
    }

    _parse() {
        if (this._parsed) return this._parsed;

        if (this._content.length < HEADER_SIZE) {
            this._parsed = { width: 0, height: 0, duration: 0, thumbnail: null, media: this._content };
            return this._parsed;
        }

        const view = new DataView(this._content.buffer, this._content.byteOffset, this._content.byteLength);
        const version = this._content[0];

        if (version !== VERSION) {
            this._parsed = { width: 0, height: 0, duration: 0, thumbnail: null, media: this._content };
            return this._parsed;
        }

        const width = view.getUint16(2, true);
        const height = view.getUint16(4, true);
        const durationRaw = view.getUint32(6, true);
        const duration = durationRaw ? durationRaw / 100 : 0;
        const thumbLen = view.getUint16(10, true);

        const thumbnail = thumbLen > 0 ? this._content.slice(HEADER_SIZE, HEADER_SIZE + thumbLen) : null;
        const media = this._content.slice(HEADER_SIZE + thumbLen);

        this._parsed = { width, height, duration, thumbnail, media };
        return this._parsed;
    }
}
