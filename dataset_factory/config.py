"""
=========================================================
Enterprise Synthetic Data Generation Engine (ESDGE)
Configuration File
=========================================================
Central configuration for dataset generation.
Only modify values here when changing dataset size.
"""

from pathlib import Path

# =========================================================
# PROJECT PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

OUTPUT_DIR = BASE_DIR / "output" / "raw"
VALIDATED_DIR = BASE_DIR / "output" / "validated"
LOG_DIR = BASE_DIR / "logs"
TEMPLATE_DIR = BASE_DIR / "templates"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
VALIDATED_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)
TEMPLATE_DIR.mkdir(parents=True, exist_ok=True)

# =========================================================
# RANDOM SETTINGS
# =========================================================

RANDOM_SEED = 42

# =========================================================
# DATASET SIZES
# =========================================================

DATASET_SIZE = {

    "organizations": 5,

    "workspaces": 30,

    "users": 800,

    "projects": 250,

    "feedback": 15000,

    "features": 2500,

    "tickets": 6000,

    "sprints": 1200,

    "analytics_metrics": 5000,

    "rag_chunks": 25000
}

# =========================================================
# ORGANIZATION INDUSTRIES
# =========================================================

INDUSTRIES = [

    "Healthcare",

    "Finance",

    "E-Commerce",

    "Education",

    "Telecommunications",

    "Retail",

    "Manufacturing",

    "Logistics",

    "Travel",

    "Insurance"

]

# =========================================================
# COUNTRIES
# =========================================================

COUNTRIES = [

    "India",

    "USA",

    "United Kingdom",

    "Germany",

    "Canada",

    "Australia",

    "Singapore"

]

# =========================================================
# PROJECT STATUS
# =========================================================

PROJECT_STATUS = [

    "Planning",

    "Active",

    "Completed",

    "On Hold"

]

# =========================================================
# PRIORITIES
# =========================================================

PRIORITIES = [

    "Low",

    "Medium",

    "High",

    "Critical"

]

# =========================================================
# FEEDBACK TYPES
# =========================================================

FEEDBACK_TYPES = [

    "Bug Report",

    "Feature Request",

    "Improvement",

    "Complaint",

    "Question",

    "Praise"

]

# =========================================================
# TICKET STATUS
# =========================================================

TICKET_STATUS = [

    "Open",

    "In Progress",

    "Resolved",

    "Closed"

]

# =========================================================
# EXPORT FILE NAMES
# =========================================================

CSV_FILES = {

    "organizations": "organizations.csv",

    "workspaces": "workspaces.csv",

    "users": "users.csv",

    "projects": "projects.csv",

    "feedback": "feedback.csv",

    "features": "features.csv",

    "tickets": "tickets.csv",

    "sprints": "sprints.csv",

    "analytics_metrics": "analytics_metrics.csv",

    "rag_chunks": "rag_chunks.csv"

}