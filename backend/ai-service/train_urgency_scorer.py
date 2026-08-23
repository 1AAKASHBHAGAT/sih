"""
train_urgency_scorer.py
Trains a small 3-layer PyTorch feed-forward network on urgency_dataset.csv
to predict a 1-10 urgency score from engineered text features.

Architecture:
    Input(13) -> Linear(64) -> ReLU -> Dropout(0.3)
              -> Linear(32) -> ReLU -> Dropout(0.3)
              -> Linear(1)  -> Sigmoid -> scale to [1, 10]

Features:
    - high_kw_count   : count of high-severity keywords in text
    - med_kw_count    : count of medium-severity keywords
    - mild_kw_count   : count of mild-severity keywords
    - text_len        : character length of text (normalised)
    - domain_onehot   : 9-dim one-hot vector for domain category

Training data: ~85 synthetic/heuristically-labelled examples.
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

SEED = 42
TRAIN_RATIO = 0.80
EPOCHS = 50
LR = 1e-3
BATCH_SIZE = 16
MAX_TEXT_LEN = 120  # for normalisation

random.seed(SEED)
torch.manual_seed(SEED)


# ---------------------------------------------------------------------------
# Model definition
# ---------------------------------------------------------------------------
class UrgencyNet(nn.Module):
    """
    3-layer feed-forward network:
        Input:  4 engineered features + 9 domain one-hot = 13 total
        Output: scalar in [0, 1] scaled to [1, 10] at inference
    """
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
        return self.net(x).squeeze(-1)  # [B]


# ---------------------------------------------------------------------------
# Data helpers
# ---------------------------------------------------------------------------
def load_dataset(path: str):
    """Return numpy feature matrix X and target vector y (1-10 scores)."""
    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                domain_id = int(row["domain_id"])
                urgency = float(row["urgency_score"])
                high_kw = float(row["high_kw_count"])
                med_kw = float(row["med_kw_count"])
                mild_kw = float(row["mild_kw_count"])
                text_len = float(row["text_len"])
            except (KeyError, ValueError):
                continue
            rows.append((domain_id, urgency, high_kw, med_kw, mild_kw, text_len))

    if not rows:
        print("[ERROR] No valid rows in urgency dataset.")
        sys.exit(1)

    # Build feature matrix
    X_list, y_list = [], []
    for domain_id, urgency, high_kw, med_kw, mild_kw, text_len in rows:
        # One-hot encode domain
        domain_vec = [0.0] * NUM_DOMAINS
        if 0 <= domain_id < NUM_DOMAINS:
            domain_vec[domain_id] = 1.0

        # Normalise scalar features
        features = [
            min(high_kw / 3.0, 1.0),        # max 3 high keywords
            min(med_kw / 4.0, 1.0),          # max 4 medium keywords
            min(mild_kw / 3.0, 1.0),         # max 3 mild keywords
            min(text_len / MAX_TEXT_LEN, 1.0),
        ] + domain_vec

        X_list.append(features)
        y_list.append((urgency - 1.0) / 9.0)  # normalise to [0, 1]

    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list, dtype=np.float32)
    return X, y


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
    print(" SIH 26043 — Urgency Scorer Training")
    print(f" Data  : {DATASET_PATH}")
    print(f" Output: {MODEL_OUT_PATH}")
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
    optimizer = torch.optim.Adam(model.parameters(), lr=LR)
    criterion = nn.MSELoss()

    best_val_loss = float("inf")
    best_state = None

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
                # Convert back to 1-10 scale for MAE
                pred_score = pred * 9.0 + 1.0
                true_score = y_b * 9.0 + 1.0
                mae += torch.abs(pred_score - true_score).sum().item()

        val_loss /= len(X_val)
        mae /= len(X_val)

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_state = {k: v.clone() for k, v in model.state_dict().items()}

        if epoch % 10 == 0 or epoch == 1:
            print(f"  Epoch {epoch:3d}/{EPOCHS} | train_loss={train_loss:.4f} | val_loss={val_loss:.4f} | val_MAE={mae:.2f}")

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
        "final_val_mae": final_mae,
    }, MODEL_OUT_PATH)

    print(f"\n[SAVE] Urgency scorer saved to: {MODEL_OUT_PATH}")
    print("[DONE] Training complete. Cite the MAE above in your pitch.")


if __name__ == "__main__":
    main()
