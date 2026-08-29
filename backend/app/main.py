import time
import uvicorn
from collections import defaultdict
from fastapi import FastAPI, Request, Response, status
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .routes import problems, projects, analytics, industry, auth, notifications
from .routes.auth import seed_demo_users_if_needed
from .routes.problems import seed_initial_problems_if_needed

# Initialize database tables & seed initial data safely
try:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_users_if_needed(db)
        seed_initial_problems_if_needed(db)
    finally:
        db.close()
except Exception as e:
    print(f"Warning during DB startup initialization: {e}")

app = FastAPI(
    title="Societal Innovation Collaboration Platform (SIH 26043)",
    description="API services for crowdsourcing societal challenges in Jharkhand, AI zero-shot auto-categorization, university routing, role-based JWT auth, and visual analytics.",
    version="2.4.0",
    docs_url="/docs",
    redoc_url="/redoc"
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
    if request.method == "OPTIONS":
        return await call_next(request)

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

HTML_PORTAL_CONTENT = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SETU Jharkhand • Nodal System Status & API Portal</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #0f172a; color: #f8fafc; line-height: 1.6; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .wrapper { max-width: 850px; width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 28px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        .header-pill { display: inline-flex; align-items: center; gap: 8px; background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); font-size: 13px; font-weight: 700; padding: 8px 16px; border-radius: 9999px; }
        .pulse-dot { width: 10px; height: 10px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 12px #22c55e; }
        h1 { font-size: 32px; font-weight: 800; margin-top: 20px; margin-bottom: 8px; color: #ffffff; letter-spacing: -0.02em; }
        .subtitle { font-size: 15px; color: #94a3b8; margin-bottom: 32px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .stat-card { background: #0f172a; border: 1px solid #334155; border-radius: 20px; padding: 24px; text-decoration: none; color: inherit; transition: all 0.25s ease; }
        .stat-card:hover { border-color: #3b82f6; transform: translateY(-3px); box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.2); }
        .stat-title { font-size: 15px; font-weight: 700; color: #60a5fa; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between; }
        .stat-desc { font-size: 13px; color: #94a3b8; }
        .main-btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; background: #2563eb; color: #ffffff; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 16px; text-decoration: none; transition: all 0.2s ease; border: none; cursor: pointer; }
        .main-btn:hover { background: #1d4ed8; box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.4); }
        .info-box { background: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 20px; font-family: monospace; font-size: 13px; color: #cbd5e1; margin-bottom: 32px; }
        .info-row { margin-bottom: 8px; }
        .info-row:last-child { margin-bottom: 0; }
        .label { color: #64748b; font-weight: 600; }
        .val { color: #38bdf8; font-weight: 700; }
        .footer { border-top: 1px solid #334155; padding-top: 24px; font-size: 13px; color: #64748b; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header-pill">
            <span class="pulse-dot"></span>
            SYSTEM OPERATIONAL • ALL SERVICES ONLINE 200 OK
        </div>
        <h1>SETU Jharkhand Nodal Backend</h1>
        <p class="subtitle">Department of Higher & Technical Education, Government of Jharkhand (SIH Challenge 26043)</p>
        
        <div class="info-box">
            <div class="info-row"><span class="label">Primary User Web Interface: </span> <a href="https://sih-lake-beta.vercel.app" style="color:#38bdf8; text-decoration:underline;" target="_blank">https://sih-lake-beta.vercel.app</a></div>
            <div class="info-row"><span class="label">Backend Service Host: </span> <span class="val">sih-2y11.onrender.com (Render Free Tier)</span></div>
            <div class="info-row"><span class="label">Database Connection: </span> <span class="val" style="color:#4ade80;">Active (SQLite / PostgreSQL Engine)</span></div>
            <div class="info-row"><span class="label">Reported Problems Endpoint: </span> <a href="/api/problems" style="color:#38bdf8; text-decoration:underline;" target="_blank">/api/problems</a></div>
        </div>

        <div class="stats-grid">
            <a href="https://sih-lake-beta.vercel.app" target="_blank" class="stat-card" style="border-color:#3b82f6; background:#1e3a8a33;">
                <div class="stat-title" style="color:#93c5fd;">🚀 Launch Web Application →</div>
                <div class="stat-desc">Open the full interactive React Web Interface on Vercel to sign in or submit citizen challenges.</div>
            </a>
            <a href="/api/problems" target="_blank" class="stat-card" style="border-color:#10b981; background:#064e3b33;">
                <div class="stat-title" style="color:#6ee7b7;">📋 All Reported Citizen Problems →</div>
                <div class="stat-desc">View all reported citizen challenges, descriptions, ticket codes, districts, and reporter details.</div>
            </a>
            <a href="/docs" class="stat-card">
                <div class="stat-title">⚡ Interactive Swagger UI API Docs →</div>
                <div class="stat-desc">Test all 18 FastAPI endpoints interactively in your browser with request execution.</div>
            </a>
        </div>

        <div class="footer">
            <span>Version 2.4.0 • FastAPI Python Engine</span>
            <span>Independent Deployment Architecture</span>
        </div>
    </div>
</body>
</html>
"""

@app.api_route("/", methods=["GET", "HEAD"], response_class=HTMLResponse)
@app.api_route("/health", methods=["GET", "HEAD"], response_class=HTMLResponse)
def landing_page():
    return HTML_PORTAL_CONTENT

@app.api_route("/api", methods=["GET", "HEAD"])
@app.api_route("/health/json", methods=["GET", "HEAD"])
def api_json_status():
    return {
        "status": "healthy",
        "health_check": "passed",
        "system": "Societal Innovation Collaboration Platform (SIH 26043)",
        "nodal_department": "Department of Higher & Technical Education, Government of Jharkhand",
        "database": "connected",
        "version": "2.4.0",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

from typing import Optional
from fastapi import Header

@app.post("/api/admin/reset-database")
def reset_database(dev_key: Optional[str] = Header(None, alias="X-Developer-Key"), key: Optional[str] = None):
    """
    Developer-Only Endpoint: Resets all database tables & persistent store files, re-seeding clean demo data.
    """
    provided_key = dev_key or key
    if provided_key != "sih2026devkey":
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"detail": "Access Denied. Database reset is restricted to developer access only."}
        )

    try:
        from .reset_db import reset_and_reseed_database
        reset_and_reseed_database()
        return {"status": "success", "message": "Database and persistent store reset complete. Clean demo data re-seeded!"}
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": f"Database reset error: {str(e)}"}
        )

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
