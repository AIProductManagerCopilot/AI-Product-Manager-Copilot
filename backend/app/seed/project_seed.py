import pandas as pd

from app.core.database import SessionLocal
from app.models.core_models import Project, Workspace, User


def seed_projects():
    db = SessionLocal()

    df = pd.read_csv("../dataset_factory/output/raw/projects.csv")

    projects = []

    for _, row in df.iterrows():

        # Find workspace
        workspace = (
            db.query(Workspace)
            .filter(
                Workspace.workspace_code == row["workspace_id"]
            )
            .first()
        )

        if workspace is None:
            print(f"Workspace {row['workspace_id']} not found. Skipping...")
            continue

        # Find owner user
        owner = (
            db.query(User)
            .filter(
                User.user_code == row["owner_user_id"]
            )
            .first()
        )

        owner_id = owner.id if owner else None

        project = Project(
            project_code=row["project_id"],
            workspace_id=workspace.id,
            owner_id=owner_id,
            project_name=row["project_name"],
            project_type=row["project_type"],
            description=row["description"],
            technology_stack=row["technology_stack"],
            status=row["status"],
            budget_usd=row["budget_usd"],
            start_date=pd.to_datetime(row["start_date"]).date()
            if pd.notna(row["start_date"])
            else None,
            end_date=pd.to_datetime(row["end_date"]).date()
            if pd.notna(row["end_date"])
            else None,
        )

        projects.append(project)

    db.add_all(projects)
    db.commit()
    db.close()

    print("Projects seeded successfully!")


if __name__ == "__main__":
    seed_projects()
