from decimal import Decimal

from sqlalchemy import CheckConstraint, Integer, Numeric, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Product(Base):
    __tablename__ = "products"

    __table_args__ = (
        CheckConstraint(
            "quantity >= 0",
            name="ck_products_quantity_nonnegative"
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    sku: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="Uncategorized"
    )

    warehouse: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        default="Unassigned"
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )

    unit_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        default=Decimal("0.00")
    )
