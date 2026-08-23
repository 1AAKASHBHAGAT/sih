from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from ..database import get_db
from ..models import Problem, Project, CSRPledge, User
from ..schemas import AnalyticsSummaryResponse
from ..dependencies import require_roles

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/summary", response_model=AnalyticsSummaryResponse)
def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["government", "university_admin", "industry"]))
):
    """
    Computes real-time executive dashboard metrics.
    Requires authenticated role (`government`, `university_admin`, `industry`).
    """
    total_submitted = db.query(Problem).count()
    active_projects = db.query(Problem).filter(Problem.status.in_(["Assigned", "In Progress", "Testing"])).count()
    completed_deployed = db.query(Problem).filter(Problem.status == "Deployed").count()
    
    distinct_heis = db.query(func.count(func.distinct(Problem.assigned_university))).scalar() or 0

    # Domain Distribution
    domain_counts = db.query(
        Problem.ai_predicted_category.label("name"),
        func.count(Problem.id).label("value")
    ).group_by(Problem.ai_predicted_category).all()
    
    domain_distribution = [{"name": row.name, "value": row.value} for row in domain_counts]

    # District Distribution
    district_counts = db.query(
        Problem.district.label("district"),
        func.count(Problem.id).label("count")
    ).group_by(Problem.district).all()
    
    district_distribution = [{"district": row.district, "count": row.count} for row in district_counts]

    # University Leaderboard
    uni_counts = db.query(
        Problem.assigned_university.label("university"),
        func.count(Problem.id).label("total_assigned"),
        func.sum(case((Problem.status == "Deployed", 1), else_=0)).label("deployed_count")
    ).group_by(Problem.assigned_university).all()

    university_leaderboard = [
        {
            "university": row.university,
            "total_assigned": row.total_assigned,
            "deployed_count": row.deployed_count or 0
        }
        for row in uni_counts
    ]

    # Recent Activity
    recent_problems = db.query(Problem).order_by(Problem.created_at.desc()).limit(5).all()
    recent_activity = [
        {
            "id": p.id,
            "ticket_code": p.ticket_code,
            "title": p.title,
            "category": p.ai_predicted_category,
            "university": p.assigned_university,
            "status": p.status,
            "district": p.district,
            "created_at": p.created_at.strftime("%Y-%m-%d %H:%M")
        }
        for p in recent_problems
    ]

    return {
        "total_submitted": total_submitted,
        "active_projects": active_projects,
        "completed_deployed": completed_deployed,
        "participating_heis": distinct_heis,
        "domain_distribution": domain_distribution,
        "district_distribution": district_distribution,
        "university_leaderboard": university_leaderboard,
        "recent_activity": recent_activity
    }
