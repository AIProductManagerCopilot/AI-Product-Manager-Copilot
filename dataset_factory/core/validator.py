"""
=========================================================
Enterprise Synthetic Data Generation Engine (ESDGE)
Dataset Validator
=========================================================

Performs basic validation checks on generated datasets.
"""

from pathlib import Path
import pandas as pd


class DatasetValidator:

    def __init__(self):
        self.errors = []

    def validate_file(self, filepath: Path):

        print(f"\nValidating {filepath.name}...")

        df = pd.read_csv(filepath)

        # -------------------------------------------------
        # Empty File
        # -------------------------------------------------

        if df.empty:
            self.errors.append(f"{filepath.name} is empty.")
            return

        # -------------------------------------------------
        # Duplicate Primary Key
        # -------------------------------------------------

        id_column = df.columns[0]

        duplicates = df[id_column].duplicated().sum()

        if duplicates:
            self.errors.append(
                f"{filepath.name}: {duplicates} duplicate IDs found."
            )

        # -------------------------------------------------
        # Missing Values
        # -------------------------------------------------

        missing = df.isnull().sum().sum()

        if missing:
            self.errors.append(
                f"{filepath.name}: {missing} missing values."
            )

        print(f"✓ {filepath.name} passed basic validation.")

    def summary(self):

        print("\n===================================")
        print("Dataset Validation Summary")
        print("===================================")

        if not self.errors:

            print("All datasets passed validation.")

        else:

            print("\nValidation Errors:\n")

            for error in self.errors:
                print(f"• {error}")