import Log from './Log.js';

/**
 * Set app settings in a SuiSQL database
 * Note: Does not call db.sync() - caller should sync after all operations are complete
 *
 * @param {Object} db - SuiSQL database instance
 * @param {Object} settings - Settings object
 * @param {string} [settings.templateId] - Template identifier
 * @param {string} [settings.templateVersion] - Template version
 * @param {string} [settings.appName] - Application name
 * @param {string} [settings.appDescription] - Application description
 * @param {string} [settings.appOrigins] - Allowed origins (newline separated)
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export async function setAppSettings(db, settings = {}) {
    if (!db) {
        Log.error('No database provided to saveAppSettings');
        return false;
    }

    const {
        templateId = '',
        templateVersion = '',
        appName = '',
        appDescription = '',
        appOrigins = '',
    } = settings;

    try {
        // Collect all settings to save
        const settingsToSave = {};
        if (templateId) settingsToSave.templateId = templateId;
        if (templateVersion) settingsToSave.templateVersion = templateVersion;
        if (appName) settingsToSave.appName = appName;
        if (appDescription) settingsToSave.appDescription = appDescription;
        if (appOrigins) settingsToSave.appOrigins = appOrigins;

        if (Object.keys(settingsToSave).length === 0) {
            Log.warn('No settings provided to save');
            return true; // Not an error, just nothing to do
        }

        // Check which settings already exist in the database and get their values
        const settingNames = Object.keys(settingsToSave);
        const placeholders = settingNames.map(() => '?').join(', ');
        const existingSettings = await db.query(
            `SELECT name, value FROM cpuso_settings WHERE name IN (${placeholders})`,
            settingNames
        );

        // Create a map of existing setting names to their values
        const existingValues = new Map(
            (existingSettings || []).map(row => [row.name, row.value])
        );

        // Escape single quotes in values
        const escapeValue = (value) => String(value || '').replace(/'/g, "''");

        // Build SQL statements - INSERT for new, UPDATE only if value changed
        const sqlStatements = [];

        for (const [name, value] of Object.entries(settingsToSave)) {
            const escapedValue = escapeValue(value);

            if (existingValues.has(name)) {
                // Only UPDATE if value has changed
                const currentValue = existingValues.get(name);
                if (currentValue !== value) {
                    sqlStatements.push(
                        `UPDATE cpuso_settings SET value = '${escapedValue}' WHERE name = '${name}';`
                    );
                }
                // else: value is the same, skip update
            } else {
                // INSERT new setting
                sqlStatements.push(
                    `INSERT INTO cpuso_settings (name, value) VALUES ('${name}', '${escapedValue}');`
                );
            }
        }

        // Execute all SQL statements
        if (sqlStatements.length > 0) {
            const sql = sqlStatements.join('\n');
            await db.iterateStatements(sql);

            Log.info('App settings saved successfully:', sqlStatements.length, 'changes out of', settingNames.length, 'settings');
            return true;
        }

        Log.info('No changes needed - all settings are up to date');
        return true;
    } catch (error) {
        Log.error('Error saving app settings:', error);
        return false;
    }
}

/**
 * Ensure cpuso_settings table exists and initialize with settings
 * Note: Does not call db.sync() - caller should sync after all operations are complete
 *
 * @param {Object} db - SuiSQL database instance
 * @param {Object} settings - Settings object (same as setAppSettings)
 * @param {number} [version=1] - Database schema version
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export async function initializeAppSettings(db, settings = {}, version = 1) {
    if (!db) {
        Log.error('No database provided to initializeAppSettings');
        return false;
    }

    try {
        // Check if cpuso_settings table exists
        const tables = await db.query(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='cpuso_settings'"
        );

        // Create table if it doesn't exist
        if (!tables || tables.length === 0) {
            Log.info('Creating cpuso_settings table');

            const createTableSQL = `
                CREATE TABLE cpuso_settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    value TEXT
                );
                CREATE UNIQUE INDEX idx_cpuso_settings_name ON cpuso_settings(name);
                INSERT INTO cpuso_settings (name, value) VALUES ('initializedWithVersion', '${version}');
            `;

            await db.iterateStatements(createTableSQL);

            Log.info('cpuso_settings table created successfully');
        }

        // Save the provided settings
        return await setAppSettings(db, settings);
    } catch (error) {
        Log.error('Error initializing app settings:', error);
        return false;
    }
}
