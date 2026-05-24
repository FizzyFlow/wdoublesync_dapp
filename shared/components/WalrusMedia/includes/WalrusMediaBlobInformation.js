
/**
 * @typedef {import('@fizzyflow/suisql').default} SuiSQL
 */

/**
 * Represents a Walrus blob with its storage and epoch information.
 */
export default class WalrusMediaBlobInformation {
    /**
     * @param {Object} params - Blob parameters
     * @param {number} params.currentEpoch - The current Walrus epoch
     * @param {number} params.endEpoch - The epoch when the blob storage expires
     * @param {string} params.objectId - The Sui object ID of the blob
     * @param {string} params.blobId - The Walrus blob ID
     * @param {'media'|'db'} [params.type='media'] - The blob type: 'media' for media files, 'db' for database blob
     * @param {string} [params.network='mainnet'] - The network: 'mainnet' or 'testnet'
     * @param {SuiSQL} [params.db=null] - Optional database instance
     */
    constructor({ currentEpoch, endEpoch, objectId, blobId, type = 'media', network = 'mainnet', db = null }) {
        /** @type {number} */
        this.currentEpoch = currentEpoch;
        /** @type {number} */
        this.endEpoch = endEpoch;
        /** @type {string} */
        this.objectId = objectId;
        /** @type {string} */
        this.blobId = blobId;
        /** @type {'media'|'db'} */
        this.type = type;
        /** @type {string} */
        this.network = network;
        /** @type {SuiSQL|null} */
        this.db = db;
    }

    /**
     * Checks if the blob storage has expired.
     * @returns {boolean} True if the blob has expired
     */
    isExpired() {
        return this.currentEpoch >= this.endEpoch;
    }

    /**
     * Returns the number of epochs remaining until expiration.
     * @returns {number} Epochs remaining (0 if already expired)
     */
    epochsRemaining() {
        return Math.max(0, this.endEpoch - this.currentEpoch);
    }
}
