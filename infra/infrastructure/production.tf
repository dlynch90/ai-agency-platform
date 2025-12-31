# Production Infrastructure as Code
# Terraform configuration for vendor-compliant cloud deployment

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    bucket         = "ai-agency-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "ai-agency-terraform-locks"
  }
}

# AWS Provider
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "ai-agency-platform"
      Environment = "production"
      ManagedBy   = "terraform"
    }
  }
}

# GitHub Provider
provider "github" {
  token = var.github_token
}

# VPC Configuration
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "ai-agency-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway     = true
  single_nat_gateway     = true
  enable_dns_hostnames   = true
  enable_dns_support     = true

  tags = {
    Name = "ai-agency-vpc"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "ai-agency-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "ai-agency-ecs-cluster"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = "ai-agency-app"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "ai-agency-app"
      image = "${var.docker_registry}/ai-agency-platform:${var.app_version}"

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "DATABASE_URL", value = var.database_url },
        { name = "REDIS_URL", value = var.redis_url },
        { name = "NEO4J_URI", value = var.neo4j_uri },
        { name = "QDRANT_URL", value = var.qdrant_url }
      ]

      secrets = [
        {
          name      = "ANTHROPIC_API_KEY"
          valueFrom = aws_secretsmanager_secret.anthropic_api_key.arn
        },
        {
          name      = "OPENAI_API_KEY"
          valueFrom = aws_secretsmanager_secret.openai_api_key.arn
        },
        {
          name      = "GITHUB_TOKEN"
          valueFrom = aws_secretsmanager_secret.github_token.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command = ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
        interval = 30
        timeout  = 5
        retries  = 3
      }
    }
  ])
}

# ECS Service
resource "aws_ecs_service" "app" {
  name            = "ai-agency-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.desired_count

  network_configuration {
    subnets         = module.vpc.private_subnets
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "ai-agency-app"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.app]
}

# Application Load Balancer
resource "aws_lb" "app" {
  name               = "ai-agency-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb.id]
  subnets            = module.vpc.public_subnets

  enable_deletion_protection = true
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/ai-agency-app"
  retention_in_days = 30
}

# Secrets Manager
resource "aws_secretsmanager_secret" "anthropic_api_key" {
  name = "ai-agency/anthropic-api-key"
}

resource "aws_secretsmanager_secret" "openai_api_key" {
  name = "ai-agency/openai-api-key"
}

resource "aws_secretsmanager_secret" "github_token" {
  name = "ai-agency/github-token"
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier             = "ai-agency-postgres"
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  max_allocated_storage  = 100
  db_name                = "ai_agency"
  username               = "postgres"
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.default.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  skip_final_snapshot    = true

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql"]
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "ai-agency-redis"
  engine              = "redis"
  node_type           = "cache.t3.micro"
  num_cache_nodes     = 1
  port                = 6379
  subnet_group_name   = aws_elasticache_subnet_group.redis.name
  security_group_ids  = [aws_security_group.redis.id]

  snapshot_retention_limit = 7
  snapshot_window         = "05:00-06:00"
  maintenance_window      = "sun:06:00-sun:07:00"
}

# GitHub Actions Secrets
resource "github_actions_secret" "aws_access_key_id" {
  repository      = var.github_repository
  secret_name     = "AWS_ACCESS_KEY_ID"
  plaintext_value = var.aws_access_key_id
}

resource "github_actions_secret" "aws_secret_access_key" {
  repository      = var.github_repository
  secret_name     = "AWS_SECRET_ACCESS_KEY"
  plaintext_value = var.aws_secret_access_key
}

resource "github_actions_secret" "docker_registry" {
  repository      = var.github_repository
  secret_name     = "DOCKER_REGISTRY"
  plaintext_value = var.docker_registry
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "github_token" {
  description = "GitHub token"
  type        = string
  sensitive   = true
}

variable "task_cpu" {
  description = "ECS task CPU units"
  type        = string
  default     = "1024"
}

variable "task_memory" {
  description = "ECS task memory"
  type        = string
  default     = "2048"
}

variable "desired_count" {
  description = "Number of ECS tasks"
  type        = number
  default     = 2
}

# Outputs
output "alb_dns_name" {
  description = "Load balancer DNS name"
  value       = aws_lb.app.dns_name
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}