"""
Logger utilitario para todo el backend.
Configura salida a archivo (rotación) y a stdout con formato estructurado.
Uso:
    from utils.logger import get_logger
    log = get_logger(__name__)
    log.info("Servicio iniciado")
    log.error("Error al conectar: %s", str(e))
"""

import logging
import os
import sys
from logging.handlers import RotatingFileHandler

_LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs')
_LOG_FILE = os.path.join(_LOG_DIR, 'app.log')
_LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO').upper()
_MAX_BYTES = 5 * 1024 * 1024   # 5 MB por archivo
_BACKUP_COUNT = 3               # mantener 3 rotaciones

# Crear directorio de logs si no existe
os.makedirs(_LOG_DIR, exist_ok=True)

# Formato: 2026-05-26 07:32:43,123 [INFO] app.module: mensaje
_FORMAT = logging.Formatter(
    '%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Handler de archivo (rotación)
_file_handler = RotatingFileHandler(
    _LOG_FILE, maxBytes=_MAX_BYTES, backupCount=_BACKUP_COUNT, encoding='utf-8'
)
_file_handler.setFormatter(_FORMAT)

# Handler de consola
_console_handler = logging.StreamHandler(sys.stdout)
_console_handler.setFormatter(_FORMAT)

# Logger raíz — configurar una sola vez
_root = logging.getLogger()
if not _root.handlers:
    _root.setLevel(_LOG_LEVEL)
    _root.addHandler(_file_handler)
    _root.addHandler(_console_handler)


def get_logger(name: str) -> logging.Logger:
    """Obtiene un logger para el módulo especificado."""
    return logging.getLogger(name)
