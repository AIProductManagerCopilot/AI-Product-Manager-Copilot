import pandas as pd

from app.core.database import SessionLocal
from app.models.core_models import AnalyticsMetric, Project


def seed_analytics_metrics():
    db = SessionLocal()

    try:
        df = pd.read_csv("../dataset_factory/output/raw/analytics_metrics.csv")

        metrics = []

        for _, row in df.iterrows():
            project = (
                db.query(Project)
                .filter(Project.project_code == row["project_id"])
                .first()
            )

            if project is None:
                print(
                    f"Project {row['project_id']} not found. "
                    "Skipping metric..."
                )
                continue

            metric = AnalyticsMetric(
                metric_code=row["metric_id"],
                project_id=project.id,
                metric_name=row["metric_name"],
                metric_value=float(row["metric_value"]),
                recorded_date=pd.to_datetime(row["recorded_date"]),
            )

            metrics.append(metric)

        db.add_all(metrics)
        db.commit()

        print(f"Analytics metrics seeded successfully: {len(metrics)} records.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_analytics_metrics()
    