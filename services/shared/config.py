import os
from pathlib import Path
from dotenv import load_dotenv

# Find root .env file
root_dir = Path(__file__).resolve().parent.parent.parent
env_path = root_dir / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    # Google Gemini GenAI Settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL_LIVE: str = os.getenv("GEMINI_MODEL_LIVE", "gemini-3.8-flash")
    GEMINI_MODEL_REASONING: str = os.getenv("GEMINI_MODEL_REASONING", "gemini-pro-latest")

    # Pinecone Vector DB Settings
    PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY", "")
    PINECONE_INDEX_NAME: str = os.getenv("PINECONE_INDEX_NAME", "scamshield-radar")

    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Security & Redaction
    ENABLE_PRIVACY_VAULT: bool = True
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() == "true"

settings = Settings()
