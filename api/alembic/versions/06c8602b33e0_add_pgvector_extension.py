"""add pgvector extension

Revision ID: 06c8602b33e0
Revises: afcb46a36887
Create Date: 2026-05-22 21:12:47.107461

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '06c8602b33e0'
down_revision: Union[str, Sequence[str], None] = 'afcb46a36887'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP EXTENSION IF EXISTS vector")
