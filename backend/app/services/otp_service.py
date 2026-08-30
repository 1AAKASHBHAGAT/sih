import random
import time
from typing import Dict, Tuple, Optional

# In-memory OTP storage:
# { identifier: { "code": str, "expiry": float, "attempts": int, "last_sent": float } }
_otp_store: Dict[str, Dict] = {}

OTP_VALIDITY_SECONDS = 300 # 5 minutes
RESEND_COOLDOWN_SECONDS = 30 # 30 seconds
MAX_FAILED_ATTEMPTS = 5

def generate_otp(identifier: str, force_resend: bool = False) -> Tuple[bool, str, str]:
    """
    Generates a secure 6-digit OTP for the given email or phone number.
    Returns (success, message_or_code, dev_otp_code).
    Enforces a 30-second resend cooldown timer.
    """
    clean_id = identifier.strip().lower()
    now = time.time()

    if clean_id in _otp_store:
        record = _otp_store[clean_id]
        time_since_last_sent = now - record.get("last_sent", 0)
        if time_since_last_sent < RESEND_COOLDOWN_SECONDS and not force_resend:
            wait_time = int(RESEND_COOLDOWN_SECONDS - time_since_last_sent)
            return False, f"Please wait {wait_time} seconds before requesting a new OTP code.", ""

    # Generate random 6-digit passcode
    otp_code = "".join([str(random.randint(0, 9)) for _ in range(6)])
    expiry = now + OTP_VALIDITY_SECONDS

    _otp_store[clean_id] = {
        "code": otp_code,
        "expiry": expiry,
        "attempts": 0,
        "last_sent": now
    }

    print(f"==================================================")
    print(f"[GOVT 2FA OTP ENGINE] Generated OTP for '{clean_id}': {otp_code}")
    print(f"==================================================")

    return True, f"6-Digit OTP security code dispatched to {clean_id}.", otp_code

def verify_otp_with_attempts(identifier: str, input_otp: str) -> Tuple[bool, str]:
    """
    Validates the provided 6-digit OTP code.
    Returns (is_valid, detail_message).
    Caps failed attempts at 5 before requiring restart from Step 1.
    """
    clean_id = identifier.strip().lower()
    if clean_id not in _otp_store:
        return False, "No active OTP request found for this account. Please sign in again."

    record = _otp_store[clean_id]

    # Check expiry
    if time.time() > record["expiry"]:
        del _otp_store[clean_id]
        return False, "OTP code has expired (5-minute limit). Please request a new code."

    # Check attempt limit
    if record["attempts"] >= MAX_FAILED_ATTEMPTS:
        del _otp_store[clean_id]
        return False, f"Maximum failed verification attempts ({MAX_FAILED_ATTEMPTS}/{MAX_FAILED_ATTEMPTS}) exceeded. Please restart sign in."

    # Record attempt
    record["attempts"] += 1

    stored_code = record["code"]
    clean_input = input_otp.strip()

    if stored_code == clean_input:
        del _otp_store[clean_id]
        return True, "OTP successfully verified."

    remaining = MAX_FAILED_ATTEMPTS - record["attempts"]
    if remaining <= 0:
        del _otp_store[clean_id]
        return False, f"Incorrect OTP code. Maximum attempts exceeded. Please restart sign in from Step 1."

    return False, f"Incorrect OTP passcode. {remaining} attempt(s) remaining."
