@echo off
chcp 65001 > nul
title Despacho Ventas Especiales - Iniciar Sistema

echo =====================================================================
echo       DESPACHO VENTAS ESPECIALES - SAP VL06O CONTROL CENTER
echo =====================================================================
echo.
echo [1/3] Iniciando Servidor Backend (FastAPI en puerto 3115)...
start "Backend - Despacho Ventas Especiales" /min cmd /c "cd /d %~dp0backend && python -m uvicorn main:app --host 127.0.0.1 --port 3115"

echo [2/3] Iniciando Servidor Frontend (Vite en puerto 3015)...
start "Frontend - Despacho Ventas Especiales" /min cmd /c "cd /d %~dp0frontend && npm.cmd run dev"

echo [3/3] Esperando arranque de servicios...
timeout /t 3 /nobreak > nul

echo.
echo ✅ Sistema iniciado con éxito.
echo Abriendo la aplicación en tu navegador: http://localhost:3015
start http://localhost:3015

echo.
echo Presiona cualquier tecla para cerrar esta ventana (los servicios continuarán en segundo plano).
pause > nul
