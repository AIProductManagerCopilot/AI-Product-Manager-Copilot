"""
organization_generator.py
---------------------------------
Generates realistic organizations for the
AI Product Manager Copilot dataset.
"""

from faker import Faker
import random

from dataset_factory.config import DATASET_SIZE
from dataset_factory.core.id_generator import generate_org_id

fake = Faker()

INDUSTRIES = [
    "Banking",
    "Healthcare",
    "Retail",
    "Education",
    "E-Commerce",
    "Telecommunications",
    "Manufacturing",
    "Logistics",
    "Insurance",
    "Technology"
]

COMPANY_SUFFIX = [
    "Solutions",
    "Technologies",
    "Systems",
    "Labs",
    "Digital",
    "Software",
    "Analytics",
    "Global",
    "Networks",
    "Consulting"
]


def generate_organizations():

    organizations = []

    for i in range(DATASET_SIZE["organizations"]):

        company_name = (
            fake.company().replace(",", "")
            + " "
            + random.choice(COMPANY_SUFFIX)
        )

        organizations.append({

            "organization_id": generate_org_id(),

            "organization_name": company_name,

            "industry": random.choice(INDUSTRIES),

            "country": fake.country(),

            "city": fake.city(),

            "employee_count": random.randint(100, 25000),

            "subscription_plan": random.choice(
                ["Starter", "Professional", "Enterprise"]
            ),

            "created_at": fake.date_between(
                start_date="-5y",
                end_date="today"
            )
        })

    return organizations