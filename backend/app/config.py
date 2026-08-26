import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    anthropic_api_key: str = "sk-ant-mock-key-for-dev-testing"
    razorpay_key_id: str = "rzp_test_mock_key"
    razorpay_key_secret: str = "rzp_secret_mock"
    razorpay_webhook_secret: str = "rzp_webhook_secret_mock_12345"
    database_url: str = "sqlite+aiosqlite:///./revenue_recovery.db"
    resend_api_key: str = "re_mock_key_12345"
    slack_webhook_url: str = "https://hooks.slack.com/services/mock/123/456"
    dashboard_api_key: str = "rev-recovery-dev-secret-key-2025"
    environment: str = "development"
    max_retry_attempts: int = 3
    retry_cooldown_hours: int = 12

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
