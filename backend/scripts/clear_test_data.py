import asyncio
from app.database import AsyncSessionLocal
from app.models import Event, AuditLog, Action, Diagnosis
from sqlalchemy import delete

async def clear_all_test_data():
    async with AsyncSessionLocal() as session:
        await session.execute(delete(AuditLog))
        await session.execute(delete(Action))
        await session.execute(delete(Diagnosis))
        await session.execute(delete(Event))
        await session.commit()
        print("Database successfully cleared! All dummy data removed.")

if __name__ == "__main__":
    asyncio.run(clear_all_test_data())
