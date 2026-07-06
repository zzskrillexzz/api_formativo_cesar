@echo off
title Ez Logistics - Inicio Rapido
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo =============================================
echo    Ez Logistics - Inicio Rapido
echo =============================================
echo.

:: Detectar IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "IP=%%a"
    set "IP=!IP: =!"
    if not "!IP!"=="127.0.0.1" if "!MYIP!"=="" set "MYIP=!IP!"
)
if "%MYIP%"=="" set "MYIP=192.168.1.100"
echo   IP del PC: %MYIP%

:: Actualizar config.dart con la IP actual
set "CONFIG_FILE=%~dp0api_formatativo_cesar\lib\config.dart"
if exist "!CONFIG_FILE!" (
    powershell -Command "(Get-Content '!CONFIG_FILE!') -replace 'http://[0-9.]+:5000', 'http://%MYIP%:5000' | Set-Content '!CONFIG_FILE!'"
    echo   config.dart actualizado
)

:: Compilar APK
echo.
echo   Compilando APK...
set "FLUTTER_DIR=%~dp0api_formatativo_cesar"
cd /d "%FLUTTER_DIR%"
flutter build apk --release
if %ERRORLEVEL% NEQ 0 (
    echo   ERROR: Compilacion fallida
    pause & exit /b 1
)
echo   APK compilado

:: Instalar en celular
echo   Instalando en celular...
adb install -r -d build\app\outputs\flutter-apk\app-release.apk
if %ERRORLEVEL% EQU 0 (
    echo   APK instalado OK
) else (
    echo   AVISO: Conecta el celular con depuracion USB
)

:: Iniciar backend
echo.
echo   Iniciando servidor Backend en puerto 5000...
echo   =============================================
cd /d "%~dp0Backend"
python app.py
pause
