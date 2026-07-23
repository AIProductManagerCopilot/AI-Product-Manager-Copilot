"""
=========================================================
Enterprise Synthetic Data Generation Engine (ESDGE)
Workspace Generator
=========================================================
"""

from faker import Faker

from dataset_factory.config import DATASET_SIZE
from dataset_factory.core.id_generator import generate_workspace_id

fake = Faker()


def generate_workspaces(organizations):

    workspaces = []

    organization_ids = [
        org["organization_id"]
        for org in organizations
    ]

    for i in range(DATASET_SIZE["workspaces"]):

        workspaces.append({

            "workspace_id": generate_workspace_id(),

            "organization_id": fake.random_element(
                organization_ids
            ),

            "workspace_name": f"Workspace-{i+1}",

            "description": fake.sentence(nb_words=8),

            "created_at": fake.date_between(
                start_date="-3y",
                end_date="today"
            )
        })

    return workspaces