import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_notification_event_ledger_end_to_end():
    """Verifies that submitting a problem and updating its status logs real SMS notification events."""
    # 1. Submit a problem
    payload = {
        "title": "Severe Water Contamination in Chas Village",
        "description": "High turbidity and arsenic levels in community drinking water well near Chas village school.",
        "location": "Chas Village Ward 2",
        "district": "Bokaro",
        "contact_phone": "+91 94311 02931"
    }
    
    submit_res = client.post("/api/problems/submit", json=payload)
    assert submit_res.status_code == 200
    prob_data = submit_res.json()
    ticket_code = prob_data["ticket_code"]
    prob_id = prob_data["id"]

    # 2. Fetch notifications for the ticket
    notif_res1 = client.get(f"/api/notifications/ticket/{ticket_code}")
    assert notif_res1.status_code == 200
    events1 = notif_res1.json()
    
    print(f"\n[Test] Initial Notification Events for {ticket_code}:")
    for ev in events1:
        print(f"  - [{ev['event_type']}] Channel: {ev['channel']} | Recipient: {ev['recipient_contact']} | Message: '{ev['message']}'")

    assert len(events1) >= 1
    assert events1[0]["event_type"] == "TICKET_CREATED"
    assert "SIH-JH-" in events1[0]["message"]

    # 3. Perform 2-Step Login to acquire JWT Bearer token
    step1_res = client.post("/api/auth/login-step1", json={
        "email": "gov@jharkhand.gov.in",
        "password": "gov123"
    })
    assert step1_res.status_code == 200
    otp = step1_res.json()["dev_otp"]

    step2_res = client.post("/api/auth/login-step2", json={
        "email": "gov@jharkhand.gov.in",
        "password": "gov123",
        "otp": otp
    })
    assert step2_res.status_code == 200
    token = step2_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 4. Update status and verify notification dispatch
    status_res = client.post(f"/api/problems/{prob_id}/status", json={"status": "In Progress"}, headers=headers)
    assert status_res.status_code == 200

    # 5. Verify status change notification event was appended
    notif_res2 = client.get(f"/api/notifications/ticket/{ticket_code}")
    events2 = notif_res2.json()

    print(f"\n[Test] Updated Notification Events after status change:")
    for ev in events2:
        print(f"  - [{ev['event_type']}] Channel: {ev['channel']} | Recipient: {ev['recipient_contact']} | Message: '{ev['message']}'")

    assert len(events2) >= 2
    event_types = [ev["event_type"] for ev in events2]
    assert "STATUS_CHANGED" in event_types
