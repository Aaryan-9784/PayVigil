import pytest
from app.database import engine

@pytest.fixture(autouse=True)
async def dispose_engine_on_teardown():
    yield
    await engine.dispose()
