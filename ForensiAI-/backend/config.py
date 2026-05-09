from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration"""

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        protected_namespaces=("settings_",),
    )
    
    # Featherless AI
    featherless_api_key: str = "mock_key_replace_with_yours"
    featherless_base_url: str = "https://api.featherless.ai/v1"
    model_name: str = "Qwen/Qwen2.5-7B-Instruct"
    
    # Firebase
    firebase_credentials_path: str = ""
    firebase_storage_bucket: str = ""
    require_auth: bool = True

    # Upload
    upload_dir: str = "uploads"
    max_upload_size_mb: int = 50
    
    # Environment
    env: str = "development"
    debug: bool = True
    frontend_url: str = "http://localhost:3000"

    @field_validator("debug", mode="before")
    @classmethod
    def parse_boolish(cls, value):
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"release", "production", "prod", "off", "false", "0", "no"}:
                return False
            if normalized in {"development", "dev", "on", "true", "1", "yes"}:
                return True
        return value


settings = Settings()
