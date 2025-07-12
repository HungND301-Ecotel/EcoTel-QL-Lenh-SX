''' This script performs a backup of a MongoDB database, compresses it, and uploads it to an AWS S3 bucket.
It uses environment variables to configure the MongoDB host, port, AWS region, and S3 bucket.
The backup is created using `mongodump`, compressed with `tar`, and uploaded to S3 using the `boto3` library.
After the upload, it verifies the file size to ensure the backup was successful and cleans up local files.
Make sure to have the necessary permissions and AWS credentials configured for `boto3` to access the S3 bucket.
'''
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
import boto3
import boto3.exceptions
from boto3.s3.transfer import TransferConfig # This is used for multipart uploads

from common import *

## Prepare Backup Directory and File Names
log_dir = f"/app/backup/logs"
backup_dir = f"/app/backup/dump"
# Ensure directories exist
os.makedirs(backup_dir, exist_ok=True)
os.makedirs(log_dir, exist_ok=True)

# Get current timestamp for backup naming
now = datetime.now(timezone.utc).strftime('%Y-%m-%d-%H%M%S')
backup_name = f"mongodump-{now}"
archive_path = f"{backup_dir}/{backup_name}.gz"
    
# Set the desired multipart threshold value (5GB)
GB = 1024 ** 3
config = TransferConfig(multipart_threshold=5*GB, max_concurrency=8)

# Call Set up logger from common.py
logger = setup_logger(name=__name__, log_file=f"{log_dir}/backup.log")

                
def run_backup():
    '''Perform the MongoDB backup, compress it, and upload to S3.'''
    
    ## Get Environment Variables
    MONGODB_HOST = os.getenv("MONGODB_HOST", "mongodb")
    MONGODB_PORT = os.getenv("MONGODB_PORT", "27017")
    MONGODB_USER = os.getenv("MONGODB_USER", "user")
    MONGODB_PASSWORD = os.getenv("MONGODB_PASSWORD", "password")
    MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "database")

    AWS_REGION = os.getenv("AWS_REGION", "ap-southeast-2")
    S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "my-backup-bucket")
    
    logger.info(f"Creating mongodump to {archive_path}")
    mongodump_command = [
        "mongodump",
        f"--host={MONGODB_HOST}",
        f"--port={MONGODB_PORT}",
        f"--username={MONGODB_USER}",
        f"--password={MONGODB_PASSWORD}",
        f"--authenticationDatabase=admin",
        f"--archive={archive_path}",
        f"--gzip",
    ]
    
    logger.info(f"Running command: {' '.join(mongodump_command)}")    
    subprocess.run(mongodump_command, check=True)
                                
    time.sleep(10)  # Wait a bit for everything to settle 

    # Create a unique S3 object name based on the DB and backup_name with timestamp
    s3_object_name = f"backups/mongodb/{MONGODB_DATABASE}/{backup_name}.gz"

    logger.info("Uploading to S3...")
    s3 = boto3.client("s3", region_name=AWS_REGION)
    try:
        s3.upload_file(archive_path, S3_BUCKET_NAME, s3_object_name,  Config=config)
    except Exception as e:
        logger.error(f"❌ Failed to upload backup to S3: {e}")
        raise
        
    
    logger.info("Verifying S3 upload...")
    response = s3.head_object(Bucket=S3_BUCKET_NAME, Key=s3_object_name)
    size = response['ContentLength']
    if size > 0:
        logger.info(f"✅ Backup uploaded successfully: {s3_object_name} ({size} bytes)")
    else:
        raise Exception("❌ Backup file exists but is empty!")    




############ Main Execution Block ############
if __name__ == "__main__":
    try:
        # Load env variables from env.list first before running the backup
        load_env_file('/app/src/env.list')
        
        # Invoke the backup function
        run_backup()
        
        # Clean up old backups after successful upload
        clean_old_files(backup_dir, "mongodump", logger)
        
    except Exception as e:
        logger.error(f"❌ Backup failed: {e}")
        sys.exit(1)
