# /app/restore.py
'''This script downloads an compressed backup dump from AWS S3 bucket and 
performs a restore for a MongoDB database.
'''

import os
import sys
import subprocess
import boto3
import boto3.exceptions
from common import *

## Prepare Restore Directory and File Names
restore_dir = f"/app/restore"

# Ensure directories exist
os.makedirs(restore_dir, exist_ok=True)

# Call setup logger from common.py
logger = setup_logger(name=__name__, log_file='/app/restore/restore.log')

def restore_backup():
    '''Restore a backup from S3 to the MongoDB database.'''

    # MongoDB credentials
    MONGODB_HOST = os.getenv("MONGODB_HOST", "mongodb")
    MONGODB_PORT = os.getenv("MONGODB_PORT", "27017")
    MONGODB_USER = os.getenv("MONGO_INITDB_ROOT_USERNAME", "user")
    MONGODB_PASSWORD = os.getenv("MONGO_INITDB_ROOT_PASSWORD", "password")
    MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "database")
    MONGODB_AUTH_DB = os.getenv("MONGODB_AUTH_DB", "admin")
    
    AWS_REGION = os.getenv("AWS_REGION", "ap-southeast-2")
    S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "my-backup-bucket")

    # folder path like "backups/mongodb/{MONGODB_DATABASE}/mongodump-"
    BACKUP_PREFIX = f"backups/mongodb/{MONGODB_DATABASE}/mongodump-" 

    logger.info(f"✅ BACKUP_PREFIX: {BACKUP_PREFIX}")
    # --- Step 1: Find the latest backup in S3 ---
    s3 = boto3.client("s3", region_name=AWS_REGION)

    response = s3.list_objects_v2(Bucket=S3_BUCKET_NAME, Prefix=BACKUP_PREFIX)
    files = response.get("Contents", [])

    # Filter only .gz files and sort by LastModified
    backup_files = [f for f in files if f['Key'].endswith('.gz')]
    if not backup_files:
        raise Exception("❌ No backup .gz files found in S3!")

    latest_file = sorted(backup_files, key=lambda x: x['LastModified'], reverse=True)[0]
    latest_key = latest_file['Key']
    local_path = os.path.join(restore_dir, os.path.basename(latest_key))

    logger.info(f"✅ Latest backup: {latest_key}")
    logger.info(f"⬇️ Downloading to: {local_path}")

    # --- Step 2: Download from S3 ---
    s3.download_file(S3_BUCKET_NAME, latest_key, local_path)
    logger.info("✅ Download complete.")

    # --- Step 3: Restore using mongorestore ---
    restore_cmd = [
        "mongorestore",
        "--drop",
        f"--verbose",
        f"--host={MONGODB_HOST}",
        f"--port={MONGODB_PORT}",
        f"--username={MONGODB_USER}",
        f"--password={MONGODB_PASSWORD}",
        f"--authenticationDatabase={MONGODB_AUTH_DB}",
        "--gzip",
        f"--archive={local_path}",
        "--noIndexRestore",
        "--noOptionsRestore"
    ]

    logger.info("🔄 Restoring MongoDB...")
    subprocess.run(restore_cmd, check=True)
    logger.info("✅ MongoDB restore complete.")

    
    
############ Main Execution Block ############
if __name__ == "__main__":
    try:
        # Load env variables from env.list first before running the restore
        load_env_file('/app/src/env.list')
        
        # Restore from the backup
        restore_backup()
        
        # clean up the downloaded backup file
        clean_old_files(restore_dir, "mongodump", logger)
        
    except Exception as e:
        logger.error(f"❌ Restore failed: {e}")
        sys.exit(1)