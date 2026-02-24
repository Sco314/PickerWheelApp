from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./pickerwheel.db"
    backend_cors_origins: str = "http://localhost:5173"


settings = Settings()
