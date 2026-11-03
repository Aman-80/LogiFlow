import os
from datetime import date, datetime, timezone
from uuid import uuid4
from decimal import Decimal
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import create_engine, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker

from models import (
    CustomerOrder,
    Delivery,
    DeliveryEvent,
    Product,
    ProofOfDelivery,
    Shipment,
    Warehouse,
)


DATABASE_URL = os.getenv("DATABASE_URL")

engine = (
    create_engine(DATABASE_URL, pool_pre_ping=True)
    if DATABASE_URL
    else None
)

SessionLocal = (
    sessionmaker(bind=engine, autoflush=False, autocommit=False)
    if engine
    else None
)

app = FastAPI(
    title="LogiFlow API",
    description="Backend API for the LogiFlow logistics platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)


class ProductCreate(BaseModel):
    sku: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=100)
    warehouse: str = Field(min_length=1, max_length=150)
    quantity: int = Field(default=0, ge=0)
    unit_price: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        max_digits=10,
        decimal_places=2
    )

class ProductUpdate(BaseModel):
    sku: str | None = Field(
        default=None, min_length=1, max_length=50
    )
    name: str | None = Field(
        default=None, min_length=1, max_length=200
    )
    category: str | None = Field(default=None, min_length=1, max_length=100)
    warehouse: str | None = Field(default=None, min_length=1, max_length=150)
    quantity: int | None = Field(
        default=None, ge=0
    )
    unit_price: Decimal | None = Field(
        default=None, ge=0, max_digits=10, decimal_places=2
    )

class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sku: str
    name: str
    category: str
    warehouse: str
    quantity: int
    unit_price: Decimal

# =========================================================
# WAREHOUSE SCHEMAS
# =========================================================

class WarehouseCreate(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=200)
    code: str = Field(min_length=2, max_length=30)
    type: Literal[
        "Distribution", "Cold Storage", "General Storage",
        "Retail Storage", "Cross-Dock"
    ]
    city: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=1, max_length=100)
    address: str = Field(min_length=1, max_length=300)
    capacity: int = Field(gt=0, le=1_000_000_000)
    occupied: int = Field(default=0, ge=0)
    manager: str = Field(default="", max_length=150)
    status: Literal["Active", "Maintenance", "Inactive"] = "Active"


class WarehouseUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    code: str | None = Field(default=None, min_length=2, max_length=30)
    type: Literal[
        "Distribution", "Cold Storage", "General Storage",
        "Retail Storage", "Cross-Dock"
    ] | None = None
    city: str | None = Field(default=None, min_length=1, max_length=100)
    state: str | None = Field(default=None, min_length=1, max_length=100)
    address: str | None = Field(default=None, min_length=1, max_length=300)
    capacity: int | None = Field(default=None, gt=0, le=1_000_000_000)
    occupied: int | None = Field(default=None, ge=0)
    manager: str | None = Field(default=None, max_length=150)
    status: Literal["Active", "Maintenance", "Inactive"] | None = None


class WarehouseResponse(WarehouseCreate):
    model_config = ConfigDict(from_attributes=True)
    created_at: datetime
    updated_at: datetime


# =========================================================
# ORDER SCHEMAS
# =========================================================

class OrderCreate(BaseModel):
    id: str = Field(min_length=1, max_length=40)
    customer: str = Field(min_length=1, max_length=200)
    email: str = Field(min_length=3, max_length=254)
    product: str = Field(min_length=1, max_length=200)
    quantity: int = Field(ge=1)
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    order_date: date
    status: Literal[
        "Pending", "Processing", "Shipped", "Delivered", "Cancelled"
    ] = "Pending"


class OrderUpdate(BaseModel):
    customer: str | None = Field(default=None, min_length=1, max_length=200)
    email: str | None = Field(default=None, min_length=3, max_length=254)
    product: str | None = Field(default=None, min_length=1, max_length=200)
    quantity: int | None = Field(default=None, ge=1)
    amount: Decimal | None = Field(
        default=None, gt=0, max_digits=12, decimal_places=2
    )
    order_date: date | None = None
    status: Literal[
        "Pending", "Processing", "Shipped", "Delivered", "Cancelled"
    ] | None = None


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    customer: str
    email: str
    product: str
    quantity: int
    amount: Decimal
    order_date: date
    status: str
    created_at: datetime
    updated_at: datetime


# =========================================================
# SHIPMENT SCHEMAS
# =========================================================

class ShipmentCreate(BaseModel):
    id: str = Field(min_length=1, max_length=50)
    order_id: str = Field(min_length=1, max_length=40)
    carrier: str = Field(min_length=1, max_length=120)
    tracking_number: str = Field(min_length=1, max_length=100)
    origin: str = Field(min_length=1, max_length=200)
    destination: str = Field(min_length=1, max_length=200)
    dispatch_date: date
    estimated_delivery: date
    status: Literal[
        "Preparing", "In Transit", "Out for Delivery",
        "Delivered", "Delayed"
    ] = "Preparing"


class ShipmentUpdate(BaseModel):
    carrier: str | None = Field(default=None, min_length=1, max_length=120)
    tracking_number: str | None = Field(
        default=None, min_length=1, max_length=100
    )
    origin: str | None = Field(default=None, min_length=1, max_length=200)
    destination: str | None = Field(default=None, min_length=1, max_length=200)
    dispatch_date: date | None = None
    estimated_delivery: date | None = None
    status: Literal[
        "Preparing", "In Transit", "Out for Delivery",
        "Delivered", "Delayed"
    ] | None = None


class ShipmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    order_id: str
    carrier: str
    tracking_number: str
    origin: str
    destination: str
    dispatch_date: date
    estimated_delivery: date
    status: str
    edit_count: int
    created_at: datetime
    updated_at: datetime


# =========================================================
# DELIVERY SCHEMAS
# =========================================================

DeliveryStatus = Literal[
    "Pending", "Assigned", "Picked Up", "In Transit",
    "Out for Delivery", "Delivered", "Delayed", "Failed", "Returned"
]

class DeliveryCreate(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    tracking_id: str = Field(min_length=3, max_length=40)
    order_reference: str = Field(min_length=1, max_length=80)
    priority: Literal["Standard", "Express", "Urgent"] = "Standard"
    transport_mode: Literal[
        "Road", "Air", "Rail", "Sea", "Local Courier"
    ] = "Road"
    source_warehouse: str = Field(default="", max_length=100)
    recipient_name: str = Field(min_length=1, max_length=200)
    recipient_phone: str = Field(default="", max_length=40)
    recipient_phone_country: str = Field(default="IN", max_length=4)
    driver_name: str = Field(default="", max_length=200)
    driver_phone: str = Field(default="", max_length=40)
    driver_phone_country: str = Field(default="IN", max_length=4)
    vehicle_number: str = Field(default="", max_length=40)
    carrier_name: str = Field(default="", max_length=120)
    destination_country: str = Field(default="IN", max_length=4)
    city: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=1, max_length=100)
    postal_code: str = Field(default="", max_length=20)
    address: str = Field(min_length=1, max_length=500)
    estimated_delivery: datetime
    notes: str = ""
    status: DeliveryStatus = "Pending"
    refund_status: Literal[
        "None", "Requested", "Processing", "Refunded"
    ] = "None"


class DeliveryUpdate(BaseModel):
    tracking_id: str | None = Field(default=None, min_length=3, max_length=40)
    order_reference: str | None = Field(default=None, min_length=1, max_length=80)
    priority: Literal["Standard", "Express", "Urgent"] | None = None
    transport_mode: Literal[
        "Road", "Air", "Rail", "Sea", "Local Courier"
    ] | None = None
    source_warehouse: str | None = Field(default=None, max_length=100)
    recipient_name: str | None = Field(default=None, min_length=1, max_length=200)
    recipient_phone: str | None = Field(default=None, max_length=40)
    recipient_phone_country: str | None = Field(default=None, max_length=4)
    driver_name: str | None = Field(default=None, max_length=200)
    driver_phone: str | None = Field(default=None, max_length=40)
    driver_phone_country: str | None = Field(default=None, max_length=4)
    vehicle_number: str | None = Field(default=None, max_length=40)
    carrier_name: str | None = Field(default=None, max_length=120)
    destination_country: str | None = Field(default=None, max_length=4)
    city: str | None = Field(default=None, min_length=1, max_length=100)
    state: str | None = Field(default=None, min_length=1, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    address: str | None = Field(default=None, min_length=1, max_length=500)
    estimated_delivery: datetime | None = None
    notes: str | None = None
    refund_status: Literal[
        "None", "Requested", "Processing", "Refunded"
    ] | None = None


class DeliveryEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    type: str
    status: str
    title: str
    event_time: datetime
    location: str
    reason: str
    actor: str


class ProofOfDeliveryCreate(BaseModel):
    received_by: str = Field(min_length=1, max_length=200)
    method: Literal["Receiver Name", "Signature", "Photo", "Other"] = "Receiver Name"
    reference: str = Field(default="", max_length=200)
    delivered_at: datetime
    notes: str = ""

class DeliveryStatusUpdate(BaseModel):
    status: DeliveryStatus
    event_time: datetime
    location: str = Field(default="", max_length=200)
    reason: str = Field(min_length=1, max_length=2000)

class ProofOfDeliveryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    received_by: str
    method: str
    reference: str
    delivered_at: datetime
    notes: str
    recorded_at: datetime


class DeliveryResponse(DeliveryCreate):
    model_config = ConfigDict(from_attributes=True)
    created_at: datetime
    updated_at: datetime
    history: list[DeliveryEventResponse] = []
    pod: ProofOfDeliveryResponse | None = None

def get_db():
    if SessionLocal is None:
        raise HTTPException(
            status_code=503,
            detail="DATABASE_URL is not configured"
        )

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {
        "message": "Welcome to LogiFlow API!",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "application": "LogiFlow"
    }


@app.get("/db-check")
def check_database(db: Session = Depends(get_db)):
    try:
        db.execute(select(1))
        return {
            "status": "connected",
            "database": "PostgreSQL",
            "application": "LogiFlow"
        }
    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail="Database connection failed"
        )


@app.post("/products", response_model=ProductResponse, status_code=201)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    db_product = Product(**product.model_dump())

    try:
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return db_product

    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="A product with this SKU may already exist"
        ) from exc

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Could not save product to database"
        )


@app.get("/products", response_model=list[ProductResponse])
def list_products(db: Session = Depends(get_db)):
    try:
        result = db.scalars(
            select(Product).order_by(Product.id)
        )
        return result.all()

    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail="Could not retrieve products from database"
        )

@app.get("/products/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    try:
        product = db.get(Product, product_id)

        if product is None:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        return product

    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail="Could not retrieve product from database"
        )

@app.patch("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db)
):
    try:
        product = db.get(Product, product_id)

        if product is None:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        updates = product_update.model_dump(
            exclude_unset=True,
            exclude_none=True
        )

        if not updates:
            raise HTTPException(
                status_code=400,
                detail="Provide at least one field to update"
            )

        for field, value in updates.items():
            setattr(product, field, value)

        db.commit()
        db.refresh(product)
        return product

    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="A product with this SKU may already exist"
        ) from exc

    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Could not update product in database"
        ) from exc


@app.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    try:
        product = db.get(Product, product_id)

        if product is None:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        db.delete(product)
        db.commit()

        return {
            "message": "Product deleted successfully",
            "product_id": product_id
        }

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Could not delete product from database"
        )

# =========================================================
# ORDERS API
# =========================================================

@app.post(
    "/orders",
    response_model=OrderResponse,
    status_code=201,
)
def create_order(
    order: OrderCreate,
    db: Session = Depends(get_db),
):
    db_order = CustomerOrder(**order.model_dump())

    try:
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        return db_order

    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="An order with this ID already exists",
        ) from exc

    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Could not save order to database",
        ) from exc


@app.get("/orders", response_model=list[OrderResponse])
def list_orders(db: Session = Depends(get_db)):
    try:
        result = db.scalars(
            select(CustomerOrder).order_by(
                CustomerOrder.order_date.desc(),
                CustomerOrder.id,
            )
        )
        return result.all()

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not retrieve orders",
        ) from exc


@app.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: str,
    db: Session = Depends(get_db),
):
    try:
        order = db.get(CustomerOrder, order_id)

        if order is None:
            raise HTTPException(
                status_code=404,
                detail="Order not found",
            )

        return order

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not retrieve order",
        ) from exc


@app.patch("/orders/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: str,
    order_update: OrderUpdate,
    db: Session = Depends(get_db),
):
    try:
        order = db.get(CustomerOrder, order_id)

        if order is None:
            raise HTTPException(
                status_code=404,
                detail="Order not found",
            )

        updates = order_update.model_dump(
            exclude_unset=True,
            exclude_none=True,
        )

        if not updates:
            raise HTTPException(
                status_code=400,
                detail="Provide at least one field to update",
            )

        for field, value in updates.items():
            setattr(order, field, value)

        db.commit()
        db.refresh(order)
        return order

    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="The order update conflicts with database constraints",
        ) from exc

    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Could not update order",
        ) from exc


@app.delete("/orders/{order_id}")
def delete_order(
    order_id: str,
    db: Session = Depends(get_db),
):
    try:
        order = db.get(CustomerOrder, order_id)

        if order is None:
            raise HTTPException(
                status_code=404,
                detail="Order not found",
            )

        # Protect records referenced by shipments or deliveries.
        linked_shipment = db.scalar(
            select(Shipment.id)
            .where(Shipment.order_id == order_id)
            .limit(1)
        )

        linked_delivery = db.scalar(
            select(Delivery.id)
            .where(Delivery.order_reference == order_id)
            .limit(1)
        )

        if linked_shipment or linked_delivery:
            raise HTTPException(
                status_code=409,
                detail="This order is referenced by a shipment or delivery",
            )

        db.delete(order)
        db.commit()

        return {
            "message": "Order deleted successfully",
            "order_id": order_id,
        }

    except HTTPException:
        raise

    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Could not delete order",
        ) from exc



# =========================================================
# WAREHOUSES API
# =========================================================

@app.post(
    "/warehouses",
    response_model=WarehouseResponse,
    status_code=201,
)
def create_warehouse(
    warehouse_data: WarehouseCreate,
    db: Session = Depends(get_db),
):
    if warehouse_data.occupied > warehouse_data.capacity:
        raise HTTPException(
            status_code=422,
            detail="Occupied capacity cannot exceed total capacity",
        )

    warehouse = Warehouse(**warehouse_data.model_dump())

    try:
        db.add(warehouse)
        db.commit()
        db.refresh(warehouse)
        return warehouse

    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="A warehouse with this ID or code may already exist",
        ) from exc

    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Could not save warehouse to database",
        ) from exc


@app.get("/warehouses", response_model=list[WarehouseResponse])
def list_warehouses(db: Session = Depends(get_db)):
    try:
        result = db.scalars(
            select(Warehouse).order_by(Warehouse.name)
        )
        return result.all()

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not retrieve warehouses",
        ) from exc


@app.get("/warehouses/{warehouse_id}", response_model=WarehouseResponse)
def get_warehouse(
    warehouse_id: str,
    db: Session = Depends(get_db),
):
    try:
        warehouse = db.get(Warehouse, warehouse_id)

        if warehouse is None:
            raise HTTPException(
                status_code=404,
                detail="Warehouse not found",
            )

        return warehouse

    except HTTPException:
        raise

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not retrieve warehouse",
        ) from exc


@app.patch("/warehouses/{warehouse_id}", response_model=WarehouseResponse)
def update_warehouse(
    warehouse_id: str,
    warehouse_update: WarehouseUpdate,
    db: Session = Depends(get_db),
):
    try:
        warehouse = db.get(Warehouse, warehouse_id)

        if warehouse is None:
            raise HTTPException(
                status_code=404,
                detail="Warehouse not found",
            )

        updates = warehouse_update.model_dump(
            exclude_unset=True,
            exclude_none=True,
        )

        if not updates:
            raise HTTPException(
                status_code=400,
                detail="Provide at least one field to update",
            )

        # Validate the resulting capacity, including unchanged fields.
        new_capacity = updates.get("capacity", warehouse.capacity)
        new_occupied = updates.get("occupied", warehouse.occupied)

        if new_occupied > new_capacity:
            raise HTTPException(
                status_code=422,
                detail="Occupied capacity cannot exceed total capacity",
            )

        for field, value in updates.items():
            setattr(warehouse, field, value)

        db.commit()
        db.refresh(warehouse)
        return warehouse

    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="A warehouse with this code may already exist",
        ) from exc

    except HTTPException:
        raise

    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Could not update warehouse",
        ) from exc


@app.delete("/warehouses/{warehouse_id}")
def delete_warehouse(
    warehouse_id: str,
    db: Session = Depends(get_db),
):
    try:
        warehouse = db.get(Warehouse, warehouse_id)

        if warehouse is None:
            raise HTTPException(
                status_code=404,
                detail="Warehouse not found",
            )

        # Avoid deleting a warehouse currently referenced by inventory.
        linked_product = db.scalar(
            select(Product.id)
            .where(Product.warehouse == warehouse.name)
            .limit(1)
        )

        # Delivery records may reference a warehouse by ID, code, or name.
        linked_delivery = db.scalar(
            select(Delivery.id)
            .where(
                Delivery.source_warehouse.in_([
                    warehouse.id,
                    warehouse.code,
                    warehouse.name,
                ])
            )
            .limit(1)
        )

        if linked_product or linked_delivery:
            raise HTTPException(
                status_code=409,
                detail="This warehouse is referenced by inventory or deliveries",
            )

        db.delete(warehouse)
        db.commit()

        return {
            "message": "Warehouse deleted successfully",
            "warehouse_id": warehouse_id,
        }

    except HTTPException:
        raise

    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Could not delete warehouse",
        ) from exc



# =========================================================
# SHIPMENTS API
# =========================================================

@app.post(
    "/shipments",
    response_model=ShipmentResponse,
    status_code=201,
)
def create_shipment(
    shipment_data: ShipmentCreate,
    db: Session = Depends(get_db),
):
    if shipment_data.dispatch_date > date.today():
        raise HTTPException(
            status_code=422,
            detail="Dispatch date cannot be in the future",
        )

    if shipment_data.estimated_delivery < shipment_data.dispatch_date:
        raise HTTPException(
            status_code=422,
            detail="Estimated delivery cannot be before dispatch date",
        )

    shipment = Shipment(
        **shipment_data.model_dump(),
        edit_count=0,
    )

    try:
        db.add(shipment)
        db.commit()
        db.refresh(shipment)
        return shipment

    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Shipment ID or tracking number already exists",
        ) from exc

    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Could not save shipment",
        ) from exc


@app.get("/shipments", response_model=list[ShipmentResponse])
def list_shipments(db: Session = Depends(get_db)):
    try:
        result = db.scalars(
            select(Shipment).order_by(
                Shipment.dispatch_date.desc(),
                Shipment.id,
            )
        )
        return result.all()

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not retrieve shipments",
        ) from exc


@app.get("/shipments/{shipment_id}", response_model=ShipmentResponse)
def get_shipment(
    shipment_id: str,
    db: Session = Depends(get_db),
):
    try:
        shipment = db.get(Shipment, shipment_id)

        if shipment is None:
            raise HTTPException(
                status_code=404,
                detail="Shipment not found",
            )

        return shipment

    except HTTPException:
        raise

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not retrieve shipment",
        ) from exc


@app.patch("/shipments/{shipment_id}", response_model=ShipmentResponse)
def update_shipment(
    shipment_id: str,
    shipment_update: ShipmentUpdate,
    db: Session = Depends(get_db),
):
    try:
        # Lock the row so concurrent edits cannot bypass the edit limit.
        shipment = db.scalar(
            select(Shipment)
            .where(Shipment.id == shipment_id)
            .with_for_update()
        )

        if shipment is None:
            raise HTTPException(
                status_code=404,
                detail="Shipment not found",
            )

        updates = shipment_update.model_dump(
            exclude_unset=True,
            exclude_none=True,
        )

        if not updates:
            raise HTTPException(
                status_code=400,
                detail="Provide at least one field to update",
            )

        # Shipment ID, order ID, and edit count are not client-editable.
        actual_changes = {
            field: value
            for field, value in updates.items()
            if getattr(shipment, field) != value
        }

        if not actual_changes:
            raise HTTPException(
                status_code=400,
                detail="No changes detected; edit count remains unchanged",
            )

        if shipment.edit_count >= 2:
            raise HTTPException(
                status_code=409,
                detail="This shipment has used both permitted edits",
            )

        new_dispatch_date = actual_changes.get(
            "dispatch_date", shipment.dispatch_date
        )
        new_estimated_delivery = actual_changes.get(
            "estimated_delivery", shipment.estimated_delivery
        )

        if new_dispatch_date > date.today():
            raise HTTPException(
                status_code=422,
                detail="Dispatch date cannot be in the future",
            )

        if new_estimated_delivery < new_dispatch_date:
            raise HTTPException(
                status_code=422,
                detail="Estimated delivery cannot be before dispatch date",
            )

        for field, value in actual_changes.items():
            setattr(shipment, field, value)

        # Count only a valid, genuinely changed edit.
        shipment.edit_count += 1

        db.commit()
        db.refresh(shipment)
        return shipment

    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This tracking number may already exist",
        ) from exc

    except HTTPException:
        db.rollback()
        raise

    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Could not update shipment",
        ) from exc


@app.delete("/shipments/{shipment_id}")
def delete_shipment(
    shipment_id: str,
    db: Session = Depends(get_db),
):
    try:
        shipment = db.get(Shipment, shipment_id)

        if shipment is None:
            raise HTTPException(
                status_code=404,
                detail="Shipment not found",
            )

        db.delete(shipment)
        db.commit()

        return {
            "message": "Shipment deleted successfully",
            "shipment_id": shipment_id,
        }

    except HTTPException:
        raise

    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Could not delete shipment",
        ) from exc



# =========================================================
# DELIVERIES API
# =========================================================

def make_delivery_event(
    delivery_id: str,
    event_type: str,
    status: str,
    title: str,
    event_time: datetime,
    location: str = "",
    reason: str = "",
) -> DeliveryEvent:
    if event_time.tzinfo is None:
        event_time = event_time.replace(tzinfo=timezone.utc)

    return DeliveryEvent(
        id=f"evt_{uuid4().hex}",
        delivery_id=delivery_id,
        type=event_type,
        status=status,
        title=title,
        event_time=event_time,
        location=location,
        reason=reason,
        actor="LogiFlow Admin",
    )


@app.post(
    "/deliveries",
    response_model=DeliveryResponse,
    status_code=201,
)
def create_delivery(
    delivery_data: DeliveryCreate,
    db: Session = Depends(get_db),
):
    if delivery_data.status not in ("Pending", "Assigned"):
        raise HTTPException(
            status_code=422,
            detail="New deliveries must start as Pending or Assigned",
        )

    duplicate = db.scalar(
        select(Delivery.id).where(
            Delivery.tracking_id == delivery_data.tracking_id
        )
    )

    if duplicate:
        raise HTTPException(
            status_code=409,
            detail="This tracking ID already exists",
        )

    values = delivery_data.model_dump()

    eta = values["estimated_delivery"]
    if eta.tzinfo is None:
        values["estimated_delivery"] = eta.replace(tzinfo=timezone.utc)

    delivery = Delivery(**values)

    initial_event = make_delivery_event(
        delivery_id=delivery.id,
        event_type="created",
        status=delivery.status,
        title="Delivery created",
        event_time=datetime.now(timezone.utc),
        location=delivery.source_warehouse or delivery.city,
        reason="Delivery record created.",
    )

    try:
        db.add(delivery)
        db.add(initial_event)
        db.commit()

        return db.scalar(
            select(Delivery)
            .where(Delivery.id == delivery.id)
        )

    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Delivery ID or tracking ID already exists",
        ) from exc

    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Could not save delivery",
        ) from exc


@app.get("/deliveries", response_model=list[DeliveryResponse])
def list_deliveries(db: Session = Depends(get_db)):
    try:
        return db.scalars(
            select(Delivery).order_by(
                Delivery.created_at.desc(),
                Delivery.id,
            )
        ).all()

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not retrieve deliveries",
        ) from exc


@app.get("/deliveries/{delivery_id}", response_model=DeliveryResponse)
def get_delivery(
    delivery_id: str,
    db: Session = Depends(get_db),
):
    try:
        delivery = db.get(Delivery, delivery_id)

        if delivery is None:
            raise HTTPException(
                status_code=404,
                detail="Delivery not found",
            )

        return delivery

    except HTTPException:
        raise

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not retrieve delivery",
        ) from exc


@app.patch(
    "/deliveries/{delivery_id}",
    response_model=DeliveryResponse,
)
def update_delivery(
    delivery_id: str,
    delivery_update: DeliveryUpdate,
    db: Session = Depends(get_db),
):
    try:
        delivery = db.scalar(
            select(Delivery)
            .where(Delivery.id == delivery_id)
            .with_for_update()
        )

        if delivery is None:
            raise HTTPException(
                status_code=404,
                detail="Delivery not found",
            )

        updates = delivery_update.model_dump(
            exclude_unset=True,
            exclude_none=True,
        )

        if not updates:
            raise HTTPException(
                status_code=400,
                detail="Provide at least one field to update",
            )

        eta = updates.get("estimated_delivery")
        if eta is not None and eta.tzinfo is None:
            updates["estimated_delivery"] = eta.replace(
                tzinfo=timezone.utc
            )

        actual_changes = {
            field: value
            for field, value in updates.items()
            if getattr(delivery, field) != value
        }

        if not actual_changes:
            raise HTTPException(
                status_code=400,
                detail="No changes detected",
            )

        # The status and POD must use their dedicated endpoints.
        for field, value in actual_changes.items():
            setattr(delivery, field, value)

        audit_event = make_delivery_event(
            delivery_id=delivery.id,
            event_type="audit",
            status=delivery.status,
            title="Delivery details updated",
            event_time=datetime.now(timezone.utc),
            location=delivery.city,
            reason="Delivery details updated.",
        )
        db.add(audit_event)

        db.commit()

        return db.scalar(
            select(Delivery).where(Delivery.id == delivery_id)
        )

    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Delivery ID or tracking ID may already exist",
        ) from exc

    except HTTPException:
        db.rollback()
        raise

    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Could not update delivery",
        ) from exc


@app.delete("/deliveries/{delivery_id}")
def delete_delivery(
    delivery_id: str,
    db: Session = Depends(get_db),
):
    try:
        delivery = db.get(Delivery, delivery_id)

        if delivery is None:
            raise HTTPException(
                status_code=404,
                detail="Delivery not found",
            )

        db.delete(delivery)
        db.commit()

        return {
            "message": "Delivery deleted successfully",
            "delivery_id": delivery_id,
        }

    except HTTPException:
        raise

    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Could not delete delivery",
        ) from exc



# =========================================================
# DELIVERY STATUS HISTORY API
# =========================================================

@app.post(
    "/deliveries/{delivery_id}/status",
    response_model=DeliveryResponse,
)
def update_delivery_status(
    delivery_id: str,
    status_update: DeliveryStatusUpdate,
    db: Session = Depends(get_db),
):
    try:
        delivery = db.scalar(
            select(Delivery)
            .where(Delivery.id == delivery_id)
            .with_for_update()
        )

        if delivery is None:
            raise HTTPException(
                status_code=404,
                detail="Delivery not found",
            )

        new_status = status_update.status

        if new_status == delivery.status:
            raise HTTPException(
                status_code=400,
                detail="Delivery already has this status",
            )

        if new_status == "Delivered":
            raise HTTPException(
                status_code=400,
                detail="Use the proof-of-delivery endpoint to mark a delivery as Delivered",
            )

        delivery.status = new_status

        event = make_delivery_event(
            delivery_id=delivery.id,
            event_type="status_change",
            status=new_status,
            title=f"Status changed to {new_status}",
            event_time=status_update.event_time,
            location=status_update.location,
            reason=status_update.reason,
        )

        db.add(event)
        db.commit()

        return db.scalar(
            select(Delivery).where(Delivery.id == delivery_id)
        )

    except HTTPException:
        db.rollback()
        raise

    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Could not update delivery status",
        ) from exc


# =========================================================
# DELIVERY HISTORY API
# =========================================================

@app.get("/deliveries/{delivery_id}/history")
def get_delivery_history(
    delivery_id: str,
    db: Session = Depends(get_db),
):
    try:
        delivery = db.get(Delivery, delivery_id)

        if delivery is None:
            raise HTTPException(
                status_code=404,
                detail="Delivery not found",
            )

        events = db.scalars(
            select(DeliveryEvent)
            .where(DeliveryEvent.delivery_id == delivery_id)
            .order_by(DeliveryEvent.event_time, DeliveryEvent.id)
        ).all()

        return [
            DeliveryEventResponse.model_validate(event)
            for event in events
        ]

    except HTTPException:
        raise

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not retrieve delivery history",
        ) from exc


# =========================================================
# PROOF OF DELIVERY API
# =========================================================

@app.post(
    "/deliveries/{delivery_id}/proof-of-delivery",
    response_model=DeliveryResponse,
)
def record_proof_of_delivery(
    delivery_id: str,
    pod_data: ProofOfDeliveryCreate,
    db: Session = Depends(get_db),
):
    try:
        delivery = db.scalar(
            select(Delivery)
            .where(Delivery.id == delivery_id)
            .with_for_update()
        )

        if delivery is None:
            raise HTTPException(
                status_code=404,
                detail="Delivery not found",
            )

        if delivery.status == "Delivered":
            raise HTTPException(
                status_code=409,
                detail="Delivery is already marked as Delivered",
            )

        existing_pod = db.scalar(
            select(ProofOfDelivery)
            .where(ProofOfDelivery.delivery_id == delivery_id)
        )

        if existing_pod is not None:
            raise HTTPException(
                status_code=409,
                detail="Proof of delivery has already been recorded",
            )

        delivered_at = pod_data.delivered_at
        if delivered_at.tzinfo is None:
            delivered_at = delivered_at.replace(tzinfo=timezone.utc)

        now = datetime.now(timezone.utc)

        pod = ProofOfDelivery(
            delivery_id=delivery_id,
            received_by=pod_data.received_by,
            method=pod_data.method,
            reference=pod_data.reference,
            delivered_at=delivered_at,
            notes=pod_data.notes,
        )

        event = make_delivery_event(
            delivery_id=delivery.id,
            event_type="proof_of_delivery",
            status="Delivered",
            title="Proof of delivery recorded",
            event_time=now,
            location=delivery.city,
            reason=f"Received by {pod_data.received_by}",
        )

        delivery.status = "Delivered"

        db.add(pod)
        db.add(event)
        db.commit()

        return db.scalar(
            select(Delivery).where(Delivery.id == delivery_id)
        )

    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Proof of delivery already exists",
        ) from exc

    except HTTPException:
        db.rollback()
        raise

    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Could not record proof of delivery",
        ) from exc



# =========================================================
# DASHBOARD SUMMARY API
# =========================================================

@app.get("/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    try:
        products = db.scalars(select(Product)).all()
        orders = db.scalars(select(CustomerOrder)).all()
        shipments = db.scalars(select(Shipment)).all()
        warehouses = db.scalars(select(Warehouse)).all()
        deliveries = db.scalars(select(Delivery)).all()

        # Inventory summary
        total_stock_units = sum(product.quantity for product in products)
        total_stock_value = sum(
            (
                Decimal(product.quantity) * product.unit_price
                for product in products
            ),
            Decimal("0.00"),
        )

        # Order status counts
        order_counts = {
            status: sum(1 for order in orders if order.status == status)
            for status in [
                "Pending", "Processing", "Shipped", "Delivered", "Cancelled"
            ]
        }

        # Shipment status counts
        shipment_counts = {
            status: sum(
                1 for shipment in shipments if shipment.status == status
            )
            for status in [
                "Preparing", "In Transit", "Out for Delivery",
                "Delivered", "Delayed"
            ]
        }

        # Warehouse capacity summary
        total_capacity = sum(warehouse.capacity for warehouse in warehouses)
        occupied_capacity = sum(warehouse.occupied for warehouse in warehouses)
        available_capacity = total_capacity - occupied_capacity

        utilization_percent = (
            round(occupied_capacity / total_capacity * 100)
            if total_capacity > 0
            else 0
        )

        # Delivery summary
        pending_deliveries = sum(
            1 for delivery in deliveries if delivery.status == "Pending"
        )
        in_progress_deliveries = sum(
            1 for delivery in deliveries
            if delivery.status in [
                "Assigned", "Picked Up", "In Transit",
                "Out for Delivery", "Delayed"
            ]
        )
        delivered_count = sum(
            1 for delivery in deliveries if delivery.status == "Delivered"
        )
        delayed_count = sum(
            1 for delivery in deliveries
            if delivery.status == "Delayed"
        )
        failed_or_returned_count = sum(
            1 for delivery in deliveries
            if delivery.status in ["Failed", "Returned"]
        )
        refunds_pending = sum(
            1 for delivery in deliveries
            if delivery.refund_status in ["Requested", "Processing"]
        )

        # Latest five orders for the Dashboard table
        recent_orders = sorted(
            orders,
            key=lambda order: (order.order_date, order.id),
            reverse=True,
        )[:5]

        return {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "inventory": {
                "products_count": len(products),
                "total_stock_units": total_stock_units,
                "stock_value": str(total_stock_value),
            },
            "orders": {
                "total": len(orders),
                **{
                    status.lower(): count
                    for status, count in order_counts.items()
                },
            },
            "shipments": {
                "total": len(shipments),
                **{
                    status.lower().replace(" ", "_"): count
                    for status, count in shipment_counts.items()
                },
            },
            "warehouses": {
                "total": len(warehouses),
                "active": sum(
                    1 for warehouse in warehouses
                    if warehouse.status == "Active"
                ),
                "total_capacity": total_capacity,
                "occupied_capacity": occupied_capacity,
                "available_capacity": available_capacity,
                "utilization_percent": utilization_percent,
            },
            "deliveries": {
                "total": len(deliveries),
                "pending": pending_deliveries,
                "in_progress": in_progress_deliveries,
                "delivered": delivered_count,
                "delayed": delayed_count,
                "failed_or_returned": failed_or_returned_count,
                "refunds_pending": refunds_pending,
            },
            "recent_orders": [
                {
                    "id": order.id,
                    "customer": order.customer,
                    "status": order.status,
                    "amount": str(order.amount),
                    "order_date": order.order_date.isoformat(),
                }
                for order in recent_orders
            ],
        }

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not generate dashboard summary",
        ) from exc
