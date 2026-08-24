"""
train_urgency_scorer.py
Trains a PyTorch feed-forward network on urgency_dataset.csv
to predict a 1-10 urgency score from engineered text features.

V2 improvements:
    - Extracts features directly from raw text (not pre-computed CSV columns)
    - Richer feature set: 18 total features vs 13 before
    - BatchNorm for training stability
    - Wider network (128->64->32)

Architecture:
    Input(18) -> Linear(128) -> BatchNorm -> ReLU -> Dropout(0.2)
              -> Linear(64)  -> BatchNorm -> ReLU -> Dropout(0.2)
              -> Linear(32)  -> ReLU
              -> Linear(1)   -> Sigmoid -> scale to [1, 10]

Features (18 total):
    - high_kw_count   : count of high-severity keywords in text (normalised)
    - med_kw_count    : count of medium-severity keywords (normalised)
    - mild_kw_count   : count of mild-severity keywords (normalised)
    - total_kw_count  : sum of all keyword hits (normalised)
    - text_len        : character length of text (normalised)
    - word_count      : number of words (normalised)
    - avg_word_len    : average word length (normalised)
    - exclamation     : contains exclamation mark (binary)
    - question        : contains question mark (binary)
    - domain_onehot   : 9-dim one-hot vector for domain category

Training data: ~170 synthetic/heuristically-labelled examples.
Labels are heuristic (not from real government data) — honest prototype.

Usage:
    cd backend/
    python ai-service/train_urgency_scorer.py

Output:
    ai-service/models/urgency_scorer.pt  <- saved model state dict
    Prints final validation MAE to stdout.
"""

import os
import csv
import re
import sys
import math
import random

MISSING = []
try:
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader, TensorDataset
except ImportError:
    MISSING.append("torch")

try:
    import numpy as np
except ImportError:
    MISSING.append("numpy")

if MISSING:
    print(f"[ERROR] Missing packages: {', '.join(MISSING)}")
    print("Install with:  pip install torch numpy")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Paths & constants
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "urgency_dataset.csv")
MODEL_OUT_PATH = os.path.join(BASE_DIR, "models", "urgency_scorer.pt")

DOMAIN_LIST = [
    "Water Management", "Healthcare", "Agriculture", "Education",
    "Sanitation & Waste", "Infrastructure", "Environment",
    "Accessibility", "Energy"
]
DOMAIN2IDX = {d: i for i, d in enumerate(DOMAIN_LIST)}
NUM_DOMAINS = len(DOMAIN_LIST)

# Keyword banks — MUST match router_service.py
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

SEED = 42
TRAIN_RATIO = 0.80
EPOCHS = 200
LR = 3e-4
BATCH_SIZE = 16
MAX_TEXT_LEN = 120  # for normalisation

random.seed(SEED)
torch.manual_seed(SEED)
np.random.seed(SEED)


# ---------------------------------------------------------------------------
# Feature extraction — reusable for both training and inference
# ---------------------------------------------------------------------------
def extract_features(text: str, domain_id: int) -> list:
    """
    Extract 18-dim feature vector from raw text + domain_id.
    This function is shared between training and inference (router_service.py).
    """
    text_lower = text.lower()
    words = re.findall(r"\w+", text_lower)

    # Keyword counts
    high_kw = sum(1 for kw in HIGH_KEYWORDS if kw in text_lower)
    med_kw = sum(1 for kw in MEDIUM_KEYWORDS if kw in text_lower)
    mild_kw = sum(1 for kw in MILD_KEYWORDS if kw in text_lower)
    total_kw = high_kw + med_kw + mild_kw

    # Text features
    text_len = len(text)
    word_count = len(words)
    avg_word_len = sum(len(w) for w in words) / max(word_count, 1)
    has_exclamation = 1.0 if "!" in text else 0.0
    has_question = 1.0 if "?" in text else 0.0

    # Domain one-hot
    domain_vec = [0.0] * NUM_DOMAINS
    if 0 <= domain_id < NUM_DOMAINS:
        domain_vec[domain_id] = 1.0

    return [
        min(high_kw / 3.0, 1.0),
        min(med_kw / 4.0, 1.0),
        min(mild_kw / 3.0, 1.0),
        min(total_kw / 6.0, 1.0),
        min(text_len / MAX_TEXT_LEN, 1.0),
        min(word_count / 25.0, 1.0),
        min(avg_word_len / 8.0, 1.0),
        has_exclamation,
        has_question,
    ] + domain_vec


NUM_FEATURES = 9 + NUM_DOMAINS  # 18


# ---------------------------------------------------------------------------
# Model definition (V2 — wider with BatchNorm)
# ---------------------------------------------------------------------------
class UrgencyNet(nn.Module):
    """
    4-layer feed-forward network with BatchNorm:
        Input:  18 engineered features
        Output: scalar in [0, 1] scaled to [1, 10] at inference
    """
    INPUT_DIM = NUM_FEATURES  # 18

    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(self.INPUT_DIM, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Sigmoid(),
        )

    def forward(self, x):
        return self.net(x).squeeze(-1)  # [B]


# ---------------------------------------------------------------------------
# Data helpers
# ---------------------------------------------------------------------------
def load_dataset(path: str):
    """Return numpy feature matrix X and target vector y (1-10 scores)."""
    X_list, y_list = [], []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                text = row["text"].strip()
                domain_id = int(row["domain_id"])
                urgency = float(row["urgency_score"])
            except (KeyError, ValueError):
                continue

            if not text or urgency < 1 or urgency > 10:
                continue

            features = extract_features(text, domain_id)
            X_list.append(features)
            y_list.append((urgency - 1.0) / 9.0)  # normalise to [0, 1]

    if not X_list:
        print("[ERROR] No valid rows in urgency dataset.")
        sys.exit(1)

    return np.array(X_list, dtype=np.float32), np.array(y_list, dtype=np.float32)


def split(X, y, ratio=TRAIN_RATIO, seed=SEED):
    idx = list(range(len(X)))
    random.seed(seed)
    random.shuffle(idx)
    split_at = int(len(idx) * ratio)
    train_idx, val_idx = idx[:split_at], idx[split_at:]
    return X[train_idx], y[train_idx], X[val_idx], y[val_idx]


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------
def main():
    print("=" * 60)
    print(" SIH 26043 — Urgency Scorer Training (V2)")
    print(f" Features: {NUM_FEATURES} (keyword counts + text stats + domain one-hot)")
    print(f" Data    : {DATASET_PATH}")
    print(f" Output  : {MODEL_OUT_PATH}")
    print("=" * 60)

    X, y = load_dataset(DATASET_PATH)
    print(f"\n[DATA] Loaded {len(X)} examples.")
    X_train, y_train, X_val, y_val = split(X, y)
    print(f"[DATA] Train: {len(X_train)}  |  Val: {len(X_val)}")

    # DataLoaders
    train_loader = DataLoader(
        TensorDataset(torch.tensor(X_train), torch.tensor(y_train)),
        batch_size=BATCH_SIZE, shuffle=True
    )
    val_loader = DataLoader(
        TensorDataset(torch.tensor(X_val), torch.tensor(y_val)),
        batch_size=BATCH_SIZE
    )

    model = UrgencyNet()
    optimizer = torch.optim.Adam(model.parameters(), lr=LR, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode="min", factor=0.5, patience=20, min_lr=1e-5
    )
    criterion = nn.MSELoss()

    best_val_loss = float("inf")
    best_state = None
    patience_counter = 0

    print(f"\n[TRAIN] Training for {EPOCHS} epochs...")
    for epoch in range(1, EPOCHS + 1):
        model.train()
        train_loss = 0.0
        for X_b, y_b in train_loader:
            optimizer.zero_grad()
            pred = model(X_b)
            loss = criterion(pred, y_b)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(X_b)
        train_loss /= len(X_train)

        model.eval()
        val_loss = 0.0
        mae = 0.0
        with torch.no_grad():
            for X_b, y_b in val_loader:
                pred = model(X_b)
                val_loss += criterion(pred, y_b).item() * len(X_b)
                pred_score = pred * 9.0 + 1.0
                true_score = y_b * 9.0 + 1.0
                mae += torch.abs(pred_score - true_score).sum().item()

        val_loss /= len(X_val)
        mae /= len(X_val)

        scheduler.step(val_loss)

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
            patience_counter = 0
        else:
            patience_counter += 1

        if epoch % 20 == 0 or epoch == 1:
            lr_now = optimizer.param_groups[0]["lr"]
            print(f"  Epoch {epoch:3d}/{EPOCHS} | train={train_loss:.4f} | val={val_loss:.4f} | MAE={mae:.2f} | lr={lr_now:.1e}")

        # Early stopping
        if patience_counter > 50:
            print(f"  [EARLY STOP] No improvement for 50 epochs. Stopping at epoch {epoch}.")
            break

    # Restore best model
    if best_state:
        model.load_state_dict(best_state)

    # Final validation MAE
    model.eval()
    all_mae = 0.0
    with torch.no_grad():
        for X_b, y_b in val_loader:
            pred = model(X_b) * 9.0 + 1.0
            true = y_b * 9.0 + 1.0
            all_mae += torch.abs(pred - true).sum().item()
    final_mae = all_mae / len(X_val)

    print("\n" + "=" * 60)
    print(f"  FINAL VALIDATION MAE (1-10 scale) : {final_mae:.2f} points")
    print("=" * 60)

    # Save model
    os.makedirs(os.path.dirname(MODEL_OUT_PATH), exist_ok=True)
    torch.save({
        "model_state_dict": model.state_dict(),
        "input_dim": UrgencyNet.INPUT_DIM,
        "num_domains": NUM_DOMAINS,
        "num_features": NUM_FEATURES,
        "final_val_mae": final_mae,
    }, MODEL_OUT_PATH)

    print(f"\n[SAVE] Urgency scorer saved to: {MODEL_OUT_PATH}")
    print("[DONE] Training complete. Cite the MAE above in your pitch.")


if __name__ == "__main__":
    main()
