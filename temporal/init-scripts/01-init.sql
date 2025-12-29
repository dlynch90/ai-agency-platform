-- Temporal PostgreSQL Initialization Script
-- Creates necessary extensions and additional databases

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create visibility database
CREATE DATABASE temporal_visibility;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE temporal TO temporal;
GRANT ALL PRIVILEGES ON DATABASE temporal_visibility TO temporal;

-- Create custom schema for workflow metadata
\c temporal;

CREATE SCHEMA IF NOT EXISTS workflow_metadata;

-- Table for workflow execution metadata
CREATE TABLE IF NOT EXISTS workflow_metadata.executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id VARCHAR(255) NOT NULL,
    run_id VARCHAR(255) NOT NULL,
    workflow_type VARCHAR(255) NOT NULL,
    namespace VARCHAR(255) NOT NULL DEFAULT 'ai-agency',
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    input JSONB,
    output JSONB,
    error TEXT,
    metadata JSONB DEFAULT '{}',
    UNIQUE(workflow_id, run_id)
);

-- Table for dead letter queue entries
CREATE TABLE IF NOT EXISTS workflow_metadata.dead_letter_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id VARCHAR(255) NOT NULL,
    run_id VARCHAR(255),
    workflow_type VARCHAR(255) NOT NULL,
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT,
    error_stack TEXT,
    failed_at TIMESTAMPTZ DEFAULT NOW(),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_retry_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution VARCHAR(50),
    payload JSONB,
    metadata JSONB DEFAULT '{}'
);

-- Table for circuit breaker state
CREATE TABLE IF NOT EXISTS workflow_metadata.circuit_breaker_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(255) NOT NULL UNIQUE,
    state VARCHAR(20) NOT NULL DEFAULT 'CLOSED',
    failure_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    last_failure_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    half_opened_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ DEFAULT NOW(),
    failure_threshold INTEGER DEFAULT 5,
    recovery_timeout_seconds INTEGER DEFAULT 60,
    metadata JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_executions_workflow_type ON workflow_metadata.executions(workflow_type);
CREATE INDEX IF NOT EXISTS idx_executions_status ON workflow_metadata.executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_namespace ON workflow_metadata.executions(namespace);
CREATE INDEX IF NOT EXISTS idx_executions_started_at ON workflow_metadata.executions(started_at);

CREATE INDEX IF NOT EXISTS idx_dlq_workflow_type ON workflow_metadata.dead_letter_queue(workflow_type);
CREATE INDEX IF NOT EXISTS idx_dlq_error_type ON workflow_metadata.dead_letter_queue(error_type);
CREATE INDEX IF NOT EXISTS idx_dlq_failed_at ON workflow_metadata.dead_letter_queue(failed_at);
CREATE INDEX IF NOT EXISTS idx_dlq_resolved_at ON workflow_metadata.dead_letter_queue(resolved_at);

-- Grant permissions
GRANT ALL ON SCHEMA workflow_metadata TO temporal;
GRANT ALL ON ALL TABLES IN SCHEMA workflow_metadata TO temporal;
