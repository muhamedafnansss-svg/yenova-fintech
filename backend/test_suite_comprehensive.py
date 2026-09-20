import urllib.request
import urllib.error
import time
import json
import sys

BASE_URL = "http://127.0.0.1:8001"

class APITestRunner:
    def __init__(self):
        self.results = []
        self.token = None
        self.user_id = None
        self.created_category_id = None
        self.created_project_id = None
        self.created_expense_request_id = None

    def request(self, path, method="GET", data=None, headers=None):
        if headers is None:
            headers = {}
        url = f"{BASE_URL}{path}"
        req_data = json.dumps(data).encode("utf-8") if data is not None else None
        req = urllib.request.Request(url, data=req_data, method=method)
        req.add_header("Content-Type", "application/json")
        for k, v in headers.items():
            req.add_header(k, v)
        
        t0 = time.time()
        try:
            with urllib.request.urlopen(req) as resp:
                status_code = resp.status
                body = resp.read().decode("utf-8")
                latency = (time.time() - t0) * 1000
                parsed = json.loads(body) if body else {}
                return status_code, parsed, latency, ""
        except urllib.error.HTTPError as e:
            latency = (time.time() - t0) * 1000
            err_body = e.read().decode("utf-8")
            parsed = {}
            try:
                parsed = json.loads(err_body)
            except Exception:
                pass
            return e.code, parsed, latency, err_body
        except Exception as e:
            latency = (time.time() - t0) * 1000
            return 0, {}, latency, str(e)

    def record(self, endpoint, method, status_code, expected_status, passed, latency_ms, notes=""):
        res = {
            "endpoint": endpoint,
            "method": method,
            "status_code": status_code,
            "expected_status": expected_status,
            "passed": passed,
            "latency_ms": round(latency_ms, 2),
            "notes": notes
        }
        self.results.append(res)
        status_str = "PASS" if passed else "FAIL"
        print(f"[{status_str}] {method:<6} {endpoint:<38} -> {status_code:<3} ({res['latency_ms']:>6.2f}ms) {notes}")

    def run(self):
        print("="*80)
        print("Yenova FinTech: Comprehensive API Automated Test Suite")
        print("="*80)

        # 1. Root & Health
        code, body, lat, err = self.request("/")
        passed = (code == 200 and "message" in body)
        self.record("/", "GET", code, 200, passed, lat)

        # 2. Authentication: Valid Admin Login
        code, body, lat, err = self.request("/api/auth/login", method="POST", data={"email": "admin@yenova.com", "password": "Admin@123"})
        passed = (code == 200 and "access_token" in body)
        if passed:
            self.token = body["access_token"]
        self.record("/api/auth/login", "POST", code, 200, passed, lat, "Valid credentials")

        # 3. Authentication: Invalid Login
        code, body, lat, err = self.request("/api/auth/login", method="POST", data={"email": "admin@yenova.com", "password": "WrongPassword"})
        passed = (code == 401)
        self.record("/api/auth/login (Invalid)", "POST", code, 401, passed, lat, "Unauthorized rejection check")

        if not self.token:
            print("FATAL: Could not obtain JWT token. Aborting authenticated tests.")
            return self.summary()

        headers = {"Authorization": f"Bearer {self.token}"}

        # 4. Auth Me
        code, body, lat, err = self.request("/api/auth/me", headers=headers)
        passed = (code == 200 and body.get("email") == "admin@yenova.com")
        if passed:
            self.user_id = body.get("id")
        self.record("/api/auth/me", "GET", code, 200, passed, lat, f"User: {body.get('name')}")

        # 5. Users List
        code, body, lat, err = self.request("/api/users", headers=headers)
        passed = (code == 200 and isinstance(body, list))
        self.record("/api/users", "GET", code, 200, passed, lat, f"Total Users: {len(body) if passed else 0}")

        # 6. Profile
        code, body, lat, err = self.request("/api/profile/", headers=headers)
        passed = (code == 200)
        self.record("/api/profile/", "GET", code, 200, passed, lat)

        # 7. Dashboard Summary
        code, body, lat, err = self.request("/api/dashboard/summary", headers=headers)
        passed = (code == 200 and "current_balance" in body)
        self.record("/api/dashboard/summary", "GET", code, 200, passed, lat, f"Balance: {body.get('current_balance') if passed else 'N/A'}")

        # 8. Dashboard Recent Transactions
        code, body, lat, err = self.request("/api/dashboard/recent-transactions", headers=headers)
        passed = (code == 200 and isinstance(body, list))
        self.record("/api/dashboard/recent-transactions", "GET", code, 200, passed, lat)

        # 9. Ledger List
        code, body, lat, err = self.request("/api/ledger", headers=headers)
        passed = (code == 200)
        self.record("/api/ledger", "GET", code, 200, passed, lat)

        # 10. Categories: Create and List
        cat_name = f"Logistics_{int(time.time())}"
        code, body, lat, err = self.request("/api/categories", method="POST", data={"name": cat_name, "type": "Expense", "description": "Automated test category"}, headers=headers)
        passed = (code in [200, 201] and "id" in body)
        if passed:
            self.created_category_id = body["id"]
        self.record("/api/categories", "POST", code, 200, passed, lat, f"Created ID: {self.created_category_id}")

        code, body, lat, err = self.request("/api/categories", headers=headers)
        passed = (code == 200 and any(c.get("name") == cat_name for c in body))
        self.record("/api/categories", "GET", code, 200, passed, lat)

        # 11. Projects: Create, List & Summary
        timestamp = int(time.time())
        proj_code = f"PRJ-{timestamp % 100000}"
        code, body, lat, err = self.request("/api/projects", method="POST", data={
            "name": f"Robotics Expo {timestamp}",
            "project_code": proj_code,
            "description": "Annual Club Robotics Exhibition",
            "venue": "Campus Main Arena",
            "allocated_budget": 85000.0,
            "status": "Active"
        }, headers=headers)
        passed = (code in [200, 201] and "id" in body)
        if passed:
            self.created_project_id = body["id"]
        self.record("/api/projects", "POST", code, 200, passed, lat, f"Code: {proj_code}")

        if self.created_project_id:
            code, body, lat, err = self.request(f"/api/projects/{self.created_project_id}/summary", headers=headers)
            passed = (code == 200 and "allocated_budget" in body)
            self.record(f"/api/projects/{self.created_project_id}/summary", "GET", code, 200, passed, lat)

        # 12. Income Creation
        code, body, lat, err = self.request("/api/income", method="POST", data={
            "type": "Income",
            "amount": 40000.0,
            "description": "Gold Tier Sponsorship",
            "category_id": None,
            "project_id": self.created_project_id,
            "payment_method": "Wire Transfer",
            "reference_number": f"WIRE-{timestamp}"
        }, headers=headers)
        passed = (code in [200, 201] and "transaction_number" in body)
        self.record("/api/income", "POST", code, 200, passed, lat)

        # 13. Expense Creation
        code, body, lat, err = self.request("/api/expenses", method="POST", data={
            "type": "Expense",
            "amount": 15000.0,
            "description": "Audio & Visual Equipment Hire",
            "category_id": self.created_category_id,
            "project_id": self.created_project_id,
            "payment_method": "Card",
            "reference_number": f"INV-{timestamp}"
        }, headers=headers)
        passed = (code in [200, 201] and "transaction_number" in body)
        self.record("/api/expenses", "POST", code, 200, passed, lat)

        # 14. Expense Request Creation
        code, body, lat, err = self.request("/api/expense-requests", method="POST", data={
            "category_id": self.created_category_id,
            "event_id": self.created_project_id,
            "amount": 2200.0,
            "description": "Participant welcome refreshment kits"
        }, headers=headers)
        passed = (code in [200, 201] and "id" in body)
        if passed:
            self.created_expense_request_id = body["id"]
        self.record("/api/expense-requests", "POST", code, 200, passed, lat, f"Created ID: {self.created_expense_request_id}")

        # 15. Approvals Flow
        code, body, lat, err = self.request("/api/approvals/pending", headers=headers)
        passed = (code == 200 and isinstance(body, list))
        self.record("/api/approvals/pending", "GET", code, 200, passed, lat, f"Pending: {len(body) if passed else 0}")

        if self.created_expense_request_id:
            code, body, lat, err = self.request(f"/api/approvals/{self.created_expense_request_id}/approve", method="POST", data={"comments": "Approved for purchase"}, headers=headers)
            passed = (code in [200, 201])
            self.record(f"/api/approvals/.../approve", "POST", code, 200, passed, lat)

        # 16. Analytics Endpoints
        for ep in ["/api/analytics/dashboard", "/api/analytics/categories", "/api/analytics/events", "/api/analytics/cashflow"]:
            code, body, lat, err = self.request(ep, headers=headers)
            passed = (code == 200)
            self.record(ep, "GET", code, 200, passed, lat)

        # 17. Reports Endpoints
        for ep in ["/api/reports/daily", "/api/reports/weekly", "/api/reports/monthly", "/api/reports/yearly"]:
            code, body, lat, err = self.request(ep, headers=headers)
            passed = (code == 200)
            self.record(ep, "GET", code, 200, passed, lat)

        # 18. Repository Stats & Documents
        code, body, lat, err = self.request("/api/repository/stats", headers=headers)
        passed = (code == 200 and "storage_used" in body)
        self.record("/api/repository/stats", "GET", code, 200, passed, lat)

        code, body, lat, err = self.request("/api/documents", headers=headers)
        passed = (code == 200 and isinstance(body, list))
        self.record("/api/documents", "GET", code, 200, passed, lat)

        # 19. Audit Trail
        code, body, lat, err = self.request("/api/audit", headers=headers)
        passed = (code == 200 and isinstance(body, list))
        self.record("/api/audit", "GET", code, 200, passed, lat, f"Logs: {len(body) if passed else 0}")

        # 20. Mobile Dashboard
        code, body, lat, err = self.request("/api/mobile/dashboard", headers=headers)
        passed = (code == 200)
        self.record("/api/mobile/dashboard", "GET", code, 200, passed, lat)

        # 21. Logout
        code, body, lat, err = self.request("/api/auth/logout", method="POST", headers=headers)
        passed = (code == 200)
        self.record("/api/auth/logout", "POST", code, 200, passed, lat)

        return self.summary()

    def summary(self):
        total = len(self.results)
        passed = sum(1 for r in self.results if r["passed"])
        failed = total - passed
        avg_latency = sum(r["latency_ms"] for r in self.results) / total if total else 0
        print("="*80)
        print(f"API TEST SUMMARY: Total={total} | Passed={passed} | Failed={failed} | Avg Latency={round(avg_latency, 2)}ms")
        print("="*80)
        with open("test_results.json", "w") as f:
            json.dump({"total": total, "passed": passed, "failed": failed, "avg_latency": avg_latency, "results": self.results}, f, indent=2)
        return passed, failed

if __name__ == "__main__":
    runner = APITestRunner()
    p, f = runner.run()
    sys.exit(0 if f == 0 else 1)
