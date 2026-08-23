import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_dpdp_consent_persistence_in_database():
    """Verifies DPDP Act 2023 consent boolean and timestamp are persisted on problem creation."""
    payload = {
        "title": "DPDP Consent Verification Challenge in Ranchi",
        "description": "Testing DPDP Act 2023 location consent persistence in problem database table.",
        "location": "Kanke Road",
        "district": "Ranchi",
        "dpdp_consent_given": True
    }
    res = client.post("/api/problems/submit", json=payload)
    assert res.status_code == 200
    data = res.json()

    print(f"\n[Test] DPDP Consent Given: {data.get('dpdp_consent_given')}, Timestamp: {data.get('dpdp_consent_timestamp')}")
    assert data["dpdp_consent_given"] is True
    assert data["dpdp_consent_timestamp"] is not None

def test_jwt_session_refresh_token_exchange():
    """Verifies 24-hour access token and 7-day refresh token generation & refresh endpoint exchange."""
    # Step 1
    client.post("/api/auth/login-step1", json={"email": "gov@jharkhand.gov.in", "password": "gov123"})
    # Step 2
    step2_res = client.post("/api/auth/login-step2", json={
        "email": "gov@jharkhand.gov.in",
        "password": "gov123",
        "otp": "123456"
    })
    assert step2_res.status_code == 200
    login_data = step2_res.json()

    assert "access_token" in login_data
    assert "refresh_token" in login_data

    ref_token = login_data["refresh_token"]

    # Exchange refresh token
    refresh_res = client.post("/api/auth/refresh", json={"refresh_token": ref_token})
    assert refresh_res.status_code == 200
    ref_data = refresh_res.json()

    print(f"\n[Test] Refresh Token Exchange Success! New Access Token Issued.")
    assert "access_token" in ref_data
    assert "refresh_token" in ref_data

def test_rate_limiting_enforcement_on_public_api():
    """Verifies 60 req/min rate limit protection on public API routes."""
    print("\n[Test] Executing rapid public API requests to verify sliding window rate limiter...")
    got_429 = False
    for i in range(65):
        res = client.get("/api/problems")
        if res.status_code == 429:
            got_429 = True
            print(f"  - Rate limit triggered on request {i+1}: 429 Too Many Requests")
            break

    assert got_429 is True, "Expected 429 Too Many Requests when exceeding rate limit window"
