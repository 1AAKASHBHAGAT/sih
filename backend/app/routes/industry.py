from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Problem, CSRPledge, User
from ..schemas import CSRPledgeCreate, CSRPledgeResponse
from ..dependencies import require_roles, get_optional_current_user

router = APIRouter(prefix="/api/industry", tags=["Industry CSR"])

@router.post("/pledge/{problem_id}", response_model=CSRPledgeResponse)
def submit_pledge(
    problem_id: str,
    payload: CSRPledgeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["industry", "government"]))
):
    """
    Submits a new CSR grant or technical mentorship pledge for a challenge.
    Requires `industry` or `government` role.
    """
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem record not found.")

    company_name = payload.company_name or (current_user.company_name if current_user else "Industry Partner")

    pledge = CSRPledge(
        problem_id=problem.id,
        company_name=company_name,
        contact_person=payload.contact_person or current_user.full_name,
        email=payload.email or current_user.email,
        pledge_type=payload.pledge_type,
        amount=payload.amount,
        notes=payload.notes
    )

    db.add(pledge)
    db.commit()
    db.refresh(pledge)
    return pledge

@router.get("/pledges", response_model=List[CSRPledgeResponse])
def get_all_pledges(db: Session = Depends(get_db)):
    """Public read endpoint for total CSR pledges metrics."""
    return db.query(CSRPledge).order_by(CSRPledge.created_at.desc()).all()
