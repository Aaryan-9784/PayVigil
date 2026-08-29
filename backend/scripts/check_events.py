import asyncio
from app.database import AsyncSessionLocal
from app.models import Event, AuditLog, Action, Diagnosis
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as session:
        events = (await session.execute(select(Event))).scalars().all()
        logs = (await session.execute(select(AuditLog))).scalars().all()
        actions = (await session.execute(select(Action))).scalars().all()
        print(f"TOTAL_EVENTS: {len(events)}")
        print(f"TOTAL_AUDIT_LOGS: {len(logs)}")
        print(f"TOTAL_ACTIONS: {len(actions)}")
        for e in events:
            print(f"  - Event: {e.razorpay_payment_id} | Amount: ₹{e.amount_paise/100} | Error: {e.error_code} | Desc: {e.error_description}")

if __name__ == "__main__":
    asyncio.run(main())
