import os
from decimal import Decimal

from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import create_engine, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker

from models import Product


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


class ProductCreate(BaseModel):
    sku: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=200)
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
    quantity: int
    unit_price: Decimal


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