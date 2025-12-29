/**
 * CommonJS Setup for MCP Servers
 * Ensures compatibility between CommonJS MCP packages and ES module environment
 */

// Make process available globally for CommonJS modules
if (typeof global !== 'undefined') {
    global.process = process;
}

// Ensure globalThis is available
if (typeof globalThis === 'undefined') {
    global.globalThis = global;
}

// CommonJS compatibility helpers
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
    try {
        return originalRequire.apply(this, arguments);
    } catch (error) {
        // Handle ES module imports in CommonJS context
        if (error.code === 'ERR_REQUIRE_ESM') {
            console.warn(`ES module detected for ${id}, attempting dynamic import...`);
            // For ES modules, we'll let the error bubble up
            // The calling code should handle this appropriately
        }
        throw error;
    }
};

// Export for use in other modules
module.exports = {
    setupComplete: true,
    version: '1.0.0'
};