#!/bin/bash

# Post-workflow Notification Hook
# Sends notifications after workflow completion

set -e

echo "📢 Running post-workflow notifications..."

# Get workflow information
WORKFLOW_ID="${TEMPORAL_WORKFLOW_ID}"
WORKFLOW_TYPE="${TEMPORAL_WORKFLOW_TYPE}"
WORKFLOW_STATUS="${TEMPORAL_WORKFLOW_STATUS}"
EXECUTION_TIME="${TEMPORAL_WORKFLOW_EXECUTION_TIME}"

echo "Workflow: $WORKFLOW_ID ($WORKFLOW_TYPE)"
echo "Status: $WORKFLOW_STATUS"
echo "Execution Time: $EXECUTION_TIME seconds"

# Prepare notification data
NOTIFICATION_DATA=$(cat <<EOF
{
  "workflowId": "$WORKFLOW_ID",
  "type": "$WORKFLOW_TYPE",
  "status": "$WORKFLOW_STATUS",
  "executionTime": $EXECUTION_TIME,
  "timestamp": "$(date -Iseconds)",
  "environment": "production"
}
EOF
)

# Send notifications based on workflow type and status
case "$WORKFLOW_TYPE" in
    "project-creation-workflow")
        handle_project_creation_notification "$WORKFLOW_STATUS" "$NOTIFICATION_DATA"
        ;;

    "ai-model-training-workflow")
        handle_ai_training_notification "$WORKFLOW_STATUS" "$NOTIFICATION_DATA"
        ;;

    "user-onboarding-workflow")
        handle_user_onboarding_notification "$WORKFLOW_STATUS" "$NOTIFICATION_DATA"
        ;;

    "billing-cycle-workflow")
        handle_billing_notification "$WORKFLOW_STATUS" "$NOTIFICATION_DATA"
        ;;
esac

# Send metrics to monitoring system
send_metrics "$WORKFLOW_TYPE" "$WORKFLOW_STATUS" "$EXECUTION_TIME"

# Update workflow registry
update_workflow_registry "$WORKFLOW_ID" "$WORKFLOW_STATUS"

echo "✅ Post-workflow notifications completed"

# Project creation notification handler
handle_project_creation_notification() {
    local status=$1
    local data=$2

    if [ "$status" = "completed" ]; then
        echo "🎉 Project creation completed successfully"

        # Send Slack notification
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            -d "{\"text\": \"✅ New project created via workflow $WORKFLOW_ID\"}"

        # Send email notification (via Resend)
        curl -X POST "https://api.resend.com/emails" \
            -H "Authorization: Bearer $RESEND_API_KEY" \
            -H "Content-Type: application/json" \
            -d "{
                \"from\": \"workflows@aiagency.com\",
                \"to\": [\"team@aiagency.com\"],
                \"subject\": \"New Project Created\",
                \"html\": \"<p>Project creation workflow completed successfully.</p><p>Workflow ID: $WORKFLOW_ID</p><p>Execution Time: $EXECUTION_TIME seconds</p>\"
            }"

    elif [ "$status" = "failed" ]; then
        echo "❌ Project creation failed"

        # Send urgent Slack notification
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            -d "{\"text\": \"🚨 Project creation FAILED: $WORKFLOW_ID\"}"

        # Create incident in incident management system
        curl -X POST "$INCIDENT_IO_WEBHOOK" \
            -H 'Content-type: application/json' \
            -d "$data"
    fi
}

# AI training notification handler
handle_ai_training_notification() {
    local status=$1
    local data=$2

    if [ "$status" = "completed" ]; then
        echo "🤖 AI model training completed"

        # Update model registry
        MODEL_ID=$(echo "$TEMPORAL_WORKFLOW_INPUT" | jq -r '.modelId')
        curl -X POST "http://localhost:3000/api/models/$MODEL_ID/status" \
            -H 'Content-type: application/json' \
            -d '{"status": "trained", "workflowId": "'$WORKFLOW_ID'"}'

    elif [ "$status" = "failed" ]; then
        echo "❌ AI model training failed"

        # Send alert to ML team
        curl -X POST "$SLACK_ML_WEBHOOK" \
            -H 'Content-type: application/json' \
            -d "{\"text\": \"🚨 AI Training Failed: $WORKFLOW_ID\"}"
    fi
}

# User onboarding notification handler
handle_user_onboarding_notification() {
    local status=$1
    local data=$2

    if [ "$status" = "completed" ]; then
        echo "👋 User onboarding completed"

        # Send welcome email
        USER_EMAIL=$(echo "$TEMPORAL_WORKFLOW_INPUT" | jq -r '.email')
        curl -X POST "https://api.resend.com/emails" \
            -H "Authorization: Bearer $RESEND_API_KEY" \
            -H "Content-Type: application/json" \
            -d "{
                \"from\": \"welcome@aiagency.com\",
                \"to\": [\"$USER_EMAIL\"],
                \"subject\": \"Welcome to AI Agency!\",
                \"html\": \"<h1>Welcome!</h1><p>Your account has been set up successfully.</p>\"
            }"

    elif [ "$status" = "failed" ]; then
        echo "❌ User onboarding failed"

        # Alert support team
        curl -X POST "$SLACK_SUPPORT_WEBHOOK" \
            -H 'Content-type: application/json' \
            -d "{\"text\": \"🚨 User onboarding failed: $WORKFLOW_ID\"}"
    fi
}

# Billing notification handler
handle_billing_notification() {
    local status=$1
    local data=$2

    if [ "$status" = "completed" ]; then
        echo "💰 Billing cycle completed"

        # Generate and send invoices
        curl -X POST "http://localhost:3000/api/billing/generate-invoices" \
            -H 'Content-type: application/json'

    elif [ "$status" = "failed" ]; then
        echo "❌ Billing cycle failed"

        # Urgent alert to finance team
        curl -X POST "$SLACK_FINANCE_WEBHOOK" \
            -H 'Content-type: application/json' \
            -d "{\"text\": \"🚨 CRITICAL: Billing cycle FAILED: $WORKFLOW_ID\"}"
    fi
}

# Send metrics to monitoring system
send_metrics() {
    local workflow_type=$1
    local status=$2
    local execution_time=$3

    # Send to Prometheus metrics
    cat <<EOF | curl -X POST "http://localhost:9091/metrics/job/workflow/instance/$HOSTNAME"
# HELP workflow_execution_duration_seconds Time spent executing workflow
# TYPE workflow_execution_duration_seconds histogram
workflow_execution_duration_seconds{workflow_type="$workflow_type",status="$status"} $execution_time
# HELP workflow_executions_total Total number of workflow executions
# TYPE workflow_executions_total counter
workflow_executions_total{workflow_type="$workflow_type",status="$status"} 1
EOF
}

# Update workflow registry
update_workflow_registry() {
    local workflow_id=$1
    local status=$2

    # Update workflow status in registry
    curl -X PUT "http://localhost:3000/api/workflows/$workflow_id" \
        -H 'Content-type: application/json' \
        -d "{\"status\": \"$status\", \"completedAt\": \"$(date -Iseconds)\"}"
}