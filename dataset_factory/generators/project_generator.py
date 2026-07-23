"""
=========================================================
Enterprise Synthetic Data Generation Engine (ESDGE)
Project Generator
=========================================================
"""

import random
from faker import Faker

from dataset_factory.config import DATASET_SIZE, PROJECT_STATUS
from dataset_factory.core.id_generator import generate_project_id

fake = Faker()

PROJECT_TYPES = [
    "Web Application",
    "Mobile Application",
    "AI Product",
    "Cloud Platform",
    "Internal Tool",
    "CRM System",
    "ERP System",
    "Analytics Dashboard",
]

TECH_STACKS = [
    "Python/FastAPI",
    "React",
    "Angular",
    "Vue",
    "Node.js",
    "Java Spring",
    "Django",
    "Flutter",
]


def generate_projects(workspaces, users):

    projects = []

    workspace_ids = [
        workspace["workspace_id"]
        for workspace in workspaces
    ]

    user_ids = [
        user["user_id"]
        for user in users
    ]

    for i in range(DATASET_SIZE["projects"]):

        start_date = fake.date_between(
            start_date="-3y",
            end_date="-30d"
        )

        projects.append({

            "project_id": generate_project_id(),

            "workspace_id": random.choice(workspace_ids),

            "project_name": f"Project-{i+1}",

            "project_type": random.choice(PROJECT_TYPES),

            "description": fake.paragraph(nb_sentences=3),

            "owner_user_id": random.choice(user_ids),

            "technology_stack": random.choice(TECH_STACKS),

            "status": random.choice(PROJECT_STATUS),

            "budget_usd": random.randint(
                10000,
                500000
            ),

            "start_date": start_date,

            "end_date": fake.date_between(
                start_date=start_date,
                end_date="+1y"
            )

        })

    return projects