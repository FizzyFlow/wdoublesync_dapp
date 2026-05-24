import WalrusMediaAbstract from './WalrusMediaAbstract.js';
import WalrusMediaRowBuilder from './WalrusMediaRowBuilder.js';
import WalrusMediaItem from './WalrusMediaItem.js';
import WalrusMediaPendingChanges from './WalrusMediaPendingChanges.js';
import WalrusMediaBackButton from './WalrusMediaBackButton.js';
import WalrusMediaCache from './WalrusMediaCache.js';
import WalrusMediaBlobsExtender from './WalrusMediaBlobsExtender.js';

/**
 * @typedef {import('@mysten/walrus').WalrusClient} WalrusClient
 * @typedef {import('@mysten/walrus').WalrusFile} WalrusFile
 * @typedef {typeof import('@mysten/walrus').WalrusFile} WalrusFileConstructor
 * @typedef {import('@mysten/sui/client').SuiClient} SuiClient
 */
export default class WalrusMediaFolder extends WalrusMediaAbstract {
    /**
     * Creates a new WalrusMediaFolder instance.
     */
	constructor(params = {}) {
        super(params);

        this._db = params.db || null;

        /** @type {WalrusClient} */
        this._walrusClient = params.walrusClient || null;

        /** @type {?SuiClient} */
        this._suiClient = params.suiClient || null;

        /** @type {Function} */
        this._signAndExecuteTransaction = params.signAndExecuteTransaction || null;

        /** @type {string} */
        this._connectedAddress = params.connectedAddress || null;

        /** @type {string} */
        this._tableName = params.tableName || 'walrus_media_items';

        /** @type {string} */
        this._network = params.network || 'testnet';

        /** @type {string} */
        this._name = params.name || '___root___';

        if (this._name.indexOf('/') !== -1) {
            throw new Error('Folder name cannot contain slashes');
        }

        /** @type {WalrusMediaFolder|null} */
        this._parent = params.parent || null;

        if (this._parent && this._name === '___root___') {
            throw new Error('Root folder cannot have a parent');
        }

        /** @type {Array<WalrusMediaItem>} */
        this._items = params.items || [];
        /** @type {Array<WalrusMediaFolder>} */
        this._folders = params.folders || [];

        /** @type {WalrusMediaRowBuilder} */
        this._rowBuilder = new WalrusMediaRowBuilder();

        this._rowBuilder.on('rowAdded', (row)=>{
            this.emit('rowAdded', row);
        });

        /** @type {?WalrusMediaPendingChanges} */
        this._pendingChanges = params.pendingChanges || null;
        if (!this._pendingChanges) {
            this._pendingChanges = new WalrusMediaPendingChanges({
                    db: this._db,
                    tableName: this._tableName,
                    suiClient: params.suiClient || null,
                    walrusClient: this._walrusClient,
                    signAndExecuteTransaction: this._signAndExecuteTransaction,
                    connectedAddress: this._connectedAddress,
                    network: this._network,
                });
            this._pendingChanges.on('change', (change)=>{
                this.emit('pendingChange', change);
            });
            this._pendingChanges.on('status', (status)=>{
                this.emit('status', status);
            });
        }

        this._blobExtender = new WalrusMediaBlobsExtender({
            db: this._db,
            suiClient: params.suiClient || null,
            network: this._network,
            connectedAddress: this._connectedAddress,
        });
    }

    get name() {
        return this._name;
    }

    get network() {
        return this._network;
    }

    get connectedAddress() {
        return this._connectedAddress;
    }

    get ratio() { // so we can use folders in row builder
        return 1;
    }

    get parent() {
        return this._parent;
    }

    get isFolder() {
        return true;
    }

    get pendingChanges() {
        return this._pendingChanges;
    }

    get blobExtender() {
        return this._blobExtender;
    }

    get pendingChangesCount() {
        return this._pendingChanges.pendingCount;
    }

    get fullPath() {
        if (this._parent) {
            return this._parent.fullPath + '/' + this._name;
        } else if (this._name && this._name !== '___root___') {
            return '/' + this._name;
        } else {
            return ''; // root
        }
    }

    async implementChanges() {
        return await this._pendingChanges.implementChanges();
    }

    async mkdir(folderName) {
        const newFolder = new WalrusMediaFolder({
            db: this._db,
            walrusClient: this._walrusClient,
            signAndExecuteTransaction: this._signAndExecuteTransaction,
            connectedAddress: this._connectedAddress,
            tableName: this._tableName,
            network: this._network,
            name: folderName,
            parent: this,
            pendingChanges: this._pendingChanges,
            suiClient: this._suiClient,
        });
        this.push(newFolder);
        this.emit('folder', newFolder);
        return newFolder;
    }

    async load() {
        if (this.__loadingPromise) {
            return await this.__loadingPromise;
        }

        this.__loadingPromiseResolver = null;
        this.__loadingPromise = new Promise((resolve)=>{
            this.__loadingPromiseResolver = resolve;
        });

        await this._pendingChanges.initialize();

        let items = [];
        try {
            const q = `SELECT * FROM ${this._tableName} LEFT JOIN walrus_media_blobs ON ${this._tableName}.walrusBlobRef = walrus_media_blobs.id WHERE (path = ? OR path = ?) ORDER BY id ASC`;
            const params = [this.fullPath, this.fullPath + '/'];
            items = await this._db.query(q, params);
        } catch (e) {
            console.error('Fresh database? It is ok', e);
        }

        if (this._parent) {
            this.push(new WalrusMediaBackButton({
                parent: this._parent,
            }));
        }

        for (const itemData of items) {
            const item = new WalrusMediaItem({
                db: this._db,
                name: itemData.name,
                mimeType: itemData.mimeType,
                walrusBlobId: itemData.blobId,
                walrusBlobObjectId: itemData.blobObjectId,
                duration: itemData.duration,
                width: itemData.width,
                height: itemData.height,
                nanoThumbnail: itemData.thumbnail,
                network: this._network,
            });
            this.push(item);
            console.log('Loaded item', item);
        }

        let foldersItems = [];
        try {
            const q = `SELECT path FROM ${this._tableName} GROUP BY path`; // @todo: optimize query to get only sub of current
            foldersItems = await this._db.query(q);
        } catch (e) {
            console.error('Fresh database? It is ok', e);
        }

        for (const folderData of foldersItems) {
            const folderPath = folderData.path;
            const thisFullPathNormalized = (''+this.fullPath).endsWith('/') ? this.fullPath : this.fullPath + '/';
            if (folderPath != '/' && folderPath != this.fullPath && folderPath.startsWith(thisFullPathNormalized)) {
                const relativePath = folderPath.substring(thisFullPathNormalized.length);
                if (relativePath.split('/').length == 2) { // direct subfolder
                    const folderName = relativePath.split('/').join('');
                    const newFolder = new WalrusMediaFolder({
                        db: this._db,
                        walrusClient: this._walrusClient,
                        signAndExecuteTransaction: this._signAndExecuteTransaction,
                        connectedAddress: this._connectedAddress,
                        tableName: this._tableName,
                        network: this._network,
                        name: folderName,
                        parent: this,
                        pendingChanges: this._pendingChanges,
                        suiClient: this._suiClient,
                    });
                    this.push(newFolder);
                    this.emit('folder', newFolder);
                }
            }
        }

        this.__loadingPromiseResolver(true);
    }

    getFolder(path) {
        if (path == this.fullPath) {
            return this;
        }
        for (const key in this._folders) {
            const found = this._folders[key].getFolder(path);
            if (found) {
                return found;
            }
        }
        return null;
    }

    has(item) {
        if (item instanceof WalrusMediaItem) {
            return this._items.includes(item);
        } else if (item instanceof WalrusMediaFolder) {
            return this._folders.includes(item);
        }
        return false;
    }

    pickUniqueName(desiredName) {
        let name = desiredName;
        let counter = 1;
        const existingNames = new Set();
        for (const item of this._items) {
            existingNames.add(item.name);
        }
        for (const folder of this._folders) {
            existingNames.add(folder.name);
        }

        // Split filename into base and extension
        const lastDotIndex = desiredName.lastIndexOf('.');
        const hasExtension = lastDotIndex > 0; // Don't treat .gitignore as having extension
        const baseName = hasExtension ? desiredName.substring(0, lastDotIndex) : desiredName;
        const extension = hasExtension ? desiredName.substring(lastDotIndex) : '';

        while (existingNames.has(name)) {
            name = baseName + '_' + counter + extension;
            counter++;
        }
        return name;
    }

    get rows() {
        return this._rowBuilder.rows;
    }

    push(item) {
        if ((item instanceof WalrusMediaItem)) {
            const adjustedName = this.pickUniqueName(item.name);
            if (adjustedName != item.name) {
                item.normalizeName(adjustedName);
            }

            this._items.push(item);
            this._rowBuilder.push(item);
            item.putToFolder(this);

            if (item.isToBeUploaded) {
                this._pendingChanges.addNewMediaItem(item);
            }

            this.emit('item', item);

            return true;
        } else if ((item instanceof WalrusMediaFolder)) {
            this._folders.push(item);
            this._rowBuilder.unshift(item);
            this.emit('folder', item);

            return false;
        } else if ((item instanceof WalrusMediaBackButton)) {
            this._rowBuilder.unshift(item);

            return false;
        }
    }

    async loadPreviews(items = null) {
        // Use provided items or default to all items
        const itemsToLoad = items || this._items;

        const neededCacheKeys = [];
        const neededToLoad = [];  
        for (const item of itemsToLoad) {
            if (!item.isFolder && item.walrusBlobId && !item.hasPreviewCache('low')) {
                neededCacheKeys.push(item.previewCacheKey);
            }
        }
        const cachedPreviews = await WalrusMediaCache.getMany(neededCacheKeys);
        for (const item of itemsToLoad) {
            if (!item.isFolder && item.walrusBlobId && !item.hasPreviewCache('low')) {
                const cacheKey = item.previewCacheKey;
                if (cachedPreviews[cacheKey]) {
                    const blob = cachedPreviews[cacheKey].blob;
                    item.setPreviewCache('low', new Uint8Array(await blob.arrayBuffer()));
                } else {
                    neededToLoad.push({blobId: item.walrusBlobId, identifier: item.previewIdentifier})
                }
            }
        }

        if (neededToLoad.length) {
            const arrayBuffers = await this._pendingChanges.getFilesFromWalrus(neededToLoad);
            console.log('Got previews for items', items, 'needed:', neededToLoad, arrayBuffers);

            for (let i = 0; i < arrayBuffers.length; i++) {
                const binary = arrayBuffers[i];
                if (binary) {
                    const identifier = neededToLoad[i].identifier;
                    for (const item of itemsToLoad) {
                        if (item.previewIdentifier === identifier) {
                            item.setPreviewCache('low', new Uint8Array(binary));
                        }
                    }
                }
            }
        }
    }

    async dispose() {
        return true;
    }
};