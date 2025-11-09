import os
import jwt
from datetime import datetime, timedelta
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, EmailStr
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# JWT Configuration
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable is required and must be set")
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 30
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

# ---------- Auth Helpers ----------
def _extract_bearer_token(authorization: Optional[str]) -> str:
    """Extract Bearer token from Authorization header"""
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Authorization header")
    return parts[1]

async def get_current_user(authorization: Annotated[Optional[str], Header()] = None):
    """Get current user from JWT token"""
    token = _extract_bearer_token(authorization)
    payload = verify_token(token, "access")
    
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

@auth_router.post("/login", response_model=TokenResponse)
def login(body: LoginBody):
    """Login user and return JWT tokens"""
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

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert to seconds
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

@auth_router.post("/refresh")
def refresh_token(refresh_token: str):
    """Refresh access token using refresh token"""
    try:
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

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@auth_router.get("/oauth/{provider}")
def oauth_login(provider: str):
    """Initiate OAuth login with specified provider"""
    if provider not in ["google", "github"]:
        raise HTTPException(status_code=400, detail="Unsupported OAuth provider")
    
    try:
        # Get OAuth URL from Supabase
        redirect_url = f"{os.environ.get('FRONTEND_ORIGIN', 'http://localhost:3000')}/auth/callback"
        
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
        
        return {"url": res.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth login failed: {str(e)}")

@auth_router.post("/oauth/callback")
def oauth_callback(request: dict):
    """Handle OAuth callback and return JWT tokens"""
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
                    raise HTTPException(status_code=401, detail="Failed to exchange code for session")
                
                user = res.user
                access_token = res.session.access_token
                refresh_token = res.session.refresh_token
            except Exception as e:
                raise HTTPException(status_code=401, detail=f"Code exchange failed: {str(e)}")
        
        # Handle direct token flow
        elif access_token:
            # Get user info from Supabase using the access token
            user_res = supabase.auth.get_user(access_token)
            user = user_res.user
            
            if not user:
                raise HTTPException(status_code=401, detail="Invalid OAuth token")
        else:
            raise HTTPException(status_code=400, detail="Missing code or access token")
        
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

        response_data = TokenResponse(
            access_token=jwt_access_token,
            refresh_token=jwt_refresh_token,
            expires_in=JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user={
                "id": user_id,
                "email": email,
                "first_name": token_data["first_name"],
                "last_name": token_data["last_name"],
                "profile_saved": profile_upserted
            }
        )
        
        return response_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"OAuth callback failed: {str(e)}")

@auth_router.post("/logout")
def logout(authorization: Annotated[Optional[str], Header()] = None):
    """Logout user and invalidate tokens"""
    try:
        # Sign out from Supabase
        supabase.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception:
        return {"message": "Logged out (client should clear tokens)"}
