import uuid
from datetime import datetime, timezone
from sqlalchemy import String, BigInteger, TIMESTAMP, ForeignKey, Integer, CheckConstraint, JSON, Uuid, Boolean
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# Custom column types that adapt cleanly to PostgreSQL JSONB/UUID while allowing fallback SQLite for tests
JSON_TYPE = JSONB().with_variant(JSON, "sqlite")
UUID_TYPE = PG_UUID(as_uuid=True).with_variant(Uuid(as_uuid=True), "sqlite")

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False, default="support")  # "admin" or "support"
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class Event(Base):
    __tablename__ = "events"
    id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    razorpay_payment_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    amount_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    error_code: Mapped[str] = mapped_column(String, nullable=True)
    error_description: Mapped[str] = mapped_column(String, nullable=True)
    customer_id: Mapped[str] = mapped_column(String, nullable=True)
    raw_payload: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False)
    received_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))

class Diagnosis(Base):
    __tablename__ = "diagnoses"
    id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("events.id"))
    root_cause: Mapped[str] = mapped_column(String, nullable=False)
    confidence: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))

class Action(Base):
    __tablename__ = "actions"
    __table_args__ = (
        CheckConstraint("action_type IN ('retry_payment','send_reminder_email','escalate_to_human')"),
        CheckConstraint("status IN ('pending','success','failed','skipped_stopping_rule')"),
    )
    id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("events.id"))
    action_type: Mapped[str] = mapped_column(String, nullable=False)
    attempt_number: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String, nullable=False)
    amount_recovered_paise: Mapped[int] = mapped_column(BigInteger, default=0)
    executed_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))

class AuditLog(Base):
    __tablename__ = "audit_log"
    id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("events.id"))
    diagnosis_id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("diagnoses.id"), nullable=True)
    action_id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("actions.id"), nullable=True)
    summary: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))
