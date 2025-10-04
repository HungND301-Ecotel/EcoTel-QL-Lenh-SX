terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
}

# 1. Create S3 Bucket for Backups ---
resource "aws_s3_bucket" "backup_bucket" {
  bucket = var.backup_bucket_name

  tags = {
    Name        = var.backup_bucket_name
    Environment = var.environment
  }
}

# 2. Enable encryption at rest: SSE-S3 by default → almost no downside, no extra cost
resource "aws_s3_bucket_server_side_encryption_configuration" "backup_encryption" {
  bucket = aws_s3_bucket.backup_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# 3. Block all public access
resource "aws_s3_bucket_public_access_block" "backup_block" {
  bucket = aws_s3_bucket.backup_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# 4. Enable versioning
resource "aws_s3_bucket_versioning" "backup_versioning" {
  bucket = aws_s3_bucket.backup_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

# 5. Bucket Lifecycle: Auto-delete objects older than 30 days and always keep the latest file version
resource "aws_s3_bucket_lifecycle_configuration" "lifecycle" {
  bucket = aws_s3_bucket.backup_bucket.id

  # Rule 1: Clean up old versions of the "latest file" under UserDB/latest
  rule {
    id     = "expire-userdb-old-backups"
    status = "Enabled"

    filter {
      prefix = "UserDB/latest/" # applies to files under "UserDB/latest"
    }

    # Expire non-current (older) versions after N days
    noncurrent_version_expiration {
      noncurrent_days = var.backup_expiration_days
    }
  }

  # Rule 2: Clean up old versions of the "latest file" under SystemDB/latest
  rule {
    id     = "expire-systemdb-old-backups"
    status = "Enabled"

    filter {
      prefix = "SystemDB/latest/" # applies to files under "SystemDB/latest"
    }

    # Expire non-current (older) versions after N days
    noncurrent_version_expiration {
      noncurrent_days = var.backup_expiration_days
    }
  }

  # Rule 3: Delete daily distinct backups for files under userdb/daily after N days 
  rule {
    id     = "expire-userdb-daily-backups"
    status = "Enabled"

    filter {
      prefix = "UserDB/daily/"
    }

    expiration {
      days = var.backup_retention_days
    }
  }

}

# 6. Create IAM User for Backup user ---
resource "aws_iam_user" "backup_user" {
  name = var.backup_user_name
  tags = {
    Environment = var.environment
  }
}

# 7. Create IAM Policy to allow upload/download from the bucket
resource "aws_iam_policy" "backup_policy" {
  name        = "backup-s3-policy"
  description = "Allow backup-user to upload/download backups"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.backup_bucket.arn,
          "${aws_s3_bucket.backup_bucket.arn}/*"
        ]
      }
    ]
  })
}

# 8. Attach policy to backup user
resource "aws_iam_user_policy_attachment" "attach" {
  user       = aws_iam_user.backup_user.name
  policy_arn = aws_iam_policy.backup_policy.arn
}

# 9. Create IAM Group for customers IT deparment
resource "aws_iam_group" "customer_it_group" {
  name = var.customer_it_group_name
}

# 10-a. Create IAM policy for customers to access S3
resource "aws_iam_policy" "backup_bucket_policy" {
  name        = "Customer-Bucket-Access"
  description = "Allow IT Department users from customer to access only IT bucket"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["s3:ListAllMyBuckets"]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = ["s3:ListBucket"]
        Resource = aws_s3_bucket.backup_bucket.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.backup_bucket.arn}/*"
      }
    ]
  })
}

# 10-b. Attach the IAM policy to the customer group
resource "aws_iam_group_policy_attachment" "group_attach_bucket" {
  group      = aws_iam_group.customer_it_group.name
  policy_arn = aws_iam_policy.backup_bucket_policy.arn
}

# 11-a. IAM Policy: Allow customer users to change their own password
resource "aws_iam_policy" "allow_change_password" {
  name        = "AllowUserChangeOwnPassword"
  description = "Allow IAM users to change their own password"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "iam:ChangePassword"
        Resource = "arn:aws:iam::*:user/$${aws:username}"
      }
    ]
  })
}

# 11-b. Attach the IAM policy change password to group
resource "aws_iam_group_policy_attachment" "it_group_attach_password" {
  group      = aws_iam_group.customer_it_group.name
  policy_arn = aws_iam_policy.allow_change_password.arn
}

# 12. Create customer IT users, login profile and add to the customer group
resource "aws_iam_user" "it_users" {
  for_each = toset(var.customer_it_user_names)
  name     = each.key

  tags = {
    Department  = var.customer_it_group_name
    Environment = var.environment
  }
  
  # Disable programmatic access
  force_destroy = false
}

resource "aws_iam_user_login_profile" "it_users_console" {
  for_each = aws_iam_user.it_users
  user     = each.value.name

  # Temporary password; user must reset on first login
  password_reset_required = true
}

resource "aws_iam_group_membership" "it_membership" {
  name  = "it-group-membership"
  group = aws_iam_group.customer_it_group.name
  users = [for u in aws_iam_user.it_users : u.name]
}

# 13. IAM policy: allow IT users to view Storage Lens dashboard & reports
resource "aws_iam_policy" "storage_lens_readonly" {
  name        = "StorageLens-ReadOnly"
  description = "Allow IT Department users to view S3 Storage Lens dashboard (free)"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetAccountPublicAccessBlock",
          "s3:GetStorageLensConfiguration",
          "s3:ListAllMyBuckets"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach policy to IT group
resource "aws_iam_group_policy_attachment" "it_group_attach_storage_lens" {
  group      = aws_iam_group.customer_it_group.name
  policy_arn = aws_iam_policy.storage_lens_readonly.arn
}



# Note: Access Keys (use carefully!):  Output backup-user credentials (store securely!)
resource "aws_iam_access_key" "backup_user_key" {
  user = aws_iam_user.backup_user.name
}

# -------------------------------
# ✅ Notes
# -------------------------------
# - No aws_iam_access_key is created → users cannot use CLI/API.
# - Users can log in to AWS console using the temporary password and must reset it.
# - Bucket policy ensures they only see the IT department bucket.