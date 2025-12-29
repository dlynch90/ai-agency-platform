#!/bin/bash

# Workflow Error Handler Hook
# Handles workflow failures and implements recovery strategies

set -e

echo "🚨 Running workflow error handler..."

# Get error information
WORKFLOW_ID="${TEMPORAL_WORKFLOW_ID}"
WORKFLOW_TYPE="${TEMPORAL_WORKFLOW_TYPE}"
ERROR_MESSAGE="${TEMPORAL_WORKFLOW_ERROR_MESSAGE}"
ERROR_CODE="${TEMPORAL_WORKFLOW_ERROR_CODE}"
RETRY_COUNT="${TEMPORAL_WORKFLOW_RETRY_COUNT:-0}"

echo "Error Details:"
echo "  Workflow ID: $WORKFLOW_ID"
echo "  Type: $WORKFLOW_TYPE"
echo "  Error: $ERROR_MESSAGE"
echo "  Code: $ERROR_CODE"
echo "  Retry Count: $RETRY_COUNT"

# Classify error type
ERROR_TYPE=$(classify_error "$ERROR_CODE" "$ERROR_MESSAGE")

echo "Error Type: $ERROR_TYPE"

# Handle error based on type and workflow
case "$ERROR_TYPE" in
    "transient")
        handle_transient_error "$WORKFLOW_TYPE" "$WORKFLOW_ID"
        ;;
    "permanent")
        handle_permanent_error "$WORKFLOW_TYPE" "$WORKFLOW_ID" "$ERROR_MESSAGE"
        ;;
    "resource_exhausted")
        handle_resource_exhausted "$WORKFLOW_TYPE" "$WORKFLOW_ID"
        ;;
    "dependency_failed")
        handle_dependency_failed "$WORKFLOW_TYPE" "$WORKFLOW_ID"
        ;;
    *)
        handle_unknown_error "$WORKFLOW_TYPE" "$WORKFLOW_ID" "$ERROR_MESSAGE"
        ;;
esac

# Send error metrics
send_error_metrics "$WORKFLOW_TYPE" "$ERROR_TYPE" "$ERROR_CODE"

# Update error registry
update_error_registry "$WORKFLOW_ID" "$ERROR_TYPE" "$ERROR_MESSAGE"

echo "✅ Error handling completed"

# Classify error based on code and message
classify_error() {
    local code=$1
    local message=$2

    # Network/timeout errors
    if [[ "$code" == *"TIMEOUT"* ]] || [[ "$message" == *"timeout"* ]] || [[ "$message" == *"connection"* ]]; then
        echo "transient"
        return
    fi

    # Resource exhaustion
    if [[ "$code" == *"RESOURCE"* ]] || [[ "$message" == *"memory"* ]] || [[ "$message" == *"disk"* ]]; then
        echo "resource_exhausted"
        return
    fi

    # Validation/permission errors
    if [[ "$code" == *"VALIDATION"* ]] || [[ "$code" == *"PERMISSION"* ]] || [[ "$message" == *"not found"* ]]; then
        echo "permanent"
        return
    fi

    # Dependency failures
    if [[ "$code" == *"DEPENDENCY"* ]] || [[ "$message" == *"service unavailable"* ]]; then
        echo "dependency_failed"
        return
    fi

    echo "unknown"
}

# Handle transient errors (retry-able)
handle_transient_error() {
    local workflow_type=$1
    local workflow_id=$2

    echo "🔄 Handling transient error - will retry"

    # Implement exponential backoff
    local backoff_seconds=$((2 ** RETRY_COUNT))
    if [ $backoff_seconds -gt 300 ]; then
        backoff_seconds=300  # Max 5 minutes
    fi

    echo "Scheduling retry in $backoff_seconds seconds"

    # Schedule retry via Temporal API
    curl -X POST "http://localhost:7233/api/v1/namespaces/ai-agency/workflows/$workflow_id/retry" \
        -H 'Content-type: application/json' \
        -d "{\"backoffSeconds\": $backoff_seconds}"
}

# Handle permanent errors (non-retry-able)
handle_permanent_error() {
    local workflow_type=$1
    local workflow_id=$2
    local error_message=$3

    echo "🛑 Handling permanent error - marking as failed"

    # Update workflow status
    curl -X PUT "http://localhost:3000/api/workflows/$workflow_id/status" \
        -H 'Content-type: application/json' \
        -d "{\"status\": \"permanently_failed\", \"error\": \"$error_message\"}"

    # Send alerts to appropriate teams
    case "$workflow_type" in
        "project-creation-workflow")
            alert_project_team "$workflow_id" "$error_message"
            ;;
        "ai-model-training-workflow")
            alert_ml_team "$workflow_id" "$error_message"
            ;;
        "billing-cycle-workflow")
            alert_finance_team "$workflow_id" "$error_message"
            ;;
    esac

    # Create incident report
    create_incident_report "$workflow_type" "$workflow_id" "$error_message"
}

# Handle resource exhaustion
handle_resource_exhausted() {
    local workflow_type=$1
    local workflow_id=$2

    echo "💾 Handling resource exhaustion"

    # Check current resource usage
    local memory_usage=$(ps aux --no-headers -o pmem | awk '{sum+=$1} END {print sum}')
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

    echo "Memory usage: ${memory_usage}%"
    echo "Disk usage: ${disk_usage}%"

    # Implement resource cleanup
    if (( $(echo "$memory_usage > 85" | bc -l) )); then
        echo "High memory usage detected - triggering cleanup"
        # Kill non-essential processes or scale down
        curl -X POST "http://localhost:9090/-/reload"  # Reload Prometheus if needed
    fi

    if [ "$disk_usage" -gt 85 ]; then
        echo "High disk usage detected - triggering cleanup"
        # Clean up old logs and temporary files
        find logs/ -name "*.log" -mtime +7 -delete 2>/dev/null || true
        find temp/ -type f -mtime +1 -delete 2>/dev/null || true
    fi

    # Reschedule workflow with lower priority
    curl -X POST "http://localhost:7233/api/v1/namespaces/ai-agency/workflows" \
        -H 'Content-type: application/json' \
        -d "{
            \"workflowId\": \"${workflow_id}_retry\",
            \"workflowType\": {\"name\": \"$workflow_type\"},
            \"input\": {},
            \"taskQueue\": {\"name\": \"ai-tasks-low-priority\"}
        }"
}

# Handle dependency failures
handle_dependency_failed() {
    local workflow_type=$1
    local workflow_id=$2

    echo "🔗 Handling dependency failure"

    # Check dependency health
    check_dependencies

    # Implement circuit breaker pattern
    if [ $? -eq 0 ]; then
        echo "Dependencies healthy - retrying workflow"
        curl -X POST "http://localhost:7233/api/v1/namespaces/ai-agency/workflows/$workflow_id/signal" \
            -H 'Content-type: application/json' \
            -d "{\"signalName\": \"retry\", \"input\": {}}"
    else
        echo "Dependencies still failing - moving to dead letter queue"
        move_to_dlq "$workflow_id" "dependency_failure"
    fi
}

# Handle unknown errors
handle_unknown_error() {
    local workflow_type=$1
    local workflow_id=$2
    local error_message=$3

    echo "❓ Handling unknown error"

    # Log detailed error information
    cat <<EOF >> logs/workflow-errors.log
$(date -Iseconds) - Unknown Error
Workflow ID: $workflow_id
Type: $workflow_type
Error: $error_message
Stack Trace: ${TEMPORAL_WORKFLOW_STACK_TRACE:-N/A}
Environment: $(env | grep -E "(NODE_ENV|DATABASE_URL|REDIS_URL)" | tr '\n' ', ')
EOF

    # Send to error tracking system
    curl -X POST "https://api.sentry.io/api/envelope/" \
        -H "Content-Type: application/x-sentry-envelope" \
        -d "{
            \"event_id\": \"$(uuidgen)\",
            \"timestamp\": \"$(date -Iseconds)\",
            \"level\": \"error\",
            \"message\": \"$error_message\",
            \"tags\": {
                \"workflow_id\": \"$workflow_id\",
                \"workflow_type\": \"$workflow_type\"
            }
        }"

    # Escalate to on-call engineer
    alert_on_call_engineer "$workflow_id" "$error_message"
}

# Check dependency health
check_dependencies() {
    # Check database
    if ! timeout 5 bash -c "</dev/tcp/localhost/5432" 2>/dev/null; then
        echo "Database unhealthy"
        return 1
    fi

    # Check Redis
    if ! timeout 5 bash -c "</dev/tcp/localhost/6379" 2>/dev/null; then
        echo "Redis unhealthy"
        return 1
    fi

    # Check external APIs (if needed)
    if ! curl -s --max-time 5 "https://api.github.com/zen" >/dev/null; then
        echo "GitHub API unhealthy"
        return 1
    fi

    return 0
}

# Alert specific teams
alert_project_team() {
    local workflow_id=$1
    local error=$2

    curl -X POST "$SLACK_PROJECT_WEBHOOK" \
        -H 'Content-type: application/json' \
        -d "{\"text\": \"🚨 Project Workflow Failed: $workflow_id\nError: $error\"}"
}

alert_ml_team() {
    local workflow_id=$1
    local error=$2

    curl -X POST "$SLACK_ML_WEBHOOK" \
        -H 'Content-type: application/json' \
        -d "{\"text\": \"🚨 ML Training Failed: $workflow_id\nError: $error\"}"
}

alert_finance_team() {
    local workflow_id=$1
    local error=$2

    curl -X POST "$SLACK_FINANCE_WEBHOOK" \
        -H 'Content-type: application/json' \
        -d "{\"text\": \"🚨 CRITICAL: Billing Failed: $workflow_id\nError: $error\"}"
}

alert_on_call_engineer() {
    local workflow_id=$1
    local error=$2

    # Send SMS alert via Twilio or similar
    curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
        --data-urlencode "From=$TWILIO_PHONE_NUMBER" \
        --data-urlencode "To=$ON_CALL_PHONE" \
        --data-urlencode "Body=🚨 WORKFLOW ERROR: $workflow_id - $error" \
        -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"
}

# Create incident report
create_incident_report() {
    local workflow_type=$1
    local workflow_id=$2
    local error=$3

    curl -X POST "https://api.incident.io/v1/incidents" \
        -H "Authorization: Bearer $INCIDENT_IO_API_KEY" \
        -H 'Content-type: application/json' \
        -d "{
            \"name\": \"Workflow Failure: $workflow_type\",
            \"summary\": \"Workflow $workflow_id failed with error: $error\",
            \"severity\": \"major\",
            \"status\": \"investigating\"
        }"
}

# Move workflow to dead letter queue
move_to_dlq() {
    local workflow_id=$1
    local reason=$2

    # Send to Kafka DLQ topic
    echo "{\"workflowId\": \"$workflow_id\", \"reason\": \"$reason\", \"timestamp\": \"$(date -Iseconds)\"}" | \
    kafka-console-producer --broker-list localhost:9092 --topic workflow-dlq
}

# Send error metrics
send_error_metrics() {
    local workflow_type=$1
    local error_type=$2
    local error_code=$3

    cat <<EOF | curl -X POST "http://localhost:9091/metrics/job/workflow_errors/instance/$HOSTNAME"
# HELP workflow_errors_total Total number of workflow errors
# TYPE workflow_errors_total counter
workflow_errors_total{workflow_type="$workflow_type",error_type="$error_type",error_code="$error_code"} 1
EOF
}

# Update error registry
update_error_registry() {
    local workflow_id=$1
    local error_type=$2
    local error_message=$3

    # Store error in database for analysis
    curl -X POST "http://localhost:3000/api/errors" \
        -H 'Content-type: application/json' \
        -d "{
            \"workflowId\": \"$workflow_id\",
            \"errorType\": \"$error_type\",
            \"errorMessage\": \"$error_message\",
            \"timestamp\": \"$(date -Iseconds)\",
            \"environment\": \"production\"
        }"
}