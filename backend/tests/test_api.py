import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.ai_service import classify_issue

client = TestClient(app)

def test_create_problem_valid_data():
    """
    Test that POST /api/problems/submit with valid data returns 200/201
    and creates a problem record with an auto-generated ticket code and university routing.
    """
    payload = {
        "title": "Automated Test Groundwater Contamination in Chas",
        "description": "High iron and arsenic turbidity measured across 4 panchayats in Bokaro district.",
        "user_category": "Water Management",
        "location": "Chas High School Area",
        "district": "Bokaro",
        "reporter_name": "Test Runner",
        "contact_phone": "9876543210"
    }
    response = client.post("/api/problems/submit", json=payload)
    assert response.status_code in [200, 201]
    data = response.json()
    assert "ticket_code" in data
    assert data["ticket_code"].startswith("SIH-JH-")
    assert "assigned_university" in data
    assert data["title"] == payload["title"]

def test_create_problem_missing_fields_validation_error():
    """
    Test that POST /api/problems/submit with missing required fields (e.g. missing title/description)
    returns HTTP 422 Unprocessable Entity, not a server crash.
    """
    invalid_payload = {
        "user_category": "Water Management",
        "location": "Chas Village"
        # Missing title & description
    }
    response = client.post("/api/problems/submit", json=invalid_payload)
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data

def test_ai_classification_pipeline_output_shape():
    """
    Test that the classification pipeline returns a predicted theme + confidence score + source engine
    in the expected dictionary shape.
    """
    result = classify_issue(
        title="High Turbidity in Drinking Water Well",
        description="Villagers reporting dark rust discolored drinking water and tube well failure.",
        user_category="Water Management"
    )
    assert isinstance(result, dict)
    assert "category" in result
    assert "confidence" in result
    assert "source" in result
    assert isinstance(result["confidence"], float)
    assert result["category"] == "Water Management"

def test_protected_route_auth_challenge():
    """
    Test that protected route /api/analytics/summary returns 401 Unauthorized
    when called without a valid JWT token, and 200 OK when authenticated as Government official.
    """
    # 1. Unauthenticated Request -> 401
    unauth_response = client.get("/api/analytics/summary")
    assert unauth_response.status_code == 401

    # 2. Perform 2-Step Login to acquire JWT Bearer token
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

    # 3. Authenticated Request -> 200 OK
    auth_response = client.get("/api/analytics/summary", headers={
        "Authorization": f"Bearer {token}"
    })
    assert auth_response.status_code == 200
    analytics_data = auth_response.json()
    assert "total_submitted" in analytics_data
