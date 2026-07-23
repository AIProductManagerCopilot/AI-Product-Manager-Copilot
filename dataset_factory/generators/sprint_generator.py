"""
=========================================================
Enterprise Synthetic Data Generation Engine (ESDGE)
Sprint Generator
=========================================================
"""

import random
from faker import Faker

from dataset_factory.config import DATASET_SIZE
from dataset_factory.core.id_generator import generate_sprint_id

fake = Faker()

SPRINT_STATUS = [
    "Planned",
    "Active",
    "Completed"
]


def generate_sprints(projects):

    sprints = []

    project_ids = [
        project["project_id"]
        for project in projects
    ]

    for i in range(DATASET_SIZE["sprints"]):

        start_date = fake.date_between(
            start_date="-2y",
            end_date="-30d"
        )

        sprints.append({

            "sprint_id": generate_sprint_id(),

            "project_id": random.choice(project_ids),

            "sprint_name": f"Sprint {i+1}",

            "goal": fake.sentence(nb_words=8),

            "status": random.choice(SPRINT_STATUS),

            "start_date": start_date,

            "end_date": fake.date_between(
                start_date=start_date,
                end_date="+30d"
            )

        })

    return sprints