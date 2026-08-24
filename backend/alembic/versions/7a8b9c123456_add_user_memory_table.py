"""add_user_memory_table

Revision ID: 7a8b9c123456
Revises: 66869e21e015
Create Date: 2026-08-24 15:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7a8b9c123456'
down_revision: Union[str, None] = '66869e21e015'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'user_memory',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('workspace_id', sa.UUID(), nullable=True),
        sa.Column('fact', sa.Text(), nullable=False),
        sa.Column('fact_type', sa.Text(), nullable=False),
        sa.Column('source_session_id', sa.UUID(), nullable=True),
        sa.Column('confidence', sa.Float(), server_default='1.0', nullable=False),
        sa.Column('superseded_by', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('last_confirmed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['source_session_id'], ['sessions.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['superseded_by'], ['user_memory.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_memory_user_workspace', 'user_memory', ['user_id', 'workspace_id'], unique=False)
    op.create_index(op.f('ix_user_memory_user_id'), 'user_memory', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_memory_workspace_id'), 'user_memory', ['workspace_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_user_memory_workspace_id'), table_name='user_memory')
    op.drop_index(op.f('ix_user_memory_user_id'), table_name='user_memory')
    op.drop_index('idx_memory_user_workspace', table_name='user_memory')
    op.drop_table('user_memory')
