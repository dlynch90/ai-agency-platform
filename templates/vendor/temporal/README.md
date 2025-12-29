# Temporal Vendor Templates

Temporal workflow orchestration templates

## Installation

```bash
npm install @temporalio/client @temporalio/worker
```

## Usage

```bash
Use temporal CLI: temporal new workflow-name
```

## Available Templates

- **basic-workflow**
- **subscription-workflow**
- **saga-pattern**


# Temporal Templates

Durable workflow orchestration engine.

## Installation
```bash
npm install @temporalio/client @temporalio/worker
# Or use Go/Java SDKs
```

## Usage
```bash
# Create new Temporal project
npx @temporalio/create@latest my-workflow
```

## Available Templates
- **basic-workflow**: Simple workflow with activities
- **subscription-workflow**: Subscription management
- **saga-pattern**: Distributed transactions

## Instead of Custom Code
Use these templates instead of writing custom:
- Workflow state machines
- Retry and timeout logic
- Distributed transaction coordination
- Long-running process management
