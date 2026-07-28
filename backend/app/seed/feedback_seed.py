import pandas as pd

from app.core.database import SessionLocal
from app.models.core_models import Feedback, Project, User


def seed_feedback():
    db = SessionLocal()

    df = pd.read_csv("../dataset_factory/output/raw/feedback.csv")

    feedback_entries = []

    for _, row in df.iterrows():

        # Find project
        project = (
            db.query(Project)
            .filter(Project.project_code == row["project_id"])
            .first()
        )

        if project is None:
            print(f"Project {row['project_id']} not found. Skipping...")
            continue

        # Find user
        user = (
            db.query(User)
            .filter(User.user_code == row["user_id"])
            .first()
        )

        feedback = Feedback(
            feedback_code=row["feedback_id"],
            project_id=project.id,
            user_id=user.id if user else None,
            feedback_type=row["feedback_type"],
            feedback_text=row["feedback_text"],
            priority=row["priority"],
            sentiment=row["sentiment"],
            channel=row["channel"],
            created_at=pd.to_datetime(row["created_at"]),
        )

        feedback_entries.append(feedback)

    db.add_all(feedback_entries)
    db.commit()
    db.close()

    print("Feedback seeded successfully!")


if __name__ == "__main__":
<<<<<<< HEAD
    seed_feedback()
=======
    seed_feedback()
>>>>>>> 42b4670d97b915d3bb70c75a65efdc71f3a87b1d
