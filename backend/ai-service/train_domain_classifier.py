"""
train_domain_classifier.py
Fine-tunes distilbert-base-uncased on the synthetic domain_dataset.csv
for Jharkhand civic complaint domain classification.

Training data: ~180 synthetic examples across 9 domain categories.
Data is synthetic (generated for SIH 26043 hackathon prototype).
Run on CPU — takes ~10-20 minutes for 3 epochs on this dataset size.

Usage:
    cd backend/
    python ai-service/train_domain_classifier.py

Output:
    ai-service/models/domain_classifier/   <- best checkpoint saved here
    Prints final validation accuracy to stdout.
"""

import os
import csv
import json
import math
import random
import sys

# ---------------------------------------------------------------------------
# Dependency check — give a clear error before crashing deep in torch
# ---------------------------------------------------------------------------
MISSING = []
try:
    import torch
    from torch.utils.data import Dataset
except ImportError:
    MISSING.append("torch")

try:
    from transformers import (
        DistilBertTokenizerFast,
        DistilBertForSequenceClassification,
        TrainingArguments,
        Trainer,
    )
except ImportError:
    MISSING.append("transformers")

try:
    import numpy as np
except ImportError:
    MISSING.append("numpy")

if MISSING:
    print(f"[ERROR] Missing required packages: {', '.join(MISSING)}")
    print("Install them with:  pip install torch transformers numpy scikit-learn")
    sys.exit(1)

from sklearn.metrics import accuracy_score  # type: ignore

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "domain_dataset.csv")
MODEL_OUT_DIR = os.path.join(BASE_DIR, "models", "domain_classifier")
LABEL_MAP_PATH = os.path.join(BASE_DIR, "models", "domain_label_map.json")

DOMAINS = [
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
LABEL2ID = {d: i for i, d in enumerate(DOMAINS)}
ID2LABEL = {i: d for d, i in LABEL2ID.items()}

SEED = 42
TRAIN_RATIO = 0.80
MODEL_NAME = "distilbert-base-uncased"
EPOCHS = 3
BATCH_SIZE = 8
MAX_LEN = 128

# ---------------------------------------------------------------------------
# Dataset helpers
# ---------------------------------------------------------------------------

def load_csv(path: str):
    """Load CSV dataset, skip bad rows, return (texts, labels) lists."""
    texts, labels = [], []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            text = row.get("text", "").strip()
            label_raw = row.get("label", "").strip()
            if not text or not label_raw:
                continue
            try:
                label_int = int(label_raw)
            except ValueError:
                continue
            if label_int < 0 or label_int >= len(DOMAINS):
                continue
            texts.append(text)
            labels.append(label_int)
    return texts, labels


def train_val_split(texts, labels, ratio=TRAIN_RATIO, seed=SEED):
    combined = list(zip(texts, labels))
    random.seed(seed)
    random.shuffle(combined)
    split = int(len(combined) * ratio)
    train = combined[:split]
    val = combined[split:]
    return (
        [t for t, _ in train], [l for _, l in train],
        [t for t, _ in val],   [l for _, l in val],
    )


class ComplaintDataset(Dataset):
    def __init__(self, texts, labels, tokenizer):
        self.encodings = tokenizer(
            texts,
            truncation=True,
            padding=True,
            max_length=MAX_LEN,
        )
        self.labels = labels

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        item = {k: torch.tensor(v[idx]) for k, v in self.encodings.items()}
        item["labels"] = torch.tensor(self.labels[idx])
        return item


def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    acc = accuracy_score(labels, preds)
    return {"accuracy": acc}


# ---------------------------------------------------------------------------
# Main training
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print(" SIH 26043 — Domain Classifier Fine-Tuning")
    print(" Model : distilbert-base-uncased")
    print(f" Data  : {DATASET_PATH}")
    print(f" Output: {MODEL_OUT_DIR}")
    print("=" * 60)

    # Load data
    texts, labels = load_csv(DATASET_PATH)
    if not texts:
        print("[ERROR] No valid rows found in dataset. Exiting.")
        sys.exit(1)
    print(f"\n[DATA] Loaded {len(texts)} examples across {len(set(labels))} classes.")

    train_texts, train_labels, val_texts, val_labels = train_val_split(texts, labels)
    print(f"[DATA] Train: {len(train_texts)}  |  Val: {len(val_texts)}")

    # Tokeniser
    print(f"\n[MODEL] Loading tokenizer: {MODEL_NAME}")
    tokenizer = DistilBertTokenizerFast.from_pretrained(MODEL_NAME)

    train_dataset = ComplaintDataset(train_texts, train_labels, tokenizer)
    val_dataset = ComplaintDataset(val_texts, val_labels, tokenizer)

    # Model
    print(f"[MODEL] Loading base model: {MODEL_NAME}")
    model = DistilBertForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=len(DOMAINS),
        id2label=ID2LABEL,
        label2id=LABEL2ID,
    )

    # Training args — CPU-friendly
    os.makedirs(MODEL_OUT_DIR, exist_ok=True)
    training_args = TrainingArguments(
        output_dir=MODEL_OUT_DIR,
        num_train_epochs=EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="accuracy",
        greater_is_better=True,
        logging_steps=10,
        seed=SEED,
        use_cpu=True,                  # Force CPU — no GPU assumption
        report_to="none",              # Disable wandb / MLflow
        dataloader_num_workers=0,      # Avoid multiprocessing on Windows
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        compute_metrics=compute_metrics,
    )

    print(f"\n[TRAIN] Starting fine-tuning for {EPOCHS} epochs on CPU...")
    trainer.train()

    # Final evaluation
    print("\n[EVAL] Running final evaluation on validation set...")
    results = trainer.evaluate()
    val_accuracy = results.get("eval_accuracy", -1.0)
    val_loss = results.get("eval_loss", -1.0)

    print("\n" + "=" * 60)
    print(f"  FINAL VALIDATION ACCURACY : {val_accuracy * 100:.1f}%")
    print(f"  FINAL VALIDATION LOSS     : {val_loss:.4f}")
    print("=" * 60)

    # Save best model + tokenizer
    trainer.save_model(MODEL_OUT_DIR)
    tokenizer.save_pretrained(MODEL_OUT_DIR)

    # Save label map for inference
    os.makedirs(os.path.dirname(LABEL_MAP_PATH), exist_ok=True)
    with open(LABEL_MAP_PATH, "w") as f:
        json.dump({"id2label": ID2LABEL, "label2id": LABEL2ID}, f, indent=2)

    print(f"\n[SAVE] Model checkpoint saved to: {MODEL_OUT_DIR}")
    print(f"[SAVE] Label map saved to       : {LABEL_MAP_PATH}")
    print("\n[DONE] Fine-tuning complete. Cite the accuracy above in your pitch.")


if __name__ == "__main__":
    main()
