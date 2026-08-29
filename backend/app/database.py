import ssl
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings

# ---------------------------------------------------------------------------
# Supabase & PostgreSQL Connection Configuration
# ---------------------------------------------------------------------------
database_url = settings.database_url

# Standardize scheme to asyncpg driver
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif database_url.startswith("postgresql://") and not database_url.startswith("postgresql+asyncpg://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Specific engine arguments for PostgreSQL / Supabase vs SQLite
connect_args = {}
engine_kwargs = {
    "echo": False,
    "future": True,
}

if "postgresql" in database_url:
    # 1. Supabase SSL Enforcement (Encrypted in-transit to cloud)
    connect_args["ssl"] = "require"

    # 2. Supabase Connection Pooler / PgBouncer compatibility (Port 6543)
    if ":6543" in database_url or "pooler.supabase.com" in database_url:
        connect_args["statement_cache_size"] = 0
        connect_args["prepared_statement_cache_size"] = 0

    # 3. Cloud Connection Pool Resiliency
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,       # Auto-reconnects if cloud connection drops
        "pool_recycle": 300,        # Refreshes idle connections every 5 mins
    })

engine = create_async_engine(
    database_url,
    connect_args=connect_args,
    **engine_kwargs
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    from app.models import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

