import time
import uvicorn
from collections import defaultdict
from fastapi import FastAPI, Request, Response, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .routes import problems, projects, analytics, industry, auth, notifications
from .routes.auth import seed_demo_users_if_needed
from .routes.problems import seed_initial_problems_if_needed

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Seed default demo accounts and initial diverse university challenges
db = SessionLocal()
try:
    seed_demo_users_if_needed(db)
    seed_initial_problems_if_needed(db)
finally:
    db.close()

app = FastAPI(
    title="Societal Innovation Collaboration Platform (SIH 26043)",
    description="API services for crowdsourcing societal challenges in Jharkhand, AI zero-shot auto-categorization, university routing, role-based JWT auth, and visual analytics.",
    version="2.4.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory sliding window rate limiter: 60 requests per 60 seconds per IP (PRD NFR Section 7.2)
RATE_LIMIT_WINDOW = 60.0 # seconds
MAX_REQUESTS_PER_WINDOW = 60 # max requests per IP
_ip_request_history = defaultdict(list)

@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    """Enforces 60 requests/minute per IP rate limiting on all public & API endpoints."""
    path = request.url.path
    if path.startswith("/api/"):
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        
        # Filter timestamps outside 60-second window
        history = [ts for ts in _ip_request_history[client_ip] if now - ts < RATE_LIMIT_WINDOW]
        _ip_request_history[client_ip] = history
        
        if len(history) >= MAX_REQUESTS_PER_WINDOW:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Rate limit exceeded (60 requests/min per IP). Please wait before retrying."}
            )
        
        _ip_request_history[client_ip].append(now)
    
    response = await call_next(request)
    return response

# Register routes
app.include_router(auth.router)
app.include_router(problems.router)
app.include_router(projects.router)
app.include_router(analytics.router)
app.include_router(industry.router)
app.include_router(notifications.router)

@app.get("/")
@app.get("/api")
@app.get("/health")
def root():
    return {
        "status": "online",
        "system": "Societal Innovation Collaboration Platform (SIH 26043)",
        "nodal_department": "Department of Higher & Technical Education, Government of Jharkhand",
        "version": "2.4.0"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
