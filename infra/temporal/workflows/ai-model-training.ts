// Temporal Workflow: AI Model Training
// Manages AI model training pipelines with checkpointing and monitoring

import {
  proxyActivities,
  workflowInfo,
  defineQuery,
  defineSignal,
  setHandler,
  condition,
  sleep,
  continueAsNew,
  ApplicationFailure,
} from '@temporalio/workflow';
import type * as activities from '../activities/ai-training-activities';

// Proxy activities with appropriate timeouts for ML workloads
const {
  validateDataset,
  prepareTrainingData,
  initializeModel,
  trainModelBatch,
  evaluateModel,
  saveCheckpoint,
  deployModel,
  notifyTrainingStatus,
  logMetricsToMLFlow,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 hours',
  heartbeatTimeout: '5 minutes',
  retry: {
    initialInterval: '10s',
    backoffCoefficient: 1.5,
    maximumAttempts: 3,
    nonRetryableErrorTypes: ['DatasetValidationError', 'ModelConfigurationError'],
  },
});

// Input/output types
export interface AIModelTrainingInput {
  modelId: string;
  projectId: string;
  datasetId: string;
  modelType: 'text-classification' | 'sentiment-analysis' | 'entity-extraction' | 'custom';
  hyperparameters: {
    learningRate: number;
    batchSize: number;
    epochs: number;
    optimizer: string;
    lossFunction: string;
  };
  checkpointFrequency: number;
  earlyStoppingPatience?: number;
  validationSplit?: number;
  agencyId: string;
  requestedBy: string;
}

export interface AIModelTrainingOutput {
  modelId: string;
  status: 'completed' | 'failed' | 'cancelled';
  finalMetrics: {
    accuracy: number;
    loss: number;
    f1Score?: number;
    precision?: number;
    recall?: number;
  };
  artifactPath: string;
  trainingDuration: number;
  deploymentUrl?: string;
}

export interface TrainingProgress {
  currentEpoch: number;
  totalEpochs: number;
  currentLoss: number;
  currentAccuracy: number;
  estimatedTimeRemaining: number;
  phase: string;
}

// Signals
export const pauseTrainingSignal = defineSignal('pauseTraining');
export const resumeTrainingSignal = defineSignal('resumeTraining');
export const cancelTrainingSignal = defineSignal('cancelTraining');
export const updateHyperparametersSignal = defineSignal<[{ learningRate?: number; batchSize?: number }]>('updateHyperparameters');

// Queries
export const getTrainingProgressQuery = defineQuery<TrainingProgress>('getTrainingProgress');
export const getTrainingStatusQuery = defineQuery<string>('getTrainingStatus');
export const getMetricsHistoryQuery = defineQuery<Array<{ epoch: number; loss: number; accuracy: number }>>('getMetricsHistory');

export async function aiModelTrainingWorkflow(input: AIModelTrainingInput): Promise<AIModelTrainingOutput> {
  const { workflowId, runId } = workflowInfo();
  const startTime = Date.now();

  // State management
  let status = 'initializing';
  let isPaused = false;
  let isCancelled = false;
  let currentEpoch = 0;
  let currentLoss = 0;
  let currentAccuracy = 0;
  let metricsHistory: Array<{ epoch: number; loss: number; accuracy: number }> = [];
  let hyperparameters = { ...input.hyperparameters };
  let checkpointPath: string | null = null;
  let bestAccuracy = 0;
  let epochsWithoutImprovement = 0;

  // Signal handlers
  setHandler(pauseTrainingSignal, () => {
    isPaused = true;
    status = 'paused';
  });

  setHandler(resumeTrainingSignal, () => {
    isPaused = false;
    status = 'training';
  });

  setHandler(cancelTrainingSignal, () => {
    isCancelled = true;
    status = 'cancelling';
  });

  setHandler(updateHyperparametersSignal, (updates) => {
    if (updates.learningRate !== undefined) {
      hyperparameters.learningRate = updates.learningRate;
    }
    if (updates.batchSize !== undefined) {
      hyperparameters.batchSize = updates.batchSize;
    }
  });

  // Query handlers
  setHandler(getTrainingProgressQuery, () => ({
    currentEpoch,
    totalEpochs: hyperparameters.epochs,
    currentLoss,
    currentAccuracy,
    estimatedTimeRemaining: calculateEstimatedTime(currentEpoch, hyperparameters.epochs, startTime),
    phase: status,
  }));

  setHandler(getTrainingStatusQuery, () => status);
  setHandler(getMetricsHistoryQuery, () => metricsHistory);

  try {
    // Phase 1: Dataset Validation
    status = 'validating_dataset';
    await notifyTrainingStatus({
      modelId: input.modelId,
      status: 'validating_dataset',
      message: 'Validating training dataset...',
    });

    const datasetInfo = await validateDataset({
      datasetId: input.datasetId,
      projectId: input.projectId,
      modelType: input.modelType,
    });

    if (!datasetInfo.isValid) {
      throw ApplicationFailure.create({
        type: 'DatasetValidationError',
        message: `Dataset validation failed: ${datasetInfo.errors.join(', ')}`,
      });
    }

    // Phase 2: Data Preparation
    status = 'preparing_data';
    await notifyTrainingStatus({
      modelId: input.modelId,
      status: 'preparing_data',
      message: 'Preparing training data...',
    });

    const preparedData = await prepareTrainingData({
      datasetId: input.datasetId,
      validationSplit: input.validationSplit || 0.2,
      modelType: input.modelType,
    });

    // Phase 3: Model Initialization
    status = 'initializing_model';
    await notifyTrainingStatus({
      modelId: input.modelId,
      status: 'initializing_model',
      message: 'Initializing model architecture...',
    });

    const modelConfig = await initializeModel({
      modelId: input.modelId,
      modelType: input.modelType,
      hyperparameters,
      inputShape: preparedData.inputShape,
      outputClasses: preparedData.outputClasses,
    });

    // Phase 4: Training Loop
    status = 'training';
    await notifyTrainingStatus({
      modelId: input.modelId,
      status: 'training',
      message: `Starting training for ${hyperparameters.epochs} epochs...`,
    });

    for (let epoch = 1; epoch <= hyperparameters.epochs; epoch++) {
      // Check for cancellation
      if (isCancelled) {
        status = 'cancelled';
        await notifyTrainingStatus({
          modelId: input.modelId,
          status: 'cancelled',
          message: 'Training cancelled by user',
        });

        return {
          modelId: input.modelId,
          status: 'cancelled',
          finalMetrics: {
            accuracy: currentAccuracy,
            loss: currentLoss,
          },
          artifactPath: checkpointPath || '',
          trainingDuration: Date.now() - startTime,
        };
      }

      // Handle pause
      while (isPaused) {
        await sleep('30 seconds');
        if (isCancelled) break;
      }

      currentEpoch = epoch;

      // Train one epoch
      const epochResult = await trainModelBatch({
        modelId: input.modelId,
        epoch,
        hyperparameters,
        trainingData: preparedData.trainingPath,
      });

      currentLoss = epochResult.loss;
      currentAccuracy = epochResult.accuracy;

      // Record metrics
      metricsHistory.push({
        epoch,
        loss: epochResult.loss,
        accuracy: epochResult.accuracy,
      });

      // Log to MLFlow
      await logMetricsToMLFlow({
        runId: input.modelId,
        epoch,
        metrics: {
          loss: epochResult.loss,
          accuracy: epochResult.accuracy,
          learningRate: hyperparameters.learningRate,
        },
      });

      // Save checkpoint
      if (epoch % input.checkpointFrequency === 0) {
        checkpointPath = await saveCheckpoint({
          modelId: input.modelId,
          epoch,
          metrics: { loss: currentLoss, accuracy: currentAccuracy },
        });
      }

      // Early stopping check
      if (epochResult.accuracy > bestAccuracy) {
        bestAccuracy = epochResult.accuracy;
        epochsWithoutImprovement = 0;
      } else {
        epochsWithoutImprovement++;
      }

      if (input.earlyStoppingPatience && epochsWithoutImprovement >= input.earlyStoppingPatience) {
        await notifyTrainingStatus({
          modelId: input.modelId,
          status: 'early_stopping',
          message: `Early stopping triggered at epoch ${epoch}`,
        });
        break;
      }

      // Long-running workflow protection - continue as new every 100 epochs
      if (epoch > 0 && epoch % 100 === 0 && epoch < hyperparameters.epochs) {
        await continueAsNew<typeof aiModelTrainingWorkflow>({
          ...input,
          hyperparameters: {
            ...hyperparameters,
            epochs: hyperparameters.epochs - epoch,
          },
        });
      }
    }

    // Phase 5: Model Evaluation
    status = 'evaluating';
    await notifyTrainingStatus({
      modelId: input.modelId,
      status: 'evaluating',
      message: 'Evaluating model on validation set...',
    });

    const evaluationResults = await evaluateModel({
      modelId: input.modelId,
      validationData: preparedData.validationPath,
    });

    // Phase 6: Model Deployment
    status = 'deploying';
    await notifyTrainingStatus({
      modelId: input.modelId,
      status: 'deploying',
      message: 'Deploying trained model...',
    });

    const deployment = await deployModel({
      modelId: input.modelId,
      projectId: input.projectId,
      agencyId: input.agencyId,
      modelType: input.modelType,
      metrics: evaluationResults,
    });

    // Complete
    status = 'completed';
    await notifyTrainingStatus({
      modelId: input.modelId,
      status: 'completed',
      message: `Training completed. Final accuracy: ${(evaluationResults.accuracy * 100).toFixed(2)}%`,
    });

    return {
      modelId: input.modelId,
      status: 'completed',
      finalMetrics: {
        accuracy: evaluationResults.accuracy,
        loss: evaluationResults.loss,
        f1Score: evaluationResults.f1Score,
        precision: evaluationResults.precision,
        recall: evaluationResults.recall,
      },
      artifactPath: deployment.artifactPath,
      trainingDuration: Date.now() - startTime,
      deploymentUrl: deployment.url,
    };

  } catch (error) {
    status = 'failed';
    await notifyTrainingStatus({
      modelId: input.modelId,
      status: 'failed',
      message: `Training failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });

    throw error;
  }
}

function calculateEstimatedTime(currentEpoch: number, totalEpochs: number, startTime: number): number {
  if (currentEpoch === 0) return 0;
  const elapsed = Date.now() - startTime;
  const avgTimePerEpoch = elapsed / currentEpoch;
  const remainingEpochs = totalEpochs - currentEpoch;
  return avgTimePerEpoch * remainingEpochs;
}
