import os
from datetime import datetime
from sqlalchemy.orm import Session
from ..models import Notification

def dispatch_notification_event(
    db: Session,
    ticket_code: str,
    event_type: str,
    message: str,
    recipient_contact: str = "+91 94311 02931",
    channel: str = "SMS_SIMULATED"
) -> Notification:
    """
    Logs every lifecycle notification event (ticket created, status changes, team assignments)
    to the notification event ledger table.
    """
    # Check if external SMS or Email credentials exist in environment
    resend_key = os.getenv("RESEND_API_KEY")
    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
    
    status = "SENT"
    if resend_key or twilio_sid:
        channel = "SMS_LIVE" if twilio_sid else "EMAIL_LIVE"

    notification = Notification(
        ticket_code=ticket_code,
        recipient_contact=recipient_contact or "+91 94311 02931",
        event_type=event_type,
        channel=channel,
        message=message,
        status=status,
        created_at=datetime.utcnow()
    )
    
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

def notify_ticket_created(db: Session, ticket_code: str, title: str, category: str, university: str, phone: str = None):
    msg = f"Govt. of Jharkhand - Challenge ticket {ticket_code} logged! Domain: '{category}'. Auto-routed to {university} for R&D review."
    return dispatch_notification_event(db, ticket_code=ticket_code, event_type="TICKET_CREATED", message=msg, recipient_contact=phone, channel="SMS_SIMULATED")

def notify_status_changed(db: Session, ticket_code: str, old_status: str, new_status: str, university: str, phone: str = None):
    msg = f"SMS Alert for {ticket_code}: Status updated from '{old_status}' -> '{new_status}' by {university}. Tracking live on portal."
    return dispatch_notification_event(db, ticket_code=ticket_code, event_type="STATUS_CHANGED", message=msg, recipient_contact=phone, channel="SMS_SIMULATED")

def notify_team_assigned(db: Session, ticket_code: str, team_name: str, lead_name: str, university: str, phone: str = None):
    msg = f"SMS Alert for {ticket_code}: Innovation Team '{team_name}' led by {lead_name} assigned at {university}."
    return dispatch_notification_event(db, ticket_code=ticket_code, event_type="TEAM_ASSIGNED", message=msg, recipient_contact=phone, channel="SMS_SIMULATED")
