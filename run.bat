@echo off
echo Starting Yenova FinTech Backend and Frontend...

start "FinTech Backend" cmd /k "cd /d %~dp0backend && .\venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8001 --reload"
start "FinTech Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Backend started at http://127.0.0.1:8001
echo Frontend started at http://localhost:5173
