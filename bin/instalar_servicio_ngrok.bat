@echo off
echo ============================================
echo  Instalando ngrok como servicio de Windows
echo ============================================
echo.

REM Obtener la ruta completa del directorio actual
set "SCRIPT_DIR=%~dp0"
set "NGROK_PATH=%SCRIPT_DIR%ngrok.exe"
set "CONFIG_PATH=%SCRIPT_DIR%ngrok.yml"

echo [1/3] Instalando servicio ngrok...
"%NGROK_PATH%" service install --config "%CONFIG_PATH%"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: No se pudo instalar el servicio.
    echo Asegurate de ejecutar este script COMO ADMINISTRADOR.
    pause
    exit /b 1
)
echo [OK] Servicio instalado correctamente.
echo.

echo [2/3] Iniciando servicio ngrok...
"%NGROK_PATH%" service start
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: No se pudo iniciar el servicio.
    pause
    exit /b 1
)
echo [OK] Servicio iniciado.
echo.

echo [3/3] Verificando...
timeout /t 3 /nobreak >nul
"%NGROK_PATH%" service status
echo.

echo ============================================
echo  ngrok ahora inicia automaticamente con Windows
echo ============================================
echo.
echo Para ver la URL publica, abre en el navegador:
echo  http://localhost:4040
echo.
pause
