import csv
from pathlib import Path

from app.models.core_models import Organization
from app.seed.db_session import get_db


def seed_organizations():
    db = get_db()

    csv_path = (
        Path(__file__).resolve().parents[3]
        / "dataset_factory"
        / "output"
        / "raw"
        / "organizations.csv"
    )

    organizations = []

    with open(csv_path, mode="r", encoding="utf-8") as file:
        reader = csv.DictReader(file)

        for row in reader:
            organization = Organization(
                organization_code=row["organization_id"],
                organization_name=row["organization_name"],
                industry=row["industry"],
                country=row["country"],
                city=row["city"],
                employee_count=int(row["employee_count"]),
                subscription_plan=row["subscription_plan"],
            )

            organizations.append(organization)
    db.query(Organization).delete()
    db.add_all(organizations)

    try:
        db.commit()
        print("Organizations seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_organizations()