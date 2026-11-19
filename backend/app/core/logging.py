import sys
from loguru import logger
from app.core.config import settings

def setup_logging():
    logger.remove()
    
    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
        "<level>{message}</level>"
    )
    
    if settings.ENVIRONMENT == "production":
        log_format = "{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} | {message}"
        # File logger in json/structured style might be better, but standard format for now
        logger.add(
            "logs/app.log",
            rotation="10 MB",
            retention="7 days",
            format=log_format,
            level=settings.LOG_LEVEL,
            serialize=True
        )
    
    # Console logger
    logger.add(
        sys.stderr,
        format=log_format,
        level=settings.LOG_LEVEL,
        colorize=True
    )

class TrafficLogger:
    @staticmethod
    def get_logger(context: str = "app"):
        return logger.bind(context=context)

# Initialize logging when imported
setup_logging()
