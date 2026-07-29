# seed_db.py
from backend.app.core.database import engine, SessionLocal
from backend.app.models.core_models import Base, Organization, Workspace, Project
from sqlalchemy import text
import uuid
import random
from datetime import datetime, timedelta

def seed_system():
    print("🚀 Initializing relational database structural layout...")
    # Automatically creates all matching tables in PostgreSQL if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Create customer_feedback table if it doesn't exist
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS customer_feedback (
                id UUID PRIMARY KEY,
                category VARCHAR(255) NOT NULL,
                sentiment_score FLOAT NOT NULL,
                severity_weight FLOAT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        db.commit()

        # Check if an organization already exists
        existing_org = db.query(Organization).first()
        if not existing_org:
            print("📦 Seeding core structural enterprise boundaries...")
            org = Organization(
                id=uuid.uuid4(),
                organization_code="ORG-001",
                organization_name="Dayananda Sagar Enterprise AI",
                industry="Software & AI",
                country="India",
                city="Bengaluru",
                employee_count=250,
                subscription_plan="Enterprise"
            )
            db.add(org)
            db.flush()

            workspace = Workspace(
                id=uuid.uuid4(),
                workspace_code="WS-001",
                org_id=org.id,
                workspace_name="ISE Department Core",
                description="Core ISE AI Copilot Workspace"
            )
            db.add(workspace)
            db.flush()

            fixed_project_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
            project = Project(
                id=fixed_project_id,
                project_code="PRJ-001",
                workspace_id=workspace.id,
                project_name="Aegis Core Platform Analytics",
                project_type="AI Product",
                status="Active"
            )
            db.add(project)
            db.commit()

        # Seed customer_feedback table if empty
        feedback_count = db.execute(text("SELECT COUNT(*) FROM customer_feedback")).scalar()
        if feedback_count == 0:
            print("📊 Seeding 200 customer feedback records for live analytics...")

            categories = [
                ("Complex onboarding process", 0.25, 4.8, "Onboarding exit rate is high on mobile."),
                ("Lack of real-time analytics", 0.35, 4.5, "Need live WebSocket telemetry."),
                ("Poor feature discoverability", 0.40, 3.8, "Secondary features are hidden."),
                ("Slow performance issues", 0.30, 4.2, "Latency is slow on high load."),
                ("Limited integration options", 0.50, 3.2, "Missing Slack/Jira integration."),
                ("PDF Export Missing", 0.20, 4.9, "Cannot download statements as PDF."),
                ("Login Failures", 0.15, 5.0, "Login fails frequently with error 500."),
                ("Payment Gateway Errors", 0.10, 5.0, "Payment fails but amount deducted."),
            ]

            now = datetime.utcnow()
            for _ in range(200):
                cat, base_sentiment, base_severity, sample_content = random.choice(categories)
                fb_id = uuid.uuid4()
                sent = max(0.05, min(0.95, base_sentiment + random.uniform(-0.1, 0.1)))
                sev = max(1.0, min(5.0, base_severity + random.uniform(-0.5, 0.5)))
                days_ago = random.randint(0, 56)
                created_at = now - timedelta(days=days_ago)

                db.execute(
                    text("""
                        INSERT INTO customer_feedback (id, category, sentiment_score, severity_weight, content, created_at)
                        VALUES (:id, :category, :sentiment_score, :severity_weight, :content, :created_at)
                    """),
                    {
                        "id": fb_id,
                        "category": cat,
                        "sentiment_score": round(sent, 2),
                        "severity_weight": round(sev, 2),
                        "content": sample_content,
                        "created_at": created_at,
                    }
                )
            db.commit()

        print("\n🏆 Database successfully seeded with live analytics records!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Seeding execution dropped: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_system()