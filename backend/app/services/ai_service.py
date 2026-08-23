"""
ai_service.py — SIH 26043 AI Classification Engine

Supports two classifier modes (set via env var CLASSIFIER_MODE):
  - "finetuned" : Uses fine-tuned DistilBERT checkpoint
                  (train with ai-service/train_domain_classifier.py first)
  - "zero-shot" : Uses Hugging Face BART-MNLI API with local keyword fallback

Default: "zero-shot" so the service works out-of-the-box without training.

Response shape is identical for both modes:
    {"category": str, "confidence": float, "source": str, "needs_review": bool}
"""

import os
import re
import json
import requests
from difflib import SequenceMatcher
from typing import Dict, Optional

# ---------------------------------------------------------------------------
# Domain categories — canonical list shared across all modes
# ---------------------------------------------------------------------------
CATEGORIES = [
    "Water Management",
    "Healthcare",
    "Agriculture",
    "Education",
    "Sanitation & Waste",
    "Infrastructure",
    "Environment",
    "Accessibility",
    "Energy",
]

LABEL2ID = {d: i for i, d in enumerate(CATEGORIES)}
ID2LABEL = {i: d for d, i in LABEL2ID.items()}

# ---------------------------------------------------------------------------
# Keyword rules (used by local fallback classifier)
# ---------------------------------------------------------------------------
KEYWORD_RULES: Dict[str, list] = {
    "Water Management": [
        "water", "drinking", "well", "tube-well", "tubewell", "arsenic",
        "contamination", "river", "borewell", "filtration", "dam",
        "irrigation", "scarcity", "pond", "turbidity", "drainage", "fluoride",
        "groundwater", "pipe", "supply", "pump"
    ],
    "Healthcare": [
        "health", "hospital", "doctor", "clinic", "medicine", "disease",
        "vaccine", "malaria", "dengue", "maternal", "telemedicine", "patient",
        "ambulance", "phc", "anemia", "anc", "delivery", "tb", "sickle",
        "medicine", "nurse", "asha", "anm", "nutrition", "immunisation"
    ],
    "Agriculture": [
        "crop", "farmer", "paddy", "soil", "fertilizer", "pest", "yield",
        "harvest", "drought", "seeds", "market", "mandi", "vegetable",
        "storage", "cold storage", "kharif", "rabi", "irrigation", "fishery",
        "forest produce", "millet"
    ],
    "Education": [
        "school", "teacher", "student", "class", "computer", "lab", "digital",
        "books", "literacy", "college", "dropout", "midday", "blackboard",
        "classroom", "scholarship", "hostel", "tablet", "anganwadi", "library",
        "coaching", "training"
    ],
    "Sanitation & Waste": [
        "toilet", "garbage", "waste", "drain", "cleanliness", "hygiene",
        "sewage", "plastic", "dump", "swachh", "trash", "sanitary", "latrine",
        "defecation", "septictank", "septic", "sewer", "odour", "smell"
    ],
    "Infrastructure": [
        "road", "bridge", "electricity", "power", "solar", "lighting",
        "transport", "building", "pothole", "wire", "grid", "connectivity",
        "bus", "network", "fibre", "broadband", "highway", "culvert",
        "street light", "railway", "tower"
    ],
    "Environment": [
        "forest", "tree", "deforestation", "mining", "pollution", "air",
        "coal", "smoke", "wildlife", "elephant", "climate", "dust", "flyash",
        "river sand", "quarry", "biodiversity", "wetland", "mercury", "noise"
    ],
    "Accessibility": [
        "disability", "disabled", "wheelchair", "ramp", "blind", "deaf",
        "hearing", "visually impaired", "locomotor", "accessible", "braille",
        "sign language", "pension", "pwds", "pwd", "rehabilitation"
    ],
    "Energy": [
        "solar panel", "kerosene", "lpg", "cooking gas", "biogas", "energy",
        "electricity", "power cut", "transformer", "meter", "inverter",
        "biomass", "ev charging", "micro hydro", "fuel", "ujjwala"
    ],
}

STOP_WORDS = {
    "in", "and", "the", "of", "to", "a", "an", "is", "at", "by", "for",
    "with", "about", "against", "between", "into", "through", "during",
    "before", "after", "above", "below", "from", "up", "down", "on", "off",
    "over", "under", "again", "further", "then", "once", "or", "near",
    "high", "severe", "our", "has", "not", "no", "been", "are", "have",
}

# ---------------------------------------------------------------------------
# Fine-tuned DistilBERT classifier (lazy-loaded on first use)
# ---------------------------------------------------------------------------
_finetuned_model = None
_finetuned_tokenizer = None
_finetuned_loaded = False
_finetuned_available = False

_AI_SERVICE_DIR = os.path.dirname(os.path.abspath(__file__))
_MODEL_DIR = os.path.join(_AI_SERVICE_DIR, "..", "..", "ai-service", "models", "domain_classifier")


def _load_finetuned():
    """Lazy-load the fine-tuned DistilBERT model. Safe to call multiple times."""
    global _finetuned_model, _finetuned_tokenizer, _finetuned_loaded, _finetuned_available
    if _finetuned_loaded:
        return _finetuned_available

    _finetuned_loaded = True
    model_path = os.path.abspath(_MODEL_DIR)

    if not os.path.isdir(model_path):
        print(f"[AI] Fine-tuned model not found at {model_path}. Using fallback.")
        return False

    try:
        from transformers import (
            DistilBertTokenizerFast,
            DistilBertForSequenceClassification,
        )
        import torch

        _finetuned_tokenizer = DistilBertTokenizerFast.from_pretrained(model_path)
        _finetuned_model = DistilBertForSequenceClassification.from_pretrained(model_path)
        _finetuned_model.eval()
        _finetuned_available = True
        print(f"[AI] Fine-tuned DistilBERT domain classifier loaded from {model_path}")
    except Exception as e:
        print(f"[AI] Failed to load fine-tuned model ({e}). Using fallback.")
        _finetuned_available = False

    return _finetuned_available


def _classify_finetuned(text: str) -> Dict:
    """Run inference using the fine-tuned DistilBERT checkpoint."""
    import torch
    inputs = _finetuned_tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=128,
        padding=True,
    )
    with torch.no_grad():
        logits = _finetuned_model(**inputs).logits
        probs = torch.softmax(logits, dim=-1)[0]
        pred_id = int(torch.argmax(probs))
        confidence = float(probs[pred_id])

    return {
        "category": ID2LABEL.get(pred_id, CATEGORIES[0]),
        "confidence": round(confidence, 3),
        "source": "Fine-tuned DistilBERT (SIH 26043)",
        "needs_review": confidence < 0.55,
    }


# ---------------------------------------------------------------------------
# Local keyword-based fallback classifier
# ---------------------------------------------------------------------------
def _stem(word: str) -> str:
    for suffix in ["ation", "ing", "ity", "ion", "ed", "es", "s"]:
        if word.endswith(suffix) and len(word) - len(suffix) >= 3:
            return word[: -len(suffix)]
    return word


def _classify_keyword(text: str) -> Dict:
    text_lower = text.lower()
    scores = {cat: 0.1 for cat in CATEGORIES}

    for category, keywords in KEYWORD_RULES.items():
        for kw in keywords:
            matches = len(re.findall(r"\b" + re.escape(kw) + r"\b", text_lower))
            if matches > 0:
                scores[category] += matches * 0.35

    best = max(scores, key=scores.get)
    max_score = scores[best]
    confidence = min(0.97, max(0.60, max_score / (max_score + 0.4)))

    return {
        "category": best,
        "confidence": round(confidence, 2),
        "source": "Local Keyword Engine",
        "needs_review": confidence < 0.70,
    }


# ---------------------------------------------------------------------------
# Zero-shot BART-MNLI via HuggingFace API
# ---------------------------------------------------------------------------
def _classify_zero_shot(text: str) -> Optional[Dict]:
    api_key = os.getenv("HUGGINGFACE_API_KEY", "").strip()
    if not api_key:
        return None

    API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"
    headers = {"Authorization": f"Bearer {api_key}"}
    payload = {
        "inputs": text,
        "parameters": {"candidate_labels": CATEGORIES},
    }
    try:
        resp = requests.post(API_URL, headers=headers, json=payload, timeout=4.0)
        if resp.status_code == 200:
            result = resp.json()
            if "labels" in result and result["labels"]:
                predicted = result["labels"][0]
                score = float(result["scores"][0]) if result.get("scores") else 0.88
                return {
                    "category": predicted,
                    "confidence": round(score, 3),
                    "source": "BART-MNLI Zero-Shot API",
                    "needs_review": score < 0.60,
                }
    except Exception as e:
        print(f"[AI] HuggingFace API error: {e}")
    return None


# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------
def classify_issue(title: str, description: str, user_category: str = None) -> Dict:
    """
    Classify a citizen complaint into a domain category.

    Routing:
        CLASSIFIER_MODE=finetuned → DistilBERT checkpoint → keyword fallback
        CLASSIFIER_MODE=zero-shot  → BART-MNLI API → keyword fallback
        (default: zero-shot)

    Response always contains:
        category     : str    — predicted domain name
        confidence   : float  — [0.0, 1.0]
        source       : str    — model identifier
        needs_review : bool   — True if confidence < threshold
    """
    combined = f"{title}. {description}"
    mode = os.getenv("CLASSIFIER_MODE", "zero-shot").lower().strip()

    result = None

    if mode == "finetuned":
        if _load_finetuned():
            try:
                result = _classify_finetuned(combined)
            except Exception as e:
                print(f"[AI] Fine-tuned inference error: {e}")
    else:
        # zero-shot path
        result = _classify_zero_shot(combined)

    # Local keyword fallback
    if result is None:
        result = _classify_keyword(combined)

    # User-provided category override for very low confidence
    if (
        user_category
        and user_category in CATEGORIES
        and result["confidence"] < 0.65
    ):
        return {
            "category": user_category,
            "confidence": 0.82,
            "source": "User-Selected Category",
            "needs_review": False,
        }

    return result


# ---------------------------------------------------------------------------
# Duplicate detection (unchanged from original)
# ---------------------------------------------------------------------------
def text_similarity(text1: str, text2: str) -> float:
    """Jaccard + SequenceMatcher combined similarity."""
    raw1 = re.findall(r"\w+", text1.lower())
    raw2 = re.findall(r"\w+", text2.lower())
    w1 = {_stem(w) for w in raw1 if w not in STOP_WORDS and len(w) > 2}
    w2 = {_stem(w) for w in raw2 if w not in STOP_WORDS and len(w) > 2}
    if not w1 or not w2:
        return 0.0
    intersection = len(w1 & w2)
    union = len(w1 | w2)
    jaccard = intersection / union if union > 0 else 0.0
    seq = SequenceMatcher(None, text1.lower(), text2.lower()).ratio()
    return max(jaccard, 0.6 * jaccard + 0.4 * seq)


def check_duplicate_submission(
    title: str,
    description: str,
    district: str,
    existing_problems: list,
    threshold: float = 0.60,
) -> Optional[dict]:
    """
    Returns duplicate info dict if similarity >= threshold, else None.
    """
    new_text = f"{title}. {description}"
    best_match = None
    max_score = 0.0

    for prob in existing_problems:
        existing_text = f"{prob.title}. {prob.description}"
        score = text_similarity(new_text, existing_text)
        if score > max_score:
            max_score = score
            best_match = prob

    if max_score >= threshold and best_match:
        return {
            "is_duplicate": True,
            "duplicate_of_ticket": best_match.ticket_code,
            "similarity_score": round(max_score * 100, 1),
        }
    return None
