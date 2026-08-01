from app.seed.organization_seed import seed_organizations
from app.seed.workspace_seed import seed_workspaces
from app.seed.user_seed import seed_users
from app.seed.project_seed import seed_projects
from app.seed.feature_seed import seed_features
from app.seed.sprint_seed import seed_sprints
from app.seed.ticket_seed import seed_tickets
from app.seed.feedback_seed import seed_feedback

import traceback


def seed_database():
    """
    Master database seeding pipeline.

    Seeds all PostgreSQL tables in dependency order to preserve
    foreign key relationships.

    Order:
    Organization
        ↓
    Workspace
        ↓
    User
        ↓
    Project
        ↓
    Feature
        ↓
    Sprint
        ↓
    Ticket
        ↓
    Feedback
    """

    print("\n========================================")
    print("Starting PostgreSQL Database Seeding")
    print("========================================\n")

    try:
        seed_organizations()
        print("✓ Organizations seeded successfully.")

        seed_workspaces()
        print("✓ Workspaces seeded successfully.")

        seed_users()
        print("✓ Users seeded successfully.")

        seed_projects()
        print("✓ Projects seeded successfully.")

        seed_features()
        print("✓ Features seeded successfully.")

        seed_sprints()
        print("✓ Sprints seeded successfully.")

        seed_tickets()
        print("✓ Tickets seeded successfully.")

        seed_feedback()
        print("✓ Feedback seeded successfully.")

        print("\n========================================")
        print("Database seeding completed successfully.")
        print("========================================\n")

    except Exception:
        print("\n========================================")
        print("Database seeding failed.")
        print("========================================\n")
        traceback.print_exc()
        raise


if __name__ == "__main__":
    seed_database()