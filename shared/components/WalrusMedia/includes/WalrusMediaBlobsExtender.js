import WalrusMediaAbstract from './WalrusMediaAbstract.js';
import WalrusMediaBlobInformation from './WalrusMediaBlobInformation.js';
import { getSuiObjects, getCurrentWalrusEpoch, blobIdFromInt, normalizeNetworkName } from './WalrusMediaHelpers.js';

/**
 * @typedef {import('@fizzyflow/suisql').default} SuiSQL
 * @typedef {import('@mysten/sui/client').SuiClient} SuiClient
 */

export default class WalrusMediaBlobsExtender extends WalrusMediaAbstract {
    /**
     * Creates a new WalrusMediaBlobsExtender instance.
     */
	constructor(params = {}) {
        super(params);
        /** @type {SuiSQL} */
        this._db = params.db || null;
        /** @type {?SuiClient} */
        this._suiClient = params.suiClient || null;
        /** @type {?string} */
        this._network = params.network || null; // as we can't trust what is inside suiClient
        /** @type {?string} */
        this._connectedAddress = params.connectedAddress || null;
    }

    get suiClient() {
        return this._suiClient;
    }

    get connectedAddress() {
        return this._connectedAddress;
    }

    async getCurrentEpoch() {
        const network = (''+this._network).toLowerCase().trim().split('sui:').join('');
        return await getCurrentWalrusEpoch(network, this._suiClient);
    }

    async listBlobs(callback) {
        if (!this._db) {
            throw new Error('Database instance is not provided.');
        }
        const q = "SELECT blobObjectId, blobId FROM walrus_media_blobs GROUP BY blobObjectId";
        const rows = await this._db.query(q);
        const blobObjectIds = rows.map(row => row.blobObjectId);
        const uniqueBlobObjectIds = [...new Set(blobObjectIds)]; // just to be sure

        const network = normalizeNetworkName(this._network);
        const currentEpoch = await this.getCurrentEpoch();
        const blobs = [];

        // Add database blob if available
        if (this._db.walrusBlobId) {
            const dbBlob = new WalrusMediaBlobInformation({
                currentEpoch,
                endEpoch: this._db.walrusEndEpoch,
                objectId: null,
                blobId: this._db.walrusBlobId,
                type: 'db',
                network,
                db: this._db,
            });
            blobs.push(dbBlob);
            if (callback) {
                await callback(dbBlob);
            }
        }

        const foundSuiObjectFieldsCallback = async (suiObjectFields) => {
            try {
                const item = new WalrusMediaBlobInformation({
                    currentEpoch,
                    endEpoch: suiObjectFields.storage.fields.end_epoch,
                    objectId: suiObjectFields.id.id,
                    blobId: blobIdFromInt(suiObjectFields.blob_id),
                    network,
                    db: this._db,
                });
                blobs.push(item);
                if (callback) {
                    await callback(item);
                }
            } catch (e) {
                console.error('Error in foundSuiObjectFieldsCallback:', e);
            }
        };

        const suiObjects = await getSuiObjects(this._suiClient, uniqueBlobObjectIds, foundSuiObjectFieldsCallback);

        console.log('Blobs processed:', blobs);

        return blobs;
    }

}