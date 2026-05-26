"""
Decorador para manejo de errores en controladores.
Reemplaza el patrón repetitivo de try/except + print(traceback) en cada controlador.
Uso:
    from utils.error_handler import safe_controller

    @safe_controller
    def cnListarAlgo():
        # ... codigo sin try/except
        return jsonify(datos), 200
"""

import functools
import traceback
from flask import jsonify
from utils.logger import get_logger

log = get_logger(__name__)


def safe_controller(f):
    """
    Envuelve un controlador Flask para capturar excepciones,
    loguearlas y retornar JSON 500.
    """
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            log.error("Error en %s: %s", f.__name__, str(e), exc_info=True)
            return jsonify({"error": str(e)}), 500
    return wrapper
