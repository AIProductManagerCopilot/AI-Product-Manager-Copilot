import csv
from pathlib import Path

from app.models.core_models import Workspace, Organization
from app.seed.db_session import get_db


def seed_workspaces():
    db = get_db()

    csv_path = (
        Path(__file__).resolve().parents[3]
        / "dataset_factory"
        / "output"
        / "raw"
        / "workspaces.csv"
    )

    workspaces = []

    with open(csv_path, mode="r", encoding="utf-8") as file:
        reader = csv.DictReader(file)

        for row in reader:

            organization = (
                db.query(Organization)
                .filter(
                    Organization.organization_code == row["organization_id"]
                )
                .first()
            )

            if organization is None:
                print(
                    f"Organization {row['organization_id']} not found. Skipping..."
                )
                continue

            workspace = Workspace(
                workspace_code=row["workspace_id"],
                org_id=organization.id,
                workspace_name=row["workspace_name"],
                description=row["description"],
            )

            workspaces.append(workspace)

    db.add_all(workspaces)

    try:
        db.commit()
        print("Workspaces seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
<<<<<<< HEAD
    seed_workspaces()
=======
    seed_workspaces()
>>>>>>> 42b4670d97b915d3bb70c75a65efdc71f3a87b1d
