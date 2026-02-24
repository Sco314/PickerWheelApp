from pydantic import BaseModel


class NamesInput(BaseModel):
    names: str


class SpinResult(BaseModel):
    picked: str
