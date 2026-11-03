
"""Baseline migration for the existing products table."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "products0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("sku", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column(
            "category",
            sa.String(length=100),
            nullable=False,
            server_default=sa.text("'Uncategorized'"),
        ),
        sa.Column(
            "warehouse",
            sa.String(length=150),
            nullable=False,
            server_default=sa.text("'Unassigned'"),
        ),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.CheckConstraint(
            "quantity >= 0",
            name="ck_products_quantity_nonnegative",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index("ix_products_id", "products", ["id"], unique=False)
    op.create_index("ix_products_sku", "products", ["sku"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_products_sku", table_name="products")
    op.drop_index("ix_products_id", table_name="products")
    op.drop_table("products")
