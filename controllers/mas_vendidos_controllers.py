from flask import jsonify
from services.mas_vendidos_service import listarMasVendidos
from utils.error_handler import safe_controller

@safe_controller
def cnlistadomasvendidos():
    return jsonify(listarMasVendidos()), 200