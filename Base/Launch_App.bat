@echo off
setlocal

rem Always run from this folder
cd /d "%~dp0"

rem Prefer repo-local venv if present
if exist ".venv\Scripts\pythonw.exe" (
  set "PY_EXE=.venv\Scripts\pythonw.exe"
) else if exist ".venv\Scripts\python.exe" (
  set "PY_EXE=.venv\Scripts\python.exe"
) else (
  set "PY_EXE=python"
)

%PY_EXE% "%~dp0run_app.py"

if errorlevel 1 (
  echo.
  echo [ERROR] Failed to launch app-semifinal.
  echo.
  echo If this is the first run, install dependencies:
  echo   python -m pip install -r requirements.txt
  echo.
  pause
)

endlocal
