import urllib.request
import json

print("Logging in...")
data = json.dumps({"email": "admin@fintech.com", "password": "admin123"}).encode("utf-8")
req = urllib.request.Request("http://localhost:8001/api/auth/login", data=data)
req.add_header("Content-Type", "application/json")
try:
    with urllib.request.urlopen(req) as response:
        resp_data = json.loads(response.read().decode())
        token = resp_data["access_token"]
        print("Token:", token)
        
        print("Fetching ledger...")
        req2 = urllib.request.Request("http://localhost:8001/api/ledger")
        req2.add_header("Authorization", f"Bearer {token}")
        try:
            with urllib.request.urlopen(req2) as resp2:
                print("Status:", resp2.status)
                print("Response:", resp2.read().decode())
        except urllib.error.HTTPError as e:
            print("HTTP Error:", e.code)
            print("Body:", e.read().decode())
        except Exception as e:
            print("Error fetching ledger:", e)
except urllib.error.HTTPError as e:
    print("Login HTTP Error:", e.code)
    print("Body:", e.read().decode())
except Exception as e:
    print("Login failed:", e)
