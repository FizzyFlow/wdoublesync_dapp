import EditorPendingChange from "./EditorPendingChange.js";

export default class EditorPendingChanges {
    constructor(params = {}) {
        this.changes = params.changes || [];
        this._onUniqueChangesUpdated = params.onUniqueChangesUpdated || null;
        this._db = params.db || null;
    }

    setDb(db) {
        this._db = db;
    }

    onUniqueChangesUpdated(callback) {
        this._onUniqueChangesUpdated = callback;
    }

    addChange(params = {}) {
        const { type, name, value, slug } = params;
        const change = new EditorPendingChange({ type,  name, value, slug });
        this.changes.push(change);

        if (this._onUniqueChangesUpdated) {
            this._onUniqueChangesUpdated(this.getUniqueChanges());
        }
    }

    clearChanges() {
        this.changes = [];
        if (this._onUniqueChangesUpdated) {
            this._onUniqueChangesUpdated(this.getUniqueChanges());
        }
    }

    /**
     * @returns EditorPendingChange[]
     */
    getUniqueChanges() {
        const uniqueChangesMap = new Map();
        // Iterate in reverse to keep the latest change for each name
        for (let i = this.changes.length - 1; i >= 0; i--) {
            const change = this.changes[i];
            if (!uniqueChangesMap.has(''+change.type + '_' +change.name)) {
                uniqueChangesMap.set(''+change.type + '_' +change.name, change);
            }
        }
        return Array.from(uniqueChangesMap.values());
    }

    async getUniqueChangesSQL() {
        const sql = [];

        // @todo: indexes?
        const expectedTables = {
            'cpuso_css_variables': "CREATE TABLE cpuso_css_variables (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, value TEXT); CREATE UNIQUE INDEX idx_cpuso_css_variables_name ON cpuso_css_variables(name);",
            'cpuso_settings': "CREATE TABLE cpuso_settings (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, value TEXT); CREATE UNIQUE INDEX idx_cpuso_settings_name ON cpuso_settings(name);",
            'cpuso_contents': "CREATE TABLE cpuso_contents (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL, title TEXT, body TEXT); CREATE UNIQUE INDEX idx_cpuso_contents_slug ON cpuso_contents(slug);",
            'cpuso_block_settings': "CREATE TABLE cpuso_block_settings (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL, settings TEXT NOT NULL); CREATE UNIQUE INDEX idx_cpuso_block_settings_slug_name ON cpuso_block_settings(slug);",
        };

        for (const tableName in expectedTables) {
            // check if it's there
            const res = await this._db.query('SELECT name FROM sqlite_master WHERE type="table" AND name=?;', [tableName]);
            if (res.length > 0) {
                continue;
            }
            const createTableSQL = expectedTables[tableName];
            sql.push(createTableSQL);
        }

        const uniqueChanges = this.getUniqueChanges();

        const blockSettingsSlugs = {};
        for (const change of uniqueChanges) {
            if (change.type == 'cssVariable') {
                const valueEscaped = change.value.replace(/'/g, "''");
                sql.push(`INSERT OR REPLACE INTO cpuso_css_variables (name, value) VALUES ('${change.name}', '${valueEscaped}');`);
            } else if (change.type == 'siteSetting') {
                const valueEscaped = change.value.replace(/'/g, "''");
                sql.push(`INSERT OR REPLACE INTO cpuso_settings (name, value) VALUES ('${change.name}', '${valueEscaped}');`);
            } else if (change.type == 'contentItem') {
                sql.push(`INSERT OR REPLACE INTO cpuso_contents (slug, title, body) VALUES ('${change.name}', '${change.value.title.replace(/'/g, "''")}', '${change.value.body.replace(/'/g, "''")}');`);
            } else if (change.type == 'blockSettings') {
                if (!blockSettingsSlugs[change.slug]) {
                    blockSettingsSlugs[change.slug] = {};
                }
                blockSettingsSlugs[change.slug][change.name] = change.value;
            }
        }

        for (const slug in blockSettingsSlugs) {
            const settings = blockSettingsSlugs[slug];
            const settingsJSON = JSON.stringify(settings).replace(/'/g, "''");
            sql.push(`INSERT OR REPLACE INTO cpuso_block_settings (slug, settings) VALUES ('${slug}', '${settingsJSON}');`);
        }

        return sql.join("\n");
    }

}