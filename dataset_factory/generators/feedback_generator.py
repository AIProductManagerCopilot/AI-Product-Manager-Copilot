"""
=========================================================
Enterprise Synthetic Data Generation Engine (ESDGE)
Feedback Generator
=========================================================
"""

import random
from faker import Faker

from dataset_factory.config import DATASET_SIZE, FEEDBACK_TYPES, PRIORITIES
from dataset_factory.core.id_generator import generate_feedback_id

fake = Faker()

SENTIMENTS = [
    "Positive",
    "Neutral",
    "Negative"
]

CHANNELS = [
    "Web",
    "Email",
    "Mobile",
    "Support Ticket",
    "Survey"
]

FEEDBACK_TEMPLATES = {
    "Bug Report": [
        "Application crashes while generating reports.",
        "Login page becomes unresponsive after timeout.",
        "Dashboard takes too long to load.",
        "Notification emails are duplicated.",
        "Search results are inaccurate."
    ],
    "Feature Request": [
        "Add dark mode support.",
        "Provide export to PDF option.",
        "Integrate with Slack notifications.",
        "Support multilingual interface.",
        "Enable custom dashboard widgets."
    ],
    "Improvement": [
        "Improve application performance.",
        "Enhance dashboard usability.",
        "Simplify navigation menus.",
        "Reduce loading times.",
        "Optimize search experience."
    ],
    "Complaint": [
        "Support response is too slow.",
        "Too many unnecessary notifications.",
        "Application freezes frequently.",
        "Workflow is confusing.",
        "Reports are difficult to understand."
    ],
    "Question": [
        "How do I archive projects?",
        "Can I restore deleted tickets?",
        "How do permissions work?",
        "Where can I export analytics?",
        "Is API access available?"
    ],
    "Praise": [
        "Excellent dashboard experience.",
        "Very intuitive interface.",
        "AI suggestions are extremely useful.",
        "Great collaboration features.",
        "Fast and reliable platform."
    ]
}


def generate_feedback(projects, users):

    feedback = []

    project_ids = [
        p["project_id"]
        for p in projects
    ]

    user_ids = [
        u["user_id"]
        for u in users
    ]

    for _ in range(DATASET_SIZE["feedback"]):

        feedback_type = random.choice(FEEDBACK_TYPES)

        feedback.append({

            "feedback_id": generate_feedback_id(),

            "project_id": random.choice(project_ids),

            "user_id": random.choice(user_ids),

            "feedback_type": feedback_type,

            "feedback_text": random.choice(
                FEEDBACK_TEMPLATES[feedback_type]
            ),

            "priority": random.choice(PRIORITIES),

            "sentiment": random.choice(SENTIMENTS),

            "channel": random.choice(CHANNELS),

            "created_at": fake.date_between(
                start_date="-2y",
                end_date="today"
            )

        })

    return feedback