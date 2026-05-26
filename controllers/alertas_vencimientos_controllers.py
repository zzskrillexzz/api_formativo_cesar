from flask import jsonify, request, current_app
from services.alertas_vencimientos_service import listarAlertasVencimientos, registrarAlertasVencimientos
from utils.error_handler import safe_controller

@safe_controller
def cnlistadoalertasvencimientos():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 50, type=int)
    q = request.args.get('q', None)
    order_by = request.args.get('order_by', None)
    filtros = {k: v for k, v in request.args.items() if k not in ('page', 'limit', 'q', 'order_by')}
    datos = listarAlertasVencimientos(page=page, limit=limit, q=q, order_by=order_by, **filtros)
    return jsonify(datos), 200

@safe_controller
def cnregistraralertasvencimientos():
    data = request.get_json()
    if not data:
        return jsonify({"mensaje": "No se enviaron datos JSON"}), 400

    requerido = ["alv_id", "alv_pro_id_fk", "alv_lot_id_fk", "alv_fecha_generacion", "alv_fecha_vencimiento", "alv_dias_restantes", "alv_estado"]
    faltantes = [x for x in requerido if x not in data]
    if faltantes:
        return jsonify({"mensaje": f"Faltan los siguientes campos: {faltantes}"}), 400

    # Validar estado
    estados_validos = ["Pendiente", "Gestionada", "Ignorada"]
    if data["alv_estado"] not in estados_validos:
        return jsonify({"mensaje": f"Estado inválido. Valores permitidos: {estados_validos}"}), 400

    # Validar días restantes
    try:
        dias = int(data["alv_dias_restantes"])
        if dias < 0:
            return jsonify({"mensaje": "Los días restantes no pueden ser negativos"}), 400
    except (ValueError, TypeError):
        return jsonify({"mensaje": "Los días restantes deben ser un número entero"}), 400

    # Validar duplicado
    c = current_app.mysql.connection.cursor()
    c.execute("SELECT alv_id FROM t_alerta_vencimiento WHERE alv_id = %s", (data["alv_id"],))
    if c.fetchone():
        c.close()
        return jsonify({"mensaje": f"Ya existe una alerta con el ID {data['alv_id']}"}), 409

    # Validar que el producto exista
    c.execute("SELECT pro_id FROM t_producto WHERE pro_id = %s", (data["alv_pro_id_fk"],))
    if not c.fetchone():
        c.close()
        return jsonify({"mensaje": f"No existe un producto con el ID {data['alv_pro_id_fk']}"}), 404

    # Validar que el lote exista
    c.execute("SELECT lot_id FROM t_lote WHERE lot_id = %s", (data["alv_lot_id_fk"],))
    if not c.fetchone():
        c.close()
        return jsonify({"mensaje": f"No existe un lote con el ID {data['alv_lot_id_fk']}"}), 404

    # Validar usuario si se envía
    usuario_id = data.get("alv_usu_id_fk")
    if usuario_id:
        c.execute("SELECT usu_id FROM t_usuario WHERE usu_id = %s", (usuario_id,))
        if not c.fetchone():
            c.close()
            return jsonify({"mensaje": f"No existe un usuario con el ID {usuario_id}"}), 404
    c.close()

    resultado = registrarAlertasVencimientos(
        data["alv_id"], data["alv_pro_id_fk"], data["alv_lot_id_fk"],
        data["alv_fecha_generacion"], data["alv_fecha_vencimiento"],
        data["alv_dias_restantes"], data["alv_estado"], usuario_id
    )
    return jsonify({"mensaje": "Alerta registrada correctamente", "datos": resultado}), 201
