"""
=========================================================
Enterprise Synthetic Data Generation Engine (ESDGE)
ID Generator
=========================================================

Generates standardized unique IDs for all datasets.
"""

from collections import defaultdict


class IDGenerator:
    """
    Generates sequential IDs with configurable prefixes.

    Example:
        ORG0001
        WS0001
        USR000001
        PROJ000001
        FDBK00000001
    """

    def __init__(self):
        self.counters = defaultdict(int)

    def generate(self, prefix: str, digits: int) -> str:
        """
        Generate a new sequential ID.

        Args:
            prefix (str): Prefix of the ID.
            digits (int): Number of numeric digits.

        Returns:
            str: Generated ID.
        """

        self.counters[prefix] += 1

        return f"{prefix}{self.counters[prefix]:0{digits}d}"

    def reset(self):
        """
        Reset all counters.
        """

        self.counters.clear()


# Singleton instance
id_generator = IDGenerator()


# ---------------------------------------------------------
# Convenience Functions
# ---------------------------------------------------------

def generate_org_id():
    return id_generator.generate("ORG", 4)


def generate_workspace_id():
    return id_generator.generate("WS", 4)


def generate_user_id():
    return id_generator.generate("USR", 6)


def generate_project_id():
    return id_generator.generate("PROJ", 6)


def generate_feedback_id():
    return id_generator.generate("FDBK", 8)


def generate_feature_id():
    return id_generator.generate("FEAT", 6)


def generate_ticket_id():
    return id_generator.generate("TKT", 6)


def generate_sprint_id():
    return id_generator.generate("SPR", 6)


def generate_metric_id():
    return id_generator.generate("MET", 6)


def generate_chunk_id():
    return id_generator.generate("CHNK", 8)


# ---------------------------------------------------------
# Test
# ---------------------------------------------------------

if __name__ == "__main__":

    print(generate_org_id())
    print(generate_org_id())

    print(generate_workspace_id())

    print(generate_user_id())
    print(generate_user_id())

    print(generate_project_id())

    print(generate_feedback_id())

    print(generate_ticket_id())

    print(generate_chunk_id())