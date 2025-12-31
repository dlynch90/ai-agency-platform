// Temporal Workflows: Gibson CLI Integration
// Event-driven Gibson CLI lifecycle management

import { proxyActivities, workflowInfo, defineQuery, defineSignal, setHandler, condition } from '@temporalio/workflow';
import type * as activities from '../activities/gibson-activities';

// Proxy activities
const {
  checkGibsonHealth,
  loadGibsonConfig,
  authenticateGibson,
  startGibsonMcpServer,
  generateGibsonSchema,
  syncGibsonProject,
  registerGibsonEventListeners
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '15 minutes',
  retry: {
    initialInterval: '2s',
    backoffCoefficient: 1.5,
    maximumAttempts: 3,
  },
});

// Workflow Types
export interface GibsonActivationInput {
  projectId: string;
  services: string[];
  trigger: 'infrastructure-ready' | 'manual-activation' | 'project-creation';
}

export interface GibsonActivationOutput {
  activated: boolean;
  mcpEndpoint?: string;
  kafkaTopics?: string[];
  errorMessage?: string;
}

export interface GibsonRecoveryInput {
  projectId: string;
  failureReason: string;
  backupState?: any;
}

export interface GibsonRecoveryOutput {
  recovered: boolean;
  recoveryMethod: string;
  backupCreated?: string;
  errorMessage?: string;
}

export interface GibsonScalingInput {
  projectId: string;
  currentLoad: number;
  thresholds: { cpu: number; memory: number; requests: number };
  resources: { maxInstances: number; availableCapacity: number };
}

export interface GibsonScalingOutput {
  scaled: boolean;
  instancesAdded: number;
  newCapacity: number;
  errorMessage?: string;
}

// Signals
const cancelSignal = defineSignal('cancel');
const scaleSignal = defineSignal('scale');

// Queries
const getActivationStatusQuery = defineQuery<string>('getActivationStatus');
const getHealthStatusQuery = defineQuery<any>('getHealthStatus');

// Gibson CLI Activation Workflow
export async function gibsonActivationWorkflow(input: GibsonActivationInput): Promise<GibsonActivationOutput> {
  let status = 'initializing';
  let cancelled = false;
  let healthStatus: any = null;

  // Set up signal handlers
  setHandler(cancelSignal, () => {
    cancelled = true;
  });

  // Set up query handlers
  setHandler(getActivationStatusQuery, () => status);
  setHandler(getHealthStatusQuery, () => healthStatus);

  try {
    // Step 1: Check infrastructure readiness
    status = 'checking-infrastructure';
    const infraHealth = await checkGibsonHealth({
      projectId: input.projectId,
      timeoutSeconds: 30
    });

    if (!infraHealth.healthy) {
      throw new Error(`Infrastructure not ready: ${infraHealth.errorMessage}`);
    }

    // Check for cancellation
    if (cancelled) {
      status = 'cancelled';
      return { activated: false, errorMessage: 'Workflow cancelled' };
    }

    // Step 2: Load Gibson configuration
    status = 'loading-config';
    const configResult = await loadGibsonConfig({
      projectId: input.projectId
    });

    if (!configResult.loaded) {
      throw new Error(`Failed to load Gibson config: ${configResult.errorMessage}`);
    }

    // Step 3: Authenticate Gibson CLI
    status = 'authenticating';
    const authResult = await authenticateGibson({
      projectId: input.projectId
    });

    if (!authResult.authenticated) {
      throw new Error(`Gibson authentication failed: ${authResult.errorMessage}`);
    }

    // Step 4: Start MCP server
    status = 'starting-mcp-server';
    const mcpResult = await startGibsonMcpServer({
      projectId: input.projectId,
      port: 8000
    });

    if (!mcpResult.started) {
      throw new Error(`MCP server startup failed: ${mcpResult.errorMessage}`);
    }

    // Step 5: Register event listeners
    status = 'registering-event-listeners';
    const listenerResult = await registerGibsonEventListeners({
      projectId: input.projectId,
      kafkaBrokers: ['localhost:9092'],
      topics: ['gibson-events', 'project-events', 'ai-events']
    });

    if (!listenerResult.registered) {
      // Non-critical failure, log but continue
      console.warn(`Event listener registration failed: ${listenerResult.errorMessage}`);
    }

    // Step 6: Final health verification
    status = 'verifying-health';
    const finalHealth = await checkGibsonHealth({
      projectId: input.projectId,
      timeoutSeconds: 10
    });

    healthStatus = finalHealth;

    if (!finalHealth.healthy) {
      throw new Error(`Final health check failed: ${finalHealth.errorMessage}`);
    }

    status = 'completed';
    return {
      activated: true,
      mcpEndpoint: mcpResult.endpoint,
      kafkaTopics: ['gibson-events', 'project-events', 'ai-events']
    };

  } catch (error: any) {
    status = 'failed';
    console.error(`Gibson activation workflow failed: ${error.message}`);

    return {
      activated: false,
      errorMessage: error.message
    };
  }
}

// Gibson CLI Recovery Workflow
export async function gibsonRecoveryWorkflow(input: GibsonRecoveryInput): Promise<GibsonRecoveryOutput> {
  let recoveryMethod = 'unknown';

  try {
    // Step 1: Diagnose the failure
    console.log(`Diagnosing Gibson failure: ${input.failureReason}`);

    // Step 2: Check current health
    const currentHealth = await checkGibsonHealth({
      projectId: input.projectId,
      timeoutSeconds: 5
    });

    if (currentHealth.healthy) {
      // Already recovered
      return {
        recovered: true,
        recoveryMethod: 'already-healthy'
      };
    }

    // Step 3: Attempt graceful recovery
    recoveryMethod = 'graceful-recovery';
    console.log('Attempting graceful Gibson recovery...');

    // Kill any existing processes
    // Note: This would need to be implemented as an activity for production

    // Wait and check health again
    await new Promise(resolve => setTimeout(resolve, 10000));

    const postKillHealth = await checkGibsonHealth({
      projectId: input.projectId,
      timeoutSeconds: 10
    });

    if (postKillHealth.healthy) {
      return {
        recovered: true,
        recoveryMethod
      };
    }

    // Step 4: Force recovery - restart MCP server
    recoveryMethod = 'force-recovery';
    console.log('Attempting force Gibson recovery...');

    const mcpResult = await startGibsonMcpServer({
      projectId: input.projectId,
      port: 8000
    });

    if (mcpResult.started) {
      // Wait for full startup
      await new Promise(resolve => setTimeout(resolve, 5000));

      const finalHealth = await checkGibsonHealth({
        projectId: input.projectId,
        timeoutSeconds: 15
      });

      if (finalHealth.healthy) {
        return {
          recovered: true,
          recoveryMethod
        };
      }
    }

    // Step 5: Full system recovery
    recoveryMethod = 'system-recovery';
    console.log('Attempting full system Gibson recovery...');

    // Re-authenticate
    const authResult = await authenticateGibson({
      projectId: input.projectId
    });

    if (!authResult.authenticated) {
      throw new Error(`Re-authentication failed: ${authResult.errorMessage}`);
    }

    // Reload config
    const configResult = await loadGibsonConfig({
      projectId: input.projectId
    });

    if (!configResult.loaded) {
      throw new Error(`Config reload failed: ${configResult.errorMessage}`);
    }

    // Final attempt to start MCP server
    const finalMcpResult = await startGibsonMcpServer({
      projectId: input.projectId,
      port: 8000
    });

    if (finalMcpResult.started) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const finalHealth = await checkGibsonHealth({
        projectId: input.projectId,
        timeoutSeconds: 15
      });

      if (finalHealth.healthy) {
        return {
          recovered: true,
          recoveryMethod
        };
      }
    }

    // All recovery attempts failed
    return {
      recovered: false,
      recoveryMethod,
      errorMessage: 'All recovery attempts failed'
    };

  } catch (error: any) {
    return {
      recovered: false,
      recoveryMethod,
      errorMessage: error.message
    };
  }
}

// Gibson CLI Scaling Workflow
export async function gibsonScalingWorkflow(input: GibsonScalingInput): Promise<GibsonScalingOutput> {
  let scaledInstances = 0;

  try {
    console.log(`Analyzing Gibson scaling needs for project ${input.projectId}`);

    // Calculate required instances based on load
    const loadRatio = Math.max(
      input.currentLoad / input.thresholds.requests,
      0 // CPU and memory scaling would be calculated here
    );

    const requiredInstances = Math.min(
      Math.ceil(loadRatio),
      input.resources.maxInstances
    );

    if (requiredInstances <= 1) {
      // No scaling needed
      return {
        scaled: false,
        instancesAdded: 0,
        newCapacity: 1
      };
    }

    scaledInstances = requiredInstances - 1; // Subtract the existing instance

    console.log(`Scaling Gibson from 1 to ${requiredInstances} instances`);

    // In a real implementation, this would:
    // 1. Provision additional Gibson CLI instances
    // 2. Configure load balancing
    // 3. Redistribute workload
    // 4. Update service discovery

    // For now, simulate scaling
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(`Gibson scaling completed: ${scaledInstances} instances added`);

    return {
      scaled: true,
      instancesAdded: scaledInstances,
      newCapacity: requiredInstances
    };

  } catch (error: any) {
    return {
      scaled: false,
      instancesAdded: 0,
      newCapacity: 1,
      errorMessage: error.message
    };
  }
}