import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Get DATABASE_URL from environment variables (e.g. Supabase PostgreSQL connection string)
raw_db_url = os.getenv("DATABASE_URL", "").strip()
use_sqlite_flag = os.getenv("USE_SQLITE", "false").lower() in ("true", "1", "t")

if raw_db_url and not use_sqlite_flag:
    # Convert legacy postgres:// to postgresql:// for SQLAlchemy compatibility
    if raw_db_url.startswith("postgres://"):
        raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)
    
    SQLALCHEMY_DATABASE_URL = raw_db_url
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )
else:
    # Local SQLite Fallback for offline development & automated testing
    SQLALCHEMY_DATABASE_URL = "sqlite:///./sih_platform.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
