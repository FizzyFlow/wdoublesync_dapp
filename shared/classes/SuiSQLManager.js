import SuiSql from '@fizzyflow/suisql';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { WalrusClient, WalrusFile } from '@mysten/walrus';
import Log from './Log.js';

export function makeSignAndExecuteTransaction(suiMaster) {
    return async (tx) => {
        tx.setSenderIfNotSet(suiMaster.address);
        console.log('starting tx build and signAndExecuteTransaction...', Date.now());
        await tx.build({
            client: suiMaster.client,
        });
        console.log('finished tx build, starting signAndExecuteTransaction...', Date.now());
        const results = await suiMaster.signAndExecuteTransaction({
            transaction: tx,
        });
        return results.digest;
    };
};

export function makeWalrusClient(params = {}) {
    const network = params.network || 'mainnet';
    const suiMaster = params.suiMaster || null;
    const suiClient = suiMaster ? suiMaster.client : new SuiClient({
        url: getFullnodeUrl(network),
    });

    const uploadRelayOptions = {
        // https://upload-relay.mainnet.walrus.space/v1/tip-config
        host: 'https://upload-relay.mainnet.walrus.space',
        sendTip: {
            address: "0x765a6ff2c13b47e2603416d0b5a156df498a5c51bc8085be3838e43e06086256",
            kind: {
                linear: {
                    base: 0,
                    perEncodedKib: 40
                }
            }
        },
    };
    if (network == 'testnet') {
        // https://upload-relay.testnet.walrus.space/v1/tip-config
        uploadRelayOptions.host = 'https://upload-relay.testnet.walrus.space';
        uploadRelayOptions.sendTip.address = '0x4b6a7439159cf10533147fc3d678cf10b714f2bc998f6cb1f1b0b9594cdc52b6';
        uploadRelayOptions.sendTip.kind.const = 105;
        delete uploadRelayOptions.sendTip.kind.linear;
    }

    let activeQueriesCount = 0;
    const walrusClient = new WalrusClient({
        network: network,
        suiClient: suiClient,
        wasmUrl: 'https://unpkg.com/@mysten/walrus-wasm@0.1.1/web/walrus_wasm_bg.wasm',
        uploadRelay: uploadRelayOptions,
        storageNodeClientOptions: {
            fetch: async (url, options) => {
                const maxParallelQueries = 30;
                if (activeQueriesCount > maxParallelQueries) {
                    do {
                        await new Promise((res)=> setTimeout(res, 1000) );
                    } while (activeQueriesCount > maxParallelQueries);
                }
                activeQueriesCount++;
                try {
                    options.signal = AbortSignal.timeout(15000);
                    const res = await fetch(url, options);
                    activeQueriesCount--;
                    return res;
                } catch (e) {
                    activeQueriesCount--;
                    throw e;
                }
            },
            timeout: 170000,
        },
    });

    walrusClient.WalrusFile = WalrusFile;

    return walrusClient;
}

/**
 * Initialize SuiSQL database
 * Supports both read-only (viewer) and read-write (editor) modes
 *
 * @param {Object} options - Configuration options
 * @param {string} [options.dbId] - Database ID (provide either dbId or dbName)
 * @param {string} [options.dbName] - Database name (provide either dbId or dbName)
 * @param {string} [options.dbChain='mainnet'] - Chain name (mainnet, testnet, devnet)
 * @param {Object} [options.suiMaster=null] - SuiMaster instance for read-write mode
 * @param {boolean} [options.debug=false] - Enable debug mode
 * @returns {Promise<Object|null>} Initialized database instance or null on failure
 */
export async function initializeSuiSQL(options = {}) {
    const { dbId, dbName, dbChain = 'mainnet', suiMaster = null, debug = false } = options;

    if (!dbId && !dbName) {
        Log.info('No database ID or name provided, skipping database initialization');
        return null;
    }

    try {
        Log.info('Initializing SuiSQL database with', dbId ? 'ID: ' + dbId : 'name: ' + dbName, 'on chain:', dbChain);

        let suiSQLOptions;

        // Read-write mode (Editor with wallet)
        if (suiMaster) {
            const suiClient = suiMaster.client;

            const signAndExecuteTransaction = makeSignAndExecuteTransaction(suiMaster);

            suiSQLOptions = {
                network: ('' + suiMaster.connectedChain).split('sui:').join(''),
                suiClient: suiClient,
                signAndExecuteTransaction,
                currentWalletAddress: suiMaster.address,
                debug,
            };

            // Add either id or name
            if (dbId) {
                suiSQLOptions.id = dbId;
            } else {
                suiSQLOptions.name = dbName;
            }
        } else {
            // Read-only mode (Viewer without wallet)
            const suiClient = new SuiClient({
                url: getFullnodeUrl(dbChain),
            });

            suiSQLOptions = {
                network: dbChain,
                suiClient: suiClient,
                debug,
            };

            // Add either id or name
            if (dbId) {
                suiSQLOptions.id = dbId;
            } else {
                suiSQLOptions.name = dbName;
            }
        }

        const db = new SuiSql(suiSQLOptions);
        const state = await db.initialize();

        if (state === 'OK' || state === 'EMPTY') {
            Log.info('SuiSQL database initialized successfully, state:', state);
            return db;
        } else {
            Log.error('Failed to initialize SuiSQL database, state:', state);
            return null;
        }
    } catch (error) {
        Log.error('Error initializing SuiSQL database:', error);
        return null;
    }
}
