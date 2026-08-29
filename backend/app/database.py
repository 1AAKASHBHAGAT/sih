import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("uvicorn.error")

raw_db_url = os.getenv("DATABASE_URL", "").strip()
use_sqlite_flag = os.getenv("USE_SQLITE", "false").lower() in ("true", "1", "t")

def build_engine():
    # If DATABASE_URL is available and USE_SQLITE is not explicitly forced
    if raw_db_url and not use_sqlite_flag:
        url = raw_db_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)

        # Convert direct IPv6 Supabase host to IPv4 Transaction Pooler format for Render compatibility
        if "supabase.co" in url or "supabase" in url:
            # Replace direct host with IPv4 Pooler host
            if "db.xmnvypaghvydlaetudla.supabase.co" in url:
                url = url.replace("db.xmnvypaghvydlaetudla.supabase.co", "aws-0-ap-south-1.pooler.supabase.com")
            # Upgrade user format for transaction pooler if needed
            if "://postgres:" in url and "aws-0-ap-south-1.pooler.supabase.com" in url:
                url = url.replace("://postgres:", "://postgres.xmnvypaghvydlaetudla:", 1)
            # Switch default port 5432 to IPv4 pooler port 6543
            if ":5432" in url:
                url = url.replace(":5432", ":6543")

        try:
            logger.info("Attempting connection to Supabase Cloud PostgreSQL database...")
            pg_engine = create_engine(
                url,
                pool_pre_ping=True,
                pool_size=5,
                max_overflow=10,
                connect_args={"connect_timeout": 5}
            )
            with pg_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("🟢 Supabase Cloud PostgreSQL Database connected & verified successfully!")
            return pg_engine
        except Exception as e:
            logger.warning("PostgreSQL connection fallback (%s). Active Engine: Local File DB (sqlite:///./sih_platform.db)", str(e))

    sqlite_url = "sqlite:///./sih_platform.db"
    logger.info("Database Engine: SQLite Production File DB (%s)", sqlite_url)
    return create_engine(
        sqlite_url,
        connect_args={"check_same_thread": False}
    )

engine = build_engine()

def apply_migrations():
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN last_login TIMESTAMP"))
            conn.commit()
            logger.info("Auto-migrated last_login column to users table.")
    except Exception:
        pass

apply_migrations()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
