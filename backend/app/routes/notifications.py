from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Notification
from ..schemas import NotificationResponse

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("/ticket/{ticket_code}", response_model=List[NotificationResponse])
def get_notifications_for_ticket(ticket_code: str, db: Session = Depends(get_db)):
    """
    Returns complete chronological SMS & lifecycle notification audit log for a given ticket code.
    """
    notifs = db.query(Notification).filter(
        Notification.ticket_code == ticket_code.upper()
    ).order_by(Notification.created_at.desc()).all()
    return notifs

@router.get("/recent", response_model=List[NotificationResponse])
def get_recent_notifications(limit: int = 10, db: Session = Depends(get_db)):
    """
    Returns the latest notification dispatch log events across all statewide challenges.
    """
    return db.query(Notification).order_by(Notification.created_at.desc()).limit(limit).all()
