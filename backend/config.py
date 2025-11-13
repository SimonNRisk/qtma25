"""
Environment configuration utilities
"""
import os
from dotenv import load_dotenv

# Load environment variables before checking them
load_dotenv()

# Environment detection
ENVIRONMENT = os.environ.get("ENVIRONMENT", "prod").lower()
IS_DEV = ENVIRONMENT == "dev"

# Frontend origin configuration
if IS_DEV:
    FRONTEND_ORIGIN = "http://localhost:3000"
else:
    FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN")
    if not FRONTEND_ORIGIN:
        raise ValueError(
            "FRONTEND_ORIGIN environment variable is required when ENVIRONMENT is not 'dev'"
        )

# CORS allowed origins
def get_cors_origins():
    """Get list of allowed CORS origins based on environment"""
    origins = [FRONTEND_ORIGIN]
    if IS_DEV:
        # Always allow localhost variants in dev mode
        if "http://localhost:3000" not in origins:
            origins.append("http://localhost:3000")
        if "http://127.0.0.1:3000" not in origins:
            origins.append("http://127.0.0.1:3000")
    return origins

