"""
Logger utilitario para todo el backend.
Configura salida a stdout con formato estructurado.
Uso:
    from utils.logger import get_logger
    log = get_logger(__name__)
    log.info("Servicio iniciado")
    log.error("Error al conectar: %s", str(e))
"""

import logging
import os
import sys

_LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO').upper()

# Formato: 2026-05-26 07:32:43,123 [INFO] app.module: mensaje
_FORMAT = logging.Formatter(
    '%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Handler de consola
_console_handler = logging.StreamHandler(sys.stdout)
_console_handler.setFormatter(_FORMAT)

# Logger raíz — configurar una sola vez
_root = logging.getLogger()
if not _root.handlers:
    _root.setLevel(_LOG_LEVEL)
    _root.addHandler(_console_handler)


def get_logger(name: str) -> logging.Logger:
    """Obtiene un logger para el módulo especificado."""
    return logging.getLogger(name)
