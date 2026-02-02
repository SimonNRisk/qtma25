import os
import jwt
from datetime import datetime, timedelta
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
from pydantic import BaseModel, EmailStr
from supabase import create_client, Client
from dotenv import load_dotenv
from config import FRONTEND_ORIGIN, IS_DEV

load_dotenv()

# JWT Configuration
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable is required and must be set")
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
JWT_REFRESH_TOKEN_EXPIRE_DAYS = 7

# Supabase Configuration
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Supabase clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
admin: Optional[Client] = None
if SUPABASE_SERVICE_ROLE_KEY:
    admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Router for auth endpoints
auth_router = APIRouter(prefix="/auth", tags=["authentication"])

# ---------- Schemas ----------
class SignUpBody(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

class LoginBody(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict

class AuthResponse(BaseModel):
    """Response model for auth endpoints - tokens are set as HttpOnly cookies, not returned in body"""
    message: str = "Authentication successful"
    user: dict

# ---------- JWT Utilities ----------
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    """Create a JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str, token_type: str = "access"):
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != token_type:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

def get_cookie_domain():
    """Get cookie domain for cross-subdomain cookie sharing in production"""
    if IS_DEV:
        return None
    if not FRONTEND_ORIGIN:
        return None
    try:
        from urllib.parse import urlparse
        parsed = urlparse(FRONTEND_ORIGIN)
        hostname = parsed.hostname
        if hostname and '.' in hostname:
            # Get root domain (e.g., getastro.ca from api.getastro.ca or getastro.ca)
            parts = hostname.split('.')
            if len(parts) >= 2:
                root_domain = '.'.join(parts[-2:])  # Get last two parts (e.g., getastro.ca)
                return f".{root_domain}"  # Add leading dot for subdomain sharing
    except Exception:
        pass
    return None

# ---------- Auth Helpers ----------
async def get_current_user(
    access_token: Annotated[Optional[str], Cookie()] = None
):
    """Get current user from JWT token in HttpOnly cookie"""
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token. Please log in."
        )
    
    payload = verify_token(access_token, "access")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    # Return user data from JWT payload instead of calling Supabase
    return {
        "id": user_id,
        "email": payload.get("email", ""),
        "first_name": payload.get("first_name", ""),
        "last_name": payload.get("last_name", ""),
        "user_metadata": {
            "first_name": payload.get("first_name", ""),
            "last_name": payload.get("last_name", "")
        }
    }

# ---------- Auth Routes ----------
@auth_router.post("/signup")
def signup(body: SignUpBody):
    """Sign up a new user - requires email confirmation"""
    try:
        # Create user in Supabase (email confirmation disabled for now)
        res = supabase.auth.sign_up({
            "email": body.email,
            "password": body.password,
            "options": {
                "data": {
                    "first_name": body.first_name,
                    "last_name": body.last_name,
                }
            }
        })

        user = res.user
        user_id = getattr(user, "id", None) if user else None

        if not user_id:
            raise HTTPException(status_code=400, detail="Failed to create user")

        # Save profile to database if admin client is available
        profile_upserted = False
        if admin:
            try:
                admin.table("profiles").upsert(
                    {
                        "id": user_id,
                        "first_name": body.first_name,
                        "last_name": body.last_name,
                    },
                    on_conflict="id",
                ).execute()
                profile_upserted = True
            except Exception:
                profile_upserted = False

        # Return success message (email confirmation disabled)
        return {
            "message": "Account created successfully!",
            "user_id": user_id,
            "email": body.email,
            "profile_saved": profile_upserted,
            "email_confirmation_required": False
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@auth_router.post("/login", response_model=AuthResponse)
def login(body: LoginBody, response: Response):
    """Login user and set JWT tokens as HttpOnly cookies"""
    try:
        # Authenticate with Supabase
        res = supabase.auth.sign_in_with_password({
            "email": body.email, 
            "password": body.password
        })
        
        if not res.session or not res.user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        user = res.user
        user_id = getattr(user, "id", None)
        user_metadata = getattr(user, "user_metadata", {})
        
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")

        # Create JWT tokens
        token_data = {
            "sub": user_id,
            "email": body.email,
            "first_name": user_metadata.get("first_name", ""),
            "last_name": user_metadata.get("last_name", "")
        }
        
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token({"sub": user_id})

        # Set HttpOnly cookies for secure token storage
        # httponly=True: Prevents JavaScript from accessing the cookie (protects against XSS attacks)
        # secure: False in dev (localhost HTTP), True in production (HTTPS required)
        # samesite: "lax" works for same-site subdomains (api.getastro.ca <-> getastro.ca)
        # domain: Extract root domain from FRONTEND_ORIGIN to allow cross-subdomain cookie sharing
        # In dev, frontend uses Next.js API proxy (/api/proxy) so requests appear same-origin
        cookie_domain = get_cookie_domain()
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False if IS_DEV else True,  # False for localhost HTTP, True for production HTTPS
            samesite="lax",  # Lax works for same-site (subdomains share cookies)
            domain=cookie_domain,  # .getastro.ca allows cookie sharing across subdomains
            max_age=JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/"
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=False if IS_DEV else True,  # False for localhost HTTP, True for production HTTPS
            samesite="lax",  # Lax works for same-site (subdomains share cookies)
            domain=cookie_domain,  # .getastro.ca allows cookie sharing across subdomains
            max_age=JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
            path="/"
        )

        # Return user data only - tokens are set as HttpOnly cookies
        return AuthResponse(
            message="Authentication successful",
            user={
                "id": user_id,
                "email": body.email,
                "first_name": user_metadata.get("first_name", ""),
                "last_name": user_metadata.get("last_name", "")
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password")

@auth_router.post("/refresh", response_model=AuthResponse)
def refresh_token(refresh_token: Annotated[Optional[str], Cookie()] = None, response: Response = None):
    if response is None:
        response = Response()
    """Refresh access token using refresh token from cookie"""
    try:
        if not refresh_token:
            raise HTTPException(status_code=401, detail="Refresh token not found")
            
        payload = verify_token(refresh_token, "refresh")
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        # Get user info from Supabase
        user_res = supabase.auth.get_user(refresh_token)
        user = user_res.user
        user_metadata = getattr(user, "user_metadata", {})
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        # Create new access token
        token_data = {
            "sub": user_id,
            "email": getattr(user, "email", ""),
            "first_name": user_metadata.get("first_name", ""),
            "last_name": user_metadata.get("last_name", "")
        }
        
        access_token = create_access_token(token_data)

        # Set new access token as HttpOnly cookie
        cookie_domain = get_cookie_domain()
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False if IS_DEV else True,  # False for localhost HTTP, True for production HTTPS
            samesite="lax" if IS_DEV else "lax",  # Lax works for same-site (subdomains share cookies)
            domain=cookie_domain,  # .getastro.ca allows cookie sharing across subdomains
            max_age=JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/"
        )

        return AuthResponse(
            message="Token refreshed successfully",
            user={
                "id": user_id,
                "email": getattr(user, "email", ""),
                "first_name": user_metadata.get("first_name", ""),
                "last_name": user_metadata.get("last_name", "")
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@auth_router.get("/oauth/{provider}")
def oauth_login(provider: str):
    """Initiate OAuth login with specified provider"""
    if provider not in ["google", "github"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported OAuth provider: {provider}. Supported providers: google, github"
        )
    
    try:
        redirect_url = f"{FRONTEND_ORIGIN}/auth/callback"
        
        if provider == "google":
            res = supabase.auth.sign_in_with_oauth({
                "provider": "google",
                "options": {
                    "redirect_to": redirect_url
                }
            })
        elif provider == "github":
            res = supabase.auth.sign_in_with_oauth({
                "provider": "github", 
                "options": {
                    "redirect_to": redirect_url
                }
            })
        
        if not res or not hasattr(res, 'url') or not res.url:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to initiate {provider} OAuth login. Please try again."
            )
        
        return {"url": res.url}
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e).lower()
        if "configuration" in error_msg or "not configured" in error_msg:
            detail = f"{provider.capitalize()} OAuth is not properly configured. Please contact support."
        elif "network" in error_msg or "connection" in error_msg:
            detail = f"Network error connecting to {provider}. Please check your connection and try again."
        else:
            detail = f"Failed to initiate {provider} OAuth login. Please try again."
        
        raise HTTPException(status_code=500, detail=detail)

@auth_router.post("/oauth/callback", response_model=AuthResponse)
def oauth_callback(request: dict, response: Response):
    """Handle OAuth callback and set JWT tokens as HttpOnly cookies"""
    try:
        code = request.get("code")
        access_token = request.get("access_token")
        refresh_token = request.get("refresh_token")
        
        # Handle OAuth code flow (GitHub/Google)
        if code:
            # Exchange code for tokens using Supabase
            try:
                res = supabase.auth.exchange_code_for_session({"auth_code": code})
                if not res.session or not res.user:
                    raise HTTPException(
                        status_code=401, 
                        detail="OAuth authentication failed. The authorization code may have expired. Please try logging in again."
                    )
                
                user = res.user
                access_token = res.session.access_token
                refresh_token = res.session.refresh_token
            except HTTPException:
                raise
            except Exception as e:
                error_msg = str(e).lower()
                if "expired" in error_msg or "invalid" in error_msg:
                    detail = "OAuth authorization code expired or invalid. Please try logging in again."
                elif "network" in error_msg or "connection" in error_msg:
                    detail = "Network error during OAuth authentication. Please check your connection and try again."
                else:
                    detail = "OAuth authentication failed. Please try logging in again."
                raise HTTPException(status_code=401, detail=detail)
        
        # Handle direct token flow
        elif access_token:
            # Get user info from Supabase using the access token
            try:
                user_res = supabase.auth.get_user(access_token)
                user = user_res.user
                
                if not user:
                    raise HTTPException(status_code=401, detail="Invalid OAuth token. Please try logging in again.")
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(
                    status_code=401, 
                    detail="Failed to verify OAuth token. Please try logging in again."
                )
        else:
            raise HTTPException(
                status_code=400, 
                detail="Missing OAuth authorization code or token. Please try logging in again."
            )
        
        user_id = getattr(user, "id", None)
        user_metadata = getattr(user, "user_metadata", {})
        email = getattr(user, "email", "")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")

        # Create JWT tokens
        token_data = {
            "sub": user_id,
            "email": email,
            "first_name": user_metadata.get("full_name", "").split(" ")[0] if user_metadata.get("full_name") else "",
            "last_name": " ".join(user_metadata.get("full_name", "").split(" ")[1:]) if user_metadata.get("full_name") else ""
        }
        
        jwt_access_token = create_access_token(token_data)
        jwt_refresh_token = create_refresh_token({"sub": user_id})

        # Set HttpOnly cookies
        cookie_domain = get_cookie_domain()
        response.set_cookie(
            key="access_token",
            value=jwt_access_token,
            httponly=True,
            secure=False if IS_DEV else True,  # False for localhost HTTP, True for production HTTPS
            samesite="lax" if IS_DEV else "lax",  # Lax works for same-site (subdomains share cookies)
            domain=cookie_domain,  # .getastro.ca allows cookie sharing across subdomains
            max_age=JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/"
        )
        response.set_cookie(
            key="refresh_token",
            value=jwt_refresh_token,
            httponly=True,
            secure=False if IS_DEV else True,  # False for localhost HTTP, True for production HTTPS
            samesite="lax" if IS_DEV else "lax",  # Lax works for same-site (subdomains share cookies)
            domain=cookie_domain,  # .getastro.ca allows cookie sharing across subdomains
            max_age=JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
            path="/"
        )

        # Check if user has completed onboarding (has an account)
        # For OAuth, we allow login if they have onboarding data
        has_onboarding_data = False
        if admin:
            try:
                onboarding_result = admin.table("onboarding_context").select("id").eq("user_id", user_id).execute()
                has_onboarding_data = bool(onboarding_result.data)
            except Exception:
                has_onboarding_data = False

        # Save profile to database if admin client is available
        profile_upserted = False
        if admin:
            try:
                admin.table("profiles").upsert(
                    {
                        "id": user_id,
                        "first_name": token_data["first_name"],
                        "last_name": token_data["last_name"],
                        "email": email,
                    },
                    on_conflict="id",
                ).execute()
                profile_upserted = True
            except Exception:
                profile_upserted = False

        # Return user data only - tokens are set as HttpOnly cookies
        return AuthResponse(
            message="OAuth authentication successful",
            user={
                "id": user_id,
                "email": email,
                "first_name": token_data["first_name"],
                "last_name": token_data["last_name"],
                "profile_saved": profile_upserted
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"OAuth callback failed: {str(e)}")

@auth_router.post("/logout")
def logout(response: Response):
    """Logout user and clear HttpOnly cookies"""
    try:
        # Sign out from Supabase
        supabase.auth.sign_out()
    except Exception:
        # Continue even if Supabase sign out fails
        pass
    
    # Clear HttpOnly cookies - must use same domain as when setting them
    cookie_domain = get_cookie_domain()
    response.delete_cookie(
        key="access_token",
        path="/",
        domain=cookie_domain,  # Must match the domain used when setting the cookie
        samesite="lax",
        secure=False if IS_DEV else True
    )
    response.delete_cookie(
        key="refresh_token",
        path="/",
        domain=cookie_domain,  # Must match the domain used when setting the cookie
        samesite="lax",
        secure=False if IS_DEV else True
    )
    
    return {"message": "Logged out successfully"}
