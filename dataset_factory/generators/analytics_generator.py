"""
=========================================================
Enterprise Synthetic Data Generation Engine (ESDGE)
Analytics Metrics Generator
=========================================================
"""

import random
from faker import Faker

from dataset_factory.config import DATASET_SIZE
from dataset_factory.core.id_generator import generate_metric_id

fake = Faker()

METRIC_NAMES = [
    "Customer Satisfaction",
    "Bug Resolution Rate",
    "Feature Adoption",
    "Sprint Velocity",
    "Average Response Time",
    "Monthly Active Users",
    "Net Promoter Score",
    "Retention Rate",
    "Feature Completion",
    "Deployment Frequency"
]


def generate_analytics_metrics(projects):

    metrics = []

    project_ids = [
        project["project_id"]
        for project in projects
    ]

    for _ in range(DATASET_SIZE["analytics_metrics"]):

        metrics.append({

            "metric_id": generate_metric_id(),

            "project_id": random.choice(project_ids),

            "metric_name": random.choice(METRIC_NAMES),

            "metric_value": round(random.uniform(0, 100), 2),

            "recorded_date": fake.date_between(
                start_date="-2y",
                end_date="today"
            )

        })

    return metrics