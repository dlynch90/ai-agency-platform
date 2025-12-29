#!/usr/bin/env node

/**
 * Cursor IDE Debug Instrumentation Script
 * Vendor-compliant instrumentation using Node.js built-ins
 */

import fs from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  logPath: process.env.CURSOR_DEBUG_LOG_PATH || path.join(process.cwd(), 'cursor_debug.log'),
  maxLogSize: parseInt(process.env.CURSOR_DEBUG_MAX_LOG_SIZE) || 10 * 1024 * 1024,
  logLevel: process.env.CURSOR_DEBUG_LOG_LEVEL || 'info',
  enablePerformance: process.env.CURSOR_DEBUG_PERFORMANCE === 'true',
  enableMemory: process.env.CURSOR_DEBUG_MEMORY === 'true',
  enableNetwork: process.env.CURSOR_DEBUG_NETWORK === 'true'
};

class CursorInstrumentation {
  constructor() {
    this.startTime = performance.now();
    this.metrics = { performance: {}, memory: {}, network: {}, errors: [] };
    this.logBuffer = [];
  }

  async init() {
    try {
      // CONSOLE_LOG_VIOLATION: console.log('Initializing Cursor instrumentation...');
      await fs.mkdir(path.dirname(CONFIG.logPath), { recursive: true });
      await this.rotateLogs();
      this.log('info', 'Cursor instrumentation initialized');
      // CONSOLE_LOG_VIOLATION: console.log(`Log path: ${CONFIG.logPath}`);
      // CONSOLE_LOG_VIOLATION: console.log(`Log level: ${CONFIG.logLevel}`);

      // Force immediate log flush
      await this.flushLogs();
      // CONSOLE_LOG_VIOLATION: console.log('Instrumentation initialized and logs flushed');

      process.on('uncaughtException', (error) => {
        this.log('error', 'Uncaught exception', { error: error.message, stack: error.stack });
      });

      process.on('unhandledRejection', (reason, promise) => {
        this.log('error', 'Unhandled rejection', { reason, promise });
      });

      if (CONFIG.enablePerformance) this.startPerformanceMonitoring();
      if (CONFIG.enableMemory) this.startMemoryMonitoring();
      if (CONFIG.enableNetwork) this.startNetworkMonitoring();

    } catch (error) {
      console.error('Failed to initialize Cursor instrumentation:', error);
    }
  }

  log(level, message, data = {}) {
    if (!this.shouldLog(level)) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level, message, data,
      pid: process.pid,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      uptime: process.uptime()
    };

    this.logBuffer.push(entry);

    if (level === 'error') {
      console.error(`[${entry.timestamp}] ${level.toUpperCase()}: ${message}`, data);
    }

    if (this.logBuffer.length >= 10) {
      this.flushLogs();
    }
  }

  shouldLog(level) {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(CONFIG.logLevel);
  }

  startPerformanceMonitoring() {
    setInterval(() => {
      const now = performance.now();
      this.metrics.performance = {
        uptime: now - this.startTime,
        eventLoopLag: performance.eventLoopUtilization().utilization,
        nodeUptime: process.uptime()
      };
      this.log('debug', 'Performance metrics', this.metrics.performance);
    }, 30000);
  }

  startMemoryMonitoring() {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.metrics.memory = {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external
      };
      this.log('debug', 'Memory metrics', this.metrics.memory);
    }, 60000);
  }

  startNetworkMonitoring() {
    setInterval(() => {
      this.metrics.network = {
        interfaces: Object.keys(os.networkInterfaces()).length,
        hostname: os.hostname(),
        platform: os.platform()
      };
      this.log('debug', 'Network metrics', this.metrics.network);
    }, 300000);
  }

  async flushLogs() {
    if (this.logBuffer.length === 0) return;
    try {
      const logData = this.logBuffer.map(entry => JSON.stringify(entry)).join('\n') + '\n';
      await fs.appendFile(CONFIG.logPath, logData);
      this.logBuffer = [];
    } catch (error) {
      console.error('Failed to flush logs:', error);
    }
  }

  async rotateLogs() {
    try {
      const stats = await fs.stat(CONFIG.logPath).catch(() => null);
      if (stats && stats.size > CONFIG.maxLogSize) {
        const backupPath = `${CONFIG.logPath}.${Date.now()}.bak`;
        await fs.rename(CONFIG.logPath, backupPath);
        this.log('info', `Rotated log file to ${backupPath}`);
      }
    } catch (error) {}
  }

  getMetrics() {
    return {
      ...this.metrics,
      process: {
        pid: process.pid,
        platform: process.platform,
        arch: process.arch,
        versions: process.versions,
        uptime: process.uptime()
      },
      system: {
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAverage: os.loadavg()
      }
    };
  }

  async shutdown() {
    this.log('info', 'Shutting down Cursor instrumentation');
    await this.flushLogs();
  }
}

const instrumentation = new CursorInstrumentation();
instrumentation.init().catch(console.error);

export default instrumentation;

process.on('SIGTERM', () => instrumentation.shutdown());
process.on('SIGINT', () => instrumentation.shutdown());
process.on('exit', () => instrumentation.shutdown());