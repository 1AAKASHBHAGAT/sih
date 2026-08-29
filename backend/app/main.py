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

@app.get("/", response_class=HTMLResponse)
def landing_page():
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SETU Jharkhand • API Services Portal</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Inter', sans-serif; background-color: #f8fafc; color: #0f172a; line-height: 1.5; padding: 40px 20px; }
            .container { max-width: 800px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
            .badge { display: inline-flex; align-items: center; gap: 6px; background: #dcfce7; color: #166534; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 9999px; border: 1px solid #bbf7d0; }
            .dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; display: inline-block; }
            h1 { font-size: 28px; font-weight: 800; margin-top: 16px; margin-bottom: 8px; color: #0f172a; }
            p { font-size: 14px; color: #475569; margin-bottom: 24px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 32px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; text-decoration: none; color: inherit; transition: all 0.2s ease; }
            .card:hover { border-color: #2563eb; background: #eff6ff; transform: translateY(-2px); }
            .card-title { font-size: 14px; font-weight: 700; color: #1e40af; margin-bottom: 4px; }
            .card-desc { font-size: 12px; color: #64748b; }
            .footer { border-top: 1px solid #f1f5f9; pt-20px; margin-top: 24px; padding-top: 20px; font-size: 12px; color: #94a3b8; display: flex; justify-between: space-between; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="badge"><span class="dot"></span> API Engine Operational • 200 OK</div>
            <h1>SETU Jharkhand Nodal API Portal</h1>
            <p>Department of Higher & Technical Education, Government of Jharkhand (SIH Problem Statement 26043)</p>
            
            <div class="grid">
                <a href="/docs" class="card">
                    <div class="card-title">⚡ Interactive Swagger UI →</div>
                    <div class="card-desc">Test all 18 REST endpoints interactively in your browser at /docs.</div>
                </a>
                <a href="/redoc" class="card">
                    <div class="card-title">📜 OpenAPI ReDoc Spec →</div>
                    <div class="card-desc">Inspect standard OpenAPI 3.0 schema definitions at /redoc.</div>
                </a>
                <a href="/health" class="card">
                    <div class="card-title">🟢 Health Monitor →</div>
                    <div class="card-desc">Check automated JSON status check endpoint at /health.</div>
                </a>
            </div>

            <div style="background: #f1f5f9; padding: 16px; border-radius: 12px; font-family: monospace; font-size: 12px; color: #334155;">
                Frontend Target: <strong>https://sih-lake-beta.vercel.app</strong><br>
                Backend API Base: <strong>https://sih-2y11.onrender.com/api</strong>
            </div>

            <div class="footer">
                <span>Version 2.4.0 • FastAPI Python Engine</span>
                <span>Render Independent Deployment</span>
            </div>
        </div>
    </body>
    </html>
    """

@app.get("/api")
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "system": "Societal Innovation Collaboration Platform (SIH 26043)",
        "nodal_department": "Department of Higher & Technical Education, Government of Jharkhand",
        "version": "2.4.0"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
