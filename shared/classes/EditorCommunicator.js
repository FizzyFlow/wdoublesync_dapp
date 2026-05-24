import Log from 'shared/classes/Log.js';

/**
 * Class to communicate betweet windows with postMessage API. This same class works on both sides.
 */
export default class EditorCommunicator {
    constructor(params = {}) {
        this._targetWindow = params.targetWindow;
        this._targetOrigin = params.targetOrigin || "*";
        this._id = params.id;
        this._messageTarget = "cpu.so";
        this.__acceptMessagesFunction = this.acceptIncomingMessage.bind(this);
        this._pendingResponses = new Map();
        this._sentResponseIds = new Set();
        this._pingIntervalId = null;
        this._isConnected = false;
        this._onConnectionChange = null;

        this._debug = params.debug || false;

        this._messageHandlers = new Map();
        this.onMessage('ping', (payload, reply) => {
            reply({ status: 'pong' });
        });
    }

    destroy() {
        this.unsubscribeFromEventsFromTargetWindow();
        this.stopConnectionCheck();
    }

    debug(...args) {
        if (!this._debug) return;

        if (this._id) {
            args.unshift(`${this._id} |`);
        }
        Log.tag('EditorCommunicator').debug.apply(this, args);
    }

    /**
     * Generate a unique message ID using timestamp and random suffix
     */
    _generateMessageId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    async checkIfTargetWindowIsAvailable() {
        const response = await this.sendMessage('ping', {});
        // this.debug('Target window is available, ping response:', response);
    }

    /**
     * Start periodic connection check
     * @param {number} interval - Check interval in milliseconds (default: 1000)
     * @param {number} timeout - Ping timeout in milliseconds (default: 3000)
     */
    startConnectionCheck(interval = 1000, timeout = 3000) {
        this.stopConnectionCheck();

        this._pingIntervalId = setInterval(async () => {
            try {
                await this.sendMessage('ping', {}, timeout);
                this._setConnectionStatus(true);
            } catch (err) {
                // this.debug('Connection check failed:', err.message);
                this._setConnectionStatus(false);
            }
        }, interval);

        // Perform initial check immediately
        this.sendMessage('ping', {}, timeout)
            .then(() => this._setConnectionStatus(true))
            .catch(() => this._setConnectionStatus(false));
    }

    /**
     * Stop periodic connection check
     */
    stopConnectionCheck() {
        if (this._pingIntervalId) {
            clearInterval(this._pingIntervalId);
            this._pingIntervalId = null;
        }
    }

    /**
     * Set callback for connection status changes
     * @param {Function} callback - Called with (isConnected) when status changes
     */
    onConnectionChange(callback) {
        this._onConnectionChange = callback;
    }

    /**
     * Get current connection status
     * @returns {boolean}
     */
    isConnected() {
        return this._isConnected;
    }

    _setConnectionStatus(connected) {
        if (this._isConnected !== connected) {
            this._isConnected = connected;
            this.debug('Connection status changed:', connected);
            if (this._onConnectionChange) {
                this._onConnectionChange(connected);
            }
        }
    }

    /**
     * Send a message to the target window and wait for a response
     * @param {string} type - Message type
     * @param {*} payload - Message payload
     * @param {number} timeout - Timeout in milliseconds (default: 30000)
     * @returns {Promise} Resolves with the response payload
     */
    sendMessage(type, payload, timeout = 30000) {
        return new Promise((resolve, reject) => {
            const messageId = this._generateMessageId();

            const timeoutId = setTimeout(() => {
                this._pendingResponses.delete(messageId);
                reject(new Error(`Message timeout: ${type} (${messageId})`));
            }, timeout);

            this._pendingResponses.set(messageId, {
                resolve: (responsePayload) => {
                    clearTimeout(timeoutId);
                    this._pendingResponses.delete(messageId);
                    resolve(responsePayload);
                },
                reject: (error) => {
                    clearTimeout(timeoutId);
                    this._pendingResponses.delete(messageId);
                    reject(error);
                }
            });

            const message = {
                target: this._messageTarget,
                id: messageId,
                type,
                payload
            };

            if (type != 'ping') {
                this.debug('Sending message:', message);
            }
            this._targetWindow.postMessage(message, this._targetOrigin);
        });
    }

    /**
     * Register a handler for a specific message type
     * @param {string} type - Message type to handle
     * @param {Function} handler - Handler function that receives (payload, reply)
     */
    onMessage(type, handler) {
        this._messageHandlers.set(type, handler);
    }

    acceptIncomingMessage(event) {
        const message = event.data;

        if (!message || typeof message !== 'object') {
            return;
        }

        // Filter messages by target
        if (message.target !== this._messageTarget) {
            return;
        }

        if (message.type != 'ping' && (!message.payload || message.payload.status != 'pong')) {
            this.debug('Received message:', message);
        }

        // Check if this is a response to a pending message
        if (message.responseToId) {
            // Filter out responses we sent ourselves
            if (this._sentResponseIds.has(message.responseToId)) {
                this._sentResponseIds.delete(message.responseToId);
                return;
            }

            const pending = this._pendingResponses.get(message.responseToId);
            if (pending) {
                if (message.error) {
                    pending.reject(new Error(message.error));
                } else {
                    pending.resolve(message.payload);
                }
            }
            return;
        }

        // Handle incoming message with registered handler
        const handler = this._messageHandlers.get(message.type);
        if (handler) {
            const reply = (payload, error = null) => {
                const response = {
                    target: this._messageTarget,
                    responseToId: message.id,
                    payload,
                    error
                };
                this._sentResponseIds.add(message.id);

                if (message.type != 'ping') {
                    this.debug('Sending reply:', response);
                }

                this._targetWindow.postMessage(response, this._targetOrigin);
            };

            try {
                handler(message.payload, reply);
            } catch (err) {
                this.debug('Handler error:', err);
                reply(null, err.message);
            }
        }
    }

    subscribeToEventsFromTargetWindow() {
        window.addEventListener("message", this.__acceptMessagesFunction, false);
    }

    unsubscribeFromEventsFromTargetWindow() {
        window.removeEventListener("message", this.__acceptMessagesFunction, false);
    }
};