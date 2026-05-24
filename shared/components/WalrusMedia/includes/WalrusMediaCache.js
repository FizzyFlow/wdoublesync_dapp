/**
 * WalrusMediaCache - Manages media blob storage using the Cache API
 * Provides persistent storage for media previews and files
 */
export default class WalrusMediaCache {
    static CACHE_NAME = 'walrus-media-cache-v1';
    static _cachePromise = null;

    /**
     * Gets the cache instance, reusing the same handle
     * @private
     * @returns {Promise<Cache>}
     */
    static async _getCache() {
        if (!this._cachePromise) {
            this._cachePromise = caches.open(this.CACHE_NAME);
        }
        return this._cachePromise;
    }

    /**
     * Stores a blob in the cache with a given key
     * @param {string} key - Unique identifier for the blob
     * @param {Blob} blob - The blob to store
     * @param {Object} [metadata] - Optional metadata to store with the blob
     * @returns {Promise<void>}
     */
    static async put(key, blob, metadata = {}) {
        if (!key || typeof key !== 'string') {
            throw new Error('Cache key must be a non-empty string');
        }

        if (!(blob instanceof Blob)) {
            throw new Error('Value must be a Blob');
        }

        const cache = await this._getCache();
        const url = this._generateUrl(key);

        const headers = new Headers({
            'Content-Type': blob.type || 'application/octet-stream',
            'Content-Length': blob.size.toString(),
            'X-Cache-Timestamp': Date.now().toString(),
        });

        // Store metadata as custom headers
        if (metadata && typeof metadata === 'object') {
            headers.set('X-Metadata', JSON.stringify(metadata));
        }

        const response = new Response(blob, {
            status: 200,
            statusText: 'OK',
            headers
        });

        await cache.put(url, response);
        console.log(`Cached blob: ${key} (${blob.size} bytes)`);
    }

    /**
     * Retrieves a blob from the cache
     * @param {string} key - The key to retrieve
     * @returns {Promise<{blob: Blob, metadata: Object}|null>} The blob and metadata, or null if not found
     */
    static async get(key) {
        const cache = await this._getCache();
        const url = this._generateUrl(key);
        const response = await cache.match(url);

        if (!response) {
            return null;
        }

        const blob = await response.blob();
        const metadataHeader = response.headers.get('X-Metadata');
        const metadata = metadataHeader ? JSON.parse(metadataHeader) : {};

        return { blob, metadata };
    }

    /**
     * Retrieves multiple blobs from the cache in parallel
     * @param {string[]} keys - Array of keys to retrieve
     * @returns {Promise<Object<string, {blob: Blob, metadata: Object}>>} Object mapping keys to their blob and metadata
     */
    static async getMany(keys) {
        if (!Array.isArray(keys) || keys.length === 0) {
            return {};
        }

        const cache = await this._getCache();
        const promises = keys.map(async (key) => {
            const url = this._generateUrl(key);
            const response = await cache.match(url);

            if (!response) return { key, result: null };

            const blob = await response.blob();
            const metadataHeader = response.headers.get('X-Metadata');
            const metadata = metadataHeader ? JSON.parse(metadataHeader) : {};

            return { key, result: { blob, metadata } };
        });

        const results = await Promise.all(promises);

        // Convert to object format
        const resultObj = {};
        for (const { key, result } of results) {
            if (result !== null) {
                resultObj[key] = result;
            }
        }

        return resultObj;
    }

    /**
     * Checks if a key exists in the cache
     * @param {string} key - The key to check
     * @returns {Promise<boolean>}
     */
    static async has(key) {
        const cache = await this._getCache();
        const url = this._generateUrl(key);
        const response = await cache.match(url);
        return !!response;
    }

    /**
     * Deletes a blob from the cache
     * @param {string} key - The key to delete
     * @returns {Promise<boolean>} True if deleted, false if not found
     */
    static async delete(key) {
        const cache = await this._getCache();
        const url = this._generateUrl(key);
        return await cache.delete(url);
    }

    /**
     * Lists all keys in the cache
     * @returns {Promise<string[]>} Array of cache keys
     */
    static async keys() {
        const cache = await this._getCache();
        const requests = await cache.keys();
        return requests.map(request => this._extractKey(request.url));
    }

    /**
     * Clears all entries from the cache
     * @returns {Promise<boolean>}
     */
    static async clear() {
        const result = await caches.delete(this.CACHE_NAME);
        this._cachePromise = null; // Reset cache handle after clearing
        return result;
    }

    /**
     * Gets cache statistics
     * @returns {Promise<{count: number, totalSize: number}>}
     */
    static async stats() {
        const cache = await this._getCache();
        const requests = await cache.keys();

        let totalSize = 0;
        for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
                const contentLength = response.headers.get('Content-Length');
                totalSize += parseInt(contentLength || '0', 10);
            }
        }

        return {
            count: requests.length,
            totalSize
        };
    }

    /**
     * Generates a cache URL from a key
     * @private
     * @param {string} key
     * @returns {string}
     */
    static _generateUrl(key) {
        return `https://cache/${encodeURIComponent(key)}`;
    }

    /**
     * Extracts a key from a cache URL
     * @private
     * @param {string} url
     * @returns {string}
     */
    static _extractKey(url) {
        const match = url.match(/https:\/\/cache\/(.+)$/);
        return match ? decodeURIComponent(match[1]) : '';
    }

    /**
     * Generates a unique key from blob data
     * @param {Blob} blob - The blob to generate a key for
     * @param {string} [prefix=''] - Optional prefix for the key
     * @returns {Promise<string>} A unique hash-based key
     */
    static async generateKey(blob, prefix = '') {
        const buffer = await blob.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return prefix ? `${prefix}-${hashHex}` : hashHex;
    }
}
