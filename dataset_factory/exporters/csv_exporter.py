"""
=========================================================
Enterprise Synthetic Data Generation Engine (ESDGE)
CSV Exporter
=========================================================

Exports generated datasets into CSV files.
"""

import csv
from pathlib import Path

from dataset_factory.config import OUTPUT_DIR


class CSVExporter:

    def __init__(self):

        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    def export(self, filename, data):

        """
        Export list of dictionaries to CSV.
        """

        if not data:
            print(f"[WARNING] No data to export -> {filename}")
            return

        filepath = OUTPUT_DIR / filename

        with open(filepath, "w", newline="", encoding="utf-8") as csvfile:

            writer = csv.DictWriter(
                csvfile,
                fieldnames=data[0].keys()
            )

            writer.writeheader()

            writer.writerows(data)

        print(f"[SUCCESS] Exported -> {filepath}")


csv_exporter = CSVExporter()


# ---------------------------------------------------------
# Test
# ---------------------------------------------------------

if __name__ == "__main__":

    sample_data = [

        {
            "organization_id": "ORG0001",
            "organization_name": "NovaTech Solutions",
            "industry": "Healthcare",
            "country": "India"
        },

        {
            "organization_id": "ORG0002",
            "organization_name": "FinEdge Analytics",
            "industry": "Finance",
            "country": "USA"
        }

    ]

    csv_exporter.export(
        "organizations.csv",
        sample_data
    )