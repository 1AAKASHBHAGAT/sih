import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey, Boolean, Numeric
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="citizen", index=True) # citizen, university_admin, industry, government
    institution = Column(String(255), nullable=True) # e.g. "IIT (ISM) Dhanbad - Water Research Center"
    company_name = Column(String(255), nullable=True) # e.g. "Tata Steel CSR Division"
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Problem(Base):
    __tablename__ = "problems"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_code = Column(String(20), unique=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    user_category = Column(String(100), nullable=True, index=True)
    ai_predicted_category = Column(String(100), nullable=False, index=True)
    ai_confidence = Column(Float, default=0.85)
    needs_human_review = Column(Boolean, default=False, index=True)
    assigned_university = Column(String(255), nullable=False, index=True)
    location = Column(String(255), nullable=False)
    district = Column(String(100), nullable=False, default="Ranchi", index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String(50), default="Submitted", index=True) # Submitted, Assigned, In Progress, Testing, Deployed, Rejected
    urgency_score = Column(Integer, default=5)
    reporter_name = Column(String(100), default="Anonymous Citizen")
    contact_phone = Column(String(20), nullable=True)
    image_url = Column(String(500), nullable=True)
    
    # DPDP Consent Persistence Fields (PRD NFR Section 12)
    dpdp_consent_given = Column(Boolean, default=True)
    dpdp_consent_timestamp = Column(DateTime, default=datetime.utcnow)

    # Duplicate Detection Fields
    is_duplicate = Column(Boolean, default=False)
    duplicate_of_ticket = Column(String(50), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="problem", uselist=False, cascade="all, delete-orphan")
    csr_pledges = relationship("CSRPledge", back_populates="problem", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    problem_id = Column(String(36), ForeignKey("problems.id"), nullable=False, index=True)
    university_name = Column(String(255), nullable=False, index=True)
    team_name = Column(String(255), nullable=True)
    student_lead = Column(String(255), nullable=True)
    faculty_advisor = Column(String(255), nullable=True)
    lifecycle_stage = Column(String(50), default="Assigned", index=True) # Assigned, In Progress, Testing, Deployed
    proposal_summary = Column(Text, nullable=True)
    budget_allocated = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    problem = relationship("Problem", back_populates="project")
    milestones = relationship("Milestone", back_populates="project", cascade="all, delete-orphan")


class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    target_date = Column(String(50), nullable=True)
    status = Column(String(50), default="Pending") # Pending, Completed
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="milestones")


class CSRPledge(Base):
    __tablename__ = "csr_pledges"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    problem_id = Column(String(36), ForeignKey("problems.id"), nullable=False, index=True)
    company_name = Column(String(255), nullable=False, index=True)
    contact_person = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    pledge_type = Column(String(50), default="Grant Funding") # Grant Funding, Equipment, Mentorship
    amount = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    problem = relationship("Problem", back_populates="csr_pledges")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_code = Column(String(50), index=True, nullable=False)
    recipient_contact = Column(String(100), nullable=True) # Phone or Email
    event_type = Column(String(50), nullable=False) # TICKET_CREATED, STATUS_CHANGED, TEAM_ASSIGNED, SOLUTION_DEPLOYED
    channel = Column(String(50), default="SMS_SIMULATED") # SMS_SIMULATED, EMAIL_SIMULATED, IN_APP
    message = Column(Text, nullable=False)
    status = Column(String(50), default="SENT") # SENT, PENDING, FAILED
    created_at = Column(DateTime, default=datetime.utcnow)
