#!/usr/bin/env node

const { spawn } = require('child_process');
const v8 = require('v8');

const CONFIG = {
  MAX_FILES: parseInt(process.env.MAX_FILES) || 500,
  TIMEOUT_MS: parseInt(process.env.TIMEOUT_MS) || 30000,
  MAX_MEMORY_MB: parseInt(process.env.MAX_MEMORY_MB) || 4096,
  MAX_CONCURRENT_PROCESSES: parseInt(process.env.MAX_CONCURRENT) || 5,
  HEALTH_CHECK_INTERVAL_MS: 5000,
  
  EXCLUDED_DIRS: [
    'node_modules',
    '.pixi',
    'pixi-ros2',
    'pixi-node',
    'pixi-universe',
    'venv311',
    'venv',
    '.venv',
    '__pycache__',
    '.pytest_cache',
    'target',
    'dist',
    'build',
    '.git',
    '.turbo',
    'coverage',
    '.next',
    '.nuxt'
  ],
  
  EXCLUDED_EXTENSIONS: [
    '.dylib',
    '.so',
    '.jar',
    '.whl',
    '.h5',
    '.pb',
    '.onnx',
    '.sqlite',
    '.db'
  ]
};

class ResourceLimiter {
  constructor(options = {}) {
    this.config = { ...CONFIG, ...options };
    this.activeProcesses = new Map();
    this.fileCount = 0;
    this.startTime = Date.now();
    this.memoryWarningIssued = false;
  }

  shouldExcludeDir(dirName) {
    return this.config.EXCLUDED_DIRS.some(excluded => 
      dirName === excluded || dirName.includes(excluded)
    );
  }

  shouldExcludeFile(fileName) {
    return this.config.EXCLUDED_EXTENSIONS.some(ext => 
      fileName.endsWith(ext)
    );
  }

  checkFileLimit() {
    this.fileCount++;
    if (this.fileCount > this.config.MAX_FILES) {
      throw new Error(`File limit exceeded: ${this.fileCount} > ${this.config.MAX_FILES}`);
    }
    return true;
  }

  checkMemory() {
    const heapStats = v8.getHeapStatistics();
    const usedMB = heapStats.used_heap_size / (1024 * 1024);
    const limitMB = this.config.MAX_MEMORY_MB;
    
    if (usedMB > limitMB * 0.9 && !this.memoryWarningIssued) {
      console.warn(`[ResourceLimiter] Memory warning: ${usedMB.toFixed(0)}MB / ${limitMB}MB (90%)`);
      this.memoryWarningIssued = true;
    }
    
    if (usedMB > limitMB) {
      throw new Error(`Memory limit exceeded: ${usedMB.toFixed(0)}MB > ${limitMB}MB`);
    }
    
    return { usedMB, limitMB, percentage: (usedMB / limitMB * 100).toFixed(1) };
  }

  checkTimeout() {
    const elapsed = Date.now() - this.startTime;
    if (elapsed > this.config.TIMEOUT_MS) {
      throw new Error(`Timeout exceeded: ${elapsed}ms > ${this.config.TIMEOUT_MS}ms`);
    }
    return elapsed;
  }

  async runWithTimeout(asyncFn, timeoutMs = this.config.TIMEOUT_MS) {
    return Promise.race([
      asyncFn(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  async trackProcess(id, process) {
    if (this.activeProcesses.size >= this.config.MAX_CONCURRENT_PROCESSES) {
      throw new Error(`Concurrent process limit reached: ${this.config.MAX_CONCURRENT_PROCESSES}`);
    }
    
    this.activeProcesses.set(id, {
      process,
      startTime: Date.now()
    });
    
    return () => this.activeProcesses.delete(id);
  }

  killAllProcesses() {
    for (const [id, { process }] of this.activeProcesses) {
      try {
        process.kill('SIGTERM');
        console.log(`[ResourceLimiter] Killed process: ${id}`);
      } catch (e) {
        console.error(`[ResourceLimiter] Failed to kill process ${id}:`, e.message);
      }
    }
    this.activeProcesses.clear();
  }

  getStats() {
    const memStats = this.checkMemory();
    return {
      filesProcessed: this.fileCount,
      maxFiles: this.config.MAX_FILES,
      memoryUsed: `${memStats.usedMB.toFixed(0)}MB`,
      memoryLimit: `${memStats.limitMB}MB`,
      memoryPercentage: `${memStats.percentage}%`,
      elapsedMs: Date.now() - this.startTime,
      timeoutMs: this.config.TIMEOUT_MS,
      activeProcesses: this.activeProcesses.size,
      maxProcesses: this.config.MAX_CONCURRENT_PROCESSES
    };
  }

  startHealthCheck() {
    this.healthCheckInterval = setInterval(() => {
      try {
        const stats = this.getStats();
        console.log(`[HealthCheck] Files: ${stats.filesProcessed}/${stats.maxFiles}, Memory: ${stats.memoryPercentage}, Processes: ${stats.activeProcesses}/${stats.maxProcesses}`);
      } catch (e) {
        console.error(`[HealthCheck] Error:`, e.message);
        this.killAllProcesses();
        process.exit(1);
      }
    }, this.config.HEALTH_CHECK_INTERVAL_MS);
  }

  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}

function withResourceLimits(fn, options = {}) {
  const limiter = new ResourceLimiter(options);
  
  return async (...args) => {
    limiter.startHealthCheck();
    
    try {
      const result = await limiter.runWithTimeout(
        () => fn(limiter, ...args),
        limiter.config.TIMEOUT_MS
      );
      return result;
    } finally {
      limiter.stopHealthCheck();
      limiter.killAllProcesses();
      console.log('[ResourceLimiter] Final stats:', limiter.getStats());
    }
  };
}

module.exports = {
  ResourceLimiter,
  withResourceLimits,
  CONFIG
};

if (require.main === module) {
  console.log('Resource Limiter Configuration:');
  console.log(JSON.stringify(CONFIG, null, 2));
  
  const limiter = new ResourceLimiter();
  console.log('\nCurrent Stats:');
  console.log(JSON.stringify(limiter.getStats(), null, 2));
}
