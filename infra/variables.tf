variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used as resource prefix"
  type        = string
  default     = "claude-plugins"
}

variable "environment" {
  description = "Environment name (e.g. prod, staging)"
  type        = string
  default     = "prod"
}

variable "desired_count" {
  description = "Number of ECS tasks to run"
  type        = number
  default     = 1
}

variable "container_port" {
  description = "Port the container listens on"
  type        = number
  default     = 3000
}

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
}
