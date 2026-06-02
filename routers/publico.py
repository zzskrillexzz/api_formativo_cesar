from flask import Blueprint, current_app, jsonify, request
from controllers.pedidos_controllers import cnconfirmarentrega
import time
from collections import defaultdict

publico_bp = Blueprint('publico', __name__)

# ── Rate limiter simple en memoria (5 req/min por IP) ──
_rate_limit_store: dict[str, list[float]] = defaultdict(list)
_RATE_LIMIT_MAX = 5
_RATE_LIMIT_WINDOW = 60  # segundos

def _check_rate_limit(ip: str) -> bool:
    ahora = time.time()
    ventana = [t for t in _rate_limit_store[ip] if ahora - t < _RATE_LIMIT_WINDOW]
    _rate_limit_store[ip] = ventana
    if len(ventana) >= _RATE_LIMIT_MAX:
        return False
    _rate_limit_store[ip].append(ahora)
    # Limpiar IPs expiradas periódicamente
    if len(_rate_limit_store) > 1000:
        for k in list(_rate_limit_store.keys()):
            _rate_limit_store[k] = [t for t in _rate_limit_store[k] if ahora - t < _RATE_LIMIT_WINDOW]
            if not _rate_limit_store[k]:
                del _rate_limit_store[k]
    return True


@publico_bp.route('/')
def index():
    return jsonify({"mensaje": "API San Diego Distribuidora - Sistema de Pedidos", "estado": "online"}), 200

@publico_bp.route('/health')
def health_check():
    """Verifica que MySQL (XAMPP) esté accesible."""
    try:
        c = current_app.mysql.connection.cursor()
        c.execute("SELECT 1")
        c.close()
        return jsonify({"db": "conectada", "estado": "online"}), 200
    except Exception as e:
        return jsonify({"db": "desconectada", "error": str(e), "estado": "degradado"}), 503

@publico_bp.route('/verificar/<pedido_id>')
def verificar_estado(pedido_id):
    """Endpoint público para verificar estado de un pedido (con rate limit)."""
    ip = request.remote_addr or '127.0.0.1'
    if not _check_rate_limit(ip):
        return jsonify({"error": "Demasiadas solicitudes. Intente de nuevo en un minuto."}), 429

    from services.pedidos_service import buscarPedido
    pedido = buscarPedido(pedido_id)
    if not pedido:
        return jsonify({"error": "Pedido no encontrado"}), 404
    return jsonify({
        "ped_id": pedido.get("ped_id"),
        "ped_estado_entrega": pedido.get("ped_estado_entrega"),
        "ped_estado_pago": pedido.get("ped_estado_pago"),
        "ped_token_entrega": pedido.get("ped_token_entrega")
    }), 200

@publico_bp.route('/confirmar-entrega/<token>', methods=['GET', 'POST'])
def confirmar_entrega(token):
    return cnconfirmarentrega(token)
