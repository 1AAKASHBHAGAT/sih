"""
router_service.py — SIH 26043 University Routing & Urgency Scoring

Urgency scoring uses:
  1. Trained PyTorch UrgencyNet model (if models/urgency_scorer.pt exists)
  2. Keyword-rule fallback (if model file missing or inference fails)

Set URGENCY_MODE=model to force model, URGENCY_MODE=rules to force rules.
Default: auto (model if checkpoint exists, rules otherwise).
"""

import os
import re
from typing import Optional

# ---------------------------------------------------------------------------
# University routing map
# ---------------------------------------------------------------------------
UNIVERSITY_ROUTING_MAP = {
    "Water Management":     "IIT (ISM) Dhanbad - Water Research Center",
    "Agriculture":          "Birsa Agricultural University, Ranchi",
    "Healthcare":           "Central University of Jharkhand (CUJ) - Health Tech Hub",
    "Education":            "Ranchi University - Digital Innovation Lab",
    "Sanitation & Waste":   "NIT Jamshedpur - Environmental Engineering Department",
    "Infrastructure":       "BIT Mesra - Civil & Renewable Energy Center",
    "Environment":          "Central University of Jharkhand (CUJ) - Environmental Sciences",
    "Accessibility":        "Ranchi University - Inclusive Education Centre",
    "Energy":               "BIT Mesra - Renewable Energy Research Lab",
}

DISTRICT_COORDINATES = {
    "Ranchi":     (23.3441, 85.3096),
    "Dhanbad":    (23.7957, 86.4304),
    "Bokaro":     (23.6693, 86.1511),
    "Jamshedpur": (22.8046, 86.2029),
    "Hazaribagh": (23.9925, 85.3637),
    "Dumka":      (24.2676, 87.2489),
    "Deoghar":    (24.4826, 86.6967),
    "Giridih":    (24.1913, 86.3013),
    "Palamu":     (24.0384, 84.0722),
    "Chaibasa":   (22.5532, 85.8086),
    "Ramgarh":    (23.6300, 85.5100),
    "Koderma":    (24.4670, 85.5940),
}

DOMAIN_LIST = [
    "Water Management", "Healthcare", "Agriculture", "Education",
    "Sanitation & Waste", "Infrastructure", "Environment",
    "Accessibility", "Energy",
]
DOMAIN2IDX = {d: i for i, d in enumerate(DOMAIN_LIST)}
NUM_DOMAINS = len(DOMAIN_LIST)
MAX_TEXT_LEN = 120  # for normalisation (same as training)

# ---------------------------------------------------------------------------
# Keyword banks for feature engineering (shared with urgency rules fallback)
# ---------------------------------------------------------------------------
HIGH_KEYWORDS = [
    "arsenic", "poison", "outbreak", "death", "fatal", "cholera", "toxic",
    "emergency", "collapsed", "acute", "casualty", "epidemic", "hazard",
]
MEDIUM_KEYWORDS = [
    "contamination", "flood", "malaria", "dengue", "drought", "maternal",
    "pregnant", "broken", "tube-well", "turbidity", "failure", "pollution",
    "disrupted", "shortage", "anemia",
]
MILD_KEYWORDS = [
    "pothole", "lighting", "cleanliness", "trash", "book", "classroom", "wire",
]

# ---------------------------------------------------------------------------
# PyTorch model (lazy-loaded)
# ---------------------------------------------------------------------------
_urgency_model = None
_urgency_loaded = False
_urgency_available = False

_BASE = os.path.dirname(os.path.abspath(__file__))
_MODEL_PATH = os.path.abspath(
    os.path.join(_BASE, "..", "..", "ai-service", "models", "urgency_scorer.pt")
)


def _build_model():
    """Reconstruct the UrgencyNet architecture for loading weights."""
    import torch.nn as nn

    class UrgencyNet(nn.Module):
        INPUT_DIM = 4 + NUM_DOMAINS  # 13

        def __init__(self):
            super().__init__()
            self.net = nn.Sequential(
                nn.Linear(self.INPUT_DIM, 64),
                nn.ReLU(),
                nn.Dropout(0.3),
                nn.Linear(64, 32),
                nn.ReLU(),
                nn.Dropout(0.3),
                nn.Linear(32, 1),
                nn.Sigmoid(),
            )

        def forward(self, x):
            return self.net(x).squeeze(-1)

    return UrgencyNet()


def _load_urgency_model():
    global _urgency_model, _urgency_loaded, _urgency_available
    if _urgency_loaded:
        return _urgency_available

    _urgency_loaded = True
    if not os.path.isfile(_MODEL_PATH):
        print(f"[URGENCY] Model checkpoint not found at {_MODEL_PATH}. Using rules.")
        return False

    try:
        import torch
        checkpoint = torch.load(_MODEL_PATH, map_location="cpu", weights_only=True)
        model = _build_model()
        model.load_state_dict(checkpoint["model_state_dict"])
        model.eval()
        _urgency_model = model
        _urgency_available = True
        mae = checkpoint.get("final_val_mae", "unknown")
        print(f"[URGENCY] PyTorch UrgencyNet loaded. Training val MAE={mae:.2f}" if isinstance(mae, float) else f"[URGENCY] PyTorch UrgencyNet loaded.")
    except Exception as e:
        print(f"[URGENCY] Failed to load urgency model ({e}). Using rules fallback.")
        _urgency_available = False

    return _urgency_available


def _extract_features(text: str, category: str) -> list:
    """Extract the same 13 features used during training."""
    text_lower = text.lower()
    high_kw = sum(1 for kw in HIGH_KEYWORDS if kw in text_lower)
    med_kw = sum(1 for kw in MEDIUM_KEYWORDS if kw in text_lower)
    mild_kw = sum(1 for kw in MILD_KEYWORDS if kw in text_lower)

    domain_vec = [0.0] * NUM_DOMAINS
    idx = DOMAIN2IDX.get(category, -1)
    if 0 <= idx < NUM_DOMAINS:
        domain_vec[idx] = 1.0

    return [
        min(high_kw / 3.0, 1.0),
        min(med_kw / 4.0, 1.0),
        min(mild_kw / 3.0, 1.0),
        min(len(text) / MAX_TEXT_LEN, 1.0),
    ] + domain_vec


def _urgency_model_score(text: str, category: str) -> int:
    """Run PyTorch model inference → int score [1, 10]."""
    import torch
    features = _extract_features(text, category)
    x = torch.tensor([features], dtype=torch.float32)
    with torch.no_grad():
        raw = _urgency_model(x).item()
    score = raw * 9.0 + 1.0          # denormalise from [0,1] → [1,10]
    return int(round(min(10.0, max(1.0, score))))


def _urgency_rules(text: str) -> int:
    """Original keyword-rule urgency scorer (fallback)."""
    text_lower = text.lower()
    score = 4.0
    for kw in HIGH_KEYWORDS:
        if kw in text_lower:
            score += 2.5
    for kw in MEDIUM_KEYWORDS:
        if kw in text_lower:
            score += 1.25
    for kw in MILD_KEYWORDS:
        if kw in text_lower:
            score += 0.5
    return int(round(min(10.0, max(1.0, score))))


# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------
def route_problem_to_university(category: str, district: str = "Ranchi") -> str:
    """Route a problem category to the appropriate nodal HEI."""
    return UNIVERSITY_ROUTING_MAP.get(
        category,
        "Central University of Jharkhand (CUJ) - Multi-disciplinary Wing",
    )


def calculate_urgency(title: str, description: str, category: str = "") -> int:
    """
    Return urgency score [1, 10].

    Mode selection (URGENCY_MODE env var):
        "model"  → force PyTorch model
        "rules"  → force keyword rules
        "auto"   → model if checkpoint exists, else rules (default)
    """
    text = f"{title} {description}"
    mode = os.getenv("URGENCY_MODE", "auto").lower().strip()

    if mode == "rules":
        return _urgency_rules(text)

    if mode == "model" or mode == "auto":
        if _load_urgency_model():
            try:
                return _urgency_model_score(text, category)
            except Exception as e:
                print(f"[URGENCY] Model inference error: {e}. Falling back to rules.")

    return _urgency_rules(text)
