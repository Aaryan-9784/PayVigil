import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import AsyncSessionLocal, init_db
from app.models import User
from app.security import hash_password, verify_password, decode_jwt_token
from sqlalchemy import select

@pytest.fixture(autouse=True)
async def setup_test_users():
    await init_db()
    async with AsyncSessionLocal() as session:
        # Seed or reset test admin user
        res = await session.execute(select(User).where(User.username == "TestAdmin"))
        admin_u = res.scalars().first()
        if not admin_u:
            admin_u = User(
                username="TestAdmin",
                email="aaryanpatel9784@gmail.com",
                role="admin",
                password_hash=hash_password("AdminSecret@123"),
                is_active=True
            )
            session.add(admin_u)
        else:
            admin_u.email = "aaryanpatel9784@gmail.com"
            admin_u.password_hash = hash_password("AdminSecret@123")
            admin_u.reset_token = None
            admin_u.reset_token_expires_at = None

        # Seed or reset test support user
        res2 = await session.execute(select(User).where(User.username == "TestSupport"))
        support_u = res2.scalars().first()
        if not support_u:
            support_u = User(
                username="TestSupport",
                email="test_support@razorpay.com",
                role="support",
                password_hash=hash_password("SupportSecret@123"),
                is_active=True
            )
            session.add(support_u)
        else:
            support_u.password_hash = hash_password("SupportSecret@123")
            support_u.reset_token = None
            support_u.reset_token_expires_at = None

        await session.commit()
    yield

@pytest.mark.asyncio
async def test_auth_login_admin_success():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/auth/login", json={
            "username": "TestAdmin",
            "passkey": "AdminSecret@123",
            "role": "admin"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["role"] == "admin"
        assert "token" in data
        
        # Verify JWT payload
        jwt_payload = decode_jwt_token(data["token"])
        assert jwt_payload is not None
        assert jwt_payload["role"] == "admin"

@pytest.mark.asyncio
async def test_auth_login_invalid_password_returns_401():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/auth/login", json={
            "username": "TestAdmin",
            "passkey": "WrongPassword@999",
            "role": "admin"
        })
        assert res.status_code == 401

@pytest.mark.asyncio
async def test_auth_get_me_profile():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Login
        login_res = await client.post("/api/auth/login", json={
            "username": "TestAdmin",
            "passkey": "AdminSecret@123",
            "role": "admin"
        })
        token = login_res.json()["token"]

        # 2. Query /api/auth/me with Bearer token
        me_res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200
        data = me_res.json()
        assert data["authenticated"] is True
        assert data["user"]["role"] == "admin"
        assert data["permissions"]["can_manage_passkeys"] is True

@pytest.mark.asyncio
async def test_forgot_password_flow_end_to_end():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Step 1: Request reset code
        forgot_res = await client.post("/api/auth/forgot-password", json={
            "identifier": "TestAdmin"
        })
        assert forgot_res.status_code == 200
        data = forgot_res.json()
        assert data["success"] is True
        otp_code = data["dev_otp"]
        assert len(otp_code) == 6

        # Step 2: Verify reset code
        verify_res = await client.post("/api/auth/verify-reset-code", json={
            "identifier": "TestAdmin",
            "code": otp_code
        })
        assert verify_res.status_code == 200
        assert verify_res.json()["verified"] is True

        # Step 3: Set new password
        reset_res = await client.post("/api/auth/reset-password", json={
            "identifier": "TestAdmin",
            "code": otp_code,
            "new_passkey": "BrandNewAdminPass@2026"
        })
        assert reset_res.status_code == 200
        assert reset_res.json()["success"] is True

        # Step 4: Verify login with NEW password
        login_new = await client.post("/api/auth/login", json={
            "username": "TestAdmin",
            "passkey": "BrandNewAdminPass@2026",
            "role": "admin"
        })
        assert login_new.status_code == 200
        assert login_new.json()["success"] is True

@pytest.mark.asyncio
async def test_auth_signup_and_email_password_login():
    import uuid
    dynamic_email = f"signup_test_{uuid.uuid4().hex[:8]}@razorpay-demo.internal"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Sign up a new user with email & password
        signup_res = await client.post("/api/auth/signup", json={
            "name": "Priya Sharma",
            "email": dynamic_email,
            "password": "SecurePassword@2026",
            "role": "support"
        })
        assert signup_res.status_code == 200
        signup_data = signup_res.json()
        assert signup_data["success"] is True
        assert signup_data["role"] == "support"
        assert "token" in signup_data

        # 2. Login using the newly created Email & Password
        login_res = await client.post("/api/auth/login", json={
            "email": dynamic_email,
            "password": "SecurePassword@2026"
        })
        assert login_res.status_code == 200
        login_data = login_res.json()
        assert login_data["success"] is True
        assert login_data["email"] == dynamic_email
        assert login_data["role"] == "support"
        assert "token" in login_data

@pytest.mark.asyncio
async def test_auth_signup_duplicate_email_fails():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Attempt registering an existing email (aaryanpatel9784@gmail.com)
        dup_res = await client.post("/api/auth/signup", json={
            "name": "Duplicate Admin",
            "email": "aaryanpatel9784@gmail.com",
            "password": "Password@123",
            "role": "admin"
        })
        assert dup_res.status_code == 400
        assert "already exists" in dup_res.json()["detail"].lower()
