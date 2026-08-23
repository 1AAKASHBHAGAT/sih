from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any, Dict
from datetime import datetime

# User Schemas
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "citizen" # citizen, university_admin, industry, government
    institution: Optional[str] = None
    company_name: Optional[str] = None

UserRegister = UserCreate

class UserLoginStep1(BaseModel):
    email: str
    password: str

UserLogin = UserLoginStep1

class UserLoginStep2(BaseModel):
    email: str
    password: str
    otp: str

class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    email: str
    otp: str
    new_password: str

class ResendOTPRequest(BaseModel):
    email: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    institution: Optional[str]
    company_name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserResponse

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# Problem Schemas
class ProblemSubmissionCreate(BaseModel):
    title: str
    description: str
    user_category: Optional[str] = None
    location: str
    district: Optional[str] = "Ranchi"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    reporter_name: Optional[str] = "Anonymous Citizen"
    contact_phone: Optional[str] = None
    image_url: Optional[str] = None
    dpdp_consent_given: Optional[bool] = True

class ProblemStatusUpdate(BaseModel):
    status: str

class TeamAssignmentCreate(BaseModel):
    team_name: str
    student_lead: str
    faculty_advisor: str
    proposal_summary: Optional[str] = None
    budget_allocated: Optional[float] = 0.0

class CSRPledgeCreate(BaseModel):
    company_name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    pledge_type: Optional[str] = "Grant Funding"
    amount: float
    notes: Optional[str] = None

class MilestoneResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    target_date: Optional[str]
    status: str

    class Config:
        from_attributes = True

class ProjectResponse(BaseModel):
    id: str
    university_name: str
    team_name: Optional[str]
    student_lead: Optional[str]
    faculty_advisor: Optional[str]
    lifecycle_stage: str
    proposal_summary: Optional[str]
    budget_allocated: float
    milestones: List[MilestoneResponse] = []

    class Config:
        from_attributes = True

class CSRPledgeResponse(BaseModel):
    id: str
    company_name: str
    contact_person: Optional[str]
    email: Optional[str]
    pledge_type: str
    amount: float
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class ProblemResponse(BaseModel):
    id: str
    ticket_code: str
    title: str
    description: str
    user_category: Optional[str]
    ai_predicted_category: str
    ai_confidence: Optional[float] = 0.85
    needs_human_review: Optional[bool] = False
    assigned_university: str
    location: str
    district: str
    latitude: Optional[float]
    longitude: Optional[float]
    status: str
    urgency_score: int
    reporter_name: Optional[str]
    image_url: Optional[str]
    dpdp_consent_given: Optional[bool] = True
    dpdp_consent_timestamp: Optional[datetime] = None
    is_duplicate: Optional[bool] = False
    duplicate_of_ticket: Optional[str] = None
    created_at: datetime
    project: Optional[ProjectResponse] = None
    csr_pledges: List[CSRPledgeResponse] = []

    class Config:
        from_attributes = True

class AnalyticsSummaryResponse(BaseModel):
    total_submitted: int
    active_projects: int
    completed_deployed: int
    participating_heis: int
    domain_distribution: List[Dict[str, Any]]
    district_distribution: List[Dict[str, Any]]
    university_leaderboard: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]

class NotificationResponse(BaseModel):
    id: str
    ticket_code: str
    recipient_contact: Optional[str]
    event_type: str
    channel: str
    message: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
