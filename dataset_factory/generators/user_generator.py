"""
Enterprise Synthetic Data Generation Engine (ESDGE)

User Generator
"""

import random
from faker import Faker

from dataset_factory.config import DATASET_SIZE
from dataset_factory.core.id_generator import generate_user_id

fake = Faker()


ROLES = [
    "Product Manager",
    "Product Owner",
    "Engineering Manager",
    "Software Engineer",
    "QA Engineer",
    "UI/UX Designer",
    "Data Analyst",
    "Business Analyst",
]


def generate_users(workspaces):

    users = []

    workspace_ids = [
        workspace["workspace_id"]
        for workspace in workspaces
    ]

    for _ in range(DATASET_SIZE["users"]):

        first = fake.first_name()
        last = fake.last_name()

        users.append({

            "user_id": generate_user_id(),

            "workspace_id": random.choice(workspace_ids),

            "first_name": first,

            "last_name": last,

            "email": f"{first.lower()}.{last.lower()}@example.com",

            "role": random.choice(ROLES),

            "country": fake.country(),

            "created_at": fake.date_between(
                start_date="-5y",
                end_date="today"
            )

        })

    return users