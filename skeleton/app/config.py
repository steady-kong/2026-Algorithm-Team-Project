from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    upstage_api_key: str = ""
    upstage_model: str = "solar-pro"
    upstage_base_url: str = "https://api.upstage.ai/v1"

    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
