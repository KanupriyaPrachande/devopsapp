from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import metrics, containers, logs, terminal, auth

app = FastAPI(title="DevOpsApp API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,       prefix="/api/auth",       tags=["auth"])
app.include_router(metrics.router,    prefix="/api/metrics",    tags=["metrics"])
app.include_router(containers.router, prefix="/api/containers", tags=["containers"])
app.include_router(logs.router,       prefix="/api/logs",       tags=["logs"])
app.include_router(terminal.router,   prefix="/terminal",       tags=["terminal"])

@app.get("/")
def root():
    return {"status": "ok", "app": "DevOpsApp", "version": "2.0.0"}

@app.get("/api/health")
def health():
    return {"status": "healthy"}