from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./farm_task.db"
    cors_origins: str = "http://localhost:5173"
    app_name: str = "Farm-Task"
    debug: bool = True

    model_config = {"env_file": ".env"}


settings = Settings()
