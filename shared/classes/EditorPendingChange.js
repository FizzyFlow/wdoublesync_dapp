

export default class EditorPendingChange {
    constructor(params = {}) {
        this.type = params.type;
        this.name = params.name;
        this.value = params.value;
        this.slug = params.slug || null;
    }
}