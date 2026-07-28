import pandas as pd

from app.core.database import SessionLocal
from app.models.core_models import Ticket, Project, User


def seed_tickets():
    db = SessionLocal()

    df = pd.read_csv("../dataset_factory/output/raw/tickets.csv")

    tickets = []

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

        # Find assigned user
        assigned_user = (
            db.query(User)
            .filter(User.user_code == row["assigned_user_id"])
            .first()
        )

        ticket = Ticket(
            ticket_code=row["ticket_id"],
            project_id=project.id,
            assigned_user_id=assigned_user.id if assigned_user else None,
            ticket_title=row["ticket_title"],
            ticket_type=row["ticket_type"],
            priority=row["priority"],
            status=row["status"],
            story_points=row["story_points"],
            created_at=pd.to_datetime(row["created_at"]),
        )

        tickets.append(ticket)

    db.add_all(tickets)
    db.commit()
    db.close()

    print("Tickets seeded successfully!")


if __name__ == "__main__":
<<<<<<< HEAD
    seed_tickets()
=======
    seed_tickets()
>>>>>>> 42b4670d97b915d3bb70c75a65efdc71f3a87b1d
