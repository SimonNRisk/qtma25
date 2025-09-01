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
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")  # optional, but recommended for server writes
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")

# Public client (anon key): good for auth flows and reads with RLS
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Admin client (service role): bypasses RLS for trusted server-side writes
admin: Optional[Client] = None
if SUPABASE_SERVICE_ROLE_KEY:
    admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

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
    first_name: str
    last_name: str

class LoginBody(BaseModel):
    email: EmailStr
    password: str

class ProfileBody(BaseModel):
    first_name: str = ""
    last_name: str = ""

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
    Stores first/last name in user metadata and (if service role is configured) upserts into public.profiles.
    """
    try:
        # 1) Create auth user and store names in user metadata
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

        # res: AuthResponse (user, session)
        user = res.user
        user_id = getattr(user, "id", None) if user else None

        # 2) If we have service role, immediately upsert to profiles (bypasses RLS safely on server)
        profile_upserted = False
        if admin and user_id:
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
                # Don't fail signup on a profile write error
                profile_upserted = False

        return {
            "user": user.model_dump() if user else None,
            "session": res.session.model_dump() if res.session else None,
            "profile_saved": profile_upserted,
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
            raise HTTPException(status_code=400, detail="No active session (is your email confirmed?)")
        return {
            "access_token": res.session.access_token,
            "refresh_token": res.session.refresh_token,
            "user": res.user.model_dump() if res.user else None,
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid email or password")

@app.post("/auth/logout")
def logout(authorization: Annotated[Optional[str], Header()] = None):
    """
    Revoke the refresh token and end the session. The frontend should also clear its stored tokens.
    """
    _ = _extract_bearer_token(authorization)  # we don't strictly need it for sign_out()
    try:
        supabase.auth.sign_out()
        return {"message": "Logged out"}
    except Exception:
        return {"message": "Logged out (client should clear tokens)"}

@app.get("/me")
def me(user=Depends(get_current_user)):
    """
    Example protected route. Call with Authorization: Bearer <access_token>
    """
    return {"user": user.model_dump()}