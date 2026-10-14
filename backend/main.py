
from fastapi import FastAPI

app = FastAPI(
    title="LogiFlow API",
    description="Backend API for the LogiFlow logistics platform",
    version="1.0.0"
)


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
