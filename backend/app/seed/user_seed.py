import pandas as pd

from app.core.database import SessionLocal
from app.models.core_models import User, Workspace


def seed_users():
    db = SessionLocal()

    df = pd.read_csv("../dataset_factory/output/raw/users.csv")
    df = df.drop_duplicates(subset=["email"])

    users = []

    for _, row in df.iterrows():

        # Find the workspace using workspace_code (e.g., WS0001)
        workspace = (
            db.query(Workspace)
            .filter(
                Workspace.workspace_code == row["workspace_id"]
            )
            .first()
        )

        if workspace is None:
            print(
                f"Workspace {row['workspace_id']} not found. Skipping..."
            )
            continue

        user = User(
            user_code=row["user_id"],
            workspace_id=workspace.id,
            first_name=row["first_name"],
            last_name=row["last_name"],
            email=row["email"],
            role=row["role"],
            country=row["country"],
        )

        users.append(user)

    db.add_all(users)
    db.commit()
    db.close()

    print("Users seeded successfully!")


if __name__ == "__main__":
    seed_users()