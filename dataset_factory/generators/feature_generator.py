"""
=========================================================
Enterprise Synthetic Data Generation Engine (ESDGE)
Feature Generator
=========================================================
"""

import random
from faker import Faker

from dataset_factory.config import DATASET_SIZE, PRIORITIES
from dataset_factory.core.id_generator import generate_feature_id

fake = Faker()

FEATURE_STATUS = [
    "Backlog",
    "Planned",
    "In Development",
    "Testing",
    "Released"
]

FEATURE_NAMES = [
    "Dark Mode",
    "PDF Export",
    "Slack Integration",
    "Advanced Dashboard",
    "AI Insights",
    "Custom Reports",
    "Notification Center",
    "Role Based Access",
    "Workflow Automation",
    "Mobile Optimization",
    "API Enhancements",
    "Search Improvements",
    "Multi-language Support",
    "Analytics Widgets",
    "Roadmap View"
]


def generate_features(projects):

    features = []

    project_ids = [
        p["project_id"]
        for p in projects
    ]

    for _ in range(DATASET_SIZE["features"]):

        features.append({

            "feature_id": generate_feature_id(),

            "project_id": random.choice(project_ids),

            "feature_name": random.choice(FEATURE_NAMES),

            "priority": random.choice(PRIORITIES),

            "status": random.choice(FEATURE_STATUS),

            "estimated_story_points": random.randint(1, 21),

            "created_at": fake.date_between(
                start_date="-2y",
                end_date="today"
            )

        })

    return features