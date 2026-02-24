from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_auth import router as auth_router
from app.api.routes_classroom import router as classroom_router
from app.api.routes_picker import router as picker_router
from app.api.routes_projects import router as projects_router
from app.core.config import settings
from app.db.session import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="PickerWheelApp API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.backend_cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(projects_router)
app.include_router(picker_router)
app.include_router(classroom_router)
app.include_router(auth_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
