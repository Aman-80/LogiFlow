
from __future__ import annotations

import enum
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


# =========================================================
# MULTI-TENANCY & AUTHENTICATION ENUMS & MODELS
# =========================================================

class IndustryType(str, enum.Enum):
    RETAIL_KIRANA = "retail_kirana"
    MARITIME_SHIPPING = "maritime_shipping"
    ROAD_LOGISTICS = "road_logistics"
    WAREHOUSE_DISTRIBUTION = "warehouse_distribution"


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    industry_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default=IndustryType.ROAD_LOGISTICS.value,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    bootstrap_claimed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    members: Mapped[list[WorkspaceMember]] = relationship(
        back_populates="workspace",
        cascade="all, delete-orphan",
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    is_superuser: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    failed_login_attempts: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    locked_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    memberships: Mapped[list[WorkspaceMember]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    sessions: Mapped[list[UserSession]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    reset_tokens: Mapped[list[PasswordResetToken]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class WorkspaceMember(Base):
    __tablename__ = "workspace_members"

    __table_args__ = (
        UniqueConstraint(
            "workspace_id", "user_id", name="uq_workspace_member"
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    workspace_id: Mapped[str] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[str] = mapped_column(
        String(30), nullable=False, default="owner"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    workspace: Mapped[Workspace] = relationship(back_populates="members")
    user: Mapped[User] = relationship(back_populates="memberships")


class UserSession(Base):
    __tablename__ = "user_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    current_refresh_token_hash: Mapped[str] = mapped_column(
        String(64), nullable=False, index=True
    )
    previous_refresh_token_hash: Mapped[str | None] = mapped_column(
        String(64), nullable=True, index=True
    )
    rotation_counter: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    user_agent: Mapped[str] = mapped_column(
        String(300), default="", nullable=False
    )
    ip_address: Mapped[str] = mapped_column(
        String(45), default="", nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    last_refreshed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    user: Mapped[User] = relationship(back_populates="sessions")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token_hash: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False, index=True
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    user: Mapped[User] = relationship(back_populates="reset_tokens")


# =========================================================
# INVENTORY
# Workspace-scoped SKU uniqueness.
# =========================================================

class Product(Base):
    __tablename__ = "products"

    __table_args__ = (
        CheckConstraint(
            "quantity >= 0",
            name="ck_products_quantity_nonnegative",
        ),
        UniqueConstraint(
            "workspace_id", "sku",
            name="uq_products_workspace_sku",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    workspace_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("workspaces.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    sku: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(
        String(100), nullable=False, default="Uncategorized"
    )
    warehouse: Mapped[str] = mapped_column(
        String(150), nullable=False, default="Unassigned"
    )
    quantity: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    unit_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False, default=Decimal("0.00")
    )


# =========================================================
# WAREHOUSES
# Workspace-scoped Code uniqueness.
# =========================================================

class Warehouse(Base):
    __tablename__ = "warehouses"

    __table_args__ = (
        CheckConstraint(
            "capacity > 0",
            name="ck_warehouses_capacity_positive",
        ),
        CheckConstraint(
            "occupied >= 0 AND occupied <= capacity",
            name="ck_warehouses_occupied_within_capacity",
        ),
        UniqueConstraint(
            "workspace_id", "code",
            name="uq_warehouses_workspace_code",
        ),
    )

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    workspace_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("workspaces.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str] = mapped_column(
        String(30), nullable=False, index=True
    )
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[str] = mapped_column(String(300), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    occupied: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    manager: Mapped[str] = mapped_column(
        String(150), nullable=False, default=""
    )
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="Active"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


# =========================================================
# ORDERS
# Existing IDs such as LF-ORD-1001 are retained as identifiers.
# =========================================================

class CustomerOrder(Base):
    __tablename__ = "orders"

    __table_args__ = (
        CheckConstraint(
            "quantity >= 1",
            name="ck_orders_quantity_positive",
        ),
        CheckConstraint(
            "amount >= 0",
            name="ck_orders_amount_nonnegative",
        ),
    )

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    workspace_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("workspaces.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    customer: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    product: Mapped[str] = mapped_column(String(200), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False
    )
    order_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="Pending"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


# =========================================================
# SHIPMENTS
# Edit-count enforcement will also be implemented in the API.
# =========================================================

class Shipment(Base):
    __tablename__ = "shipments"

    __table_args__ = (
        CheckConstraint(
            "edit_count >= 0 AND edit_count <= 2",
            name="ck_shipments_edit_count_limit",
        ),
    )

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    workspace_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("workspaces.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    order_id: Mapped[str] = mapped_column(String(40), nullable=False)
    carrier: Mapped[str] = mapped_column(String(120), nullable=False)
    tracking_number: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    origin: Mapped[str] = mapped_column(String(200), nullable=False)
    destination: Mapped[str] = mapped_column(String(200), nullable=False)
    dispatch_date: Mapped[date] = mapped_column(Date, nullable=False)
    estimated_delivery: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(40), nullable=False)
    edit_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


# =========================================================
# DELIVERIES
# History and proof are stored in their own tables below.
# =========================================================

class Delivery(Base):
    __tablename__ = "deliveries"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    workspace_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("workspaces.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    tracking_id: Mapped[str] = mapped_column(
        String(40), unique=True, nullable=False, index=True
    )
    order_reference: Mapped[str] = mapped_column(
        String(80), nullable=False, index=True
    )
    priority: Mapped[str] = mapped_column(
        String(30), nullable=False, default="Standard"
    )
    transport_mode: Mapped[str] = mapped_column(
        String(40), nullable=False, default="Road"
    )
    source_warehouse: Mapped[str] = mapped_column(
        String(100), nullable=False, default=""
    )
    recipient_name: Mapped[str] = mapped_column(String(200), nullable=False)
    recipient_phone: Mapped[str] = mapped_column(
        String(40), nullable=False, default=""
    )
    recipient_phone_country: Mapped[str] = mapped_column(
        String(4), nullable=False, default="IN"
    )
    driver_name: Mapped[str] = mapped_column(
        String(200), nullable=False, default=""
    )
    driver_phone: Mapped[str] = mapped_column(
        String(40), nullable=False, default=""
    )
    driver_phone_country: Mapped[str] = mapped_column(
        String(4), nullable=False, default="IN"
    )
    vehicle_number: Mapped[str] = mapped_column(
        String(40), nullable=False, default=""
    )
    carrier_name: Mapped[str] = mapped_column(
        String(120), nullable=False, default=""
    )
    destination_country: Mapped[str] = mapped_column(
        String(4), nullable=False, default="IN"
    )
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    postal_code: Mapped[str] = mapped_column(
        String(20), nullable=False, default=""
    )
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    estimated_delivery: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(
        String(40), nullable=False, default="Pending", index=True
    )
    refund_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="None"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    history: Mapped[list[DeliveryEvent]] = relationship(
        back_populates="delivery",
        cascade="all, delete-orphan",
        order_by="DeliveryEvent.event_time",
    )
    pod: Mapped[ProofOfDelivery | None] = relationship(
        back_populates="delivery",
        cascade="all, delete-orphan",
        uselist=False,
    )


class DeliveryEvent(Base):
    __tablename__ = "delivery_events"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    delivery_id: Mapped[str] = mapped_column(
        ForeignKey("deliveries.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[str] = mapped_column(
        String(30), nullable=False, default="status"
    )
    status: Mapped[str] = mapped_column(String(40), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    event_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    location: Mapped[str] = mapped_column(
        String(200), nullable=False, default=""
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False, default="")
    actor: Mapped[str] = mapped_column(
        String(150), nullable=False, default="LogiFlow Admin"
    )

    delivery: Mapped[Delivery] = relationship(back_populates="history")


class ProofOfDelivery(Base):
    __tablename__ = "proof_of_delivery"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    delivery_id: Mapped[str] = mapped_column(
        ForeignKey("deliveries.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    received_by: Mapped[str] = mapped_column(String(200), nullable=False)
    method: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Receiver Name"
    )
    reference: Mapped[str] = mapped_column(
        String(200), nullable=False, default=""
    )
    delivered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    delivery: Mapped[Delivery] = relationship(back_populates="pod")
