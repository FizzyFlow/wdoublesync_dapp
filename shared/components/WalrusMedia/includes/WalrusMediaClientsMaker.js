import { WalrusSealClient } from 'walrus-seal-client-with-local';
import EndlessVector from '@fizzyflow/endless-vector';

export const normalizeNetworkName = (network) => {
    if (!network) return 'mainnet';
    const n = ('' + network).toLowerCase().replace('sui:', '');
    if (n.includes('testnet')) return 'testnet';
    if (n.includes('mainnet')) return 'mainnet';
    if (n.includes('devnet')) return 'devnet';
    if (n.includes('localnet') || n.includes('local')) return 'localnet';
    return 'mainnet';
};

const _cache = {};

export const makeWalrusSealClient = (network) => {
    const n = normalizeNetworkName(network);
    if (!_cache[n]) {
        const wsc = new WalrusSealClient({ network: n });
        _cache[n] = wsc.initialize().then(() => wsc);
    }
    return _cache[n];
};

export const makeSuiClient = async (network) => {
    const wsc = await makeWalrusSealClient(network);
    return wsc.suiClient;
};

export const makeWalrusClient = async (network) => {
    const wsc = await makeWalrusSealClient(network);
    return wsc.walrusClient;
};

export const makeSealClient = async (network) => {
    const wsc = await makeWalrusSealClient(network);
    return wsc.sealClient;
};

export const getAggregator = async (network) => {
    const wsc = await makeWalrusSealClient(network);
    return wsc.aggregatorUrl;
};

export const getPackageId = async (network) => {
    const n = normalizeNetworkName(network);
    if (n === 'localnet') {
        const wsc = await makeWalrusSealClient(network);
        return wsc.config?.walrus?.packageId;
    }
    return EndlessVector.getPackageId(n) || n;
};
