@echo off
echo ======================================
echo   Wireframe Generator - Full Stack
echo ======================================
echo.

REM Check for .env
if not exist "backend\.env" (
  copy "backend\.env.example" "backend\.env"
  echo.
  echo ACTION REQUIRED:
  echo   1. Open backend\.env
  echo   2. Replace 'your_openrouter_api_key_here' with your real key
  echo   3. Get a free key at https://openrouter.ai
  echo   4. Run this script again
  echo.
  pause
  exit /b 1
)

REM Start backend
echo Starting backend...
cd backend
if not exist "venv\" (
  python -m venv venv
)
call venv\Scripts\activate
pip install -q -r requirements.txt pydantic-settings
start "WireGen Backend" cmd /k "uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
cd ..

REM Wait a moment
timeout /t 3 /nobreak > nul

REM Start frontend
echo Starting frontend...
cd frontend
if not exist "node_modules\" (
  npm install
)
start "WireGen Frontend" cmd /k "npm start"
cd ..

echo.
echo Both services are starting...
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo.
pause
