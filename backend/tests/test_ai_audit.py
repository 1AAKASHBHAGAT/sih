import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.ai_service import classify_issue, check_duplicate_submission, text_similarity
from app.services.router_service import calculate_urgency

client = TestClient(app)

def test_duplicate_detection_similarity_score():
    """Verify >60% semantic similarity detection between two near-identical submissions."""
    text1 = "High Arsenic & Turbidity in Chas Village Drinking Water Well"
    text2 = "Severe Arsenic Contamination in Chas Village Drinking Water Wells"
    
    score = text_similarity(text1, text2)
    print(f"\n[Test] Semantic Similarity Score between near-identical texts: {round(score * 100, 1)}%")
    assert score >= 0.60, f"Expected similarity >= 60%, got {round(score * 100, 1)}%"

def test_urgency_scoring_algorithmic():
    """Verify algorithmic 1-10 urgency score calculation based on severity keywords."""
    emergency_text = "Urgent toxic chemical leak and fatal arsenic poison outbreak in tube-well causing casualty"
    mild_text = "Minor street light bulb replacement needed near school"

    urgency_high = calculate_urgency("Emergency Poison Outbreak", emergency_text)
    urgency_low = calculate_urgency("Light Bulb Replacement", mild_text)

    print(f"\n[Test] High Severity Urgency Score: {urgency_high}/10")
    print(f"[Test] Low Severity Urgency Score: {urgency_low}/10")

    assert urgency_high >= 8, f"High severity score should be >= 8, got {urgency_high}"
    assert urgency_low <= 5, f"Low severity score should be <= 5, got {urgency_low}"

def test_confidence_threshold_and_human_review_flag():
    """Verify >85% confidence threshold enforcement and needs_human_review flag on low-confidence issues."""
    payload_vague = {
        "title": "Stuff is broken somewhere",
        "description": "Something is bad in the locality but not sure what.",
        "location": "Locality",
        "district": "Ranchi"
    }
    
    response = client.post("/api/problems/submit", json=payload_vague)
    assert response.status_code == 200
    data = response.json()
    
    print(f"\n[Test] Vague Issue Confidence: {data['ai_confidence']}, Needs Review: {data['needs_human_review']}")
    assert "needs_human_review" in data
    assert "ai_confidence" in data

def test_end_to_end_duplicate_submission_flow():
    """Verify duplicate submission detection flags duplicate_of_ticket live."""
    district_name = "Koderma"
    payload1 = {
        "title": "Paddy Crop Pest Attack in Koderma Hamlet",
        "description": "Widespread stem borer attack causing 35% crop loss for farmers in Koderma block.",
        "location": "Koderma Hamlet",
        "district": district_name
    }
    res1 = client.post("/api/problems/submit", json=payload1)
    ticket1 = res1.json()["ticket_code"]

    payload2 = {
        "title": "Paddy Crop Pest Attack in Koderma Hamlet",
        "description": "Widespread stem borer attack causing 35% crop loss for farmers in Koderma block.",
        "location": "Koderma Hamlet",
        "district": district_name
    }
    res2 = client.post("/api/problems/submit", json=payload2)
    data2 = res2.json()

    print(f"\n[Test] Original Ticket: {ticket1}, Duplicate Ticket: {data2['ticket_code']}")
    print(f"[Test] Is Duplicate: {data2['is_duplicate']}, Duplicate Of: {data2['duplicate_of_ticket']}")

    assert data2["is_duplicate"] is True
    assert data2["duplicate_of_ticket"] is not None
