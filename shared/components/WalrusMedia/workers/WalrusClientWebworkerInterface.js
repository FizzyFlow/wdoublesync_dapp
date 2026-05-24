import WalrusClientWebworker from './WalrusClientWebworker.js?worker';
import { Transaction } from '@mysten/sui/transactions';
import WalrusMediaAbstract from '../includes/WalrusMediaAbstract.js';

export default class WalrusClientWebworkerInterface extends WalrusMediaAbstract {
    constructor(params = {}) {
        super(params);

        this._worker = new WalrusClientWebworker;
        this._signAndExecuteTransaction = params.signAndExecuteTransaction;
        this._network = params.network;
        this._connectedAddress = params.connectedAddress;

        this._statusMessage = null;
        this._statusStep = null;

    	this._workerPromises = {};
        this._workerPromisesResolvers = {};
        this._worker.onmessage = (event) => {
            const { data, success, id, method, options } = event.data;
            if (this._workerPromisesResolvers[id]) {
                this._workerPromisesResolvers[id](data);
                delete this._workerPromisesResolvers[id];
                delete this._workerPromises[id];
            } else if (method && method == 'signAndExecuteTransaction') {
                const txJSON = options.txJSON;
                const tx = Transaction.from(txJSON);
                this._signAndExecuteTransaction(tx)
                    .then((digest) => {
                        this._worker.postMessage({
                            id: id,
                            data: { digest: digest },
                            success: true,
                        });
                    })
                    .catch((e) => {
                        this._worker.postMessage({
                            id: id,
                            data: { error: e.message },
                            success: false,
                        });
                    });
            } else if (method && method == 'statusUpdate') {
                this._statusMessage = options.message || null;
                this._statusStep = options.step || null;
                const stop = options.stop || false;

                if (stop) {
                    this._statusStep = null;
                    this._statusMessage = null;
                }

                this.emit('status', {
                    message: this._statusMessage,
                    step: this._statusStep,
                    start: options.start || false,
                    stop: options.stop || false,
                    error: options.error || null,
                });
            }
        };
    }

	async callWorker(method, options) {
		const id = (''+Math.random()).split('.').join('');
		const payload = {
			id: id,
			method: method,
			options: options,
		};

		this._workerPromises[id] = new Promise((res) => { this._workerPromisesResolvers[id] = res; });
		this._worker.postMessage(payload);
		if (options.timeout) {
			return await Promise.race([new Promise(function(res) { setTimeout(()=>{ res({data: null}); }, options.timeout) }), this._workerPromises[id]]);
		} else {
			return await this._workerPromises[id];
		}
	}

    /** @returns {Promise<ArrayBuffer[]>} */
    async getFiles(ids) {
        const resp = await this.callWorker('getFiles', {
            ids: ids,
        });
        console.log('getFiles response:', resp);
        /** @type {ArrayBuffer[]} */
        return resp.files;
    }

    async pushFile(file, identifier, tags = {}) {
        return await this.callWorker('pushFile', {
            file: file,
            identifier: identifier,
            tags: tags,
        });
    }

    async prepare() {
        return await this.callWorker('prepareFiles', {});
    }

    async uploadFiles() {
        return await this.callWorker('uploadFiles', {});
    }

    async initialize() {
        return await this.callWorker('initialize', {
            network: this._network,
            connectedAddress: this._connectedAddress,
        });
    }

    async getAggregatorURL(quiltBlobId = null, identifier = null) {
        const resp = await this.callWorker('getAggregatorURL', {
            quiltBlobId: quiltBlobId,
            identifier: identifier,
        });
        return resp.aggregatorUrl;
    }
}