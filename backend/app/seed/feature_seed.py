import pandas as pd

from app.core.database import SessionLocal
from app.models.core_models import Feature, Project


def seed_features():
    db = SessionLocal()

    df = pd.read_csv("../dataset_factory/output/raw/features.csv")

    features = []

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

        feature = Feature(
            feature_code=row["feature_id"],
            project_id=project.id,
            feature_name=row["feature_name"],
            priority=row["priority"],
            status=row["status"],
            estimated_story_points=row["estimated_story_points"],
            created_at=pd.to_datetime(row["created_at"]),
        )

        features.append(feature)

    db.add_all(features)
    db.commit()
    db.close()

    print("Features seeded successfully!")


if __name__ == "__main__":
    seed_features()
