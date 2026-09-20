# Start Yenova FinTech Services
Write-Host "Starting Yenova FinTech Services..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; .\venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8001 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host "FinTech Backend:  http://127.0.0.1:8001" -ForegroundColor Green
Write-Host "FinTech Frontend: http://localhost:5173" -ForegroundColor Green
