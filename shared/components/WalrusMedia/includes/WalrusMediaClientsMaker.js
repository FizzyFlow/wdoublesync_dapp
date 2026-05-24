import { SuiGrpcClient, GrpcWebFetchTransport } from '@mysten/sui/grpc';
import { WalrusClient } from '@mysten/walrus';
import { SealClient } from '@mysten/seal';
import EndlessVector from '@fizzyflow/endless-vector';

const baseUrls = {
    mainnet: 'https://fullnode.mainnet.sui.io:443',
    testnet: 'https://fullnode.testnet.sui.io:443',
    devnet: 'https://fullnode.devnet.sui.io:443',
    localnet: 'http://127.0.0.1:9000',
};

const aggregators = {
    testnet: 'https://aggregator.walrus-testnet.walrus.space',
    mainnet: 'https://aggregator.walrus-mainnet.walrus.space',
};

const LOCALNET_CONFIG_URL = 'http://localhost:8099/v1/localnet-config';

let _localnetConfig = null;

async function getLocalnetConfig() {
    if (_localnetConfig) return _localnetConfig;
    const res = await fetch(LOCALNET_CONFIG_URL);
    if (!res.ok) throw new Error('Failed to fetch localnet config: ' + res.statusText);
    _localnetConfig = await res.json();
    return _localnetConfig;
}

export const normalizeNetworkName = (network) => {
    if (!network) return 'mainnet';
    const n = ('' + network).toLowerCase().replace('sui:', '');
    if (n.includes('testnet')) return 'testnet';
    if (n.includes('mainnet')) return 'mainnet';
    if (n.includes('devnet')) return 'devnet';
    if (n.includes('localnet') || n.includes('local')) return 'localnet';
    return 'mainnet';
};

export const getAggregator = async (network) => {
    const n = normalizeNetworkName(network);
    if (n === 'localnet') {
        const config = await getLocalnetConfig();
        return config.walrus.aggregatorUrl;
    }
    return aggregators[n] || aggregators.mainnet;
};

export const makeSuiClient = (network) => {
    const n = normalizeNetworkName(network);
    return new SuiGrpcClient({
        network: n,
        transport: new GrpcWebFetchTransport({ baseUrl: baseUrls[n] }),
    });
};

export const makeWalrusClient = async (network, suiClient) => {
    const n = normalizeNetworkName(network);
    const client = suiClient || makeSuiClient(n);

    if (n === 'localnet') {
        const config = await getLocalnetConfig();
        return new WalrusClient({
            network: n,
            suiClient: client,
            wasmUrl: 'https://unpkg.com/@mysten/walrus-wasm@0.2.2/web/walrus_wasm_bg.wasm',
            uploadRelay: { host: config.walrus.uploadRelayUrl, sendTip: null },
            packageConfig: {
                systemObjectId: config.walrus.systemObjectId,
                stakingPoolId: config.walrus.stakingPoolId,
            },
        });
    }

    const uploadRelayOptions = {
        host: 'https://upload-relay.mainnet.walrus.space',
        sendTip: {
            address: '0x765a6ff2c13b47e2603416d0b5a156df498a5c51bc8085be3838e43e06086256',
            kind: { linear: { base: 0, perEncodedKib: 40 } },
        },
    };

    if (n === 'testnet') {
        uploadRelayOptions.host = 'https://upload-relay.testnet.walrus.space';
        uploadRelayOptions.sendTip.address = '0x4b6a7439159cf10533147fc3d678cf10b714f2bc998f6cb1f1b0b9594cdc52b6';
        uploadRelayOptions.sendTip.kind = { const: 105 };
    }

    return new WalrusClient({
        network: n,
        suiClient: client,
        wasmUrl: 'https://unpkg.com/@mysten/walrus-wasm@0.2.2/web/walrus_wasm_bg.wasm',
        uploadRelay: uploadRelayOptions,
    });
};

export const makeSealClient = async (network, suiClient) => {
    const n = normalizeNetworkName(network);
    const client = suiClient || makeSuiClient(n);

    if (n === 'localnet') {
        const config = await getLocalnetConfig();
        return new SealClient({
            suiClient: client,
            serverConfigs: [{ objectId: config.seal.serverObjectId, weight: 1 }],
            verifyKeyServers: true,
        });
    }

    const sealKeyServers = {
        testnet: [
            { objectId: '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75', weight: 1 },
            { objectId: '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8', weight: 1 },
        ],
    };

    if (!sealKeyServers[n]) {
        throw new Error(`Seal key servers not configured for network: ${n}`);
    }

    return new SealClient({
        suiClient: client,
        serverConfigs: sealKeyServers[n],
        verifyKeyServers: true,
    });
};

export const getPackageId = async (network) => {
    const n = normalizeNetworkName(network);
    if (n === 'localnet') {
        const config = await getLocalnetConfig();
        return config.walrus.packageId;
    }
    return EndlessVector.getPackageId(n) || n;
};
