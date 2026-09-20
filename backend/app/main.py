from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError, ResponseValidationError
from fastapi.responses import JSONResponse

from app.database.config import Base, engine, SessionLocal
import app.models
from app.models.role import Role
from app.models.user import User

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-initialize all tables on fresh PostgreSQL or SQLite
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            # 1. Ensure Admin role exists
            admin_role = db.query(Role).filter(Role.name == "Admin").first()
            if not admin_role:
                admin_role = Role(
                    name="Admin",
                    description="Administrator with full system privileges",
                    permissions=["*"]
                )
                db.add(admin_role)
                db.commit()
                db.refresh(admin_role)

            # 2. Ensure Member role exists
            member_role = db.query(Role).filter(Role.name == "Member").first()
            if not member_role:
                member_role = Role(
                    name="Member",
                    description="Standard club member with view and request permissions",
                    permissions=["VIEW_LEDGER", "CREATE_INCOME", "SUBMIT_EXPENSE_REQUEST", "VIEW_DASHBOARD"]
                )
                db.add(member_role)
                db.commit()

            # 3. Ensure primary Super Admin exists
            admin_user = db.query(User).filter(User.email == "admin@yenova.com").first()
            if not admin_user:
                from app.utils.auth import get_password_hash
                admin_user = User(
                    name="Super Admin",
                    email="admin@yenova.com",
                    password_hash=get_password_hash("Admin@123"),
                    role_id=admin_role.id,
                    status="Active"
                )
                db.add(admin_user)
                db.commit()
        finally:
            db.close()
    except Exception as e:
        print("[Startup] Database initialization warning:", e)
    
    yield

app = FastAPI(
    title="FinTech API",
    description="Backend API for FinTech Application",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Supports local and cloud frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Type", "Content-Length"]
)

from app.routes import auth, users, profile, ledger, income, expenses, dashboard, opening_balance, projects, categories, mobile, analytics, reports, export, documents, repository, expense_requests, approvals, audit

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(profile.router)
app.include_router(ledger.router)
app.include_router(income.router)
app.include_router(expenses.router)
app.include_router(dashboard.router)
app.include_router(opening_balance.router)
app.include_router(projects.router)
app.include_router(categories.router)
app.include_router(mobile.router)
app.include_router(analytics.router)
app.include_router(reports.router)
app.include_router(export.router)
app.include_router(documents.router)
app.include_router(repository.router)
app.include_router(expense_requests.router)
app.include_router(approvals.router)
app.include_router(audit.router)

@app.exception_handler(ResponseValidationError)
async def validation_exception_handler(request, exc):
    print("RESPONSE VALIDATION ERROR:", exc.errors())
    return JSONResponse(status_code=500, content={"detail": exc.errors()})

@app.get("/")
@app.get("/healthz")
@app.get("/api/health")
def read_root():
    return {"message": "Welcome to FinTech API", "status": "online"}
