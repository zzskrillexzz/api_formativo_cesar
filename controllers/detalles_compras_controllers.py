from flask import jsonify, request, current_app
from services.detalles_compras_service import listarDetallesCompras, registrarDetallesCompras
from utils.error_handler import safe_controller

@safe_controller
def cnlistadodetallescompras():
    datos = listarDetallesCompras()
    return jsonify(datos), 200

@safe_controller
def cnregistrardetallescompras():
    data = request.get_json()
    if not data:
        return jsonify({"mensaje": "No se enviaron datos JSON"}), 400

    requerido = ["dco_id", "dco_com_id_fk", "dco_pro_id_fk", "dco_lot_id_fk", "dco_cantidad", "dco_precio_compra", "dco_subtotal"]
    faltantes = [x for x in requerido if x not in data]
    if faltantes:
        return jsonify({"mensaje": f"Faltan los siguientes campos: {faltantes}"}), 400

    # Validar cantidad positiva
    try:
        cantidad = int(data["dco_cantidad"])
        if cantidad <= 0:
            return jsonify({"mensaje": "La cantidad debe ser mayor a 0"}), 400
    except (ValueError, TypeError):
        return jsonify({"mensaje": "La cantidad debe ser un número entero"}), 400

    # Validar precio positivo
    try:
        precio = float(data["dco_precio_compra"])
        if precio <= 0:
            return jsonify({"mensaje": "El precio de compra debe ser mayor a 0"}), 400
    except (ValueError, TypeError):
        return jsonify({"mensaje": "El precio de compra debe ser un número válido"}), 400

    # Validar duplicado
    c = current_app.mysql.connection.cursor()
    c.execute("SELECT dco_id FROM t_detalle_compra WHERE dco_id = %s", (data["dco_id"],))
    if c.fetchone():
        c.close()
        return jsonify({"mensaje": f"Ya existe un detalle de compra con el ID {data['dco_id']}"}), 409

    # Validar que la compra exista
    c.execute("SELECT com_id FROM t_compra WHERE com_id = %s", (data["dco_com_id_fk"],))
    if not c.fetchone():
        c.close()
        return jsonify({"mensaje": f"No existe una compra con el ID {data['dco_com_id_fk']}"}), 404

    # Validar que el producto exista
    c.execute("SELECT pro_id FROM t_producto WHERE pro_id = %s", (data["dco_pro_id_fk"],))
    if not c.fetchone():
        c.close()
        return jsonify({"mensaje": f"No existe un producto con el ID {data['dco_pro_id_fk']}"}), 404

    # Validar que el lote exista
    c.execute("SELECT lot_id FROM t_lote WHERE lot_id = %s", (data["dco_lot_id_fk"],))
    if not c.fetchone():
        c.close()
        return jsonify({"mensaje": f"No existe un lote con el ID {data['dco_lot_id_fk']}"}), 404
    c.close()

    resultado = registrarDetallesCompras(
        data["dco_id"], data["dco_com_id_fk"], data["dco_pro_id_fk"],
        data["dco_lot_id_fk"], data["dco_cantidad"], data["dco_precio_compra"], data["dco_subtotal"]
    )
    return jsonify({"mensaje": "Detalle de compra registrado correctamente", "datos": resultado}), 201
