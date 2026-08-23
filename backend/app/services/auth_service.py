import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional

SECRET_KEY = "SIH_JHARKHAND_GOVT_SECRET_KEY_26043_SECURE_JWT"
REFRESH_SECRET_KEY = "SIH_JHARKHAND_GOVT_REFRESH_SECRET_KEY_26043_SECURE_JWT"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
REFRESH_TOKEN_EXPIRE_DAYS = 7

def hash_password(password: str) -> str:
    """Hashes plain password using direct bcrypt."""
    pw_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plain password against bcrypt hash."""
    pw_bytes = plain_password.encode('utf-8')
    hash_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(pw_bytes, hash_bytes)

def create_access_token(user_id: str, email: str, role: str, institution: Optional[str] = None, company_name: Optional[str] = None) -> str:
    """Creates a JWT access token with 24-hour expiration (PRD Section 7.2)."""
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode = {
        "sub": user_id,
        "email": email,
        "role": role,
        "institution": institution,
        "company_name": company_name,
        "type": "access",
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(user_id: str) -> str:
    """Creates a 7-day JWT refresh token for session renewals (PRD Section 7.2)."""
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "sub": user_id,
        "type": "refresh",
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """Decodes and validates a JWT access token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def decode_refresh_token(token: str) -> Optional[dict]:
    """Decodes and validates a 7-day JWT refresh token."""
    try:
        payload = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except jwt.PyJWTError:
        return None
