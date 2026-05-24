import WalrusMediaAbstract from './WalrusMediaAbstract.js';
import WalrusMediaNanoThumb from './WalrusMediaNanoThumb.js';
import WalrusMediaCache from './WalrusMediaCache.js';

/**
 * @typedef {import('./WalrusMediaFolder.js').default} WalrusMediaFolder
 */

export default class WalrusMediaItem extends WalrusMediaAbstract {
    /**
     * Creates a new WalrusMediaItem instance.
     * @param {Object} params - Configuration parameters
     * @param {File} [params.file] - File instance representing the media file
     */
	constructor(params = {}) {
        super(params);

        this.file = params.file || null;
        this.db = params.db || null;

        /** @type {?WalrusMediaFolder} */
        this._folder = params.folder || null;

        /** @type {string} */
        this._network = params.network || 'testnet';

        this._name = this.file?.name || params.name || null;
        this.normalizeName();

        this._width = params.width || null;
        this._height = params.height || null;
        this._duration = params.duration || null;

        // this._walrusId = params.walrusId || null;
        // this._previewWalrusId = params.previewWalrusId || null;

        this._walrusBlobId = params.walrusBlobId || null;
        this._walrusBlobObjectId = params.walrusBlobObjectId || null;

        this._mimeType = this.file?.type || params.mimeType || null;

        /** @type {Object<string, Uint8Array|string>} */
        this._previewCache = {
            nano: null,             // string, data URL
            micro: null,            // Uint8Array (Blob)
            low: null,          // Uint8Array (Blob)
            high: null,         // Uint8Array (Blob)
        };

        this._previewUrls = {
            micro: null,
            low: null,
            high: null,
        };

        /** @type {?Uint8Array} */
        this._nanoThumbnail = params.nanoThumbnail || null;

        this.id = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    }

    /**
     * Creates a new WalrusMediaItem by downloading a file from a URL.
     * @param {string} url - URL of the file to download
     * @param {string} [network='testnet'] - Network to use
     * @returns {Promise<WalrusMediaItem>}
     */
    static async fromUrl(url, network = 'testnet') {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();

        const filename = url.split('/').pop() || 'downloaded-file';
        const contentType = response.headers.get('content-type') || blob.type;

        const file = new File([blob], filename, { type: contentType });

        console.log(`Downloaded file: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes`);

        return new WalrusMediaItem({ file, network });
    }

    get isToBeUploaded() {
        return !!this.file && !this._walrusBlobId;
    }

    get walrusBlobId() {
        return this._walrusBlobId;
    }

    get identifier() {
        return this.path;
    }

    get previewIdentifier() {
        return this.path + '.___preview';
    }
    
    get cacheKey() {
        return this.walrusBlobId + '_' + this.identifier;
    }

    get previewCacheKey() {
        return this.walrusBlobId + '_' + this.previewIdentifier;
    }

    /**
     * Gets the aspect ratio (width / height) of the media file.
     * @returns {number} Aspect ratio, or 1 if dimensions are not set
     */
    get ratio() {
        if (this._width && this._height) {
            return this._width / this._height;
        }
        return 1;
    }

    get width() {
        return this._width;
    }
    
    get height() {
        return this._height;
    }

    get folder() {
        return this._folder;
    }

    get network() {
        return this._network;
    }

    get pathTo() {
        if (this._folder) {
            return this._folder.fullPath + '/';
        } else {
            return '/';
        }
    }

    get path() {
        return this.pathTo + this.name;
    }


    get name() {
        return this._name;
    }

    normalizeName(name = null) {
        this._name = name || this._name;
        if (!this._name) {
            return;
        }

        // An identifier must start with an alphanumeric character, contain no trailing whitespace, and not exceed 64 KB in length.
        if (this._name) {
            let normalized = (''+this._name).normalize("NFD").trim();
            const startsWithLatin = /^[A-Za-z]/.test(normalized);
            if (normalized) {
                if (normalized.length > 1024) {
                    normalized = normalized.substring(0, 1024);
                }
                if (startsWithLatin) {
                    this._name = normalized;
                } else {
                    this._name = 'm-' + normalized;
                }
            }
        }
    }

    /**
     * Gets the MIME type of the media file
     * @returns {string|null}
     */
    get mimeType() {
        return this._mimeType;
    }

    /**
     * Gets the raw duration in seconds (for videos only)
     * @returns {number|null}
     */
    get duration() {
        return this._duration;
    }

    /**
     * Gets the duration formatted as a human-readable string (HH:MM:SS or MM:SS)
     * @returns {string|null}
     */
    get durationFormatted() {
        if (this._duration === null) {
            return null;
        }

        const totalSeconds = Math.floor(this._duration);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        } else {
            return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }

    async setInDb(db = null) {
        const theDb = db || this.db;
        if (!theDb) {
            throw new Error('No database instance provided to setInDb');
        }
        if (!this._walrusBlobId) {
            throw new Error('Cannot setInDb without walrusBlobId');
        }

        // check if there's already an entry for the blob
        let walrusBlobRef = null;
        try {
            const rows = await theDb.query(
                'SELECT id FROM walrus_media_blobs WHERE blobId = ? LIMIT 1',
                [this._walrusBlobId]
            );
            if (rows && rows.length && rows.length.id) {
                walrusBlobRef = rows[0].id;
            }
        } catch (e) {
            console.error('Error checking existing walrus media blob:', e);
        }

        if (!walrusBlobRef) {
            // insert new blob entry
            const result = await theDb.query(
                'INSERT INTO walrus_media_blobs (id, blobObjectId, blobId) VALUES (NULL, ?, ?)',
                [this._walrusBlobObjectId, this._walrusBlobId]
            );
            console.log('Inserted new walrus media blob with ID:', result, result.lastID);
            const rows = await theDb.query(
                'SELECT id FROM walrus_media_blobs WHERE blobId = ? LIMIT 1',
                [this._walrusBlobId]
            );
            if (rows && rows.length && rows[0].id) {
                walrusBlobRef = rows[0].id;
            }
        }

        if (!walrusBlobRef) {
            throw new Error('Failed to obtain walrusBlobRef after insertion');
        }

        // insert media item
        const result = await theDb.query(
            `INSERT INTO walrus_media_items
            (id, createdAt, path, name, walrusBlobRef, mimeType, duration, width, height, thumbnail)
            VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                Date.now(),
                this.pathTo,
                this.name,
                walrusBlobRef,
                this._mimeType,
                this._duration,
                this._width,
                this._height,
                (this._nanoThumbnail ? this.getNanoThumbnail() : null)
            ]
        );
        console.log('Inserted walrus media item with ID:', result, result.lastID);

        return true;        
    }

    /**
     * Sets the Walrus storage IDs after a file has been uploaded.
     * This method should be called after successfully uploading media to Walrus storage
     * to associate the storage IDs with this media item.
     * @param {Object} [params={}] - Upload result parameters
     * @returns {Promise<void>}
     */
    async setDataFromUploaded(params = {}) {
        const {  walrusBlobId = null, walrusBlobObjectId = null } = params;

        if (walrusBlobId) {
            this._walrusBlobId = walrusBlobId;
        }
        if (walrusBlobObjectId) {
            this._walrusBlobObjectId = walrusBlobObjectId;
        }
    }

    /**
     * Put media item into a folder.
     * 
     * @param {WalrusMediaFolder} walrusMediaFolder 
     */
    putToFolder(walrusMediaFolder) {
        if (this._folder) {
            throw new Error('Media item is already in a folder');
        }
        this._folder = walrusMediaFolder;
        if (this._folder && !this._folder.has(this)) {
            this._folder.push(this);
        }
    }

    async initialize() {
        if (this.file) {
            return await this.initializeBasedOnFile();
        }
    }

    /**
     * Waits for a preview to be generated for the specified size.
     * @private
     * @param {string} size - Preview size to wait for
     * @returns {Promise<string|Blob>} Data URL (for nano) or Blob (for micro/low/high)
     */
    _waitForPreview(size) {
        return new Promise((resolve) => {
            const handler = (eventSize) => {
                if (eventSize === size) {
                    this.off('preview', handler);
                    resolve(this._previewCache[eventSize]);
                }
            };
            this.on('preview', handler);
        });
    }

    hasPreviewCache(size) {
        if (size === 'nano') {
            return !!this._previewCache.nano;
        } else if (['micro', 'low', 'high'].includes(size)) {
            return !!this._previewCache[size];
        }

        return false;
    }

    /**
     * Gets a preview URL at the specified size.
     * Returns immediately if available, otherwise waits for generation.
     * @param {string} size - Preview size ('nano', 'micro', 'low', or 'high')
     * @returns {Promise<string>} Object URL or data URL of the preview
     */
    async getPreviewURL(size) {
        if (!['nano', 'micro', 'low', 'high'].includes(size)) {
            throw new Error(`Invalid preview size: ${size}. Must be 'nano', 'micro', 'low', or 'high'`);
        }

        // Handle nano preview (restored from stripped data)
        if (size === 'nano') {
            if (this._previewCache.nano) {
                return this._previewCache.nano;
            }

            if (this._nanoThumbnail) {
                const dataUrl = WalrusMediaNanoThumb.restore(this._nanoThumbnail);
                this._previewCache.nano = dataUrl;
                return dataUrl;
            }

            // Wait for nano thumbnail generation
            return this._waitForPreview('nano');
        }

        // For micro, low, high - check if URL already exists
        if (this._previewUrls[size]) {
            return this._previewUrls[size];
        }

        // If blob exists, create object URL from it
        if (this._previewCache[size]) {
            const objectUrl = URL.createObjectURL(this._previewCache[size]);
            this._previewUrls[size] = objectUrl;
            return objectUrl;
        }

        // Wait for preview generation
        const blob = await this._waitForPreview(size);
        const objectUrl = URL.createObjectURL(blob);
        this._previewUrls[size] = objectUrl;
        return objectUrl;
    }

    // async putToBrowserCache(sizes = ['low']) {
    //     return true;

    //     for (const size of sizes) {
    //         if (this._previewCache[size] && this._walrusId) {
    //             if (size == 'low') {
    //                 const key = `${this._previewWalrusId}`;
    //                 const blob = this._previewCache[size];
    //                 const metadata = {
    //                     mimeType: 'image/jpeg',
    //                     size: blob.size,
    //                 };
    //                 await WalrusMediaCache.put(key, blob, metadata);
    //             } else {
    //                 const key = `${this._walrusId}__preview__${size}`;
    //                 const blob = this._previewCache[size];
    //                 const metadata = {
    //                     mimeType: 'image/jpeg',
    //                     size: blob.size,
    //                 };
    //                 await WalrusMediaCache.put(key, blob, metadata);
    //             }
    //         }
    //     }
    // }

    // async restoreFromBrowserCache(size) {
    //     return;

    //     if (!this._walrusId) {
    //         throw new Error('Cannot restore from cache without walrusId');
    //     }
    //     const key = (size == 'low') ? `${this._previewWalrusId}` : `${this._walrusId}__preview__${size}`;
    //     const cached = await WalrusMediaCache.get(key);
    //     if (cached && cached.blob) {
    //         this._previewCache[size] = cached.blob;

    //         // Clear existing object URL if any
    //         if (this._previewUrls[size]) {
    //             URL.revokeObjectURL(this._previewUrls[size]);
    //             this._previewUrls[size] = null;
    //         }

    //         this.emit('preview', size);

    //         return true;
    //     }
    //     return false;
    // }

    cachePreview() {
        if (!this._previewCache['low']) {
            return false;
        }
        const blobCopy = new Blob([this._previewCache['low']], {type: this._previewCache['low'].type});
        const metadata = {
            mimeType: 'image/jpeg',
            size: blobCopy.size,
        };
        WalrusMediaCache.put(this.previewCacheKey, blobCopy, metadata);

        return true;
    }

    setPreviewCache(size, data) {
        if (!['micro', 'low', 'high'].includes(size)) {
            throw new Error(`Invalid preview size: ${size}. Must be 'micro', 'low', or 'high'`);
        }

        if (!data.length) {
            return false;
        }

        const blob = data instanceof Blob ? data : new Blob([data], { type: 'image/jpeg' });
        this._previewCache[size] = blob;

        // Clear existing object URL if any
        if (this._previewUrls[size]) {
            URL.revokeObjectURL(this._previewUrls[size]);
            this._previewUrls[size] = null;
        }

        this.emit('preview', size);

        const metadata = {
            mimeType: 'image/jpeg',
            size: blob.size,
        };
        WalrusMediaCache.put(this.previewCacheKey, blob, metadata);
    }

    /**
     * Gets a preview as binary data (Uint8Array) at the specified size.
     * Returns immediately if available, otherwise waits for generation.
     * @param {string} size - Preview size ('nano', 'micro', 'low', or 'high')
     * @returns {Promise<Uint8Array>} Binary data of the preview image
     */
    async getPreviewBinary(size) {
        if (!['nano', 'micro', 'low', 'high'].includes(size)) {
            throw new Error(`Invalid preview size: ${size}. Must be 'nano', 'micro', 'low', or 'high'`);
        }

        // Handle nano preview (decode from data URL)
        if (size === 'nano') {
            let dataUrl = this._previewCache.nano;

            if (!dataUrl) {
                if (this._nanoThumbnail) {
                    dataUrl = WalrusMediaNanoThumb.restore(this._nanoThumbnail);
                    this._previewCache.nano = dataUrl;
                } else {
                    // Wait for nano thumbnail generation
                    dataUrl = await this._waitForPreview('nano');
                }
            }

            // Decode data URL to binary
            const base64Data = dataUrl.split(',')[1];
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes;
        }

        // For micro, low, high - get blob and convert to Uint8Array
        let blob = this._previewCache[size];

        if (!blob) {
            // Wait for preview generation
            blob = await this._waitForPreview(size);
        }

        const arrayBuffer = await blob.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    }

    /**
     * Supports both image and video files.
     * @returns {Promise<{width: number, height: number}>}
     */
    async initializeBasedOnFile() {
        if (!this.file) {
            throw new Error('No file available to initialize dimensions');
        }

        const fileURL = URL.createObjectURL(this.file);

        try {
            if (this.file.type.startsWith('image/')) {
                const result = await this._loadImageDimensions(fileURL);
                this._width = result.width;
                this._height = result.height;
                console.log(`Image dimensions: ${this._width}x${this._height}`);

                this.emit('ratio', this.ratio);

                await this._generatePreviews(result.element);
            } else if (this.file.type.startsWith('video/')) {
                const result = await this._loadVideoDimensions(fileURL);
                this._width = result.width;
                this._height = result.height;
                this._duration = result.duration;
                console.log(`Video dimensions: ${this._width}x${this._height}, Duration: ${this.durationFormatted}`);

                this.emit('ratio', this.ratio);

                await this._generatePreviews(result.element);


            } else {
                throw new Error(`Unsupported file type: ${this.file.type}`);
            }

            return { width: this._width, height: this._height };
        } finally {
            URL.revokeObjectURL(fileURL);
        }
    }

    /**
     * Loads dimensions from an image file.
     * @private
     * @param {string} url - Object URL of the image
     * @returns {Promise<{width: number, height: number, element: HTMLImageElement}>}
     */
    _loadImageDimensions(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                img.onload = null;
                img.onerror = null;
                resolve({
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    element: img
                });
            };

            img.onerror = () => {
                img.onload = null;
                img.onerror = null;
                img.src = '';
                reject(new Error('Failed to load image'));
            };

            img.src = url;
        });
    }

    /**
     * Loads dimensions and duration from a video file.
     * @private
     * @param {string} url - Object URL of the video
     * @returns {Promise<{width: number, height: number, duration: number, element: HTMLVideoElement}>}
     */
    _loadVideoDimensions(url) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true;

            let metadataLoaded = false;

            video.onloadedmetadata = () => {
                metadataLoaded = true;
                video.currentTime = Math.min(1, video.duration * 0.1);
            };

            video.onseeked = () => {
                if (metadataLoaded) {
                    video.onloadedmetadata = null;
                    video.onseeked = null;
                    video.onerror = null;
                    resolve({
                        width: video.videoWidth,
                        height: video.videoHeight,
                        duration: video.duration,
                        element: video
                    });
                }
            };

            video.onerror = () => {
                video.onloadedmetadata = null;
                video.onseeked = null;
                video.onerror = null;
                video.src = '';
                video.load();
                reject(new Error('Failed to load video'));
            };

            video.src = url;
        });
    }

    /**
     * Generates preview images at different quality levels.
     * @private
     * @param {HTMLImageElement|HTMLVideoElement} element - The media element to generate previews from
     * @returns {Promise<void>}
     */
    async _generatePreviews(element) {
        const sizes = {
            low: 300,
        };

        const width = element.naturalWidth || element.videoWidth;
        const height = element.naturalHeight || element.videoHeight;

        for (const [quality, maxSize] of Object.entries(sizes)) {
            // Scale to fit maxSize while maintaining aspect ratio
            const scale = Math.min(1, maxSize / Math.max(width, height));

            // Ensure smaller dimension doesn't get too small (at least maxSize/4)
            const minDimension = maxSize / 2;
            const minScale = minDimension / Math.min(width, height);

            // Use the larger scale factor (less aggressive scaling)
            const finalScale = Math.max(scale, minScale);

            const scaledWidth = Math.round(width * finalScale);
            const scaledHeight = Math.round(height * finalScale);

            const canvas = document.createElement('canvas');
            canvas.width = scaledWidth;
            canvas.height = scaledHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(element, 0, 0, scaledWidth, scaledHeight);

            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
            this._previewCache[quality] = blob;

            console.log(`Generated ${quality} preview: ${scaledWidth}x${scaledHeight}`);

            this.emit('preview', quality);
        }

        // Generate nano thumbnail
        const nanoData = await WalrusMediaNanoThumb.generate(element);
        this._nanoThumbnail = nanoData;

        // Restore and cache the data URL
        const nanoDataUrl = WalrusMediaNanoThumb.restore(nanoData);
        this._previewCache.nano = nanoDataUrl;

        // Emit preview event
        this.emit('preview', 'nano');

        if (element.tagName === 'IMG') {
            element.src = '';
        } else if (element.tagName === 'VIDEO') {
            element.src = '';
            element.load();
        }
    }

    /**
     * Gets the stored nano thumbnail data.
     * @returns {string|null} Nano thumbnail base64 string
     */
    getNanoThumbnail() {
        return this._nanoThumbnail;
    }

    /**
     * Frees memory by revoking all created object URLs.
     * Call this when the media item is no longer needed.
     */
    dispose() {
        // Revoke object URLs for micro, low, high previews
        for (const [size, url] of Object.entries(this._previewUrls)) {
            if (url) {
                URL.revokeObjectURL(url);
                this._previewUrls[size] = null;
            }
        }
    }


}