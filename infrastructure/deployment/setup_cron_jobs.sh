#!/bin/bash
# Automated Cron Job Setup for Event-Driven Architecture
# Sets up scheduled execution of orchestration tasks

set -e

echo "⏰ SETTING UP AUTOMATED CRON JOBS"
echo "==================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[CRON]${NC} $1"
}

info() {
    echo -e "${BLUE:-\\033[0;34m}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Configuration
PROJECT_ROOT="${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer}"
ORCHESTRATOR="$PROJECT_ROOT/infra/event_driven_orchestrator.sh"
CRON_FILE="$PROJECT_ROOT/infra/cron_jobs"

# Function to add cron job
add_cron_job() {
    local schedule="$1"
    local command="$2"
    local description="$3"

    echo "# $description" >> "$CRON_FILE"
    echo "$schedule cd $PROJECT_ROOT && $command" >> "$CRON_FILE"
    echo "" >> "$CRON_FILE"

    log "Added cron job: $description"
}

# Create cron jobs file
cat > "$CRON_FILE" << 'EOF'
# Event-Driven Architecture Cron Jobs
# Comprehensive automation schedule for enterprise development

# System Health Monitoring (every 5 minutes)
*/5 * * * * cd ${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer} && infra/event_driven_orchestrator.sh integration

# Code Quality Monitoring (every 15 minutes)
*/15 * * * * cd ${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer} && infra/event_driven_orchestrator.sh quality

# Security Scanning (hourly)
0 * * * * cd ${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer} && infra/event_driven_orchestrator.sh security

# Performance Monitoring (every 30 minutes)
*/30 * * * * cd ${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer} && infra/event_driven_orchestrator.sh performance

# Automated Backups (daily at 2 AM)
0 2 * * * cd ${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer} && infra/event_driven_orchestrator.sh backup

# Metrics Collection (every 10 minutes)
*/10 * * * * cd ${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer} && infra/event_driven_orchestrator.sh metrics

# Compliance Audits (daily at 6 AM)
0 6 * * * cd ${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer} && infra/event_driven_orchestrator.sh compliance

# Full Orchestration Cycle (daily at midnight)
0 0 * * * cd ${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer} && infra/event_driven_orchestrator.sh all

# Weekly Deep Analysis (Sundays at 3 AM)
0 3 * * 0 cd ${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer} && infra/event_driven_orchestrator.sh all && infra/finite-element-analysis.sh

# Monthly Comprehensive Audit (1st of month at 4 AM)
0 4 1 * * cd ${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer} && infra/comprehensive-audit.sh

# Dependency Updates Check (Mondays at 5 AM)
0 5 * * 1 cd ${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer} && pixi update && npm audit fix 2>/dev/null || true

# Log Rotation (daily at 3 AM)
0 3 * * * cd ${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer} && find logs/ -name "*.log" -mtime +30 -delete 2>/dev/null || true

# Cache Cleanup (weekly on Wednesdays at 4 AM)
0 4 * * 3 cd ${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer} && rm -rf .cache/* 2>/dev/null || true && pixi clean

EOF

log "Cron jobs configuration created at $CRON_FILE"

# Create installation script
cat > "$PROJECT_ROOT/infra/install_cron_jobs.sh" << EOF
#!/bin/bash
# Install Cron Jobs for Event-Driven Architecture

echo "Installing cron jobs..."

# Backup existing crontab
crontab -l > /tmp/crontab_backup_\$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# Install new cron jobs
crontab $CRON_FILE

echo "Cron jobs installed successfully!"
echo "To view installed jobs: crontab -l"
echo "To edit jobs: crontab -e"
echo "Backup saved in /tmp/"
EOF

chmod +x "$PROJECT_ROOT/infra/install_cron_jobs.sh"

log "Installation script created at $PROJECT_ROOT/infra/install_cron_jobs.sh"

# Create monitoring dashboard script
cat > "$PROJECT_ROOT/infra/monitoring_dashboard.sh" << 'EOF'
#!/bin/bash
# Event-Driven Architecture Monitoring Dashboard

echo "📊 EVENT-DRIVEN MONITORING DASHBOARD"
echo "====================================="

PROJECT_ROOT="${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer}"
EVENT_LOG="$PROJECT_ROOT/logs/event_driven.log"
METRICS_DIR="$PROJECT_ROOT/metrics"
BACKUP_DIR="$PROJECT_ROOT/backups"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to display metrics
show_metrics() {
    echo -e "\n${BLUE}📈 SYSTEM METRICS${NC}"
    echo "=================="

    if [ -f "$METRICS_DIR/system_metrics.csv" ]; then
        local last_line=$(tail -1 "$METRICS_DIR/system_metrics.csv")
        IFS=',' read -r timestamp commit lines_changed cpu memory files dirs <<< "$last_line"

        echo "Timestamp: $(date -r $timestamp '+%Y-%m-%d %H:%M:%S')"
        echo "Commit: ${commit:0:8}"
        echo "Lines Changed: $lines_changed"
        echo "CPU Usage: ${cpu}%"
        echo "Memory Usage: ${memory}MB"
        echo "Total Files: $files"
        echo "Total Directories: $dirs"
    else
        echo "No metrics data available"
    fi
}

# Function to show recent events
show_recent_events() {
    echo -e "\n${GREEN}🔔 RECENT EVENTS${NC}"
    echo "================"

    if [ -f "$EVENT_LOG" ]; then
        tail -10 "$EVENT_LOG" | while read -r line; do
            # Color code events
            if echo "$line" | grep -q "ERROR\|FAILED"; then
                echo -e "${RED}$line${NC}"
            elif echo "$line" | grep -q "WARN"; then
                echo -e "${YELLOW}$line${NC}"
            else
                echo "$line"
            fi
        done
    else
        echo "No event log available"
    fi
}

# Function to show backup status
show_backup_status() {
    echo -e "\n${BLUE}💾 BACKUP STATUS${NC}"
    echo "================"

    local backup_count=$(ls -1 "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)
    local latest_backup=$(ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | head -1)

    echo "Total Backups: $backup_count"

    if [ -n "$latest_backup" ]; then
        local backup_date=$(basename "$latest_backup" .tar.gz)
        echo "Latest Backup: $backup_date"
        local backup_age=$(($(date +%s) - $(date -r "$latest_backup" +%s)))
        local days_old=$((backup_age / 86400))
        echo "Age: $days_old days"
    else
        echo "No backups found"
    fi
}

# Function to show cron status
show_cron_status() {
    echo -e "\n${GREEN}⏰ CRON JOB STATUS${NC}"
    echo "==================="

    local active_jobs=$(crontab -l 2>/dev/null | grep -v '^#' | grep -v '^$' | wc -l)
    echo "Active Cron Jobs: $active_jobs"

    if [ $active_jobs -gt 0 ]; then
        echo -e "${GREEN}✓ Cron jobs are configured${NC}"
    else
        echo -e "${RED}✗ No cron jobs configured${NC}"
    fi
}

# Function to show health status
show_health_status() {
    echo -e "\n${BLUE}🏥 SYSTEM HEALTH${NC}"
    echo "=================="

    # Check services
    local services_ok=0
    local total_services=0

    # Ollama
    ((total_services++))
    if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
        echo -e "Ollama: ${GREEN}✓ RUNNING${NC}"
        ((services_ok++))
    else
        echo -e "Ollama: ${RED}✗ DOWN${NC}"
    fi

    # Docker
    ((total_services++))
    if docker info >/dev/null 2>&1; then
        echo -e "Docker: ${GREEN}✓ RUNNING${NC}"
        ((services_ok++))
    else
        echo -e "Docker: ${RED}✗ DOWN${NC}"
    fi

    echo "Services: $services_ok/$total_services operational"
}

# Main dashboard
echo "Event-Driven Architecture Status Report"
echo "Generated: $(date)"
echo ""

show_health_status
show_metrics
show_recent_events
show_backup_status
show_cron_status

echo -e "\n${BLUE}🔄 QUICK ACTIONS${NC}"
echo "=================="
echo "Run full orchestration: ./infra/event_driven_orchestrator.sh all"
echo "Run health check: ./infra/event_driven_orchestrator.sh integration"
echo "View detailed logs: tail -f logs/event_driven.log"
echo "Manual backup: ./infra/event_driven_orchestrator.sh backup"
EOF

chmod +x "$PROJECT_ROOT/infra/monitoring_dashboard.sh"

log "Monitoring dashboard created at $PROJECT_ROOT/infra/monitoring_dashboard.sh"

# Final instructions
cat << EOF

🎉 CRON JOB SETUP COMPLETE
==========================

Cron jobs have been configured for comprehensive event-driven automation:

📅 SCHEDULED TASKS:
• System health monitoring (every 5 min)
• Code quality checks (every 15 min)
• Security scanning (hourly)
• Performance monitoring (every 30 min)
• Automated backups (daily 2 AM)
• Metrics collection (every 10 min)
• Compliance audits (daily 6 AM)
• Full orchestration (daily midnight)

🚀 INSTALLATION:
Run: ./infra/install_cron_jobs.sh

📊 MONITORING:
Run: ./infra/monitoring_dashboard.sh

The event-driven architecture is now fully automated and will:
- Monitor system health continuously
- Enforce code quality standards
- Perform security scanning
- Collect performance metrics
- Create automated backups
- Maintain compliance requirements

All activities are logged to logs/event_driven.log
Metrics are stored in metrics/ directory
Backups are maintained in backups/ directory

EOF

log "Event-driven cron job setup completed successfully!"