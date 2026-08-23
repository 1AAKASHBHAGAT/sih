import random
from app.database import engine, SessionLocal, Base
from app.models import Problem, Project, Milestone, CSRPledge
from app.services.router_service import route_problem_to_university, calculate_urgency, DISTRICT_COORDINATES

SAMPLE_PROBLEMS = [
    {
        "ticket_code": "SIH-JH-1042",
        "title": "High Turbidity and Arsenic Contamination in Chas Village Drinking Water",
        "description": "Over 450 households in Chas block, Bokaro rely on deep tube wells showing visible rust discoloration and high turbidity. Preliminary testing indicates elevated arsenic levels causing local health concerns.",
        "user_category": "Water Management",
        "ai_predicted_category": "Water Management",
        "location": "Chas Village, Bokaro District",
        "district": "Bokaro",
        "status": "In Progress",
        "reporter_name": "Ramesh Kumar Mahato",
        "contact_phone": "+91 94311 02931"
    },
    {
        "ticket_code": "SIH-JH-2089",
        "title": "Soil Acidity and Crop Yield Decline in Kanke Tribal Farming Belt",
        "description": "Farmers in Kanke block are facing a 35% decline in paddy yields due to increasing soil acidity and lack of localized soil testing facilities. Urgent demand for automated pH testing and organic lime treatment.",
        "user_category": "Agriculture",
        "ai_predicted_category": "Agriculture",
        "location": "Kanke Block, Ranchi",
        "district": "Ranchi",
        "status": "In Progress",
        "reporter_name": "Sunita Munda",
        "contact_phone": "+91 98351 44829"
    },
    {
        "ticket_code": "SIH-JH-3104",
        "title": "Maternal Healthcare Telemedicine Gap in Dumka Tribal Clinics",
        "description": "Primary Health Centers (PHCs) in rural Dumka lack specialized gynecologists. High risk for pregnant women during monsoon when river transport is blocked. Need low-cost offline-capable diagnostic kits.",
        "user_category": "Healthcare",
        "ai_predicted_category": "Healthcare",
        "location": "Jama PHC, Dumka",
        "district": "Dumka",
        "status": "Assigned",
        "reporter_name": "Dr. Rajeshwar Murmu",
        "contact_phone": "+91 94301 99201"
    },
    {
        "ticket_code": "SIH-JH-4112",
        "title": "Solar Powered Digital Lab Setup for Government Schools in Hazaribagh",
        "description": "Frequent power outages of 8-10 hours daily disrupt ICT labs in 12 government high schools in Hazaribagh. Need micro-grid solar power backup paired with low-wattage Raspberry Pi terminals.",
        "user_category": "Education",
        "ai_predicted_category": "Education",
        "location": "Ichak High School, Hazaribagh",
        "district": "Hazaribagh",
        "status": "Testing",
        "reporter_name": "Anand Mohan Verma",
        "contact_phone": "+91 97092 11029"
    },
    {
        "ticket_code": "SIH-JH-5521",
        "title": "Industrial Fly Ash Dust and Air Pollution near Jamshedpur Suburbs",
        "description": "Heavy industrial transport creates severe PM10 fly ash pollution impacting residential areas near Adityapur. Requesting real-time IoT air quality monitoring node and fogger suppression design.",
        "user_category": "Environment & Forests",
        "ai_predicted_category": "Environment & Forests",
        "location": "Adityapur Industrial Area, Jamshedpur",
        "district": "Jamshedpur",
        "status": "Deployed",
        "reporter_name": "Priya Ranjan Das",
        "contact_phone": "+91 92345 88912"
    },
    {
        "ticket_code": "SIH-JH-6610",
        "title": "Plastic and Solid Waste Accumulation along Subarnarekha River Banks",
        "description": "Unchecked municipal dumping near Namkum river banks causes severe plastic blockage and riverine pollution during monsoon floods.",
        "user_category": "Sanitation",
        "ai_predicted_category": "Sanitation",
        "location": "Namkum Riverbank, Ranchi",
        "district": "Ranchi",
        "status": "Submitted",
        "reporter_name": "Amitabh Roy",
        "contact_phone": "+91 99312 00192"
    },
    {
        "ticket_code": "SIH-JH-7734",
        "title": "Bridge Structural Crack and Flash Flood Early Warning System",
        "description": "Old masonry bridge on Barakar river in Giridih shows deep concrete cracks. Urgent need for structural vibration sensors and automated water level flash flood sirens.",
        "user_category": "Infrastructure & Energy",
        "ai_predicted_category": "Infrastructure & Energy",
        "location": "Barakar River Bridge, Giridih",
        "district": "Giridih",
        "status": "In Progress",
        "reporter_name": "Vikram Singh",
        "contact_phone": "+91 94313 77210"
    },
    {
        "ticket_code": "SIH-JH-8890",
        "title": "Groundwater Fluoride Contamination in Daltonganj Rural Belts",
        "description": "High prevalence of dental fluorosis among school children in Palamu due to fluoride levels exceeding 3.5 ppm in local handpumps.",
        "user_category": "Water Management",
        "ai_predicted_category": "Water Management",
        "location": "Daltonganj Block, Palamu",
        "district": "Palamu",
        "status": "Deployed",
        "reporter_name": "Dr. K. K. Sinha",
        "contact_phone": "+91 91223 44510"
    }
]

def seed():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        for data in SAMPLE_PROBLEMS:
            dist = data["district"]
            base_lat, base_lng = DISTRICT_COORDINATES.get(dist, (23.3441, 85.3096))
            lat = base_lat + random.uniform(-0.02, 0.02)
            lng = base_lng + random.uniform(-0.02, 0.02)
            
            assigned_uni = route_problem_to_university(data["ai_predicted_category"], dist)
            urgency = calculate_urgency(data["title"], data["description"])
            
            prob = Problem(
                ticket_code=data["ticket_code"],
                title=data["title"],
                description=data["description"],
                user_category=data["user_category"],
                ai_predicted_category=data["ai_predicted_category"],
                assigned_university=assigned_uni,
                location=data["location"],
                district=dist,
                latitude=lat,
                longitude=lng,
                status=data["status"],
                urgency_score=urgency,
                reporter_name=data["reporter_name"],
                contact_phone=data["contact_phone"]
            )
            db.add(prob)
            db.commit()
            db.refresh(prob)
            
            # Project
            proj = Project(
                problem_id=prob.id,
                university_name=assigned_uni,
                lifecycle_stage=prob.status,
                team_name=f"Innovators-{prob.ai_predicted_category.split()[0]}-{random.randint(100, 999)}",
                student_lead="Aishwarya Patel (Final Year B.Tech)",
                faculty_advisor="Dr. R. K. Mishra (Head of Department)",
                proposal_summary=f"Developing low-cost localized solution for {prob.title.lower()} tailored for {prob.district} geography.",
                budget_allocated=float(random.choice([45000, 75000, 120000, 200000]))
            )
            db.add(proj)
            db.commit()
            db.refresh(proj)
            
            # Milestones
            m1 = Milestone(project_id=proj.id, title="Requirement & Site Survey Verification", status="Completed", target_date="2026-06-15")
            m2 = Milestone(project_id=proj.id, title="Lab Prototype & Testing", status="Completed" if prob.status in ["Testing", "Deployed"] else "Pending", target_date="2026-07-20")
            m3 = Milestone(project_id=proj.id, title="Field Deployment & Community Handover", status="Completed" if prob.status == "Deployed" else "Pending", target_date="2026-08-30")
            db.add_all([m1, m2, m3])
            
            # CSR Pledge for some
            if random.choice([True, False]):
                csr = CSRPledge(
                    problem_id=prob.id,
                    company_name=random.choice(["Tata Steel CSR", "Coal India Ltd (CIL)", "NTPC CSR", "Usha Martin Foundation", "Jindal Steel"]),
                    contact_person="Ravi Desai (CSR Head)",
                    email="csr.grants@tata.com",
                    pledge_type="Grant Funding & Mentorship",
                    amount=float(random.choice([50000, 100000, 250000])),
                    notes="Approved CSR grant allocation under Jharkhand Community Development Scheme 2026."
                )
                db.add(csr)
                
            db.commit()
            
        print("Database successfully seeded with realistic Jharkhand societal datasets!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
