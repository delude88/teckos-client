class SocketEventEmitter {
    maxListeners = 50;
    handlers = {};
    addListener = (event, listener) => {
        if (Object.keys(this.handlers).length === this.maxListeners) {
            throw new Error('Max listeners reached');
        }
        if (typeof listener !== 'function') {
            throw new Error('The given listener is not a function');
        }
        this.handlers[event] = this.handlers[event] || [];
        this.handlers[event].push(listener);
        return this;
    };
    once = (event, listener) => {
        if (Object.keys(this.handlers).length === this.maxListeners) {
            throw new Error('Max listeners reached');
        }
        if (typeof listener !== 'function') {
            throw new Error('The given listener is not a function');
        }
        this.handlers[event] = this.handlers[event] || [];
        const onceWrapper = () => {
            listener();
            this.off(event, onceWrapper);
        };
        this.handlers[event].push(onceWrapper);
        return this;
    };
    removeListener = (event, listener) => {
        if (this.handlers[event]) {
            this.handlers[event] = this.handlers[event].filter((handler) => handler !== listener);
        }
        return this;
    };
    off = (event, listener) => this.removeListener(event, listener);
    removeAllListeners = (event) => {
        if (event) {
            delete this.handlers[event];
        }
        else {
            this.handlers = {};
        }
        return this;
    };
    setMaxListeners = (n) => {
        this.maxListeners = n;
        return this;
    };
    getMaxListeners = () => this.maxListeners;
    listeners = (event) => {
        if (this.handlers[event]) {
            return [...this.handlers[event]];
        }
        return [];
    };
    rawListeners = (event) => [...this.handlers[event]];
    listenerCount = (event) => {
        if (this.handlers[event]) {
            return Object.keys(this.handlers[event]).length;
        }
        return 0;
    };
    prependListener = (event, listener) => {
        if (Object.keys(this.handlers).length === this.maxListeners) {
            throw new Error('Max listeners reached');
        }
        this.handlers[event] = this.handlers[event] || [];
        this.handlers[event].unshift(listener);
        return this;
    };
    prependOnceListener = (event, listener) => {
        if (Object.keys(this.handlers).length === this.maxListeners) {
            throw new Error('Max listeners reached');
        }
        this.handlers[event] = this.handlers[event] || [];
        const onceWrapper = () => {
            listener();
            this.off(event, onceWrapper);
        };
        this.handlers[event].unshift(onceWrapper);
        return this;
    };
    eventNames = () => Object.keys(this.handlers);
    on = (event, listener) => this.addListener(event, listener);
    emit = (event, ...args) => {
        const listeners = this.listeners(event);
        if (listeners.length > 0) {
            listeners.forEach((listener) => {
                if (listener)
                    listener(args);
            });
            return true;
        }
        return false;
    };
}
export { SocketEventEmitter };
//# sourceMappingURL=SocketEventEmitter.js.map