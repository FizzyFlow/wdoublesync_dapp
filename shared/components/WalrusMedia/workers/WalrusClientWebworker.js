// import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
// import { WalrusClient, WalrusFile } from '@mysten/walrus';
import {  WalrusFile } from '@mysten/walrus';
import { makeSuiClient, makeWalrusClient, getAggregator } from '../includes/WalrusMediaClientsMaker.js';

// const aggregators = {
//     testnet: 'https://aggregator.walrus-testnet.walrus.space',
//     mainnet: 'https://aggregator.walrus-mainnet.walrus.space',
// };

const state = {
    aggregatorUrl: null,
    network: null,
    walrusClient: null,
    suiClient: null,
    connectedAddress: null,
    activeQueriesCount: 0,

    filesToUpload: [],
    filesToUploadChangedAt: null,

    preparedFilesIdentifiers: null,
    preparedFilesFlow: null,
    preparedFilesRegisterTx: null,
    filesChangedAtPrepared: null,

    prepareFilesPromises: {},
    prepareFilesPromisesResolvers: {},

    workerPromises: {},
    workerPromisesResolvers: {},
};

const fetchLimitingConcurrent = async (url, options = {}) => {
    const maxParallelQueries = 30;
    if (state.activeQueriesCount > maxParallelQueries) {
        do {
            await new Promise((res)=> setTimeout(res, 200) );
        } while (state.activeQueriesCount > maxParallelQueries);
    }
    state.activeQueriesCount++;
    try {
        options.signal = AbortSignal.timeout(315000);
        const res = await fetch(url, options);
        state.activeQueriesCount--;
        return res;
    } catch (e) {
        state.activeQueriesCount--;
        throw e;
    }
};

const callParent = async(method, options) =>{
    const id = (''+Math.random()).split('.').join('');
    const payload = {
        id: id,
        method: method,
        options: options,
    };
    state.workerPromises[id] = new Promise((res) => { state.workerPromisesResolvers[id] = res; });
    postMessage(payload);
    if (options.timeout) {
        return await Promise.race([new Promise(function(res) { setTimeout(()=>{ res({data: null}); }, options.timeout) }), state.workerPromises[id]]);
    } else {
        return await state.workerPromises[id];
    }
};

const signAndExecuteTransaction = async(tx) => {
    const txJSON = await tx.toJSON();
    const response = await callParent('signAndExecuteTransaction', {
        txJSON: txJSON,
    });
    if (!response.digest) {
        throw new Error('Failed to sign and execute transaction: ' + (response.error || 'unknown error'));
    }
    return response.digest;
};

const queryableFunctions = {
	ping: async function(options) {
        return 'pong';
    },
    getAggregatorURL: async function(options) {
        const { quiltBlobId, identifier } = options;

        if (!state.aggregatorUrl) {
            return { aggregatorUrl: null };
        }

        if (quiltBlobId && identifier) {
            const blobIdasString = quiltBlobId;
            const url = state.aggregatorUrl + "/v1/blobs/by-quilt-id/" + blobIdasString + '/' + encodeURIComponent(identifier);
            return { aggregatorUrl: url };
        }

        return { aggregatorUrl: state.aggregatorUrl };
    },
    async readFromAggregator(quiltBlobId, identifier) {
        const blobIdasString = quiltBlobId;
        const url = state.aggregatorUrl+"/v1/blobs/by-quilt-id/" + blobIdasString + '/' + encodeURIComponent(identifier);
        const res = await fetchLimitingConcurrent(url);
        if (res.status !== 200) {
            throw new Error('Failed to fetch blob from aggregator: ' + res.status + ' ' + await res.text());
        }

        const arrayBuffer = await res.arrayBuffer();

        return arrayBuffer;
    },
    getFiles: async function(options) {
        const {ids} = options;
        if (!ids || !ids.length) {
            return { success: true, files: [] };
        }

        if (state.aggregatorUrl) {
            const binaryPromises = [];
            ids.forEach((id) => {
                binaryPromises.push(new Promise(async(res, rej) => {
                    try {
                        const data = await queryableFunctions.readFromAggregator(id.blobId, id.identifier);
                        res(data);
                    } catch (e) {
                        rej(e);
                    }
                }));
            });

            const promiseResults = await Promise.allSettled(binaryPromises);
            const promiseResultsNormalized = promiseResults.map(result => { return result.value ? result.value : null; });
            console.log('Fetched files from aggregator', promiseResultsNormalized);

            return { success: true, files:  promiseResultsNormalized };
        } else {
            const files = await state.walrusClient.getFiles({ ids: ids });
            const binaryPromises = [];
            files.forEach((file) => {
                binaryPromises.push(new Promise((res, rej) => {
                    file.bytes().then((bytes) => {
                        res(bytes.buffer);
                    }).catch((e) => {
                        rej(e);
                    });
                }));
            });

            return { success: true, files: await Promise.allSettled(binaryPromises) };
        }
    },
    pushFile: async function(options) {
        state.filesToUploadChangedAt = Date.now();
        const {file, identifier, tags} = options;

        let alreadyExists = false;
        for (let i = 0; i < state.filesToUpload.length; i++) {
            const fileToUpload = state.filesToUpload[i];
            if (fileToUpload.identifier === identifier) {
                alreadyExists = true;
                break;
            }
        }
        if (alreadyExists) {
            return { success: true };
        }

        const walrusFile = WalrusFile.from({
            contents: file,
            identifier: identifier,
            tags: tags,
        });
        state.filesToUpload.push({
            walrusFile: walrusFile,
            identifier: identifier,
            walrusId: null,
            walrusBlobId: null,
            walrusBlobObjectId: null,
            size: file.size || file.byteLength,
        });
        return { success: true };
    },
    uploadFiles: async function(options) {
        try {
            if (state.filesToUploadChangedAt && state.filesChangedAtPrepared != state.filesToUploadChangedAt) {
                // need to wait for prepare
                await queryableFunctions.prepareFiles();
            }

            const flow = state.preparedFilesFlow;
            const registerTx = state.preparedFilesRegisterTx;

            if (!flow) {
                return { success: false, error: 'Files not prepared' };
            }

            const handleRegister = async () => {
                callParent('statusUpdate', { 
                    step: 'encode',
                    message: 'Submitting register transaction...',
                    start: true,
                });
                let digest = await signAndExecuteTransaction(registerTx);
                if (!digest) {
                    throw new Error('Failed to execute register transaction');
                }
                callParent('statusUpdate', { 
                    step: 'encode',
                    message: 'Sending binaries to Upload Relay...',
                    start: true,
                });
                await flow.upload({ digest: digest });
            }
            const handleCertify = async () => {
                callParent('statusUpdate', { 
                    step: 'encode',
                    message: 'Building certify transaction...',
                    start: true,
                });
                const certifyTx = flow.certify();
                certifyTx.setSenderIfNotSet(state.connectedAddress);
                await certifyTx.build({
                    client: state.suiClient,
                });
                callParent('statusUpdate', { 
                    step: 'encode',
                    message: 'Submitting certify transaction...',
                    start: true,
                });
                await signAndExecuteTransaction(certifyTx);

                callParent('statusUpdate', { 
                    step: 'encode',
                    message: 'Getting walrus ids...',
                    start: true,
                });
                const uploadedFilesResponse = await flow.listFiles();
                console.log('Uploaded files', uploadedFilesResponse);

                const ret = [];
                for (const uploadedFilesResponseItem of uploadedFilesResponse) {
                    if (uploadedFilesResponseItem && uploadedFilesResponseItem.id) {
                        const item = {
                            id: uploadedFilesResponseItem.id,
                            blobObjectId: uploadedFilesResponseItem.blobObject?.id?.id,
                            blobObject: uploadedFilesResponseItem.blobObject,
                            blobId: uploadedFilesResponseItem.blobId,
                        };

                        ret.push(item);
                    }
                }

                return ret;
            }

            await handleRegister();
            const uploadedItems = await handleCertify();

            callParent('statusUpdate', { 
                step: 'encode',
                message: 'Uploaded ' + uploadedItems.length + ' items' + (uploadedItems.length !== 1 ? 's' : '') + ' to Walrus',
                start: true,
            });

            if (uploadedItems.length != state.preparedFilesIdentifiers.length) {
                return { success: false, error: 'Uploaded files count mismatch' };
            }

            for (let i = 0; i < uploadedItems.length; i++) {
                const expectedIdentifier = state.preparedFilesIdentifiers[i];
                const walrusId = uploadedItems[i].id;
                const walrusBlobId = uploadedItems[i].blobId;
                const walrusBlobObjectId = uploadedItems[i].blobObjectId;
                state.filesToUpload.forEach((fileToUpload) => {
                    if (fileToUpload.identifier === expectedIdentifier) {
                        fileToUpload.walrusId = walrusId;
                        fileToUpload.walrusBlobObjectId = walrusBlobObjectId;
                        fileToUpload.walrusBlobId = walrusBlobId;
                        fileToUpload.walrusFile = null; // free memory
                    }
                });
            }

            callParent('statusUpdate', { 
                step: 'encode',
                stop: true,
            });

            return { success: true, files: state.filesToUpload };
        } catch (e) {
            callParent('statusUpdate', { 
                step: 'encode',
                stop: true,
                error: e.message,
            });

            return { success: false, error: e.message };
        }
    },
    prepareFiles: async function(options) {
        const epochs = options.epochs || (state.network == 'mainnet' ? 2 : 7);

        const runAtPrepareFilesChangedAt = state.filesToUploadChangedAt;
        if (state.prepareFilesPromises[runAtPrepareFilesChangedAt]) {
            return await state.prepareFilesPromises[runAtPrepareFilesChangedAt];
        }
        if (!runAtPrepareFilesChangedAt) {
            return { success: false };
        }
        state.prepareFilesPromises[runAtPrepareFilesChangedAt] = new Promise((res) => {
            state.prepareFilesPromisesResolvers[runAtPrepareFilesChangedAt] = res;
        });

        const preparedFilesIdentifiers = [];
        const files = [];
        
        state.filesToUpload.forEach((fileToUpload) => {
            if (fileToUpload.walrusFile) {
                // only files that are not yet prepared
                preparedFilesIdentifiers.push(fileToUpload.identifier);
                files.push(fileToUpload.walrusFile);
            }
        });

        callParent('statusUpdate', { 
            message: 'Encoding ' + files.length + ' file' + (files.length !== 1 ? 's' : '') + ' for upload...',
            step: 'encode',
            start: true,
        });

        if (!files.length) {
            state.prepareFilesPromisesResolvers[runAtPrepareFilesChangedAt]({ success: false });
            return { success: false };
        }

        const flow = state.walrusClient.writeFilesFlow({
            files: files,
        });

        await flow.encode();

        if (runAtPrepareFilesChangedAt != state.filesToUploadChangedAt) {
            // Files changed during preparation, need to prepare again
            state.prepareFilesPromisesResolvers[runAtPrepareFilesChangedAt]({ success: false });
            return { success: false };
        }

        callParent('statusUpdate', { 
            message: 'Building register transaction...',
            step: 'encode',
            start: true,
        });

        let registerTx = null;
        if (state.suiClient) {
            registerTx = flow.register({
                epochs: epochs,
                owner: state.connectedAddress,
                deletable: true,
            });
            registerTx.setSenderIfNotSet(state.connectedAddress);
            await registerTx.build({
                client: state.suiClient,
            });
        }

        callParent('statusUpdate', { 
            step: 'encode',
            stop: true,
        });
        
        if (runAtPrepareFilesChangedAt != state.filesToUploadChangedAt) {
            // Files changed during preparation, need to prepare again
            state.prepareFilesPromisesResolvers[runAtPrepareFilesChangedAt]({ success: false });
            return { success: false };
        }

        state.preparedFilesFlow = flow;
        state.preparedFilesRegisterTx = registerTx;
        state.preparedFilesIdentifiers = preparedFilesIdentifiers;

        state.filesChangedAtPrepared = runAtPrepareFilesChangedAt;

        state.prepareFilesPromisesResolvers[runAtPrepareFilesChangedAt]({ success: true });
        return { success: true };
    },
    initialize: async function(options) {
        const {network, connectedAddress} = options;
        
        if (connectedAddress) {
            state.connectedAddress = connectedAddress;
        }
        if (network) {
            state.network = network;
            state.suiClient = await makeSuiClient(network);
            state.walrusClient = await makeWalrusClient(network);

            const aggUrl = await getAggregator(network);
            if (aggUrl) {
                state.aggregatorUrl = aggUrl;
            }

            // const uploadRelayOptions = {
            //     // https://upload-relay.mainnet.walrus.space/v1/tip-config
            //     host: 'https://upload-relay.mainnet.walrus.space',
            //     sendTip: {
            //         address: "0x765a6ff2c13b47e2603416d0b5a156df498a5c51bc8085be3838e43e06086256",
            //         kind: {
            //             linear: {
            //                 base: 0,
            //                 perEncodedKib: 40
            //             }
            //         }
            //     },
            //     timeout: 95000,
            // };
            // if (network == 'testnet') {
            //     // https://upload-relay.testnet.walrus.space/v1/tip-config
            //     uploadRelayOptions.host = 'https://upload-relay.testnet.walrus.space';
            //     uploadRelayOptions.sendTip.address = '0x4b6a7439159cf10533147fc3d678cf10b714f2bc998f6cb1f1b0b9594cdc52b6';
            //     uploadRelayOptions.sendTip.kind.const = 105;
            //     delete uploadRelayOptions.sendTip.kind.linear;
            // }
            
            // state.activeQueriesCount = 0;
            // state.walrusClient = new WalrusClient({
            //     network: network,
            //     suiClient: state.suiClient,
            //     wasmUrl: 'https://unpkg.com/@mysten/walrus-wasm@0.1.1/web/walrus_wasm_bg.wasm',
            //     uploadRelay: uploadRelayOptions,
            //     storageNodeClientOptions: {
            //         fetch: fetchLimitingConcurrent,
            //         timeout: 170000,
            //     },
            // });

            return true;
        }
    }
};

onmessage = function(e) {
	const {id, method, options, data} = e.data;

	if (queryableFunctions[method]) {
		queryableFunctions[method](options)
			.then((data)=>{
				const payload = {
					data: data,
					success: true,
					id: id,
				};
				postMessage(payload);
			})
			.catch((e)=>{
				console.error(e);
				const payload = {
					id: id,
					data: e,
					success: false,
				};
				postMessage(payload);
			});
	} else if (state.workerPromisesResolvers[id]) {
        state.workerPromisesResolvers[id](data);
        delete state.workerPromisesResolvers[id];
        delete state.workerPromises[id];
    }
}