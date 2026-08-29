import os
import json
import logging
from sqlalchemy.orm import Session
from .database import engine, SessionLocal, Base
from .models import User, Problem, Project, Milestone, CSRPledge, Notification
from .routes.auth import seed_demo_users_if_needed
from .routes.problems import seed_initial_problems_if_needed
from .services.persistent_store import STORE_DIR, USERS_FILE, PROBLEMS_FILE

logger = logging.getLogger("uvicorn.error")

def reset_and_reseed_database():
    """
    Completely resets all database tables and disk persistent stores,
    then re-seeds clean initial demo data.
    """
    logger.info("🧹 Resetting all database tables and persistent file stores...")

    # 1. Clear JSON persistent store files
    try:
        if os.path.exists(USERS_FILE):
            os.remove(USERS_FILE)
        if os.path.exists(PROBLEMS_FILE):
            os.remove(PROBLEMS_FILE)
    except Exception as e:
        logger.warning("Error clearing persistent store files: %s", e)

    # 2. Re-create all SQLAlchemy database tables
    try:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        logger.warning("Error dropping/re-creating tables: %s", e)

    # 3. Seed clean initial demo accounts & problem catalog
    db: Session = SessionLocal()
    try:
        seed_demo_users_if_needed(db)
        seed_initial_problems_if_needed(db)
        logger.info("✅ Database reset complete. Initial demo accounts & problem catalog seeded!")
    finally:
        db.close()

if __name__ == "__main__":
    reset_and_reseed_database()
