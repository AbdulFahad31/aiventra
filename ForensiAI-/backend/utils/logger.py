import logging
import sys
from datetime import datetime

# Create logger
logger = logging.getLogger("forensiai")
logger.setLevel(logging.DEBUG)

# Console handler
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.DEBUG)

# Formatter
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
console_handler.setFormatter(formatter)

# Add handler
logger.addHandler(console_handler)


def log_info(message: str):
    """Log info message"""
    logger.info(message)


def log_error(message: str, error: Exception = None):
    """Log error message"""
    if error:
        logger.error(f"{message}: {str(error)}")
    else:
        logger.error(message)


def log_debug(message: str):
    """Log debug message"""
    logger.debug(message)
