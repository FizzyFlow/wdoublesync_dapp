import WalrusMediaAbstract from './WalrusMediaAbstract.js';

export default class WalrusMediaBackButton extends WalrusMediaAbstract {
    constructor(params = {}) {
        super();
        this.isBackButton = true;
        this.ratio = 1;
        this.parent = params.parent || null;
    }

    dispose() {
    }
}