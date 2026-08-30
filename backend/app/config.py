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
    environment: str = "development"
    max_retry_attempts: int = 3
    support_email: str = "support@yourdomain.com"
    fast2sms_api_key: str = ""
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""
    twilio_whatsapp_number: str = "whatsapp:+14155238886"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
