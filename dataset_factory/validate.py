"""
Run validation on all generated datasets.
"""

from pathlib import Path

from dataset_factory.config import OUTPUT_DIR
from dataset_factory.core.validator import DatasetValidator


def main():

    validator = DatasetValidator()

    for csv_file in OUTPUT_DIR.glob("*.csv"):
        validator.validate_file(csv_file)

    validator.summary()


if __name__ == "__main__":
    main()