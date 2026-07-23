"""
Enterprise Synthetic Data Generation Engine (ESDGE)

Main Entry Point

Runs the complete dataset generation pipeline.
"""

from dataset_factory.generators.organization_generator import generate_organizations
from dataset_factory.generators.workspace_generator import generate_workspaces
from dataset_factory.exporters.csv_exporter import csv_exporter
from dataset_factory.generators.user_generator import generate_users
from dataset_factory.generators.project_generator import generate_projects
from dataset_factory.generators.feedback_generator import generate_feedback
from dataset_factory.generators.feature_generator import generate_features
from dataset_factory.generators.ticket_generator import generate_tickets
from dataset_factory.generators.sprint_generator import generate_sprints
from dataset_factory.generators.analytics_generator import generate_analytics_metrics
from dataset_factory.generators.rag_chunk_generator import generate_rag_chunks


def main():

    print("\n========================================")
    print(" Enterprise Synthetic Data Generation Engine")
    print("========================================\n")

    # -------------------------------------------------
    # Organizations
    # -------------------------------------------------

    print("[1/10] Generating Organizations...")

    organizations = generate_organizations()

    csv_exporter.export(
        "organizations.csv",
        organizations
    )

    print(f"[SUCCESS] Generated {len(organizations)} organizations.\n")

    # -------------------------------------------------
    # Workspaces
    # -------------------------------------------------

    print("[2/10] Generating Workspaces...")

    workspaces = generate_workspaces(
        organizations
    )

    csv_exporter.export(
        "workspaces.csv",
        workspaces
    )

    print(f"[SUCCESS] Generated {len(workspaces)} workspaces.\n")


    # -------------------------------------------------
    # Users
    # -------------------------------------------------

    print("[3/10] Generating Users...")

    users = generate_users(
        workspaces
    )

    csv_exporter.export(
        "users.csv",
        users
    )

    print(f"[SUCCESS] Generated {len(users)} users.\n")

    # -------------------------------------------------
    # Projects
    # -------------------------------------------------

    print("[4/10] Generating Projects...")

    projects = generate_projects(
        workspaces,
        users
    )

    csv_exporter.export(
        "projects.csv",
        projects
    )

    print(f"[SUCCESS] Generated {len(projects)} projects.\n")

    # -------------------------------------------------
    # Feedback
    # -------------------------------------------------

    print("[5/10] Generating Feedback...")

    feedback = generate_feedback(
        projects,
        users
    )

    csv_exporter.export(
        "feedback.csv",
        feedback
    )

    print(f"[SUCCESS] Generated {len(feedback)} feedback records.\n")

    # -------------------------------------------------
    # Features
    # -------------------------------------------------

    print("[6/10] Generating Features...")

    features = generate_features(
        projects
    )

    csv_exporter.export(
        "features.csv",
        features
    )

    print(f"[SUCCESS] Generated {len(features)} features.\n")

    # -------------------------------------------------
    # Tickets
    # -------------------------------------------------

    print("[7/10] Generating Tickets...")

    tickets = generate_tickets(
        projects,
        users
    )

    csv_exporter.export(
        "tickets.csv",
        tickets
    )

    print(f"[SUCCESS] Generated {len(tickets)} tickets.\n")

    # -------------------------------------------------
    # Sprints
    # -------------------------------------------------

    print("[8/10] Generating Sprints...")

    sprints = generate_sprints(
        projects
    )

    csv_exporter.export(
        "sprints.csv",
        sprints
    )

    print(f"[SUCCESS] Generated {len(sprints)} sprints.\n")

    # -------------------------------------------------
    # Analytics Metrics
    # -------------------------------------------------

    print("[9/10] Generating Analytics Metrics...")

    analytics_metrics = generate_analytics_metrics(
        projects
    )

    csv_exporter.export(
        "analytics_metrics.csv",
        analytics_metrics
    )

    print(f"[SUCCESS] Generated {len(analytics_metrics)} analytics metrics.\n")

    # -------------------------------------------------
    # RAG Chunks
    # -------------------------------------------------

    print("[10/10] Generating RAG Chunks...")

    rag_chunks = generate_rag_chunks(
        feedback
    )

    csv_exporter.export(
        "rag_chunks.csv",
        rag_chunks
    )

    print(f"[SUCCESS] Generated {len(rag_chunks)} RAG chunks.\n")

    print("Dataset generation completed successfully.")


if __name__ == "__main__":
    main()