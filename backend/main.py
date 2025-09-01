import os
from typing import Annotated, Optional

from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Schemas ----------
class SignUpBody(BaseModel):
    email: EmailStr
    password: str
    # You can extend with metadata for your "profiles" table if you like
    # e.g. full_name: Optional[str] = None

class LoginBody(BaseModel):
    email: EmailStr
    password: str

# ---------- Auth helpers ----------
def _extract_bearer_token(authorization: Optional[str]) -> str:
    """
    Expect: Authorization: Bearer <access_token>
    """
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Authorization header")
    return parts[1]

async def get_current_user(authorization: Annotated[Optional[str], Header()] = None):
    """
    Validate the Supabase access token by asking Supabase Auth who this user is.
    This keeps your backend stateless.
    """
    token = _extract_bearer_token(authorization)
    try:
        user_res = supabase.auth.get_user(token)
        # supabase-py returns a dict with 'user' on success, or raises on invalid
        user = user_res.user
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return user
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

# ---------- Routes ----------
@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI"}

@app.get("/api/hello")
def say_hello():
    return {"message": "Hello from /api/hello"}

@app.post("/auth/signup")
def signup(body: SignUpBody):
    """
    Public sign-up using the ANON key.
    Supabase will hash+store password and send confirmation email (if enabled in your project).
    """
    try:
        res = supabase.auth.sign_up({"email": body.email, "password": body.password})
        # res: AuthResponse (user, session)
        return {
            "user": res.user.model_dump() if res.user else None,
            "session": res.session.model_dump() if res.session else None,
            "message": "Check your email to confirm your account if confirmation is enabled."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/login")
def login(body: LoginBody):
    """
    Returns access_token and refresh_token for the frontend to store (e.g., httpOnly cookies or memory+refresh).
    """
    try:
        res = supabase.auth.sign_in_with_password({"email": body.email, "password": body.password})
        if not res.session:
            # Could happen if email confirmation is required and not yet done
            raise HTTPException(status_code=400, detail="No active session (is your email confirmed?)")
        return {
            "access_token": res.session.access_token,
            "refresh_token": res.session.refresh_token,
            "user": res.user.model_dump() if res.user else None,
        }
    except Exception as e:
        # For security, don't leak whether email exists vs password wrong; adjust if you want more specificity.
        raise HTTPException(status_code=401, detail="Invalid email or password")

@app.post("/auth/logout")
def logout(authorization: Annotated[Optional[str], Header()] = None):
    """
    Revoke the refresh token and end the session. The frontend should also clear its stored tokens.
    """
    token = _extract_bearer_token(authorization)
    try:
        # supabase-py will revoke session associated with token (refresh token is required for full revoke).
        supabase.auth.sign_out()
        return {"message": "Logged out"}
    except Exception:
        # Even if revoke fails, instruct the client to clear tokens.
        return {"message": "Logged out (client should clear tokens)"}

@app.get("/me")
def me(user=Depends(get_current_user)):
    """
    Example protected route. Call with Authorization: Bearer <access_token>
    """
    return {"user": user.model_dump()}

# Example protected data route
@app.get("/protected/data")
def protected_data(user=Depends(get_current_user)):
    return {"secret": f"Top secret for user {user.email}"}
