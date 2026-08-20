@echo off
title Masters Codex - The Campaign Forge Tool
cd /d "%~dp0"

echo ===================================================
echo   Iniciando Masters Codex - The Campaign Forge Tool
echo ===================================================
echo.

:: Abre o navegador padrao em http://localhost:3000 apos 2 segundos em segundo plano
start /B cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"

echo Servidor iniciando em http://localhost:3000 ...
echo Pressione Ctrl+C para encerrar o servidor.
echo.

call npm run dev
pause
