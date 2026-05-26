import WalrusMediaAbstract from './WalrusMediaAbstract.js'

class WalrusMediaRow extends WalrusMediaAbstract {
	constructor() {
        super();
        
		this.items = [];
		this.widths = [];
		this.idWidth = {};
		this.filledWidth = 0;
		this.isFull = false;
        this.isEnded = false;

        this.id = Math.random().toString(36).substring(2, 15);
	}

    end() {
        this.isEnded = true;
    }

    remove(item) {
        const i = this.items.indexOf(item);
        if (i === -1) return false;

        const remaining = this.items.filter((_, idx) => idx !== i);

        this.items = [];
        this.widths = [];
        this.idWidth = {};
        this.filledWidth = 0;
        this.isFull = false;

        for (const r of remaining) {
            this.pushIfHasSpace(r);
        }

        this.emit('itemRemoved', item);
        return true;
    }

    unshift(itemOrArrayOfItems) {
        const countOfItemsOnStart = this.items.length;

        this.isFull = false;
        this.widths = [];
        this.idWidth = {};
        this.filledWidth = 0;

        const itemsBack = this.items.slice();
        this.items = [];

        // keep the back item on its place
        for (let item of itemsBack) {
            if (item.isBackButton) {
                this.pushIfHasSpace(item);
            }
        }

        let itemsToUnshift = [];
        if (Array.isArray(itemOrArrayOfItems)) {
            itemsToUnshift = itemOrArrayOfItems;
        } else {
            itemsToUnshift = [itemOrArrayOfItems];
        }

        for (let item of itemsToUnshift) {
            const addedPushedSuccess = this.pushIfHasSpace(item); // push the one we are adding
        }

        let pushingItem = null;
        do {
            pushingItem = itemsBack.shift(); // get items one by one

            if (pushingItem && !pushingItem.isBackButton) {
                const success = this.pushIfHasSpace(pushingItem); // and push them again

                if (!success && this.isFull) {
                    itemsBack.unshift(pushingItem); // get it back if there's no more place
                }
            }
        } while(!this.isFull && itemsBack.length);

        // on this step itemBack consist of items we have to move to the next row, lets return them
        return itemsBack;
    }

    pushIfHasSpace(item) {
        if (this.isFull) {
            return false;
        }

        const itemRatio = item.ratio;

        if (!itemRatio) {
            return false;
        }

        const minPercent = 15;
        const maxPercent = 30;
        const minRatioToUse = 0.5;
        const maxRatioToUse = 2;
        let ratioToUse = itemRatio;
        if (ratioToUse < minRatioToUse) {
            ratioToUse = minRatioToUse;
        } else if (ratioToUse > maxRatioToUse) {
            ratioToUse = maxRatioToUse;
        }

        let width = Math.floor((ratioToUse / maxRatioToUse)*maxPercent);
        if (width < minPercent) {
            width = minPercent;
        }

        let success = false;

        if (this.filledWidth + width <= 100) {
            this.filledWidth = this.filledWidth + width;
            this.widths.push(width);
            this.items.push(item);

            this.emit('itemAdded', item);

            success = true;
        } else {
            const expectedWidth = this.filledWidth + width;
            const k = 100 / expectedWidth;

            for (let i = 0; i < this.widths.length; i++) {
                this.widths[i] = this.widths[i] * k;
            }

            this.widths.push(width*k);
            this.items.push(item);

            this.emit('itemAdded', item);

            this.filledWidth = 100;
            this.isFull = true;

            success = true;
        }

        if (this.filledWidth + minPercent > 100) {
            const curWidth = this.filledWidth;
            const k = 100 / curWidth;
            for (let i = 0; i < this.widths.length; i++) {
                this.widths[i] = this.widths[i] * k;
            }
            this.isFull = true;
        }

        return success;
    }
}


export default class WalrusMediaRowBuilder extends WalrusMediaAbstract {
	constructor() {
		super();
		this._rows = [];
	}

	get rows() {
		return this._rows;
	}

	push(item) {
		const lastRow = this._rows[this._rows.length - 1];
		let success = false;
		if (lastRow) {
			success = lastRow.pushIfHasSpace(item);
		}

		if (!success) {
			const row = new WalrusMediaRow();
            this._rows.push(row);
            this.emit('rowAdded', row);
			success = row.pushIfHasSpace(item);
		}

		return success;
	}

    unshift(item) {
        let rowIndex = 0;
        let shiftingItems = [item];

        do {
            let row = this._rows[rowIndex];
            if (!row) {
                row = new WalrusMediaRow();
                this._rows.push(row);
                this.emit('rowAdded', row);
            }
            shiftingItems = row.unshift(shiftingItems);
            rowIndex++;
        } while (shiftingItems.length);
    }

    remove(item) {
        let rowIdx = -1;
        for (let r = 0; r < this._rows.length; r++) {
            if (this._rows[r].items.indexOf(item) !== -1) {
                rowIdx = r;
                break;
            }
        }
        if (rowIdx === -1) return false;

        const remaining = [];
        for (let r = rowIdx; r < this._rows.length; r++) {
            for (const rowItem of this._rows[r].items) {
                if (rowItem !== item) remaining.push(rowItem);
            }
            this._rows[r].items = [];
            this._rows[r].widths = [];
            this._rows[r].idWidth = {};
            this._rows[r].filledWidth = 0;
            this._rows[r].isFull = false;
        }

        let cur = rowIdx;
        for (const r of remaining) {
            let pushed = this._rows[cur].pushIfHasSpace(r);
            if (!pushed && cur + 1 < this._rows.length) {
                cur++;
                pushed = this._rows[cur].pushIfHasSpace(r);
            }
        }

        while (this._rows.length > 0 && this._rows[this._rows.length - 1].items.length === 0) {
            const empty = this._rows.pop();
            this.emit('rowRemoved', empty);
        }

        for (let r = rowIdx; r < this._rows.length; r++) {
            this._rows[r].emit('itemRemoved', item);
        }

        return true;
    }

    end() {
        const lastRow = this._rows[this._rows.length - 1];
        if (lastRow) {
            lastRow.end();
        }
    }
}