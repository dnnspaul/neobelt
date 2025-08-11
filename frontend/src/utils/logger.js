// Centralized logging utility that routes JavaScript logs through Go's logging system

// Global reference to the app
let app;
let debugModeCache = true; // Default to true, will be updated after init
let debugModeCacheTime = 0;
const DEBUG_MODE_CACHE_TTL = 5000; // Cache for 5 seconds

// Initialize logger with app reference
export function initLogger(appInstance) {
    app = appInstance;
    // Initially update debug mode cache
    updateDebugModeCache();
    // Update debug mode cache periodically
    setInterval(updateDebugModeCache, DEBUG_MODE_CACHE_TTL);
}

// Force update debug mode cache (useful when settings change)
export function updateDebugMode() {
    updateDebugModeCache();
}

// Update the cached debug mode status
async function updateDebugModeCache() {
    if (app && app.JSGetDebugMode) {
        try {
            debugModeCache = await app.JSGetDebugMode();
            debugModeCacheTime = Date.now();
        } catch (error) {
            // If we can't get debug mode, default to enabled to avoid losing messages
            debugModeCache = true;
        }
    }
}

// Logging functions that route through Go's centralized logging system
export const logger = {
    info: (message, ...args) => {
        const logMessage = args.length > 0 ? `${message} ${args.join(' ')}` : message;
        if (app && app.JSLogInfo) {
            app.JSLogInfo(logMessage);
        } else {
            // Fallback to console if app not available
            console.log(`[INFO] ${logMessage}`);
        }
    },

    error: (message, ...args) => {
        const logMessage = args.length > 0 ? `${message} ${args.join(' ')}` : message;
        if (app && app.JSLogError) {
            app.JSLogError(logMessage);
        } else {
            // Fallback to console if app not available
            console.error(`[ERROR] ${logMessage}`);
        }
    },

    debug: (message, ...args) => {
        // Check if debug mode is enabled before logging
        if (!debugModeCache) {
            return; // Don't log debug messages when debug mode is disabled
        }
        
        const logMessage = args.length > 0 ? `${message} ${args.join(' ')}` : message;
        if (app && app.JSLogDebug) {
            app.JSLogDebug(logMessage);
        } else {
            // Fallback to console if app not available
            console.log(`[DEBUG] ${logMessage}`);
        }
    },

    warning: (message, ...args) => {
        const logMessage = args.length > 0 ? `${message} ${args.join(' ')}` : message;
        if (app && app.JSLogWarning) {
            app.JSLogWarning(logMessage);
        } else {
            // Fallback to console if app not available
            console.warn(`[WARNING] ${logMessage}`);
        }
    },

    // Alias for backward compatibility
    warn: function(message, ...args) {
        this.warning(message, ...args);
    },

    log: function(message, ...args) {
        this.info(message, ...args);
    }
};