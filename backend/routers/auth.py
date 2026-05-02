"""
auth.py — JWT authentication with safe demo terminal
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import hashlib, hmac, base64, json, time, os

router   = APIRouter()
security = HTTPBearer()

SECRET_KEY   = os.environ.get("JWT_SECRET", "devopsapp-super-secret-change-in-production")
ADMIN_PASS   = os.environ.get("ADMIN_PASSWORD", "")   # set via env var — never hardcoded
DEMO_PASS    = "demo123"

USERS = {
    "admin": {
        "role": "admin",
        "name": "Admin",
    },
    "demo": {
        "password_hash": hashlib.sha256(DEMO_PASS.encode()).hexdigest(),
        "role": "demo",
        "name": "Demo User",
    },
}

def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def _create_token(payload: dict) -> str:
    header  = _b64(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload["iat"] = int(time.time())
    payload["exp"] = int(time.time()) + 60 * 60 * 24
    body    = _b64(json.dumps(payload).encode())
    sig     = _b64(hmac.new(SECRET_KEY.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest())
    return f"{header}.{body}.{sig}"

def _verify_token(token: str) -> dict:
    try:
        header, body, sig = token.split(".")
        expected = _b64(hmac.new(SECRET_KEY.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, expected):
            raise ValueError("Invalid signature")
        payload = json.loads(base64.urlsafe_b64decode(body + "=="))
        if payload.get("exp", 0) < time.time():
            raise ValueError("Token expired")
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

def require_auth(credentials: HTTPAuthorizationCredentials = Depends(security)):
    return _verify_token(credentials.credentials)

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(body: LoginRequest):
    if body.username == "admin":
        if not ADMIN_PASS:
            raise HTTPException(status_code=401, detail="Admin login not configured on this server")
        pw_hash  = hashlib.sha256(body.password.encode()).hexdigest()
        expected = hashlib.sha256(ADMIN_PASS.encode()).hexdigest()
        if not hmac.compare_digest(pw_hash, expected):
            raise HTTPException(status_code=401, detail="Invalid username or password")
        user = USERS["admin"]
    elif body.username == "demo":
        pw_hash = hashlib.sha256(body.password.encode()).hexdigest()
        if not hmac.compare_digest(pw_hash, USERS["demo"]["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid username or password")
        user = USERS["demo"]
    else:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = _create_token({
        "sub":  body.username,
        "role": user["role"],
        "name": user["name"],
    })
    return {
        "token":    token,
        "username": body.username,
        "name":     user["name"],
        "role":     user["role"],
    }

@router.get("/me")
def me(user=Depends(require_auth)):
    return user

@router.post("/logout")
def logout():
    return {"ok": True}