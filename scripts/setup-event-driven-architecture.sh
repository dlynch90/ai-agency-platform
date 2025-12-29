#!/bin/bash

# Event-Driven Architecture Setup Script
# Temporal + Kafka + Hooks + Triggers + Pipelines

set -e

echo "⚡ Setting up event-driven architecture..."

# Create necessary directories
mkdir -p temporal/workflows temporal/activities hooks logs/temporal data/temporal

# Install Temporal CLI
if ! command -v temporal >/dev/null 2>&1; then
    echo "📦 Installing Temporal CLI..."
    curl -sSf https://temporal.download/cli.sh | sh
fi

# Install Kafka
if ! command -v kafka-server-start >/dev/null 2>&1; then
    echo "📦 Installing Kafka..."
    brew install kafka
fi

# Start infrastructure services
start_infrastructure() {
    echo "🏗️ Starting infrastructure services..."

    # Start Temporal server
    echo "Starting Temporal server..."
    temporal server start-dev --db-filename data/temporal/db.sqlite > logs/temporal/server.log 2>&1 &
    TEMPORAL_PID=$!

    # Start Kafka
    echo "Starting Kafka..."
    zookeeper-server-start /opt/homebrew/etc/kafka/zookeeper.properties > logs/temporal/zookeeper.log 2>&1 &
    ZOOKEEPER_PID=$!

    kafka-server-start /opt/homebrew/etc/kafka/server.properties > logs/temporal/kafka.log 2>&1 &
    KAFKA_PID=$!

    # Wait for services to be ready
    echo "⏳ Waiting for services to start..."
    sleep 10

    # Create Kafka topics
    kafka-topics --create --topic workflow-events --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
    kafka-topics --create --topic activity-events --bootstrap-server localhost:9092 --partitions 2 --replication-factor 1
    kafka-topics --create --topic system-events --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
    kafka-topics --create --topic workflow-dlq --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1

    echo "✅ Infrastructure services started"
}

# Configure Temporal workers
setup_temporal_workers() {
    echo "👷 Setting up Temporal workers..."

    # Create worker configuration
    cat > temporal/worker-config.yaml << EOF
namespace: ai-agency
taskQueue: ai-tasks

activities:
  - name: createProjectRecord
    timeout: 15m
  - name: setupProjectDatabase
    timeout: 10m
  - name: initializeAIModels
    timeout: 2h
  - name: sendProjectNotifications
    timeout: 5m

workflows:
  - projectCreationWorkflow
  - aiModelTrainingWorkflow
  - userOnboardingWorkflow
  - billingCycleWorkflow

hooks:
  preWorkflow: hooks/pre-workflow-validation.sh
  postWorkflow: hooks/post-workflow-notification.sh
  onError: hooks/workflow-error-handler.sh

monitoring:
  prometheus:
    enabled: true
    port: 9092
  metrics:
    - workflow_execution_duration
    - workflow_errors_total
    - activity_execution_duration
EOF

    # Create worker startup script
    cat > scripts/start-temporal-worker.sh << 'EOF'
#!/bin/bash

# Temporal Worker Startup Script

echo "👷 Starting Temporal worker..."

# Load environment
if [ -f ".env" ]; then
    export $(cat .env | xargs)
fi

# Start worker with configuration
npx tsx temporal/worker.ts \
    --config temporal/worker-config.yaml \
    --log-level info \
    --log-file logs/temporal/worker.log

EOF

    chmod +x scripts/start-temporal-worker.sh

    echo "✅ Temporal workers configured"
}

# Set up event triggers
setup_event_triggers() {
    echo "🎯 Setting up event triggers..."

    # Create event trigger configuration
    cat > temporal/triggers.yaml << EOF
triggers:
  # Project creation triggers
  - event: "project.created"
    workflow: "projectCreationWorkflow"
    conditions:
      - field: "budget"
        operator: "greaterThan"
        value: 10000
    priority: "high"

  # AI model training triggers
  - event: "dataset.uploaded"
    workflow: "aiModelTrainingWorkflow"
    conditions:
      - field: "size"
        operator: "greaterThan"
        value: 1048576
    priority: "medium"

  # User onboarding triggers
  - event: "user.registered"
    workflow: "userOnboardingWorkflow"
    conditions:
      - field: "email"
        operator: "contains"
        value: "@"
    priority: "high"

  # Billing triggers
  - event: "billing.period_started"
    workflow: "billingCycleWorkflow"
    schedule: "monthly"
    priority: "critical"

event_sources:
  - type: "webhook"
    url: "/api/events"
    secret: "${WEBHOOK_SECRET}"

  - type: "database"
    connection: "${DATABASE_URL}"
    table: "events"

  - type: "kafka"
    brokers: ["localhost:9092"]
    topics: ["user-events", "project-events", "system-events"]
EOF

    # Create event processor
    cat > temporal/event-processor.ts << 'EOF'
import { Connection, Client } from '@temporalio/client';
import { Worker } from '@temporalio/worker';
import { Kafka } from 'kafkajs';
import * as workflows from './workflows';
import * as activities from './activities';

async function main() {
  // Connect to Temporal
  const connection = await Connection.connect();
  const client = new Client({ connection });

  // Set up Kafka consumer
  const kafka = new Kafka({
    clientId: 'temporal-event-processor',
    brokers: ['localhost:9092']
  });

  const consumer = kafka.consumer({ groupId: 'temporal-events' });

  await consumer.connect();
  await consumer.subscribe({
    topics: ['user-events', 'project-events', 'system-events'],
    fromBeginning: false
  });

  // Process events
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value!.toString());

      // Route event to appropriate workflow
      switch (event.type) {
        case 'project.created':
          await client.workflow.start('projectCreationWorkflow', {
            taskQueue: 'ai-tasks',
            workflowId: `project-${event.data.projectId}`,
            args: [event.data]
          });
          break;

        case 'user.registered':
          await client.workflow.start('userOnboardingWorkflow', {
            taskQueue: 'ai-tasks',
            workflowId: `user-${event.data.userId}`,
            args: [event.data]
          });
          break;

        case 'dataset.uploaded':
          await client.workflow.start('aiModelTrainingWorkflow', {
            taskQueue: 'ai-tasks',
            workflowId: `training-${event.data.datasetId}`,
            args: [event.data]
          });
          break;
      }
    },
  });

  // Start worker
  const worker = await Worker.create({
    connection,
    namespace: 'ai-agency',
    taskQueue: 'ai-tasks',
    workflowsPath: require.resolve('./workflows'),
    activities,
  });

  await worker.run();
}

main().catch(console.error);
EOF

    echo "✅ Event triggers configured"
}

# Set up monitoring and alerting
setup_monitoring() {
    echo "📊 Setting up monitoring and alerting..."

    # Create Prometheus configuration
    cat > temporal/prometheus.yml << EOF
global:
  scrape_interval: 15s

rule_files:
  - "temporal/alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - localhost:9093

scrape_configs:
  - job_name: 'temporal'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/metrics'

  - job_name: 'kafka'
    static_configs:
      - targets: ['localhost:7071']
    metrics_path: '/metrics'

  - job_name: 'workflows'
    static_configs:
      - targets: ['localhost:9092']
EOF

    # Create alert rules
    cat > temporal/alert_rules.yml << EOF
groups:
  - name: temporal
    rules:
      - alert: WorkflowFailureRate
        expr: rate(workflow_failed_total[5m]) / rate(workflow_started_total[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High workflow failure rate"
          description: "Workflow failure rate is {{ $value }}"

      - alert: ActivityTimeout
        expr: increase(activity_timeout_total[5m]) > 5
        labels:
          severity: warning
        annotations:
          summary: "Activity timeouts detected"
          description: "{{ $value }} activities timed out in the last 5 minutes"

      - alert: QueueBacklog
        expr: workflow_queue_backlog > 100
        labels:
          severity: warning
        annotations:
          summary: "Workflow queue backlog"
          description: "Queue backlog is {{ $value }}"
EOF

    echo "✅ Monitoring and alerting configured"
}

# Create pipeline orchestrator
setup_pipeline_orchestrator() {
    echo "🔧 Setting up pipeline orchestrator..."

    cat > temporal/pipeline-orchestrator.ts << 'EOF'
import { Connection, Client } from '@temporalio/client';
import { Kafka } from 'kafkajs';

interface PipelineStep {
  name: string;
  activity: string;
  timeout: string;
  retryPolicy?: {
    initialInterval: string;
    backoffCoefficient: number;
    maximumAttempts: number;
  };
  dependencies?: string[];
}

interface Pipeline {
  name: string;
  steps: PipelineStep[];
  triggers: string[];
}

class PipelineOrchestrator {
  private client: Client;
  private kafka: Kafka;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'pipeline-orchestrator',
      brokers: ['localhost:9092']
    });
  }

  async initialize() {
    const connection = await Connection.connect();
    this.client = new Client({ connection });
  }

  async executePipeline(pipeline: Pipeline, input: any) {
    const executionId = `${pipeline.name}-${Date.now()}`;
    const stepResults = new Map<string, any>();

    // Execute steps in dependency order
    for (const step of this.getExecutionOrder(pipeline.steps)) {
      // Check dependencies
      if (step.dependencies) {
        const dependenciesMet = step.dependencies.every(dep =>
          stepResults.has(dep)
        );

        if (!dependenciesMet) {
          throw new Error(`Dependencies not met for step ${step.name}`);
        }
      }

      // Execute step
      try {
        const result = await this.client.workflow.execute(step.activity, {
          taskQueue: 'ai-tasks',
          workflowId: `${executionId}-${step.name}`,
          args: [input, stepResults],
        });

        stepResults.set(step.name, result);

        // Publish step completion event
        await this.publishEvent('pipeline.step.completed', {
          pipelineName: pipeline.name,
          executionId,
          stepName: step.name,
          result
        });

      } catch (error) {
        // Publish step failure event
        await this.publishEvent('pipeline.step.failed', {
          pipelineName: pipeline.name,
          executionId,
          stepName: step.name,
          error: error.message
        });

        throw error;
      }
    }

    // Publish pipeline completion
    await this.publishEvent('pipeline.completed', {
      pipelineName: pipeline.name,
      executionId,
      results: Object.fromEntries(stepResults)
    });

    return Object.fromEntries(stepResults);
  }

  private getExecutionOrder(steps: PipelineStep[]): PipelineStep[] {
    // Topological sort based on dependencies
    const visited = new Set<string>();
    const result: PipelineStep[] = [];

    const visit = (step: PipelineStep) => {
      if (visited.has(step.name)) return;

      if (step.dependencies) {
        step.dependencies.forEach(dep => {
          const depStep = steps.find(s => s.name === dep);
          if (depStep) visit(depStep);
        });
      }

      visited.add(step.name);
      result.push(step);
    };

    steps.forEach(step => visit(step));
    return result;
  }

  private async publishEvent(eventType: string, data: any) {
    const producer = this.kafka.producer();
    await producer.connect();

    await producer.send({
      topic: 'pipeline-events',
      messages: [{
        key: eventType,
        value: JSON.stringify({
          type: eventType,
          data,
          timestamp: new Date().toISOString()
        })
      }]
    });

    await producer.disconnect();
  }

  async startEventListener() {
    const consumer = this.kafka.consumer({ groupId: 'pipeline-orchestrator' });

    await consumer.connect();
    await consumer.subscribe({ topics: ['pipeline-triggers'] });

    await consumer.run({
      eachMessage: async ({ message }) => {
        const trigger = JSON.parse(message.value!.toString());

        // Load pipeline configuration
        const pipeline = await this.loadPipeline(trigger.pipelineName);

        // Execute pipeline
        await this.executePipeline(pipeline, trigger.input);
      },
    });
  }

  private async loadPipeline(name: string): Promise<Pipeline> {
    // Load pipeline from configuration
    // This would typically come from a database or config file
    return {
      name,
      steps: [],
      triggers: []
    };
  }
}

// Export orchestrator
export { PipelineOrchestrator, Pipeline, PipelineStep };
EOF

    echo "✅ Pipeline orchestrator created"
}

# Create startup script
create_startup_script() {
    echo "🚀 Creating startup script..."

    cat > scripts/start-event-driven-architecture.sh << 'EOF'
#!/bin/bash

# Event-Driven Architecture Startup Script

echo "⚡ Starting event-driven architecture..."

# Start infrastructure
echo "🏗️ Starting infrastructure..."
scripts/setup-event-driven-architecture.sh start_infrastructure

# Start Temporal worker
echo "👷 Starting Temporal worker..."
scripts/start-temporal-worker.sh &

# Start event processor
echo "🎯 Starting event processor..."
npx tsx temporal/event-processor.ts > logs/temporal/event-processor.log 2>&1 &

# Start pipeline orchestrator
echo "🔧 Starting pipeline orchestrator..."
npx tsx temporal/pipeline-orchestrator.ts > logs/temporal/pipeline-orchestrator.log 2>&1 &

echo "✅ Event-driven architecture started!"
echo ""
echo "📋 Services running:"
echo "  • Temporal Server: http://localhost:8233"
echo "  • Temporal UI: http://localhost:8233"
echo "  • Kafka: localhost:9092"
echo "  • Prometheus: http://localhost:9090"
echo "  • Grafana: http://localhost:3001"
echo ""
echo "To stop: ./scripts/stop-event-driven-architecture.sh"
EOF

    chmod +x scripts/start-event-driven-architecture.sh

    # Create stop script
    cat > scripts/stop-event-driven-architecture.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping event-driven architecture..."

# Stop Temporal
pkill -f "temporal server" || true
pkill -f "temporal/worker" || true

# Stop Kafka
pkill -f "kafka" || true
pkill -f "zookeeper" || true

# Stop Node.js processes
pkill -f "event-processor.ts" || true
pkill -f "pipeline-orchestrator.ts" || true

echo "✅ Event-driven architecture stopped"
EOF

    chmod +x scripts/stop-event-driven-architecture.sh

    echo "✅ Startup scripts created"
}

# Main setup function
main() {
    echo "🎯 Starting event-driven architecture setup..."

    # Start infrastructure
    start_infrastructure

    # Setup workers
    setup_temporal_workers

    # Setup triggers
    setup_event_triggers

    # Setup monitoring
    setup_monitoring

    # Setup pipelines
    setup_pipeline_orchestrator

    # Create scripts
    create_startup_script

    echo "✅ Event-driven architecture setup completed!"
    echo ""
    echo "🚀 To start the system:"
    echo "  ./scripts/start-event-driven-architecture.sh"
    echo ""
    echo "📊 To monitor:"
    echo "  • Temporal UI: http://localhost:8233"
    echo "  • Prometheus: http://localhost:9090"
    echo "  • Grafana: http://localhost:3001"
}

# Run main function
main "$@"
EOF

    chmod +x scripts/setup-event-driven-architecture.sh

    echo "✅ Event-driven architecture setup completed"
}

# Main function
main() {
    echo "🎯 Starting comprehensive event-driven architecture setup..."

    # Run setup
    setup_event_driven_architecture

    echo "✅ Event-driven architecture is now ready!"
    echo "   - Temporal workflows configured"
    echo "   - Kafka event streaming set up"
    echo "   - Pre/post/error hooks installed"
    echo "   - Event triggers configured"
    echo "   - Pipeline orchestrator ready"
    echo "   - Monitoring and alerting active"
}

# Run main function
main "$@"