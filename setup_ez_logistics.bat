@echo off
title Ez Logistics - Setup Universidad
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo =============================================
echo    Ez Logistics - Instalador Universidad
echo =============================================
echo.

:: ──────────────────────────────────────────────
:: Detectar Backend (rama test clonada junto a esta carpeta)
:: ──────────────────────────────────────────────
set "BACKEND_DIR=%~dp0..\"
if not exist "%BACKEND_DIR%\app.py" (
    set "BACKEND_DIR=%~dp0Backend"
)
if not exist "%BACKEND_DIR%\app.py" (
    set "BACKEND_DIR=%~dp0..\api_formatativo_cesar"
)
if not exist "%BACKEND_DIR%\app.py" (
    echo ERROR: No se encontro el Backend ^(app.py^).
    echo Asegurate de que el repo con rama test esta en ..\ ^(un nivel arriba^)
    pause & exit /b 1
)
echo   Backend encontrado en: %BACKEND_DIR%

:: ──────────────────────────────────────────────
:: 1. Verificar Git
:: ──────────────────────────────────────────────
echo [1/8] Verificando Git...
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Git no encontrado.
    pause & exit /b 1
)

:: ──────────────────────────────────────────────
:: 2. Actualizar ambos repos si usan git
:: ──────────────────────────────────────────────
echo [2/8] Actualizando repos...
git pull origin app_movil 2>nul
cd /d "%BACKEND_DIR%"
git pull origin test 2>nul
cd /d "%~dp0"
echo   OK

:: ──────────────────────────────────────────────
:: 3. Instalar dependencias Python
:: ──────────────────────────────────────────────
echo [3/8] Instalando dependencias Python...
if exist "%BACKEND_DIR%\requirements.txt" (
    pip install -r "%BACKEND_DIR%\requirements.txt" >nul 2>&1
    echo   Python OK
) else (
    echo   ADVERTENCIA: Backend no encontrado
)

:: ──────────────────────────────────────────────
:: 4. Crear .env si no existe
:: ──────────────────────────────────────────────
echo [4/8] Configurando .env...
if exist "%BACKEND_DIR%" (
    if not exist "%BACKEND_DIR%\.env" (
        (
            echo MYSQL_HOST=localhost
            echo MYSQL_USER=root
            echo MYSQL_PASSWORD=
            echo MYSQL_PORT=3307
            echo MYSQL_DB=db_drogueria_sandiego
            echo SECRET_KEY=ezlogistics2025
        ) > "%BACKEND_DIR%\.env"
        echo   .env creado. Editalo si tu MySQL tiene otros datos.
    ) else (
        echo   .env ya existe
    )
)

:: ──────────────────────────────────────────────
:: 5. Firewall (requiere admin)
:: ──────────────────────────────────────────────
echo [5/8] Configurando Firewall y Red...
powershell -Command "Get-NetConnectionProfile | Set-NetConnectionProfile -NetworkCategory Private" >nul 2>&1
netsh advfirewall firewall add rule name="Flask 5000" dir=in action=allow protocol=TCP localport=5000 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   Puerto 5000 abierto
) else (
    echo   AVISO: Ejecuta como Administrador para abrir el firewall
)

:: ──────────────────────────────────────────────
:: 6. Detectar IP
:: ──────────────────────────────────────────────
echo [6/8] Detectando IP...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "IP=%%a"
    set "IP=!IP: =!"
    if not "!IP!"=="127.0.0.1" if "!MYIP!"=="" set "MYIP=!IP!"
)
if "%MYIP%"=="" set "MYIP=192.168.1.100"
echo   IP: %MYIP%

:: ──────────────────────────────────────────────
:: 7. Compilar e instalar APK
:: ──────────────────────────────────────────────
echo [7/8] Compilando APK...

:: Actualizar IP
set "CONFIG_FILE=%~dp0lib\config.dart"
if exist "!CONFIG_FILE!" (
    powershell -Command "(Get-Content '!CONFIG_FILE!') -replace 'http://[0-9.]+:5000', 'http://%MYIP%:5000' | Set-Content '!CONFIG_FILE!'"
    echo   IP actualizada en config.dart
)

flutter pub get >nul 2>&1
echo   Compilando APK release ^(~2 min^)...
flutter build apk --release
if %ERRORLEVEL% NEQ 0 (
    echo   ERROR: Fallo la compilacion
    pause & exit /b 1
)
echo   APK compilado

:: Instalar
adb install -r -d build\app\outputs\flutter-apk\app-release.apk >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   APK instalado en el celular
) else (
    echo   AVISO: Conecta el celular USB con depuracion activada
    echo   Comando manual: adb install -r -d build\app\outputs\flutter-apk\app-release.apk
)

:: ──────────────────────────────────────────────
:: 8. Iniciar Backend
:: ──────────────────────────────────────────────
echo [8/8] Iniciando Backend...
if exist "%BACKEND_DIR%\app.py" (
    echo.
    echo   =============================================
    echo    Backend: http://%MYIP%:5000
    echo    Celular: conectate a la misma red WiFi
    echo             abre http://%MYIP%:5000/login para probar
    echo   =============================================
    echo    Presiona Ctrl+C para detener
    echo.
    cd /d "%BACKEND_DIR%"
    python app.py
) else (
    echo.
    echo =============================================
    echo    SETUP COMPLETO
    echo =============================================
    echo   IP: %MYIP%
    echo   Para iniciar backend: cd Backend ^& python app.py
    echo.
    pause
)
