// Temporal Workflow: Project Creation
// Event-driven project setup and initialization

import { proxyActivities, workflowInfo, defineQuery, defineSignal, setHandler, condition } from '@temporalio/workflow';
import type * as activities from '../activities/project-activities';

// Proxy activities
const {
  createProjectRecord,
  setupProjectDatabase,
  initializeAIModels,
  sendProjectNotifications,
  setupMonitoring,
  createProjectWorkspace
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '15 minutes',
  retry: {
    initialInterval: '2s',
    backoffCoefficient: 1.5,
    maximumAttempts: 3,
  },
});

// Workflow input/output types
export interface ProjectCreationInput {
  projectId: string;
  name: string;
  description?: string;
  agencyId: string;
  clientId: string;
  createdBy: string;
  budget?: number;
  deadline?: Date;
}

export interface ProjectCreationOutput {
  projectId: string;
  status: 'completed' | 'failed';
  databaseSetup: boolean;
  aiModelsInitialized: boolean;
  workspaceCreated: boolean;
  notificationsSent: boolean;
}

// Workflow signals
const approveSignal = defineSignal('approve');
const rejectSignal = defineSignal('reject');

// Workflow queries
const getStatusQuery = defineQuery<string>('getStatus');
const getProgressQuery = defineQuery<number>('getProgress');

export async function projectCreationWorkflow(input: ProjectCreationInput): Promise<ProjectCreationOutput> {
  const { workflowId } = workflowInfo();

  let status = 'initializing';
  let progress = 0;
  let approved = false;
  let rejected = false;

  // Set up signal handlers
  setHandler(approveSignal, () => {
    approved = true;
  });

  setHandler(rejectSignal, () => {
    rejected = true;
  });

  // Set up query handlers
  setHandler(getStatusQuery, () => status);
  setHandler(getProgressQuery, () => progress);

  try {
    // Step 1: Create project record
    status = 'creating_project_record';
    progress = 10;

    await createProjectRecord({
      projectId: input.projectId,
      name: input.name,
      description: input.description,
      agencyId: input.agencyId,
      clientId: input.clientId,
      createdBy: input.createdBy,
      budget: input.budget,
      deadline: input.deadline,
    });

    // Step 2: Wait for approval if required
    status = 'awaiting_approval';
    progress = 20;

    if (input.budget && input.budget > 50000) {
      // High-budget projects require approval
      await condition(() => approved || rejected);

      if (rejected) {
        throw new Error('Project creation rejected');
      }
    }

    // Step 3: Set up project database
    status = 'setting_up_database';
    progress = 40;

    const databaseSetup = await setupProjectDatabase({
      projectId: input.projectId,
      agencyId: input.agencyId,
    });

    // Step 4: Initialize AI models
    status = 'initializing_ai_models';
    progress = 60;

    const aiModelsInitialized = await initializeAIModels({
      projectId: input.projectId,
      modelTypes: ['text-classification', 'sentiment-analysis'],
    });

    // Step 5: Create project workspace
    status = 'creating_workspace';
    progress = 80;

    const workspaceCreated = await createProjectWorkspace({
      projectId: input.projectId,
      agencyId: input.agencyId,
    });

    // Step 6: Set up monitoring
    await setupMonitoring({
      projectId: input.projectId,
      metrics: ['performance', 'usage', 'errors'],
    });

    // Step 7: Send notifications
    status = 'sending_notifications';
    progress = 90;

    const notificationsSent = await sendProjectNotifications({
      projectId: input.projectId,
      agencyId: input.agencyId,
      clientId: input.clientId,
      createdBy: input.createdBy,
    });

    // Complete
    status = 'completed';
    progress = 100;

    return {
      projectId: input.projectId,
      status: 'completed',
      databaseSetup,
      aiModelsInitialized,
      workspaceCreated,
      notificationsSent,
    };

  } catch (error) {
    status = 'failed';
    console.error(`Project creation workflow failed: ${error.message}`);

    // Send failure notifications
    await sendProjectNotifications({
      projectId: input.projectId,
      agencyId: input.agencyId,
      clientId: input.clientId,
      createdBy: input.createdBy,
      failure: true,
      error: error.message,
    });

    throw error;
  }
}