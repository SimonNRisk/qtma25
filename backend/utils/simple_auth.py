import os
from typing import Annotated, Optional

from fastapi import Header, HTTPException, status


def verify_api_token(authorization: Annotated[Optional[str], Header()] = None) -> None:
    """
    Simple token-based authentication.

    Expects Authorization header: "Bearer <token>"
    Token must match API_TOKEN environment variable.

    Raises:
        HTTPException: If token is missing or invalid
    """
    api_token = os.getenv("API_TOKEN")
    
    if not api_token:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="API token not configured on server",
        )

    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format. Expected: Bearer <token>",
        )

    token = parts[1]
    if token != api_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API token",
        )

