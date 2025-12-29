// Temporal Activities: Project Management
// Vendor-compliant activity implementations

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { Client as PostHog } from 'posthog-node';
import * as Sentry from '@sentry/node';
import { Redis } from 'ioredis';

const prisma = new PrismaClient();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
const posthog = new PostHog(process.env.POSTHOG_KEY!);
const redis = new Redis(process.env.REDIS_URL!);

// Activity: Create project record
export async function createProjectRecord(input: {
  projectId: string;
  name: string;
  description?: string;
  agencyId: string;
  clientId: string;
  createdBy: string;
  budget?: number;
  deadline?: Date;
}): Promise<boolean> {
  try {
    // Create project in database
    await prisma.project.create({
      data: {
        id: input.projectId,
        name: input.name,
        description: input.description,
        agencyId: input.agencyId,
        clientId: input.clientId,
        budget: input.budget,
        deadline: input.deadline,
        status: 'PLANNING',
        createdBy: input.createdBy,
      },
    });

    // Track event in PostHog
    posthog.capture({
      distinctId: input.createdBy,
      event: 'project_created',
      properties: {
        projectId: input.projectId,
        agencyId: input.agencyId,
        budget: input.budget,
      },
    });

    // Cache project info
    await redis.setex(
      `project:${input.projectId}`,
      3600,
      JSON.stringify({
        id: input.projectId,
        name: input.name,
        agencyId: input.agencyId,
        status: 'PLANNING',
      })
    );

    return true;
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}

// Activity: Set up project database
export async function setupProjectDatabase(input: {
  projectId: string;
  agencyId: string;
}): Promise<boolean> {
  try {
    // Create project-specific database schema
    await prisma.$executeRaw`
      CREATE SCHEMA IF NOT EXISTS ${Prisma.raw(`project_${input.projectId.replace(/-/g, '_')}`)}
    `;

    // Create Supabase storage bucket for project
    const { data, error } = await supabase.storage.createBucket(
      `project-${input.projectId}`,
      {
        public: false,
        allowedMimeTypes: ['image/*', 'application/json', 'text/*'],
        fileSizeLimit: 10485760, // 10MB
      }
    );

    if (error && !error.message.includes('already exists')) {
      throw error;
    }

    return true;
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}

// Activity: Initialize AI models
export async function initializeAIModels(input: {
  projectId: string;
  modelTypes: string[];
}): Promise<boolean> {
  try {
    // Initialize AI models for project
    const models = input.modelTypes.map(modelType => ({
      id: `${input.projectId}-${modelType}-${Date.now()}`,
      projectId: input.projectId,
      name: `${modelType} Model`,
      modelType,
      status: 'INITIALIZING',
      framework: 'huggingface',
    }));

    await prisma.aIModel.createMany({
      data: models,
    });

    // Trigger model training workflows
    // This would integrate with Hugging Face or other ML platforms

    return true;
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}

// Activity: Create project workspace
export async function createProjectWorkspace(input: {
  projectId: string;
  agencyId: string;
}): Promise<boolean> {
  try {
    // Create workspace structure in storage
    const workspaceStructure = {
      datasets: [],
      models: [],
      reports: [],
      configs: {},
    };

    await supabase.storage
      .from(`project-${input.projectId}`)
      .upload('workspace.json', JSON.stringify(workspaceStructure));

    return true;
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}

// Activity: Set up monitoring
export async function setupMonitoring(input: {
  projectId: string;
  metrics: string[];
}): Promise<void> {
  try {
    // Set up monitoring dashboards and alerts
    // This would integrate with vendor monitoring solutions

    // Create metric collection configuration
    const monitoringConfig = {
      projectId: input.projectId,
      metrics: input.metrics,
      enabled: true,
      lastUpdated: new Date(),
    };

    await redis.set(
      `monitoring:${input.projectId}`,
      JSON.stringify(monitoringConfig)
    );

  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}

// Activity: Send project notifications
export async function sendProjectNotifications(input: {
  projectId: string;
  agencyId: string;
  clientId: string;
  createdBy: string;
  failure?: boolean;
  error?: string;
}): Promise<boolean> {
  try {
    // Get project details
    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
      include: {
        agency: true,
        client: true,
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Send notifications via vendor services
    const notification = {
      type: input.failure ? 'PROJECT_CREATION_FAILED' : 'PROJECT_CREATED',
      title: input.failure ? 'Project Creation Failed' : 'New Project Created',
      message: input.failure
        ? `Failed to create project "${project.name}": ${input.error}`
        : `Project "${project.name}" has been created successfully`,
      data: {
        projectId: input.projectId,
        projectName: project.name,
        agencyId: input.agencyId,
        clientId: input.clientId,
      },
    };

    // Send to agency members
    const agencyMembers = await prisma.agencyMember.findMany({
      where: { agencyId: input.agencyId },
      include: { user: true },
    });

    for (const member of agencyMembers) {
      await prisma.notification.create({
        data: {
          userId: member.userId,
          type: notification.type as any,
          title: notification.title,
          message: notification.message,
          data: notification.data,
        },
      });
    }

    // Send to client
    await prisma.notification.create({
      data: {
        userId: input.clientId,
        type: notification.type as any,
        title: notification.title,
        message: notification.message,
        data: notification.data,
      },
    });

    return true;
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}