from flask import jsonify, request
from services.reportes_service import listarReportes, registrarReportes, editarReportes, eliminarReportes, buscarReportes
from utils.error_handler import safe_controller

@safe_controller
def cnlistarreportes():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 50, type=int)
    q = request.args.get('q', None)
    order_by = request.args.get('order_by', None)
    filtros = {k: v for k, v in request.args.items() if k not in ('page', 'limit', 'q', 'order_by')}
    datos = listarReportes(page=page, limit=limit, q=q, order_by=order_by, **filtros)
    return jsonify(datos), 200

@safe_controller
def cnregistrarreportes():
    data = request.get_json()
    if not data:
        return jsonify({"mensaje": "No se enviaron datos JSON"}), 400

    requerido = ["rep_id", "rep_tipo", "rep_fecha", "rep_parametros", "rep_usu_id_fk"]
    faltantes = [x for x in requerido if x not in data]
    if faltantes:
        return jsonify({"mensaje": f"Faltan los siguientes campos: {faltantes}"}), 400

    resultado = registrarReportes(
        data["rep_id"], data["rep_tipo"], data["rep_fecha"],
        data["rep_parametros"], data["rep_usu_id_fk"], data.get("rep_resultado")
    )
    return jsonify({"mensaje": "Reporte registrado", "datos": resultado}), 201

@safe_controller
def cneditarreportes():
    data = request.get_json()
    if not data or "rep_id" not in data:
        return jsonify({"mensaje": "ID de reporte requerido"}), 400

    resultado = editarReportes(
        data["rep_id"], data.get("rep_tipo"), data.get("rep_fecha"),
        data.get("rep_parametros"), data.get("rep_usu_id_fk"), data.get("rep_resultado")
    )
    return jsonify({"mensaje": "Reporte actualizado", "datos": resultado}), 200

@safe_controller
def cneliminarreportes(rep_id):
    if not buscarReportes(rep_id):
        return jsonify({"mensaje": "Reporte no encontrado"}), 404
    return jsonify(eliminarReportes(rep_id)), 200

@safe_controller
def cnbuscarreportes():
    rep_id = request.args.get("rep_id")
    resultado = buscarReportes(rep_id)
    if resultado:
        return jsonify(resultado), 200
    return jsonify({"mensaje": "Reporte no encontrado"}), 404
