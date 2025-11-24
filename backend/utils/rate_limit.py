from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, Tuple

from fastapi import Request, HTTPException, status


class RateLimiter:
    """In-memory rate limiter that tracks requests per IP address."""

    def __init__(self, max_requests: int = 10, window_seconds: int = 3600):
        """
        Initialize rate limiter.

        Args:
            max_requests: Maximum number of requests allowed in the time window
            window_seconds: Time window in seconds (default: 3600 = 1 hour)
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # IP -> (count, reset_time)
        self._store: Dict[str, Tuple[int, datetime]] = defaultdict(
            lambda: (0, datetime.now())
        )

    def check_rate_limit(self, ip: str) -> bool:
        """
        Check if IP has exceeded rate limit.

        Args:
            ip: Client IP address

        Returns:
            True if allowed, False if rate limited
        """
        now = datetime.now()
        count, reset_time = self._store[ip]

        # Reset if window has passed
        if now >= reset_time:
            self._store[ip] = (1, now + timedelta(seconds=self.window_seconds))
            return True

        # Check if limit exceeded
        if count >= self.max_requests:
            return False

        # Increment count
        self._store[ip] = (count + 1, reset_time)
        return True

    def get_remaining_requests(self, ip: str) -> int:
        """Get remaining requests for an IP in the current window."""
        count, reset_time = self._store[ip]
        now = datetime.now()

        if now >= reset_time:
            return self.max_requests

        return max(0, self.max_requests - count)


def get_client_ip(request: Request) -> str:
    """
    Get client IP address from request.

    Checks for X-Forwarded-For header (if behind proxy) and falls back to
    request.client.host.

    Args:
        request: FastAPI Request object

    Returns:
        Client IP address as string
    """
    # Check for forwarded IP (if behind proxy)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit_dependency(
    rate_limiter: RateLimiter, request: Request
) -> None:
    """
    FastAPI dependency for rate limiting.

    Raises HTTPException with 429 status if rate limit is exceeded.

    Args:
        rate_limiter: RateLimiter instance to use
        request: FastAPI Request object

    Raises:
        HTTPException: If rate limit is exceeded
    """
    client_ip = get_client_ip(request)
    if not rate_limiter.check_rate_limit(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later.",
        )


# Pre-configured rate limiters for different endpoints
# OpenAI endpoints: 10 requests per hour
openai_rate_limiter = RateLimiter(max_requests=10, window_seconds=3600)

# News endpoints: 10 requests per hour (more lenient since they're read-only)
news_rate_limiter = RateLimiter(max_requests=30, window_seconds=3600)

