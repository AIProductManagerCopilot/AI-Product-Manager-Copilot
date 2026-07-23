"""
=========================================================
Enterprise Synthetic Data Generation Engine (ESDGE)
Relationship Manager
=========================================================

Maintains parent-child relationships between generated
entities so that foreign keys remain valid.
"""

from collections import defaultdict
import random


class RelationshipManager:

    def __init__(self):

        self.organizations = []

        self.workspaces_by_org = defaultdict(list)

        self.users_by_workspace = defaultdict(list)

        self.projects_by_workspace = defaultdict(list)

        self.feedback_by_project = defaultdict(list)

        self.features_by_project = defaultdict(list)

        self.tickets_by_project = defaultdict(list)

        self.sprints_by_project = defaultdict(list)

    # -----------------------------------------------------
    # Organization
    # -----------------------------------------------------

    def add_organization(self, organization_id):

        self.organizations.append(organization_id)

    def get_random_organization(self):

        return random.choice(self.organizations)

    # -----------------------------------------------------
    # Workspace
    # -----------------------------------------------------

    def add_workspace(self, organization_id, workspace_id):

        self.workspaces_by_org[organization_id].append(workspace_id)

    def get_random_workspace(self, organization_id):

        return random.choice(self.workspaces_by_org[organization_id])

    # -----------------------------------------------------
    # User
    # -----------------------------------------------------

    def add_user(self, workspace_id, user_id):

        self.users_by_workspace[workspace_id].append(user_id)

    def get_random_user(self, workspace_id):

        return random.choice(self.users_by_workspace[workspace_id])

    # -----------------------------------------------------
    # Project
    # -----------------------------------------------------

    def add_project(self, workspace_id, project_id):

        self.projects_by_workspace[workspace_id].append(project_id)

    def get_random_project(self, workspace_id):

        return random.choice(self.projects_by_workspace[workspace_id])

    # -----------------------------------------------------
    # Feedback
    # -----------------------------------------------------

    def add_feedback(self, project_id, feedback_id):

        self.feedback_by_project[project_id].append(feedback_id)

    # -----------------------------------------------------
    # Feature
    # -----------------------------------------------------

    def add_feature(self, project_id, feature_id):

        self.features_by_project[project_id].append(feature_id)

    # -----------------------------------------------------
    # Ticket
    # -----------------------------------------------------

    def add_ticket(self, project_id, ticket_id):

        self.tickets_by_project[project_id].append(ticket_id)

    # -----------------------------------------------------
    # Sprint
    # -----------------------------------------------------

    def add_sprint(self, project_id, sprint_id):

        self.sprints_by_project[project_id].append(sprint_id)


relationship_manager = RelationshipManager()


# ---------------------------------------------------------
# Test
# ---------------------------------------------------------

if __name__ == "__main__":

    relationship_manager.add_organization("ORG0001")

    relationship_manager.add_workspace("ORG0001", "WS0001")

    relationship_manager.add_workspace("ORG0001", "WS0002")

    relationship_manager.add_user("WS0001", "USR000001")

    relationship_manager.add_project("WS0001", "PROJ000001")

    print("Organization :", relationship_manager.get_random_organization())

    print("Workspace :", relationship_manager.get_random_workspace("ORG0001"))

    print("User :", relationship_manager.get_random_user("WS0001"))

    print("Project :", relationship_manager.get_random_project("WS0001"))