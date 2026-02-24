from pydantic import BaseModel


class ProjectCreate(BaseModel):
    title: str


class ProjectOut(BaseModel):
    id: int
    title: str

    class Config:
        from_attributes = True
