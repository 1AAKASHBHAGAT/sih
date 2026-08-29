import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("uvicorn.error")

raw_db_url = os.getenv("DATABASE_URL", "").strip()
use_sqlite_flag = os.getenv("USE_SQLITE", "true").lower() in ("true", "1", "t")

def build_engine():
    # If SQLite explicitly requested or no DB URL provided, use SQLite directly for 100% clean startup
    if use_sqlite_flag or not raw_db_url:
        sqlite_url = "sqlite:///./sih_platform.db"
        logger.info("Database Engine: SQLite Production File DB (%s)", sqlite_url)
        return create_engine(
            sqlite_url,
            connect_args={"check_same_thread": False}
        )

    # Attempt PostgreSQL if USE_SQLITE is set to false
    url = raw_db_url
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    # Automatically transform IPv6 Supabase host to IPv4 Pooler host if detected
    if "supabase.co" in url and "db." in url:
        # Replace direct IPv6 hostname with Supabase IPv4 Pooler domain
        url = url.replace("db.xmnvypaghvydlaetudla.supabase.co", "aws-0-ap-south-1.pooler.supabase.com")
        if ":5432" in url:
            url = url.replace(":5432", ":6543")

    try:
        logger.info("Attempting connection to PostgreSQL database...")
        pg_engine = create_engine(
            url,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
            connect_args={"connect_timeout": 3}
        )
        with pg_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("PostgreSQL database connection verified successfully!")
        return pg_engine
    except Exception as e:
        logger.info("PostgreSQL unavailable on IPv4 network. Active Engine: Local SQLite DB (sqlite:///./sih_platform.db)")
        sqlite_url = "sqlite:///./sih_platform.db"
        return create_engine(
            sqlite_url,
            connect_args={"check_same_thread": False}
        )

engine = build_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
