@echo off
cd /d "%~dp0"
set NGROK=%~dp0ngrok.exe

echo ============================================
echo  RECONFIGURACION COMPLETA de ngrok SERVICE
echo ============================================
echo.

echo [Paso 1/5] Deteniendo servicio anterior...
sc stop ngrok >nul 2>&1
timeout /t 2 /nobreak >nul
echo [OK]

echo [Paso 2/5] Matando procesos ngrok residuales...
taskkill /F /IM ngrok.exe >nul 2>&1
timeout /t 1 /nobreak >nul
echo [OK]

echo [Paso 3/5] Desinstalando servicio anterior...
"%NGROK%" service uninstall >nul 2>&1
timeout /t 1 /nobreak >nul
echo [OK]

echo [Paso 4/5] Instalando servicio NUEVO con config corregida...
"%NGROK%" service install --config "%~dp0ngrok.yml"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Fallo la instalacion
    pause
    exit /b 1
)
echo [OK - Servicio instalado]

echo [Paso 5/5] Iniciando servicio...
sc start ngrok
timeout /t 3 /nobreak >nul
sc query ngrok | findstr "RUNNING"
if %ERRORLEVEL% EQU 0 (
    echo ✅ SERVICIO NGROK CORRIENDO CORRECTAMENTE
) else (
    echo ⚠️ El servicio no arranco. Revisando logs...
    type "C:\Users\JGG\AppData\Local\ngrok\ngrok-service.log" 2>nul
)

echo.
echo ============================================
echo  VERIFICACION
echo ============================================
echo.
echo Abre en tu navegador: http://localhost:4040
echo.
pause
