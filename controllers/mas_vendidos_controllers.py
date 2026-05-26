from flask import jsonify, request
from services.mas_vendidos_service import listarMasVendidos
from utils.error_handler import safe_controller

@safe_controller
def cnlistadomasvendidos():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 50, type=int)
    q = request.args.get('q', None)
    order_by = request.args.get('order_by', None)
    filtros = {k: v for k, v in request.args.items() if k not in ('page', 'limit', 'q', 'order_by')}
    return jsonify(listarMasVendidos(page=page, limit=limit, q=q, order_by=order_by, **filtros)), 200
