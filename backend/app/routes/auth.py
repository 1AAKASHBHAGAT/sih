import re
from typing import Optional
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserRegister, UserLogin, UserResponse, TokenResponse, RefreshTokenRequest
from ..services.auth_service import hash_password, verify_password, create_access_token, create_refresh_token, decode_refresh_token
from ..services.otp_service import generate_otp, verify_otp_with_attempts
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginStep1Request(BaseModel):
    email: str
    password: str

class LoginStep2Request(BaseModel):
    email: str
    password: str
    otp: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordConfirm(BaseModel):
    email: str
    otp: str
    new_password: str

class ResendOTPRequest(BaseModel):
    email: str

def validate_email_or_phone_backend(input_str: str) -> str:
    """Validates email or 10-digit Indian phone number format."""
    clean_str = input_str.strip().lower()
    email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    phone_regex = r'^(?:\+91|91)?[6-9]\d{9}$'

    if re.match(email_regex, clean_str):
        return clean_str
    
    digits_only = re.sub(r'\D', '', clean_str)
    if len(digits_only) == 10 and re.match(r'^[6-9]\d{9}$', digits_only):
        return f"{digits_only}@citizen.jharkhand.gov.in"
    
    if len(digits_only) == 12 and digits_only.startswith("91") and re.match(r'^91[6-9]\d{9}$', digits_only):
        return f"{digits_only[2:]}@citizen.jharkhand.gov.in"

    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="Please enter a valid email address or 10-digit mobile number."
    )

DEMO_ACCOUNTS = [
    {
        "email": "executive@jharkhand.gov.in",
        "password": "password123",
        "full_name": "Dr. Rameshwar Oraon (Nodal Director)",
        "role": "government",
        "institution": "Department of Higher Education, Govt. of Jharkhand",
        "company_name": None
    },
    {
        "email": "gov@jharkhand.gov.in",
        "password": "gov123",
        "full_name": "State Nodal Executive",
        "role": "government",
        "institution": "Department of Higher & Technical Education",
        "company_name": None
    },
    {
        "email": "ism_admin@iitism.ac.in",
        "password": "password123",
        "full_name": "Prof. S. K. Sinha (Water Center Head)",
        "role": "university_admin",
        "institution": "IIT (ISM) Dhanbad - Water Research Center",
        "company_name": None
    },
    {
        "email": "cuj_admin@cuj.ac.in",
        "password": "password123",
        "full_name": "Dr. Priyadarshini Roy (Health Hub)",
        "role": "university_admin",
        "institution": "Central University of Jharkhand (CUJ) - Health Tech Hub",
        "company_name": None
    },
    {
        "email": "tatasteel@csr.org",
        "password": "password123",
        "full_name": "Ravi Desai (CSR Vice President)",
        "role": "industry",
        "institution": None,
        "company_name": "Tata Steel CSR Division"
    },
    {
        "email": "citizen@gmail.com",
        "password": "citizen123",
        "full_name": "Ramesh Kumar Mahato",
        "role": "citizen",
        "institution": None,
        "company_name": None
    }
]

def seed_demo_users_if_needed(db: Session):
    """Pre-seeds standard demo accounts if they do not exist in the database."""
    for demo in DEMO_ACCOUNTS:
        existing = db.query(User).filter(User.email == demo["email"]).first()
        if not existing:
            user = User(
                email=demo["email"],
                hashed_password=hash_password(demo["password"]),
                full_name=demo["full_name"],
                role=demo["role"],
                institution=demo.get("institution"),
                company_name=demo.get("company_name")
            )
            db.add(user)
    db.commit()

import logging
logger = logging.getLogger("uvicorn.error")

from ..services.persistent_store import save_user_persistently, get_all_persistent_users

@router.post("/login-step1")
def login_step1(payload: LoginStep1Request, db: Session = Depends(get_db)):
    """
    Step 1 Authentication (First Factor: Password).
    Validates email format first, then verifies email + password against the user database.
    """
    clean_email = validate_email_or_phone_backend(payload.email)
    user = db.query(User).filter(User.email == clean_email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        logger.warning("❌ [LOGIN FAILED] Attempted email/phone: %s", clean_email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    # High-visibility Render log output
    logger.info("🔑 [USER LOGIN STEP 1 SUCCESS] Email: %s | Role: %s | Name: %s", user.email, user.role, user.full_name)

    # Persist user login activity safely
    save_user_persistently({
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "institution": user.institution,
        "company_name": user.company_name,
        "created_at": str(user.created_at)
    })

    success, msg, dev_otp = generate_otp(clean_email, force_resend=True)
    if not success:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=msg)

    return {
        "status": "otp_required",
        "email": user.email,
        "message": "Password verified. 6-digit OTP code dispatched to email/phone.",
        "dev_otp": dev_otp
    }

@router.post("/register", response_model=TokenResponse)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """
    Registers a new user account and returns a 24-hour access token and 7-day refresh token.
    """
    clean_email = validate_email_or_phone_backend(payload.email)
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email/phone number already exists."
        )

    user = User(
        email=clean_email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role or "citizen",
        institution=payload.institution,
        company_name=payload.company_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    save_user_persistently({
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "institution": user.institution,
        "company_name": user.company_name,
        "created_at": str(user.created_at)
    })

    logger.info("🎉 [NEW USER REGISTERED] Email: %s | Role: %s | Name: %s", user.email, user.role, user.full_name)

    token = create_access_token(
        user_id=user.id,
        email=user.email,
        role=user.role,
        institution=user.institution,
        company_name=user.company_name
    )
    refresh_token = create_refresh_token(user_id=user.id)

    return {
        "access_token": token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns current authenticated user details from JWT token.
    """
    return current_user

@router.get("/users")
def list_all_users(db: Session = Depends(get_db)):
    """
    Returns list of all registered stakeholder user accounts in the database and persistent store.
    """
    db_users = [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "institution": u.institution,
            "company_name": u.company_name,
            "created_at": str(u.created_at)
        }
        for u in db.query(User).order_by(User.created_at.desc()).all()
    ]
    file_users = get_all_persistent_users()

    combined = file_users + db_users
    seen_emails = set()
    unique_users = []
    for u in combined:
        if u.get("email") not in seen_emails:
            seen_emails.add(u.get("email"))
            unique_users.append(u)

    return unique_users

@router.post("/login-step2", response_model=TokenResponse)
def login_step2(payload: LoginStep2Request, db: Session = Depends(get_db)):
    """
    Step 2 Authentication (Second Factor: OTP).
    Verifies password + 6-digit OTP code. Issues a 24-hour access token and 7-day refresh token.
    """
    clean_email = validate_email_or_phone_backend(payload.email)
    user = db.query(User).filter(User.email == clean_email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    is_otp_valid, otp_msg = verify_otp_with_attempts(clean_email, payload.otp)
    if not is_otp_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=otp_msg
        )

    token = create_access_token(
        user_id=user.id,
        email=user.email,
        role=user.role,
        institution=user.institution,
        company_name=user.company_name
    )
    refresh_token = create_refresh_token(user_id=user.id)

    return {
        "access_token": token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/refresh", response_model=TokenResponse)
def refresh_session_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Exchanges a valid 7-day refresh token for a new 24-hour access token (PRD Section 7.2).
    """
    decoded = decode_refresh_token(payload.refresh_token)
    if not decoded or not decoded.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token. Please sign in again."
        )

    user = db.query(User).filter(User.id == decoded["sub"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer active."
        )

    new_access_token = create_access_token(
        user_id=user.id,
        email=user.email,
        role=user.role,
        institution=user.institution,
        company_name=user.company_name
    )
    new_refresh_token = create_refresh_token(user_id=user.id)

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/forgot-password/request")
def request_password_reset(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Requests a 6-digit password reset OTP for an account.
    """
    clean_email = validate_email_or_phone_backend(payload.email)
    user = db.query(User).filter(User.email == clean_email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found matching this email address."
        )

    success, msg, dev_otp = generate_otp(clean_email, force_resend=True)
    if not success:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=msg)

    return {
        "status": "reset_otp_sent",
        "email": user.email,
        "message": "Password reset OTP dispatched to registered email/phone.",
        "dev_otp": dev_otp
    }

@router.post("/forgot-password/confirm")
def confirm_password_reset(payload: ResetPasswordConfirm, db: Session = Depends(get_db)):
    """
    Confirms password reset using 6-digit OTP code and updates account password.
    """
    clean_email = validate_email_or_phone_backend(payload.email)
    user = db.query(User).filter(User.email == clean_email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    is_otp_valid, otp_msg = verify_otp_with_attempts(clean_email, payload.otp)
    if not is_otp_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=otp_msg
        )

    user.hashed_password = hash_password(payload.new_password)
    db.commit()

    return {
        "status": "success",
        "message": "Password reset successfully. You can now log in with your new password."
    }

@router.post("/resend-otp")
def resend_otp(payload: ResendOTPRequest, db: Session = Depends(get_db)):
    """
    Resends 6-digit OTP code with strict rate-limit protection.
    """
    clean_email = validate_email_or_phone_backend(payload.email)
    user = db.query(User).filter(User.email == clean_email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    success, msg, dev_otp = generate_otp(clean_email, force_resend=True)
    if not success:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=msg)

    return {
        "status": "otp_resent",
        "message": msg,
        "dev_otp": dev_otp
    }

@router.post("/register", response_model=TokenResponse)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """
    Registers a new user account and returns a 24-hour access token and 7-day refresh token.
    """
    clean_email = validate_email_or_phone_backend(payload.email)
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email/phone number already exists."
        )

    user = User(
        email=clean_email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role or "citizen",
        institution=payload.institution,
        company_name=payload.company_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(
        user_id=user.id,
        email=user.email,
        role=user.role,
        institution=user.institution,
        company_name=user.company_name
    )
    refresh_token = create_refresh_token(user_id=user.id)

    return {
        "access_token": token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns current authenticated user details from JWT token.
    """
    return current_user

@router.get("/users")
def list_all_users(db: Session = Depends(get_db)):
    """
    Returns list of all registered stakeholder user accounts in the database.
    """
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "institution": u.institution,
            "company_name": u.company_name,
            "created_at": u.created_at
        }
        for u in users
    ]
