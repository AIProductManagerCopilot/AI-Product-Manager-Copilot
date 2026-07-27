import pandas as pd

from app.core.database import SessionLocal
from app.models.core_models import Sprint, Project


def seed_sprints():
    db = SessionLocal()

    df = pd.read_csv("../dataset_factory/output/raw/sprints.csv")

    sprints = []

    for _, row in df.iterrows():

        # Find project using project_code
        project = (
            db.query(Project)
            .filter(Project.project_code == row["project_id"])
            .first()
        )

        if project is None:
            print(f"Project {row['project_id']} not found. Skipping...")
            continue

        sprint = Sprint(
            sprint_code=row["sprint_id"],
            project_id=project.id,
            sprint_name=row["sprint_name"],
            goal=row["goal"],
            status=row["status"],
            start_date=pd.to_datetime(row["start_date"]),
            end_date=pd.to_datetime(row["end_date"]),
        )

        sprints.append(sprint)

    db.add_all(sprints)
    db.commit()
    db.close()

    print("Sprints seeded successfully!")


if __name__ == "__main__":
    seed_sprints()
