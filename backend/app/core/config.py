from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    gemini_api_key: str = Field(..., env="GEMINI_API_KEY")
    embedding_model: str = Field("gemini-embedding-001", env="EMBEDDING_MODEL")
    gemini_api_model: str = Field("gemini-2.0-flash", env="GEMINI_API_MODEL")
    qdrant_url: str = Field("./qdrant_db", env="QDRANT_URL")
    qdrant_collection: str = Field("product_context", env="QDRANT_COLLECTION")
    embedding_dimension: int = Field(3072, env="EMBEDDING_DIMENSION")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()