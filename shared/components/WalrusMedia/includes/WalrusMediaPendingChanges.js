import WalrusMediaAbstract from './WalrusMediaAbstract.js';
import WalrusClientWebworkerInterface from '../workers/WalrusClientWebworkerInterface.js';

/**
 * @typedef {import('@fizzyflow/suisql').default} SuiSQL
 * @typedef {import('./WalrusMediaItem.js').default} WalrusMediaItem
 * @typedef {import('@mysten/walrus').WalrusClient} WalrusClient
 * @typedef {import('@mysten/sui/client').SuiClient} SuiClient
 * @typedef {typeof import('@mysten/walrus').WalrusFile} WalrusFileConstructor
 */
class WalrusMediaPendingChange {
    constructor(params = {}) {
        this.type = params.type || 'add'; // 'add', 'init'

        /** @type {?WalrusMediaItem} */
        this.mediaItem = params.mediaItem || null;

        /** @type {SuiSQL} */
        this._db = params.db || null;
    }

    async implementChange() {
        if (this.type === 'init') {
            // create table
            // @todo: store blobId and blobObjectId as BLOB? BIGINT?
            const createTableQuery = `
                CREATE TABLE walrus_media_blobs (
                    id INTEGER PRIMARY KEY,
                    blobObjectId TEXT,
                    blobId TEXT
                );

                CREATE TABLE walrus_media_items (
                    id INTEGER PRIMARY KEY,
                    createdAt INTEGER,
                    path TEXT,
                    name TEXT,
                    walrusBlobRef INTEGER,
                    mimeType TEXT,
                    duration REAL,
                    width INTEGER,
                    height INTEGER,
                    thumbnail BLOB,
                    FOREIGN KEY(walrusBlobRef) REFERENCES walrus_media_blobs(id)
                );
                CREATE INDEX walrus_media_items_path ON walrus_media_items (path);
                CREATE INDEX walrus_media_items_createdAt ON walrus_media_items (createdAt);
            `;
            try {
                await this._db.iterateStatements(createTableQuery);
            } catch (e) {
                console.error('Error creating walrus media tables', e);
            }
        } else if (this.type === 'add' && this.mediaItem) {
            // insert media item
            await this.mediaItem.setInDb(this._db);

            // const q = `
            //     INSERT INTO walrus_media_items 
            //             (id,   createdAt, path, name, walrusId, previewWalrusId, mimeType, duration, width, height, thumbnail)
            //     VALUES  (NULL, ?,         ?,    ?,    ?,        ?,               ?,        ?,        ?,     ?,      ?);
            // `;
            // const params = [
            //     ((new Date()).getTime() / 1000),
            //     this.mediaItem.pathTo, // TODO: fix name
            //     this.mediaItem.name,
            //     this.mediaItem.walrusId,
            //     this.mediaItem.previewWalrusId,
            //     this.mediaItem.mimeType,
            //     this.mediaItem.duration,
            //     this.mediaItem.width,
            //     this.mediaItem.height,
            //     this.mediaItem.getNanoThumbnail(),
            // ];
            // await this._db.run(q, params);
        }
    }
}

export default class WalrusMediaPendingChanges extends WalrusMediaAbstract {
    constructor(params = {}) {
        super(params);

        /** @type {string} */
        this._tableName = params.tableName || 'walrus_media_items';

        /** @type {SuiSQL} */
        this._db = params.db || null;

        /** @type {?WalrusClient} */
        this._walrusClient = params.walrusClient || null;

        /** @type {?SuiClient} */
        this._suiClient = params.suiClient || null;

        /** @type {Function} */
        this._signAndExecuteTransaction = params.signAndExecuteTransaction || null;

        /** @type {string} */
        this._network = params.network || 'testnet';

        /** @type {WalrusClientWebworkerInterface} */
        this._walrusClientWebworkerInterface = new WalrusClientWebworkerInterface({
            connectedAddress: params.connectedAddress,
            network: this._network,
            signAndExecuteTransaction: this._signAndExecuteTransaction,
        });
        this._walrusClientWebworkerInterface.on('status', (status) => { 
            this.emit('status', status);
        });
        this._walrusClientWebworkerInterface.initialize();

        /** @type {string} */
        this._connectedAddress = params.connectedAddress || null;

        /** @type {Array<WalrusMediaPendingChange>} */
        this._changes = params.changes || [];

        window.db = this._db;

        this._preparedFilesFlow = null;
    }

    async initialize() {
        const tables = await this._db.listTables();
        if (!tables.includes(this._tableName)) {
            const change = new WalrusMediaPendingChange({ type: 'init', db: this._db, });
            this._changes.push(change);
            this.emit('change', { change: change });
        }
    }

    async getFilesFromWalrus(ids) {
        if (!ids || !ids.length) {
            return [];
        }
        await this._walrusClientWebworkerInterface.initialize();
        return await this._walrusClientWebworkerInterface.getFiles(ids);
    }

    async prepareFilesFlow() {
        const identifiersTaken = {};
        for (const change of this._changes) {
            if (change.type === 'add' && change.mediaItem) {
                let identifier = change.mediaItem.identifier;
                if (identifiersTaken[identifier]) {
                    throw new Error('Duplicate file identifier: ' + identifier);
                }
                identifiersTaken[identifier] = true;

                await this._walrusClientWebworkerInterface.pushFile(change.mediaItem.file, identifier, {
                        'content-type': change.mediaItem.mimeType,
                        'hasPreview': '1',
                    });
                const previewBinary = await change.mediaItem.getPreviewBinary('low');
                await this._walrusClientWebworkerInterface.pushFile(previewBinary, identifier + '.___preview', {
                        'content-type': 'image/jpeg',
                        'previewFor': identifier,
                    });
            }
        }

        await this._walrusClientWebworkerInterface.prepare();

        return true;

        // /** @type {WalrusFileConstructor} */
        // const WalrusFile = this._walrusClient.WalrusFile;

        // const files = [];
        // const identifiersTaken = {};
        // for (const change of this._changes) {
        //     if (change.type === 'add' && change.mediaItem) {
        //         let identifier = change.mediaItem.path;
        //         if (identifiersTaken[identifier]) {
        //             throw new Error('Duplicate file identifier: ' + identifier);
        //         }
        //         identifiersTaken[identifier] = true;

        //         const file = WalrusFile.from({
        //             contents: change.mediaItem.file,
        //             identifier: identifier,
        //             tags: {
        //                 'content-type': change.mediaItem.mimeType,
        //                 'hasPreview': '1',
        //             },
        //         });
        //         files.push(file);

        //         const previewBinary = await change.mediaItem.getPreviewBinary('low');
        //         const previewFile = WalrusFile.from({
        //             contents: previewBinary,
        //             identifier: '.preview__' + identifier,
        //             tags: {
        //                 'content-type': 'image/jpeg',
        //                 'previewFor': identifier,
        //             },
        //         });
        //         files.push(previewFile);
        //     }
        // }

        // if (!files.length) {
        //     this._preparedFilesFlow = null;
        //     return false;
        // }

        // const flow = this._walrusClient.writeFilesFlow({
        //     files: files,
        // });

        // await flow.encode();

        // let registerTx = null;
        // if (this._suiClient) {
        //     registerTx = flow.register({
        //         epochs: 1,
        //         owner: this._connectedAddress,
        //         deletable: true,
        //     });
        //     registerTx.setSenderIfNotSet(this._connectedAddress);
        //     await registerTx.build({
        //         client: this._suiClient,
        //     });
        // }

        // console.error('Prepared files flow', flow, registerTx);
        
        // this._preparedFilesFlow = {
        //     flow: flow,
        //     registerTx: registerTx,
        // };
    }

    async writeFilesToWalrus() {
        const uploaded = await this._walrusClientWebworkerInterface.uploadFiles();
        console.log('Uploaded files result', uploaded);

        for (let i = 0; i < uploaded.files.length; i++) {
            const identifier = uploaded.files[i].identifier;
            const walrusBlobId = uploaded.files[i].walrusBlobId;
            const walrusBlobObjectId = uploaded.files[i].walrusBlobObjectId;
            
            for (const pendingChange of this._changes) {
                if (pendingChange.type === 'add' && pendingChange.mediaItem) {
                    if (pendingChange.mediaItem.identifier === identifier) {
                        await pendingChange.mediaItem.setDataFromUploaded({ walrusBlobId: walrusBlobId, walrusBlobObjectId: walrusBlobObjectId });
                    } else if (pendingChange.mediaItem.identifier === identifier.replace('.___preview', '')) {
                        await pendingChange.mediaItem.setDataFromUploaded({ walrusBlobId: walrusBlobId, walrusBlobObjectId: walrusBlobObjectId });
                        await pendingChange.mediaItem.cachePreview();
                    }
                }
            }
        }

        return true;

        let preparedFlow = this._preparedFilesFlow;
        if (!preparedFlow) {
            await this.prepareFilesFlow();
            preparedFlow = this._preparedFilesFlow;
        }

        if (!preparedFlow) {
            return false;
        }

        const flow = preparedFlow.flow;

        // /** @type {WalrusFileConstructor} */
        // const WalrusFile = this._walrusClient.WalrusFile;

        // const files = [];
        // const identifiersTaken = {};
        // for (const change of this._changes) {
        //     if (change.type === 'add' && change.mediaItem) {
        //         let identifier = change.mediaItem.path;
        //         if (identifiersTaken[identifier]) {
        //             throw new Error('Duplicate file identifier: ' + identifier);
        //         }
        //         identifiersTaken[identifier] = true;

        //         const file = WalrusFile.from({
        //             contents: change.mediaItem.file,
        //             identifier: identifier,
        //             tags: {
        //                 'content-type': change.mediaItem.mimeType,
        //                 'hasPreview': '1',
        //             },
        //         });
        //         files.push(file);

        //         const previewBinary = await change.mediaItem.getPreviewBinary('low');
        //         const previewFile = WalrusFile.from({
        //             contents: previewBinary,
        //             identifier: '.preview__' + identifier,
        //             tags: {
        //                 'content-type': 'image/jpeg',
        //                 'previewFor': identifier,
        //             },
        //         });
        //         files.push(previewFile);
        //     }
        // }

        // console.log('files to upload', files);
        // const flow = this._walrusClient.writeFilesFlow({
        //     files: files,
        // });

        // await flow.encode();

        const handleRegister = async () => {
            let digest = null;
            if (preparedFlow.registerTx) {
                // pre-built transaction
                digest = await this._signAndExecuteTransaction(preparedFlow.registerTx);
            } else {
                const registerTx = flow.register({
                    epochs: 1,
                    owner: this._connectedAddress,
                    deletable: true,
                });
                digest = await this._signAndExecuteTransaction(registerTx);
            }
            if (!digest) {
                throw new Error('Failed to execute register transaction');
            }
            await flow.upload({ digest: digest });
        }
        const handleCertify = async () => {
            const certifyTx = flow.certify();
            await this._signAndExecuteTransaction(certifyTx);
            const uploadedFilesResponse = await flow.listFiles();
            console.log('Uploaded files', uploadedFilesResponse);

            const ret = [];
            for (const uploadedFilesResponseItem of uploadedFilesResponse) {
                if (uploadedFilesResponseItem && uploadedFilesResponseItem.id) {
                    ret.push(uploadedFilesResponseItem.id);
                }
            }

            return ret;
        }

        await handleRegister();
        this._preparedFilesFlow = null;
        const uploadedIds = await handleCertify();
        
        console.log('Uploaded IDs', uploadedIds);

        const walrusFiles = await this._walrusClient.getFiles({ ids: uploadedIds });

        console.log('Walrus files after upload', walrusFiles);

        for (let i = 0; i < walrusFiles.length; i++) {
            const walrusFile = walrusFiles[i];
            const walrusId = uploadedIds[i];
            const identifier = await walrusFile.getIdentifier();

            if (!identifier) {
                console.error('Uploaded file has no identifier', walrusFile);
                continue;
            }
            if (!walrusId) {
                console.error('Uploaded file has no walrusId', walrusFile);
                continue;
            }

            for (const pendingChange of this._changes) {
                if (pendingChange.type === 'add' && pendingChange.mediaItem) {
                    if (pendingChange.mediaItem.path === identifier) {
                        await pendingChange.mediaItem.setDataFromUploaded({ walrusId: walrusId });
                    } else if (pendingChange.mediaItem.path === identifier.replace('.preview__', '')) {
                        await pendingChange.mediaItem.setDataFromUploaded({ previewWalrusId: walrusId });
                    }
                }
            }
        }

        return true;
    }

    get pendingCount() {
        return this._changes.length;
    }

    get changes() {
        return this._changes;
    }

    get network() {
        return this._network;
    }

    addNewMediaItem(mediaItem) {
        const change = new WalrusMediaPendingChange({
            type: 'add',
            mediaItem,
            db: this._db,
        });
        this._changes.push(change);
        this.emit('change', { change: change });
    }

    async implementChanges() {
        const writeResult = await this.writeFilesToWalrus();
        for (const change of this._changes) {
            await change.implementChange();
        }
        if (this.changes.length) {
            this.emit('status', {
                step: 'sync',
                message: 'Saving changes to SuiSQL database...',
                start: true,
            });
            await this._db.sync();
            this.emit('status', {
                step: 'sync',
                start: false,
            });
        }

        this._changes = [];
        this.emit('change', { implemented: true }); 
    }

}