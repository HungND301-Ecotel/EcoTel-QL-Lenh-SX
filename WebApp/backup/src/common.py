import os
import glob
import logging
import logging.handlers


def setup_logger(name='app', log_file='backup.log', log_level=logging.INFO):
    """Set up a logger with rotating file handler."""
    
    ## Configure logger with rotating file handler
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler(),
            logging.handlers.RotatingFileHandler(
                log_file,
                maxBytes=5 * 1024 * 1024,  # 5 MB
                backupCount=5
            )
        ]
    )

    logger = logging.getLogger(name)    
    
    return logger


def load_env_file(filepath):
    '''Load environment variables from a file into the os.environ dictionary.'''
    with open(filepath, 'r') as f:
        for line in f:
            # Skip comments and blank lines
            line = line.strip()
            if not line or line.startswith('#'):
                continue

            if '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

def clean_old_files(dir, prefix, logger):
    '''Clean up old files in the backup directory.'''
    try:
        logger.info("Cleaning up old files...")
        
        # Get list of old files sorted by modified time (newest first)
        pattern = os.path.join(dir, f"{prefix}-*.gz")
        old_files = sorted(glob.glob(pattern), key=os.path.getmtime, reverse=True)

        logger.info(f"Keep the latest file {old_files[0]} and delete the rest!!")
        for old_file in old_files[1:]:
            logger.warning(f"Deleting old file(s): {old_file}")
            os.remove(old_file)
        
    except Exception as e:
        logger.error(f"❌ Failed to clean up old files: {e}")                