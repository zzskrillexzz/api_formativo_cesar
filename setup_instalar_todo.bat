@echo off
title SAN DIEGO DISTRIBUIDORA - Setup Universitario
chcp 65001 >nul
cls

:: ─────────────────────────────────────────────
::  🏪 SAN DIEGO DISTRIBUIDORA
::  Setup rapido para PC de presentacion
::  Ejecutar DESDE la carpeta Backend/
:: ─────────────────────────────────────────────

echo ============================================
echo   🏪 SAN DIEGO DISTRIBUIDORA
echo   🚀 Setup Rapido para Presentacion
echo ============================================
echo.

:: ─── PASO 1: Verificar Python ───
echo [1/6] Verificando Python...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python NO INSTALADO
    echo.
    echo Para instalar Python:
    echo   1. Ve a https://www.python.org/downloads/
    echo   2. Descarga Python 3.10 o superior
    echo   3. Al instalar, MARCA "Add Python to PATH"
    echo   4. Vuelve a ejecutar este script
    echo.
    pause
    exit /b 1
)
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VER=%%i
echo ✅ Python %PYTHON_VER% detectado
echo.

:: ─── PASO 2: Crear archivo .env (si no existe) ───
echo [2/6] Creando archivo de configuracion...
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo ✅ .env creado desde .env.example
        echo ⚠️  Revisa .env y ajusta MYSQL_PORT si tu XAMPP usa otro puerto
    ) else (
        echo ⚠️  No hay .env.example. Crea .env manualmente
    )
) else (
    echo ✅ .env ya existe
)
echo.

:: ─── PASO 3: Crear entorno virtual ───
echo [3/6] Creando entorno virtual...
if not exist "venv" (
    python -m venv venv
    echo ✅ Entorno virtual creado
) else (
    echo ✅ Entorno virtual ya existe
)
echo.

:: ─── PASO 4: Instalar dependencias ───
echo [4/6] Instalando dependencias del Backend...
call venv\Scripts\pip install -r requirements.txt --quiet
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error instalando dependencias
    pause
    exit /b 1
)
echo ✅ Dependencias instaladas
echo.

:: ─── PASO 5: Verificar MySQL ───
echo [5/6] Verificando Base de Datos...
echo.
echo ╔════════════════════════════════════════════╗
echo ║  IMPORTANTE: Configuracion de Base Datos   ║
echo ╠════════════════════════════════════════════╣
echo ║  1. Abre XAMPP Control Panel               ║
echo ║  2. Dale START a MySQL                     ║
echo ║  3. Crea BD: db_drogueria_sandiego         ║
echo ║  4. Importa: BD_Distribuidora_SANDIEGO.sql ║
echo ╚════════════════════════════════════════════╝
echo.
echo 📌 Si tu XAMPP usa puerto distinto a 3307:
echo    Edita .env y cambia MYSQL_PORT
echo.
set /p CONTINUAR="¿Ya configuraste MySQL? (s/n): "
if /i not "%CONTINUAR%"=="s" (
    echo.
    echo ⚠️  Deteniendo setup. Cuando tengas MySQL listo,
    echo    vuelve a ejecutar este script.
    pause
    exit /b 1
)
echo ✅ Base de datos lista
echo.

:: ─── PASO 6: Iniciar ───
echo [6/6] ¡Todo listo! Iniciando sistema...
echo.
echo ============================================
echo   🚀 INICIANDO EL SISTEMA
echo ============================================
echo.
echo 📋 Abriendo navegador en http://localhost:5000
echo.

:: Abrir navegador
start http://localhost:5000

:: Iniciar Flask
call venv\Scripts\python app.py

pause
