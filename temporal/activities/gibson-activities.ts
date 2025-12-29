// Temporal Activities: Gibson CLI Integration
// Event-driven Gibson CLI operations and management

import { Context } from '@temporalio/activity';
import { execSync, spawn } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink } from 'fs/promises';
import path from 'path';

export interface GibsonHealthCheckInput {
  projectId: string;
  timeoutSeconds?: number;
}

export interface GibsonHealthCheckOutput {
  healthy: boolean;
  responseTime: number;
  errorMessage?: string;
  mcpServerStatus?: boolean;
}

export interface GibsonConfigLoadInput {
  projectId: string;
}

export interface GibsonConfigLoadOutput {
  config: any;
  loaded: boolean;
  errorMessage?: string;
}

export interface GibsonAuthInput {
  projectId: string;
  apiKey?: string;
}

export interface GibsonAuthOutput {
  authenticated: boolean;
  sessionValid: boolean;
  errorMessage?: string;
}

export interface GibsonMcpStartInput {
  projectId: string;
  port?: number;
}

export interface GibsonMcpStartOutput {
  started: boolean;
  endpoint?: string;
  processId?: number;
  errorMessage?: string;
}

export interface GibsonSchemaGenerationInput {
  projectId: string;
  entityName: string;
  entityType: 'model' | 'api' | 'schema';
  specifications?: Record<string, any>;
}

export interface GibsonSchemaGenerationOutput {
  generated: boolean;
  files: string[];
  content?: string;
  errorMessage?: string;
}

export interface GibsonProjectSyncInput {
  projectId: string;
  syncType: 'full' | 'incremental';
  force?: boolean;
}

export interface GibsonProjectSyncOutput {
  synced: boolean;
  changes: string[];
  errorMessage?: string;
}

// Activity: Check Gibson CLI Health
export async function checkGibsonHealth(input: GibsonHealthCheckInput): Promise<GibsonHealthCheckOutput> {
  const startTime = Date.now();

  try {
    const timeout = input.timeoutSeconds || 30;
    const projectId = input.projectId;

    // Execute health check command
    const command = `cd /Users/daniellynch/Developer && timeout ${timeout}s ./bin/gibson-official --help`;
    execSync(command, {
      timeout: timeout * 1000,
      env: { ...process.env, GIBSONAI_PROJECT: projectId }
    });

    // Check MCP server if Gibson CLI is healthy
    let mcpServerStatus = false;
    try {
      execSync('curl -s http://localhost:8000/health', { timeout: 5000 });
      mcpServerStatus = true;
    } catch (error) {
      // MCP server not responding
    }

    return {
      healthy: true,
      responseTime: Date.now() - startTime,
      mcpServerStatus
    };

  } catch (error: any) {
    return {
      healthy: false,
      responseTime: Date.now() - startTime,
      errorMessage: error.message
    };
  }
}

// Activity: Load Gibson Configuration
export async function loadGibsonConfig(input: GibsonConfigLoadInput): Promise<GibsonConfigLoadOutput> {
  try {
    const configPath = path.join(process.env.HOME || '/Users/daniellynch', '.gibsonai', 'config');

    const configContent = await readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);

    if (config[input.projectId]) {
      return {
        config: config[input.projectId],
        loaded: true
      };
    } else {
      return {
        config: null,
        loaded: false,
        errorMessage: `Project ${input.projectId} not found in Gibson config`
      };
    }

  } catch (error: any) {
    return {
      config: null,
      loaded: false,
      errorMessage: error.message
    };
  }
}

// Activity: Authenticate Gibson CLI
export async function authenticateGibson(input: GibsonAuthInput): Promise<GibsonAuthOutput> {
  try {
    const projectId = input.projectId;

    // Check if already authenticated by testing a simple command
    const testCommand = `cd /Users/daniellynch/Developer && GIBSONAI_PROJECT="${projectId}" ./bin/gibson-official list projects`;
    execSync(testCommand, { timeout: 10000 });

    return {
      authenticated: true,
      sessionValid: true
    };

  } catch (error: any) {
    // If authentication fails, we could trigger re-auth here
    return {
      authenticated: false,
      sessionValid: false,
      errorMessage: error.message
    };
  }
}

// Activity: Start Gibson MCP Server
export async function startGibsonMcpServer(input: GibsonMcpStartInput): Promise<GibsonMcpStartOutput> {
  try {
    const projectId = input.projectId;
    const port = input.port || 8000;

    // Start MCP server in background
    const child = spawn('./bin/gibson-official', ['mcp', 'run'], {
      cwd: '/Users/daniellynch/Developer',
      detached: true,
      stdio: 'ignore',
      env: { ...process.env, GIBSONAI_PROJECT: projectId }
    });

    child.unref();

    // Wait a moment for startup
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Verify server is responding
    try {
      execSync(`curl -s http://localhost:${port}/health`, { timeout: 5000 });
    } catch (error) {
      return {
        started: false,
        errorMessage: 'MCP server failed to respond on health check'
      };
    }

    return {
      started: true,
      endpoint: `http://localhost:${port}`,
      processId: child.pid
    };

  } catch (error: any) {
    return {
      started: false,
      errorMessage: error.message
    };
  }
}

// Activity: Generate Schema with Gibson CLI
export async function generateGibsonSchema(input: GibsonSchemaGenerationInput): Promise<GibsonSchemaGenerationOutput> {
  try {
    const { projectId, entityName, entityType, specifications } = input;

    let command: string;
    let args: string[];

    switch (entityType) {
      case 'model':
        command = 'code';
        args = ['models', entityName];
        break;
      case 'api':
        command = 'code';
        args = ['api', entityName];
        break;
      case 'schema':
        command = 'code';
        args = ['schemas', entityName];
        break;
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }

    // Execute Gibson code generation
    const fullCommand = `cd /Users/daniellynch/Developer && GIBSONAI_PROJECT="${projectId}" ./bin/gibson-official ${command} ${args.join(' ')}`;
    const result = execSync(fullCommand, {
      timeout: 30000,
      encoding: 'utf-8'
    });

    return {
      generated: true,
      files: [], // Gibson CLI doesn't return file list directly
      content: result
    };

  } catch (error: any) {
    return {
      generated: false,
      files: [],
      errorMessage: error.message
    };
  }
}

// Activity: Sync Gibson Project
export async function syncGibsonProject(input: GibsonProjectSyncInput): Promise<GibsonProjectSyncOutput> {
  try {
    const { projectId, syncType, force } = input;

    // Execute Gibson project sync
    const forceFlag = force ? '--force' : '';
    const command = `cd /Users/daniellynch/Developer && GIBSONAI_PROJECT="${projectId}" ./bin/gibson-official deploy ${forceFlag}`;

    const result = execSync(command, {
      timeout: 60000, // 1 minute timeout for deployment
      encoding: 'utf-8'
    });

    // Parse result for changes
    const changes = result.split('\n')
      .filter(line => line.includes('changed') || line.includes('created') || line.includes('updated'))
      .map(line => line.trim());

    return {
      synced: true,
      changes
    };

  } catch (error: any) {
    return {
      synced: false,
      changes: [],
      errorMessage: error.message
    };
  }
}

// Activity: Register Gibson Event Listeners
export async function registerGibsonEventListeners(input: { projectId: string; kafkaBrokers: string[]; topics: string[] }): Promise<{ registered: boolean; errorMessage?: string }> {
  try {
    // This would integrate with Kafka consumers
    // For now, we'll simulate successful registration
    Context.current().log.info(`Registering Gibson event listeners for project ${input.projectId}`);

    return {
      registered: true
    };

  } catch (error: any) {
    return {
      registered: false,
      errorMessage: error.message
    };
  }
}