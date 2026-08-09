"""remove user role for single product manager

Revision ID: a0b82857cdf7
Revises: 46e4ba205c70
Create Date: 2026-08-08 16:35:14.205794

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a0b82857cdf7"
down_revision: Union[str, None] = "46e4ba205c70"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("users", "role")


def downgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "role",
            sa.VARCHAR(length=100),
            nullable=True,
        ),
    )

    op.execute(
        "UPDATE users SET role = 'Product Manager' WHERE role IS NULL"
    )

    op.alter_column(
        "users",
        "role",
        existing_type=sa.VARCHAR(length=100),
        nullable=False,
    )