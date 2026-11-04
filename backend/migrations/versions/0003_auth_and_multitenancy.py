"""Authentication and multi-tenancy foundation with default road logistics workspace.

Revision ID: 0003_auth_and_multitenancy
Revises: da7d176c87e0
Create Date: 2026-11-04 10:20:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0003_auth_and_multitenancy"
down_revision: Union[str, Sequence[str], None] = "da7d176c87e0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DEFAULT_WORKSPACE_ID = "ws_default_road_logistics"


def upgrade() -> None:
    # -------------------------------------------------------------
    # 1. CREATE AUTHENTICATION AND WORKSPACE TABLES
    # -------------------------------------------------------------
    op.create_table(
        "workspaces",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=100), nullable=False),
        sa.Column(
            "industry_type",
            sa.String(length=50),
            nullable=False,
            server_default="road_logistics",
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
        sa.Column(
            "bootstrap_claimed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_workspaces_slug", "workspaces", ["slug"], unique=True)

    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
        sa.Column(
            "is_superuser",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column(
            "failed_login_attempts",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "locked_until",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "workspace_members",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("workspace_id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column(
            "role",
            sa.String(length=30),
            nullable=False,
            server_default="owner",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(
            ["workspace_id"],
            ["workspaces.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "workspace_id", "user_id", name="uq_workspace_member"
        ),
    )
    op.create_index(
        "ix_workspace_members_workspace_id",
        "workspace_members",
        ["workspace_id"],
        unique=False,
    )
    op.create_index(
        "ix_workspace_members_user_id",
        "workspace_members",
        ["user_id"],
        unique=False,
    )

    op.create_table(
        "user_sessions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column(
            "current_refresh_token_hash",
            sa.String(length=64),
            nullable=False,
        ),
        sa.Column(
            "previous_refresh_token_hash",
            sa.String(length=64),
            nullable=True,
        ),
        sa.Column(
            "rotation_counter",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "user_agent",
            sa.String(length=300),
            nullable=False,
            server_default="",
        ),
        sa.Column(
            "ip_address",
            sa.String(length=45),
            nullable=False,
            server_default="",
        ),
        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "revoked_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "last_refreshed_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_user_sessions_user_id",
        "user_sessions",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_user_sessions_current_refresh_token_hash",
        "user_sessions",
        ["current_refresh_token_hash"],
        unique=False,
    )
    op.create_index(
        "ix_user_sessions_previous_refresh_token_hash",
        "user_sessions",
        ["previous_refresh_token_hash"],
        unique=False,
    )
    op.create_index(
        "ix_user_sessions_revoked_at",
        "user_sessions",
        ["revoked_at"],
        unique=False,
    )

    op.create_table(
        "password_reset_tokens",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "used_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_password_reset_tokens_token_hash",
        "password_reset_tokens",
        ["token_hash"],
        unique=True,
    )
    op.create_index(
        "ix_password_reset_tokens_user_id",
        "password_reset_tokens",
        ["user_id"],
        unique=False,
    )

    # -------------------------------------------------------------
    # 2. SEED DEFAULT ROAD LOGISTICS WORKSPACE
    # -------------------------------------------------------------
    op.execute(
        f"""
        INSERT INTO workspaces (id, name, slug, industry_type, is_active, bootstrap_claimed_at, created_at, updated_at)
        VALUES (
            '{DEFAULT_WORKSPACE_ID}',
            'LogiFlow Road Logistics',
            'default-road-logistics',
            'road_logistics',
            true,
            NULL,
            now(),
            now()
        )
        ON CONFLICT (id) DO NOTHING;
        """
    )

    # -------------------------------------------------------------
    # 3. ADD NULLABLE workspace_id TO OPERATIONAL TABLES
    # -------------------------------------------------------------
    op.add_column(
        "products",
        sa.Column("workspace_id", sa.String(length=36), nullable=True),
    )
    op.add_column(
        "warehouses",
        sa.Column("workspace_id", sa.String(length=36), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column("workspace_id", sa.String(length=36), nullable=True),
    )
    op.add_column(
        "shipments",
        sa.Column("workspace_id", sa.String(length=36), nullable=True),
    )
    op.add_column(
        "deliveries",
        sa.Column("workspace_id", sa.String(length=36), nullable=True),
    )

    # -------------------------------------------------------------
    # 4. BACKFILL EXISTING OPERATIONAL RECORDS TO DEFAULT WORKSPACE
    # -------------------------------------------------------------
    op.execute(
        f"UPDATE products SET workspace_id = '{DEFAULT_WORKSPACE_ID}' WHERE workspace_id IS NULL;"
    )
    op.execute(
        f"UPDATE warehouses SET workspace_id = '{DEFAULT_WORKSPACE_ID}' WHERE workspace_id IS NULL;"
    )
    op.execute(
        f"UPDATE orders SET workspace_id = '{DEFAULT_WORKSPACE_ID}' WHERE workspace_id IS NULL;"
    )
    op.execute(
        f"UPDATE shipments SET workspace_id = '{DEFAULT_WORKSPACE_ID}' WHERE workspace_id IS NULL;"
    )
    op.execute(
        f"UPDATE deliveries SET workspace_id = '{DEFAULT_WORKSPACE_ID}' WHERE workspace_id IS NULL;"
    )

    # -------------------------------------------------------------
    # 5. VERIFY ZERO UNASSIGNED RECORDS
    # -------------------------------------------------------------
    bind = op.get_bind()
    for table_name in ("products", "warehouses", "orders", "shipments", "deliveries"):
        unassigned_count = bind.scalar(
            sa.text(
                f"SELECT COUNT(*) FROM {table_name} WHERE workspace_id IS NULL"
            )
        )
        if unassigned_count and unassigned_count > 0:
            raise RuntimeError(
                f"Migration verification failed: table '{table_name}' has "
                f"{unassigned_count} unassigned records after backfill."
            )

    # -------------------------------------------------------------
    # 6. ENFORCE NOT NULL ON workspace_id
    # -------------------------------------------------------------
    op.alter_column(
        "products",
        "workspace_id",
        existing_type=sa.String(length=36),
        nullable=False,
    )
    op.alter_column(
        "warehouses",
        "workspace_id",
        existing_type=sa.String(length=36),
        nullable=False,
    )
    op.alter_column(
        "orders",
        "workspace_id",
        existing_type=sa.String(length=36),
        nullable=False,
    )
    op.alter_column(
        "shipments",
        "workspace_id",
        existing_type=sa.String(length=36),
        nullable=False,
    )
    op.alter_column(
        "deliveries",
        "workspace_id",
        existing_type=sa.String(length=36),
        nullable=False,
    )

    # -------------------------------------------------------------
    # 7. ADD FOREIGN KEYS AND INDEXES ON workspace_id
    # -------------------------------------------------------------
    op.create_foreign_key(
        "fk_products_workspace_id",
        "products",
        "workspaces",
        ["workspace_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_warehouses_workspace_id",
        "warehouses",
        "workspaces",
        ["workspace_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_orders_workspace_id",
        "orders",
        "workspaces",
        ["workspace_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_shipments_workspace_id",
        "shipments",
        "workspaces",
        ["workspace_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_deliveries_workspace_id",
        "deliveries",
        "workspaces",
        ["workspace_id"],
        ["id"],
        ondelete="RESTRICT",
    )

    op.create_index(
        "ix_products_workspace_id",
        "products",
        ["workspace_id"],
        unique=False,
    )
    op.create_index(
        "ix_warehouses_workspace_id",
        "warehouses",
        ["workspace_id"],
        unique=False,
    )
    op.create_index(
        "ix_orders_workspace_id",
        "orders",
        ["workspace_id"],
        unique=False,
    )
    op.create_index(
        "ix_shipments_workspace_id",
        "shipments",
        ["workspace_id"],
        unique=False,
    )
    op.create_index(
        "ix_deliveries_workspace_id",
        "deliveries",
        ["workspace_id"],
        unique=False,
    )

    # -------------------------------------------------------------
    # 8. REPLACE GLOBAL PRODUCT SKU & WAREHOUSE CODE UNIQUENESS
    #    WITH WORKSPACE-SCOPED COMPOSITE UNIQUENESS
    # -------------------------------------------------------------
    # Products SKU
    op.drop_index("ix_products_sku", table_name="products")
    op.create_index(
        "ix_products_sku", "products", ["sku"], unique=False
    )
    op.create_unique_constraint(
        "uq_products_workspace_sku",
        "products",
        ["workspace_id", "sku"],
    )

    # Warehouses Code
    op.drop_index("ix_warehouses_code", table_name="warehouses")
    op.create_index(
        "ix_warehouses_code", "warehouses", ["code"], unique=False
    )
    op.create_unique_constraint(
        "uq_warehouses_workspace_code",
        "warehouses",
        ["workspace_id", "code"],
    )


def downgrade() -> None:
    # -------------------------------------------------------------
    # 1. REVERT WORKSPACE-SCOPED UNIQUENESS TO GLOBAL UNIQUENESS
    # -------------------------------------------------------------
    op.drop_constraint(
        "uq_warehouses_workspace_code",
        "warehouses",
        type_="unique",
    )
    op.drop_index("ix_warehouses_code", table_name="warehouses")
    op.create_index(
        "ix_warehouses_code", "warehouses", ["code"], unique=True
    )

    op.drop_constraint(
        "uq_products_workspace_sku",
        "products",
        type_="unique",
    )
    op.drop_index("ix_products_sku", table_name="products")
    op.create_index(
        "ix_products_sku", "products", ["sku"], unique=True
    )

    # -------------------------------------------------------------
    # 2. DROP FOREIGN KEYS AND INDEXES ON workspace_id
    # -------------------------------------------------------------
    op.drop_index("ix_deliveries_workspace_id", table_name="deliveries")
    op.drop_index("ix_shipments_workspace_id", table_name="shipments")
    op.drop_index("ix_orders_workspace_id", table_name="orders")
    op.drop_index("ix_warehouses_workspace_id", table_name="warehouses")
    op.drop_index("ix_products_workspace_id", table_name="products")

    op.drop_constraint(
        "fk_deliveries_workspace_id", "deliveries", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_shipments_workspace_id", "shipments", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_orders_workspace_id", "orders", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_warehouses_workspace_id", "warehouses", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_products_workspace_id", "products", type_="foreignkey"
    )

    # -------------------------------------------------------------
    # 3. DROP workspace_id COLUMNS FROM OPERATIONAL TABLES
    # -------------------------------------------------------------
    op.drop_column("deliveries", "workspace_id")
    op.drop_column("shipments", "workspace_id")
    op.drop_column("orders", "workspace_id")
    op.drop_column("warehouses", "workspace_id")
    op.drop_column("products", "workspace_id")

    # -------------------------------------------------------------
    # 4. REMOVE SEEDED DEFAULT WORKSPACE
    # -------------------------------------------------------------
    op.execute(
        f"DELETE FROM workspaces WHERE id = '{DEFAULT_WORKSPACE_ID}';"
    )

    # -------------------------------------------------------------
    # 5. DROP AUTHENTICATION AND WORKSPACE TABLES
    # -------------------------------------------------------------
    op.drop_index(
        "ix_password_reset_tokens_user_id",
        table_name="password_reset_tokens",
    )
    op.drop_index(
        "ix_password_reset_tokens_token_hash",
        table_name="password_reset_tokens",
    )
    op.drop_table("password_reset_tokens")

    op.drop_index(
        "ix_user_sessions_revoked_at", table_name="user_sessions"
    )
    op.drop_index(
        "ix_user_sessions_previous_refresh_token_hash",
        table_name="user_sessions",
    )
    op.drop_index(
        "ix_user_sessions_current_refresh_token_hash",
        table_name="user_sessions",
    )
    op.drop_index(
        "ix_user_sessions_user_id", table_name="user_sessions"
    )
    op.drop_table("user_sessions")

    op.drop_index(
        "ix_workspace_members_user_id", table_name="workspace_members"
    )
    op.drop_index(
        "ix_workspace_members_workspace_id",
        table_name="workspace_members",
    )
    op.drop_table("workspace_members")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    op.drop_index("ix_workspaces_slug", table_name="workspaces")
    op.drop_table("workspaces")
