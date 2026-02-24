from pydantic import BaseModel


class ProjectCreate(BaseModel):
    title: str


class ProjectUpdate(BaseModel):
    title: str


class ProjectOut(BaseModel):
    id: int
    title: str

    class Config:
        from_attributes = True


class UserSettingsUpdate(BaseModel):
    last_project_id: int | None
