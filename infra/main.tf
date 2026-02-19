terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment to use S3 backend for remote state
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "claude-plugins/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region
}

locals {
  prefix = "${var.project_name}-${var.environment}"
}
