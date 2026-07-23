"""
=========================================================
Enterprise Synthetic Data Generation Engine (ESDGE)
Ticket Generator
=========================================================
"""

import random
from faker import Faker

from dataset_factory.config import DATASET_SIZE, PRIORITIES
from dataset_factory.core.id_generator import generate_ticket_id

fake = Faker()

TICKET_STATUS = [
    "Open",
    "In Progress",
    "Blocked",
    "Resolved",
    "Closed"
]

TICKET_TYPE = [
    "Bug",
    "Story",
    "Task",
    "Epic",
    "Improvement"
]


def generate_tickets(projects, users):

    tickets = []

    project_ids = [
        project["project_id"]
        for project in projects
    ]

    user_ids = [
        user["user_id"]
        for user in users
    ]

    for i in range(DATASET_SIZE["tickets"]):

        tickets.append({

            "ticket_id": generate_ticket_id(),

            "project_id": random.choice(project_ids),

            "assigned_user_id": random.choice(user_ids),

            "ticket_title": f"Ticket-{i+1}",

            "ticket_type": random.choice(TICKET_TYPE),

            "priority": random.choice(PRIORITIES),

            "status": random.choice(TICKET_STATUS),

            "story_points": random.randint(1,13),

            "created_at": fake.date_between(
                start_date="-2y",
                end_date="today"
            )

        })

    return tickets