import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    gemini_api_key: str = ""
    groq_api_key: str = ""
    razorpay_key_id: str = "rzp_test_mock_key"
    razorpay_key_secret: str = "rzp_secret_mock"
    razorpay_webhook_secret: str = "rzp_webhook_secret_mock_12345"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/revenue_recovery"
    resend_api_key: str = "re_mock_key_12345"
    slack_webhook_url: str = "https://hooks.slack.com/services/mock/123/456"
    dashboard_api_key: str = "rev-recovery-dev-secret-key-2025"
    admin_passkey: str = "Admin@Razorpay2026"
    customer_support_passkey: str = "Support@Razorpay2026"
    environment: str = "development"
    max_retry_attempts: int = 3
    retry_cooldown_hours: int = 12

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

def get_live_passkeys() -> dict[str, str]:
    """Reads latest passkeys directly from .env file or environment variables in real-time."""
    admin_key = os.environ.get("ADMIN_PASSKEY", "")
    support_key = os.environ.get("CUSTOMER_SUPPORT_PASSKEY", "")
    
    # Direct read of backend/.env to reflect edits immediately without server restart
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_paths = [
        os.path.join(backend_dir, ".env"),
        os.path.join(os.getcwd(), ".env"),
        os.path.join(os.getcwd(), "backend", ".env")
    ]
    
    for path in env_paths:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith("#") or "=" not in line:
                            continue
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip("'\"")
                        if k == "ADMIN_PASSKEY":
                            admin_key = v
                        elif k == "CUSTOMER_SUPPORT_PASSKEY":
                            support_key = v
                break
            except Exception:
                pass
                
    return {
        "admin": admin_key or settings.admin_passkey,
        "support": support_key or settings.customer_support_passkey
    }
