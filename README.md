# FinTech

## Overview
This is a comprehensive financial management platform designed for student clubs. 

## Phase 1: Authentication & Infrastructure (Completed)
This phase implements the core infrastructure of the FinTech application, providing robust authentication, role-based access control (RBAC), and a scalable React frontend.

### Tech Stack
*   **Backend:** FastAPI, Python, PostgreSQL/SQLite, SQLAlchemy, Alembic, Passlib (bcrypt), PyJWT.
*   **Frontend:** React (Vite), React Router, Context API, Axios, Vanilla CSS with CSS Variables.

### Features
*   **Secure Authentication:** JWT-based login, secure password hashing, and session management.
*   **Role-Based Access Control:** Pre-configured roles (Admin, Treasurer, President, Faculty, Member) restricting access to APIs and frontend routes.
*   **User Management:** Admins can view and manage system users.
*   **Profile Management:** Users can update their passwords and view their profile.
*   **Dashboard Shell:** A responsive and dynamic layout ready for Phase 2 financial modules.

### Getting Started

#### Prerequisites
*   Node.js (v18+)
*   Python (v3.10+)

#### Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    # Windows
    .\venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Run database migrations (SQLite by default):
    ```bash
    alembic upgrade head
    ```
5.  Start the FastAPI server:
    ```bash
    uvicorn app.main:app --reload --port 8001
    ```

#### Frontend Setup
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite development server:
    ```bash
    npm run dev
    ```

### Default Credentials
Upon running migrations, an initial Admin user is seeded:
*   **Email:** `admin@yenova.com`
*   **Password:** `Admin@123`
