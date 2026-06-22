from sqlalchemy import (
    Boolean,
    Column,
    String,
    Integer,
    DateTime,
    Float,
    Text,
    ForeignKey,
    Index,
    Table
)

from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

organization_users = Table(
    "organization_users",
    Base.metadata,
    Column("id", String, primary_key=True, default=lambda: str(uuid.uuid4())),
    Column("organization_id", String, ForeignKey("organizations.id")),
    Column("user_id", String, ForeignKey("users.id")),
    Column("role", String, nullable=False),
    Index("uq_org_user", "organization_id", "user_id", unique=True),
)

class OrganizationUser(Base):
    __table__ = organization_users
    user = relationship("User", back_populates="organization_users")
    organization = relationship("Organization", back_populates="organization_users")


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    settings_json = Column(Text, nullable=True) 

    organization_users = relationship("OrganizationUser", back_populates="organization")
    detections = relationship("Detection", back_populates="organization", cascade="all, delete-orphan")
    api_keys = relationship("ApiKey", back_populates="organization", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="organization", cascade="all, delete-orphan")
    usage_metrics = relationship("UsageMetric", back_populates="organization", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="organization", cascade="all, delete-orphan")



class User(Base):
    __tablename__ = "users"

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    name = Column(
        String,
        nullable=False
    )

    password_hash = Column(
        String,
        nullable=False
    )

    tier = Column(
        String,
        default="free"
    )

    is_active = Column(
        Boolean,
        default=True
    )

    is_verified = Column(
        Boolean,
        default=False
    )

    failed_login_attempts = Column(
        Integer,
        default=0
    )
    locked_until = Column(
        DateTime,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    organization_users = relationship("OrganizationUser", back_populates="user")

    api_keys = relationship(
        "ApiKey",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    detections = relationship(
        "Detection",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    applications = relationship(
        "Application",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    audit_logs = relationship(
        "AuditLog",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_email", "email"),
    )


class Application(Base):
    __tablename__ = "applications"

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    user_id = Column(
        String,
        ForeignKey("users.id"),
        nullable=False
    )

    organization_id = Column(
        String,
        ForeignKey("organizations.id"),
        nullable=False,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    description = Column(Text)

    environment = Column(
        String,
        default="production"
    )

    provider = Column(
        String,
        default="openai"
    )

    is_active = Column(
        Boolean,
        default=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )


    user = relationship(
        "User",
        back_populates="applications"
    )

    organization = relationship(
        "Organization",
        back_populates="applications"
    )

    api_keys = relationship(
        "ApiKey",
        back_populates="application",
        cascade="all, delete-orphan"
    )

    detections = relationship(
        "Detection",
        back_populates="application",
        cascade="all, delete-orphan"
    )

    audit_logs = relationship(
        "AuditLog",
        back_populates="application",
        cascade="all, delete-orphan"
    )

    usage_metrics = relationship(
        "UsageMetric",
        back_populates="application",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_application_user", "user_id"),
        Index("idx_applications_org", "organization_id"),
    )

class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    user_id = Column(
        String,
        ForeignKey("users.id"),
        nullable=False
    )

    organization_id = Column(
        String,
        ForeignKey("organizations.id"),
        nullable=False,
        index=True
    )

    application_id = Column(
        String,
        ForeignKey("applications.id"),
        nullable=True
    )

    name = Column(
        String,
        nullable=False
    )

    key_hash = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    prefix = Column(String)

    is_active = Column(
        Boolean,
        default=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    last_used_at = Column(
        DateTime
    )

    user = relationship(
        "User",
        back_populates="api_keys"
    )

    organization = relationship(
        "Organization",
        back_populates="api_keys"
    )

    application = relationship(
        "Application",
        back_populates="api_keys"
    )

    __table_args__ = (
        Index("idx_user_id", "user_id"),
        Index("idx_api_keys_org", "organization_id"),
    )


class Detection(Base):
    __tablename__ = "detections"

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    user_id = Column(
        String,
        ForeignKey("users.id"),
        nullable=False
    )

    organization_id = Column(
        String,
        ForeignKey("organizations.id"),
        nullable=False,
        index=True
    )

    application_id = Column(
        String,
        ForeignKey("applications.id"),
        nullable=True
    )

    prompt = Column(
        Text,
        nullable=False
    )

    risk_score = Column(
        Float,
        nullable=False
    )

    risk_level = Column(
        String,
        nullable=False
    )

    detected_patterns = Column(
        String
    )

    processing_time_ms = Column(
        Integer
    )

    source = Column(
        String,
        default="api"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        index=True
    )

    user = relationship(
        "User",
        back_populates="detections"
    )

    organization = relationship(
        "Organization",
        back_populates="detections"
    )

    application = relationship(
        "Application",
        back_populates="detections"
    )

    __table_args__ = (
        Index("idx_detection_user_created", "user_id", "created_at"),
        Index("idx_detection_risk_level", "risk_level"),
        Index("idx_detections_org_created", "organization_id", "created_at"),
    )


class UsageMetric(Base):
    __tablename__ = "usage_metrics"

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    application_id = Column(
        String,
        ForeignKey("applications.id"),
        nullable=False
    )

    organization_id = Column(
        String,
        ForeignKey("organizations.id"),
        nullable=False,
        index=True
    )

    total_requests = Column(
        Integer,
        default=0
    )

    blocked_requests = Column(
        Integer,
        default=0
    )

    last_request_at = Column(
        DateTime
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        index=True
    )

    application = relationship(
        "Application",
        back_populates="usage_metrics"
    )

    organization = relationship(
        "Organization",
        back_populates="usage_metrics"
    )

    __table_args__ = (
        Index("idx_usage_metrics_org", "organization_id"),
    )

class Rule(Base):
    __tablename__ = "rules"

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    name = Column(
        String,
        unique=True,
        nullable=False
    )

    category = Column(
        String,
        nullable=False
    )

    patterns = Column(
        String,
        nullable=False
    )

    weight = Column(
        Float,
        default=0.8
    )

    risk_multiplier = Column(
        Float,
        default=1.5
    )

    is_enabled = Column(
        Boolean,
        default=True
    )

    description = Column(Text)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    version = Column(
        Integer,
        default=1,
        nullable=False
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(
    String,
    primary_key=True,
    default=lambda: str(uuid.uuid4())
)

    user_id = Column(
        String,
        ForeignKey("users.id"),
        nullable=False
    )

    organization_id = Column(
        String,
        ForeignKey("organizations.id"),
        nullable=False,
        index=True
    )

    application_id = Column(
        String,
        ForeignKey("applications.id"),
        nullable=True
    )

    action = Column(
        String,
        nullable=False
    )

    resource = Column(String)

    details = Column(Text)

    ip_address = Column(String)

    user_agent = Column(String)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    user = relationship(
        "User",
        back_populates="audit_logs"
    )

    organization = relationship(
        "Organization",
        back_populates="audit_logs"
    )

    application = relationship(
        "Application",
        back_populates="audit_logs"
    )

    __table_args__ = (
        Index("idx_audit_user_created", "user_id", "created_at"),
        Index("idx_audit_application_id", "application_id"),
        Index("idx_audit_logs_org", "organization_id"),
    )


class TokenBlacklist(Base):
    __tablename__ = "token_blacklist"

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    jti = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    ) 

    user_id = Column(
        String,
        ForeignKey("users.id"),
        nullable=False
    )

    expires_at = Column(
        DateTime,
        nullable=False
    ) 

    blacklisted_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    ) 

    reason = Column(
        String,
        nullable=True
    ) 
    user = relationship("User")

    __table_args__ = (
        Index("idx_token_blacklist_expires", "expires_at"),
    )

class Plan(Base):
    __tablename__ = "plans"

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    name = Column(
        String,
        nullable=False
    )

    price_monthly = Column(
        Integer,
        nullable=False
    )  
    features_json = Column(
        Text,
        nullable=True
    )  
    __table_args__ = ()


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    organization_id = Column(
        String,
        ForeignKey("organizations.id"),
        nullable=False,
        index=True
    )

    plan_id = Column(
        String,
        ForeignKey("plans.id"),
        nullable=False
    )

    starts_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    ends_at = Column(
        DateTime,
        nullable=True
    )

    status = Column(
        String,
        nullable=False
    )  
    __table_args__ = (
        Index("idx_subscriptions_org", "organization_id"),
        Index("idx_subscriptions_plan", "plan_id"),
    )