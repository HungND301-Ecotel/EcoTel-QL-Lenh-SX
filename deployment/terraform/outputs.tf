output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.backup_bucket.id
}

output "backup_user_access_key_id" {
  description = "IAM user access key ID"
  value       = aws_iam_access_key.backup_user_key.id
  sensitive   = true
}

output "backup_user_secret_access_key" {
  description = "IAM user secret access key"
  value       = aws_iam_access_key.backup_user_key.secret
  sensitive   = true
}

# -------------------------------
# Output the AWS Console Login URL
# -------------------------------
# Data source: fetch existing alias
data "aws_iam_account_alias" "current" {}

# Output: use alias in login URL
output "iam_login_url" {
  value       = "https://${data.aws_iam_account_alias.current.account_alias}.signin.aws.amazon.com/console"
  description = "AWS IAM Console login URL using the account alias"
}

# Output the generated temporary password for IT users
# Temporary passwords for each user (sensitive)
output "it_user_temp_passwords" {
  value = {
    for username, profile in aws_iam_user_login_profile.it_users_console :
    username => profile.password
  }
  sensitive   = true
  description = "Temporary passwords for IT users (share securely!)"
}

### output block for S3 Storage Lens Dashboard
output "s3_storage_lens_dashboard_url" {
  description = "URL for IT users to access the free S3 Storage Lens dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/s3/storagelens/home?region=${var.aws_region}#/dashboard/default-account-dashboard"
}