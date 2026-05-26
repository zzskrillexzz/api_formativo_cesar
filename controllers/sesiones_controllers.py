from flask import jsonify, request
from services.sesiones_service import listarSesiones, registrarSesiones, editarSesiones, eliminarSesiones, buscarSesiones
from utils.error_handler import safe_controller

@safe_controller
def cnlistarsesiones():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 50, type=int)
    q = request.args.get('q', None)
    order_by = request.args.get('order_by', None)
    filtros = {k: v for k, v in request.args.items() if k not in ('page', 'limit', 'q', 'order_by')}
    datos = listarSesiones(page=page, limit=limit, q=q, order_by=order_by, **filtros)
    return jsonify(datos), 200

@safe_controller
def cnregistrarsesiones():
    data = request.get_json()
    if not data:
        return jsonify({"mensaje": "No se enviaron datos JSON"}), 400

    requerido = ["ses_id", "ses_usu_id_fk", "ses_fecha_inicio", "ses_activa"]
    faltantes = [x for x in requerido if x not in data]
    if faltantes:
        return jsonify({"mensaje": f"Faltan los siguientes campos: {faltantes}"}), 400

    resultado = registrarSesiones(
        data["ses_id"], data["ses_usu_id_fk"], data["ses_fecha_inicio"],
        data.get("ses_fecha_fin"), data.get("ses_ip"), data["ses_activa"]
    )
    return jsonify({"mensaje": "Sesión registrada", "datos": resultado}), 201

@safe_controller
def cneditarsesiones():
    data = request.get_json()
    if not data or "ses_id" not in data:
        return jsonify({"mensaje": "ID de sesión requerido"}), 400

    resultado = editarSesiones(
        data["ses_id"], data.get("ses_usu_id_fk"), data.get("ses_fecha_inicio"),
        data.get("ses_fecha_fin"), data.get("ses_ip"), data.get("ses_activa")
    )
    return jsonify({"mensaje": "Sesión actualizada", "datos": resultado}), 200

@safe_controller
def cneliminarsesiones(ses_id):
    if not buscarSesiones(ses_id):
        return jsonify({"mensaje": "Sesión no encontrada"}), 404
    return jsonify(eliminarSesiones(ses_id)), 200

@safe_controller
def cnbuscarsesiones():
    ses_id = request.args.get("ses_id")
    resultado = buscarSesiones(ses_id)
    if resultado:
        return jsonify(resultado), 200
    return jsonify({"mensaje": "Sesión no encontrada"}), 404
