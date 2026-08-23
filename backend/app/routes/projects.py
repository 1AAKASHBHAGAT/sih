from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Problem, Project, User
from ..schemas import TeamAssignmentCreate, ProjectResponse
from ..dependencies import require_roles

router = APIRouter(prefix="/api/projects", tags=["Projects"])

@router.post("/{problem_id}/assign-team", response_model=ProjectResponse)
def assign_team_to_problem(
    problem_id: str,
    payload: TeamAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["university_admin", "government"]))
):
    """
    Assigns student lead, faculty advisor, proposal summary, and budget.
    Requires `university_admin` or `government` role with institution scoping check.
    """
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem record not found.")

    if current_user.role == "university_admin" and current_user.institution:
        if problem.assigned_university != current_user.institution:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: You cannot assign teams for '{problem.assigned_university}'. Authorized for '{current_user.institution}' only."
            )

    project = problem.project
    if not project:
        project = Project(
            problem_id=problem.id,
            university_name=problem.assigned_university,
            lifecycle_stage="In Progress"
        )
        db.add(project)

    project.team_name = payload.team_name
    project.student_lead = payload.student_lead
    project.faculty_advisor = payload.faculty_advisor
    project.proposal_summary = payload.proposal_summary
    project.budget_allocated = payload.budget_allocated
    project.lifecycle_stage = "In Progress"

    problem.status = "In Progress"

    db.commit()
    db.refresh(project)
    return project
