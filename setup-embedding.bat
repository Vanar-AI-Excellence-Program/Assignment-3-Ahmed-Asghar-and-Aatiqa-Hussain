@echo off
echo Setting up Embedding Service with Context7 integration...

echo.
echo Option 1: Use Docker (Recommended - avoids compilation issues)
echo docker-compose -f docker-compose.full.yml up embedding -d

echo.
echo Option 2: Install locally (may have dependency issues on Windows)
echo cd embedding-service
echo pip install -r requirements.txt
echo python app.py

echo.
echo Option 3: Use pre-compiled wheels
echo cd embedding-service
echo install.bat

echo.
echo The embedding service will be available at http://localhost:8000
echo Health check: http://localhost:8000/health

pause
