
# -------------------------------
# Variables for IT customers
# -------------------------------

variable "customer_it_group_name" {
  description = "Group name of the customer"
  type        = string
  default     = "IT-Users"
}

variable "customer_it_user_names" {
  description = "name list of the customer "
  type        = list(string)
  default     = ["it-user1", "it-user2"]
}


# AWS region where resources will be created
variable "aws_region" {
  description = "AWS region for the S3 bucket and IAM resources"
  type        = string
  default     = "ap-southeast-1" # Singapore (close to Vietnam)
}

# AWS CLI profile name (configured in ~/.aws/credentials)
variable "aws_profile" {
  description = "AWS CLI profile to use for authentication"
  type        = string
  default     = "default"
}

# Deployment environment (e.g., dev, staging, prod)
variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "dev"
}

# Name of the S3 bucket for backups
variable "backup_bucket_name" {
  description = "Unique S3 bucket name for storing backups"
  type        = string
  default     = "my_bucket"
}

# Name of the S3 bucket for backups
variable "s3_backup_object_prefix" {
  description = "S3 backup object prefix"
  type        = string
  default     = "backup/mongodb/databse_name"
}

# IAM username for backup process
variable "backup_user_name" {
  description = "IAM user that will be granted access to the backup bucket"
  type        = string
  default     = "backup-user"
}

# Number of days before objects are automatically deleted
variable "backup_retention_days" {
  description = "How many days to keep backups before automatic deletion"
  type        = number
  default     = 7
}

# Number of days before objects are automatically expired for non-current version
variable "backup_expiration_days" {
  description = "How many days to keep backups before automatic expiring for non-current versions"
  type        = number
  default     = 7
}

# Enable or disable server-side encryption
variable "enable_bucket_encryption" {
  description = "Enable SSE-S3 encryption for bucket"
  type        = bool
  default     = true
}


# List of email recipients for backup alerts
variable "backup_alert_emails" {
  description = "Email addresses that will receive backup failure/missing alerts"
  type        = list(string)
  default = [
    "admin@example.com",
    "it@example.com"
  ]
}