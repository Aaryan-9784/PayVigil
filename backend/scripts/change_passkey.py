"""
CLI tool to securely update Admin or Customer Support passkeys in the database.
Uses masked input (no characters echoed to the terminal).
"""

import sys
import os
import getpass
import asyncio

# Add backend root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.database import AsyncSessionLocal, init_db
from app.models import User
from app.security import hash_password

async def update_passkey():
    print("=" * 60)
    print("🔒 AI Revenue Recovery Agent - Passkey Management CLI")
    print("=" * 60)
    
    # Initialize DB tables if not already present
    await init_db()
    
    role = input("\nSelect account to update [admin / support] (default: admin): ").strip().lower()
    if not role:
        role = "admin"
        
    if role not in ("admin", "support"):
        print("❌ Error: Invalid role. Must be 'admin' or 'support'.")
        return

    new_passkey = getpass.getpass(f"\nEnter new passkey for '{role}': ").strip()
    if len(new_passkey) < 6:
        print("❌ Error: Passkey must be at least 6 characters.")
        return

    confirm_passkey = getpass.getpass("Confirm new passkey: ").strip()
    if new_passkey != confirm_passkey:
        print("❌ Error: Passkeys do not match.")
        return

    async with AsyncSessionLocal() as session:
        stmt = select(User).where(User.role == role)
        res = await session.execute(stmt)
        user = res.scalars().first()
        
        if not user:
            # Create user if not exists
            user = User(
                username="Administrator" if role == "admin" else "Support Agent",
                email="admin@razorpay.internal" if role == "admin" else "support@razorpay.com",
                role=role,
                password_hash=hash_password(new_passkey),
                is_active=True
            )
            session.add(user)
        else:
            user.password_hash = hash_password(new_passkey)
            
        await session.commit()

    print(f"\n✅ Success: Passkey for '{role}' has been hashed (PBKDF2-SHA256) and saved in database!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(update_passkey())
