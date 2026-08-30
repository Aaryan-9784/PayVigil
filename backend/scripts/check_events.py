import asyncio
import sys
from app.database import AsyncSessionLocal as async_session
from app.models import Event, Action, AuditLog
from sqlalchemy import select

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

async def main():
    async with async_session() as session:
        events = (await session.execute(select(Event))).scalars().all()
        actions = (await session.execute(select(Action))).scalars().all()
        logs = (await session.execute(select(AuditLog))).scalars().all()
        print(f"TOTAL_EVENTS: {len(events)}")
        print(f"TOTAL_AUDIT_LOGS: {len(logs)}")
        print(f"TOTAL_ACTIONS: {len(actions)}")
        for e in events:
            print(f"  - Event: {e.razorpay_payment_id} | Amount: INR {e.amount_paise/100} | Error: {e.error_code}")
        for a in actions:
            print(f"  - Action: {a.action_type} | Status: {a.status} | Recovered: INR {a.amount_recovered_paise/100}")
        for l in logs:
            print(f"  - AuditLog: {l.summary}")

if __name__ == "__main__":
    asyncio.run(main())
