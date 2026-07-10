# seed_db.py
from backend.app.core.database import engine, SessionLocal
from backend.app.models.core_models import Base, Organization, Workspace, Project
import uuid

def seed_system():
    print("🚀 Initializing relational database structural layout...")
    # Automatically creates all matching tables in PostgreSQL if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if an organization already exists to prevent duplicate entries
        existing_org = db.query(Organization).first()
        if existing_org:
            print("✨ Database structures already built and populated.")
            return

        print("📦 Seeding core structural enterprise boundaries...")
        org = Organization(id=uuid.uuid4(), name="Dayananda Sagar Enterprise AI")
        db.add(org)
        db.flush() # Flushes states down to get the generated IDs
        
        workspace = Workspace(id=uuid.uuid4(), org_id=org.id, name="ISE Department Core")
        db.add(workspace)
        db.flush()
        
        # We lock down a fixed, predictable project ID for our initial testing runs
        fixed_project_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
        project = Project(id=fixed_project_id, workspace_id=workspace.id, name="Aegis Core Platform Analytics")
        db.add(project)
        
        db.commit()
        print("\n🏆 Database successfully seeded!")
        print(f"Target Project ID for API testing: {fixed_project_id}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Seeding execution dropped: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_system()