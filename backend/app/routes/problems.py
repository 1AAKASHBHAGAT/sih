import random
import string
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from ..models import Problem, Project, Milestone, User
from ..schemas import ProblemSubmissionCreate, ProblemResponse, ProblemStatusUpdate
from ..services.ai_service import classify_issue, check_duplicate_submission
from ..services.router_service import route_problem_to_university, calculate_urgency, DISTRICT_COORDINATES
from ..services.notification_service import notify_ticket_created, notify_status_changed
from ..dependencies import get_current_user, get_optional_current_user, require_roles

router = APIRouter(prefix="/api/problems", tags=["Problems"])

INITIAL_PROBLEMS = [
    {
        "ticket_code": "SIH-JH-1024",
        "title": "High Arsenic & Turbidity in Chas Village Drinking Water Well",
        "description": "High levels of arsenic and chemical turbidity detected in community drinking water well near Chas village, Bokaro. Requires low-cost community filtration unit.",
        "user_category": "Water Management",
        "ai_predicted_category": "Water Management",
        "assigned_university": "IIT (ISM) Dhanbad - Water Research Center",
        "location": "Chas Village, Ward 4",
        "district": "Bokaro",
        "latitude": 23.6324,
        "longitude": 86.1772,
        "status": "In Progress",
        "urgency_score": 9,
        "reporter_name": "Ramesh Kumar Mahato",
        "contact_phone": "9876543210",
        "team_name": "Team HydroPure (IIT Dhanbad)",
        "student_lead": "Ananya Sen (M.Tech Water Resources)",
        "faculty_advisor": "Dr. R. N. Mukherjee (Prof. Env Science)",
        "budget_allocated": 125000.0,
        "proposal_summary": "Deploying multi-stage nano-sand & activated alumina filtration matrix for community water purification."
    },
    {
        "ticket_code": "SIH-JH-2048",
        "title": "Paddy Crop Pest Outbreak & Soil Degradation in Mandar Block",
        "description": "Widespread stem-borer pest attack affecting 120 hectares of paddy crops in Mandar. Farmers require organic bio-pesticide and soil health diagnostic tool.",
        "user_category": "Agriculture",
        "ai_predicted_category": "Agriculture",
        "assigned_university": "Birsa Agricultural University, Ranchi",
        "location": "Mandar Village Block",
        "district": "Ranchi",
        "latitude": 23.4561,
        "longitude": 85.0892,
        "status": "Testing",
        "urgency_score": 8,
        "reporter_name": "Sita Devi",
        "contact_phone": "9431209876",
        "team_name": "Team AgriSuraksha (BAU)",
        "student_lead": "Birsa Oraon (B.Sc Agronomy)",
        "faculty_advisor": "Dr. S. K. Tirkey (Chair of Agronomy)",
        "budget_allocated": 95000.0,
        "proposal_summary": "Formulating neem-based bio-pesticide spray paired with IoT soil NPK sensor kits for local farmers."
    },
    {
        "ticket_code": "SIH-JH-3096",
        "title": "Maternal Anemia Diagnostic & Telemedicine Coverage in Latehar",
        "description": "Lack of maternal diagnostic facilities and high prevalence of iron-deficiency anemia among pregnant women in tribal hamlets of Latehar district.",
        "user_category": "Healthcare",
        "ai_predicted_category": "Healthcare",
        "assigned_university": "Central University of Jharkhand (CUJ) - Health Tech Hub",
        "location": "Mahuadanr Health Sub-Center",
        "district": "Latehar",
        "latitude": 23.7431,
        "longitude": 84.1165,
        "status": "In Progress",
        "urgency_score": 9,
        "reporter_name": "Dr. Anil Kujur",
        "contact_phone": "9123456789",
        "team_name": "Team MedPulse (CUJ)",
        "student_lead": "Priyanka Sharma (Biomedical Eng)",
        "faculty_advisor": "Prof. Rajeshwar Roy (Health Tech Chair)",
        "budget_allocated": 150000.0,
        "proposal_summary": "Portable non-invasive hemoglobinometer device integrated with mobile telemedicine app for ASHA workers."
    },
    {
        "ticket_code": "SIH-JH-4012",
        "title": "Smart ICT Classroom & Digital Literacy Disparity in Khunti Schools",
        "description": "Primary schools in rural Khunti lack offline digital learning aids and interactive audio-visual content in local regional dialects.",
        "user_category": "Education",
        "ai_predicted_category": "Education",
        "assigned_university": "Ranchi University - Digital Innovation Lab",
        "location": "Murhu Village Primary School",
        "district": "Khunti",
        "latitude": 23.0782,
        "longitude": 85.2799,
        "status": "Assigned",
        "urgency_score": 6,
        "reporter_name": "Sunil Munda",
        "contact_phone": "9709876543",
        "team_name": "Team ShikshaSethu (RU)",
        "student_lead": "Amit Kumar Mahato (MCA Lead)",
        "faculty_advisor": "Dr. Sunita Devi (Dept of Computer Applications)",
        "budget_allocated": 75000.0,
        "proposal_summary": "Solar-powered offline Raspberry Pi media servers pre-loaded with interactive regional educational modules."
    },
    {
        "ticket_code": "SIH-JH-5088",
        "title": "Coal Fly-Ash Pollution & Ambient Air Quality in Jharia Mining Belt",
        "description": "Heavy particulate matter (PM2.5/PM10) and coal dust exposure causing respiratory illness in residential areas surrounding open-cast mining sites.",
        "user_category": "Environment & Forests",
        "ai_predicted_category": "Environment & Forests",
        "assigned_university": "NIT Jamshedpur - Environmental Engineering Department",
        "location": "Jharia Basti, Dhanbad",
        "district": "Dhanbad",
        "latitude": 23.7412,
        "longitude": 86.4150,
        "status": "Submitted",
        "urgency_score": 8,
        "reporter_name": "Vikas Singh",
        "contact_phone": "9304567891",
        "team_name": "Team EcoShield (NIT JSR)",
        "student_lead": "Rahul Soren (Civil & Env Eng)",
        "faculty_advisor": "Prof. T. K. Hansda (Structural & Env Eng)",
        "budget_allocated": 50000.0,
        "proposal_summary": "Deploying low-cost particulate sensor network paired with wet fogging suppression prototype."
    },
    {
        "ticket_code": "SIH-JH-6040",
        "title": "Off-Grid Solar Micro-Grid & Street Lighting in Simdega Hamlets",
        "description": "Un-electrified tribal hamlets in Bano block of Simdega require reliable solar micro-grid lighting and smartphone charging station.",
        "user_category": "Infrastructure & Energy",
        "ai_predicted_category": "Infrastructure & Energy",
        "assigned_university": "BIT Mesra - Civil & Renewable Energy Center",
        "location": "Bano Block, Simdega",
        "district": "Simdega",
        "latitude": 22.6150,
        "longitude": 84.5090,
        "status": "Deployed",
        "urgency_score": 7,
        "reporter_name": "Pooja Ekka",
        "contact_phone": "9631245780",
        "team_name": "Team UrjaVikas (BIT Mesra)",
        "student_lead": "Deepak Verma (M.Tech Renewable Energy)",
        "faculty_advisor": "Dr. A. K. Choudhury (Head of Electrical Eng)",
        "budget_allocated": 180000.0,
        "proposal_summary": "Modular 3kW solar PV micro-grid with lithium-ion battery storage installed and operational."
    }
]

def seed_initial_problems_if_needed(db: Session):
    """Pre-seeds realistic societal challenges with diverse student leads across all 6 universities."""
    existing_count = db.query(Problem).count()
    if existing_count == 0:
        for pdata in INITIAL_PROBLEMS:
            problem = Problem(
                ticket_code=pdata["ticket_code"],
                title=pdata["title"],
                description=pdata["description"],
                user_category=pdata["user_category"],
                ai_predicted_category=pdata["ai_predicted_category"],
                ai_confidence=0.92,
                needs_human_review=False,
                assigned_university=pdata["assigned_university"],
                location=pdata["location"],
                district=pdata["district"],
                latitude=pdata["latitude"],
                longitude=pdata["longitude"],
                status=pdata["status"],
                urgency_score=pdata["urgency_score"],
                reporter_name=pdata["reporter_name"],
                contact_phone=pdata["contact_phone"],
                dpdp_consent_given=True,
                dpdp_consent_timestamp=datetime.utcnow()
            )
            db.add(problem)
            db.commit()
            db.refresh(problem)

            project = Project(
                problem_id=problem.id,
                university_name=pdata["assigned_university"],
                team_name=pdata["team_name"],
                student_lead=pdata["student_lead"],
                faculty_advisor=pdata["faculty_advisor"],
                lifecycle_stage=pdata["status"],
                proposal_summary=pdata["proposal_summary"],
                budget_allocated=pdata["budget_allocated"]
            )
            db.add(project)
            db.commit()

            m1 = Milestone(project_id=project.id, title="Requirement Verification & Field Visit", status="Completed" if pdata["status"] in ["In Progress", "Testing", "Deployed"] else "Pending", target_date="Day 7")
            m2 = Milestone(project_id=project.id, title="Prototype Development & Lab Testing", status="Completed" if pdata["status"] in ["Testing", "Deployed"] else "Pending", target_date="Day 30")
            m3 = Milestone(project_id=project.id, title="Community Field Trial & Deployment", status="Completed" if pdata["status"] == "Deployed" else "Pending", target_date="Day 60")
            db.add_all([m1, m2, m3])
            db.commit()

            notify_ticket_created(db, problem.ticket_code, problem.title, problem.ai_predicted_category, problem.assigned_university, problem.contact_phone)

def generate_ticket_code() -> str:
    """Generates unique tracking code like SIH-JH-8492"""
    digits = ''.join(random.choices(string.digits, k=4))
    return f"SIH-JH-{digits}"

@router.post("/submit", response_model=ProblemResponse)
def submit_problem(
    payload: ProblemSubmissionCreate, 
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Submits a new societal challenge. Public access allowed (or optional citizen token).
    Performs AI Zero-Shot classification, confidence threshold checks, & >80% duplicate similarity detection.
    Persists DPDP Act 2023 GPS consent & timestamp.
    """
    # 1. Run AI classification & timeout fallback
    ai_result = classify_issue(payload.title, payload.description, payload.user_category)
    ai_category = ai_result.get("category", payload.user_category or "Water Management")
    confidence = float(ai_result.get("confidence", 0.85))
    
    # Enforce PRD >85% (0.85) Confidence Threshold for Auto-Routing
    needs_review = confidence < 0.85
    
    # 2. Duplicate Detection against existing submissions
    district_problems = db.query(Problem).filter(Problem.district == (payload.district or "Ranchi")).all()
    dup_info = check_duplicate_submission(payload.title, payload.description, payload.district or "Ranchi", district_problems)
    
    is_dup = dup_info["is_duplicate"] if dup_info else False
    dup_ticket = dup_info["duplicate_of_ticket"] if dup_info else None

    # 3. Auto-route university
    assigned_university = route_problem_to_university(ai_category, payload.district)
    
    # 4. Urgency scoring (PyTorch model when available, keyword rules fallback)
    urgency = calculate_urgency(payload.title, payload.description, ai_category)
    
    # 5. Geolocation defaults if missing
    lat, lng = payload.latitude, payload.longitude
    if (not lat or not lng) and payload.district in DISTRICT_COORDINATES:
        base_lat, base_lng = DISTRICT_COORDINATES[payload.district]
        lat = base_lat + random.uniform(-0.02, 0.02)
        lng = base_lng + random.uniform(-0.02, 0.02)
        
    # 6. Create database record with DPDP consent tracking (PRD Section 12)
    ticket = generate_ticket_code()
    reporter_name = payload.reporter_name or (current_user.full_name if current_user else "Anonymous Citizen")
    
    problem = Problem(
        ticket_code=ticket,
        title=payload.title,
        description=payload.description,
        user_category=payload.user_category,
        ai_predicted_category=ai_category,
        ai_confidence=confidence,
        needs_human_review=needs_review,
        assigned_university=assigned_university,
        location=payload.location,
        district=payload.district or "Ranchi",
        latitude=lat,
        longitude=lng,
        status="Submitted",
        urgency_score=urgency,
        reporter_name=reporter_name,
        contact_phone=payload.contact_phone,
        image_url=payload.image_url,
        dpdp_consent_given=payload.dpdp_consent_given if payload.dpdp_consent_given is not None else True,
        dpdp_consent_timestamp=datetime.utcnow(),
        is_duplicate=is_dup,
        duplicate_of_ticket=dup_ticket
    )
    
    db.add(problem)
    db.commit()
    db.refresh(problem)
    
    # Auto-create initial project shell assigned to university
    project = Project(
        problem_id=problem.id,
        university_name=assigned_university,
        team_name=f"Team {ai_category.split()[0]}R&D ({assigned_university.split('-')[0].strip()})",
        student_lead="Assigned Nodal Student Lead",
        faculty_advisor="Nodal Faculty Advisor",
        lifecycle_stage="Submitted",
        proposal_summary=f"Automated R&D project shell generated for ticket {ticket}. Pending university review.",
        budget_allocated=75000.0
    )
    db.add(project)
    db.commit()

    # Initial milestone checklist
    m1 = Milestone(project_id=project.id, title="Requirement Verification & Field Visit", status="Pending", target_date="Day 7")
    m2 = Milestone(project_id=project.id, title="Prototype Development & Lab Testing", status="Pending", target_date="Day 30")
    m3 = Milestone(project_id=project.id, title="Community Field Trial & Deployment", status="Pending", target_date="Day 60")
    db.add_all([m1, m2, m3])
    db.commit()

    # Trigger SMS & System Notification Dispatch
    notify_ticket_created(db, ticket, problem.title, ai_category, assigned_university, problem.contact_phone)
    
    return problem

@router.get("", response_model=List[ProblemResponse])
def get_problems_list(
    district: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Problem)
    if district and district != "All":
        query = query.filter(Problem.district == district)
    if category and category != "All":
        query = query.filter(or_(Problem.ai_predicted_category == category, Problem.user_category == category))
    if status and status != "All":
        query = query.filter(Problem.status == status)
    if search:
        s = f"%{search}%"
        query = query.filter(or_(Problem.title.ilike(s), Problem.description.ilike(s), Problem.ticket_code.ilike(s)))
    return query.order_by(Problem.created_at.desc()).all()

@router.get("/ticket/{ticket_code}", response_model=ProblemResponse)
def get_problem_by_ticket(ticket_code: str, db: Session = Depends(get_db)):
    prob = db.query(Problem).filter(Problem.ticket_code == ticket_code.upper()).first()
    if not prob:
        raise HTTPException(status_code=404, detail=f"No problem found with ticket code '{ticket_code}'")
    return prob

@router.post("/{problem_id}/status", response_model=ProblemResponse)
def update_status(
    problem_id: str,
    payload: ProblemStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["university_admin", "government"]))
):
    prob = db.query(Problem).filter(Problem.id == problem_id).first()
    if not prob:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    # Server-side university scoping check
    if current_user.role == "university_admin" and current_user.institution:
        if current_user.institution.lower() not in prob.assigned_university.lower():
            raise HTTPException(
                status_code=403,
                detail=f"Access Denied: You are registered under '{current_user.institution}' and cannot modify problems routed to '{prob.assigned_university}'."
            )

    old_status = prob.status
    prob.status = payload.status
    if prob.project:
        prob.project.lifecycle_stage = payload.status
        
    db.commit()
    db.refresh(prob)

    # Trigger SMS & System Notification Dispatch on status change
    notify_status_changed(db, prob.ticket_code, old_status, payload.status, prob.assigned_university, prob.contact_phone)

    return prob
