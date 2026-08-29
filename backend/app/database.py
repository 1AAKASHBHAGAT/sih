import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("uvicorn.error")

raw_db_url = os.getenv("DATABASE_URL", "").strip()
use_sqlite_flag = os.getenv("USE_SQLITE", "false").lower() in ("true", "1", "t")

def build_engine():
    if raw_db_url and not use_sqlite_flag:
        url = raw_db_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        try:
            logger.info("Attempting connection to PostgreSQL database...")
            pg_engine = create_engine(
                url,
                pool_pre_ping=True,
                pool_size=5,
                max_overflow=10,
                connect_args={"connect_timeout": 5}
            )
            # Test connection
            with pg_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("PostgreSQL database connection verified successfully!")
            return pg_engine
        except Exception as e:
            logger.warning("PostgreSQL connection failed (%s). Falling back to local SQLite engine.", str(e))
    
    # Fallback SQLite Engine
    sqlite_url = "sqlite:///./sih_platform.db"
    logger.info("Initializing local SQLite database engine at %s", sqlite_url)
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
