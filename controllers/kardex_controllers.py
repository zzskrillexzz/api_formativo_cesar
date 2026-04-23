from flask import jsonify, request, current_app
from services.kardex_service import listarKardex, registrarKardex, buscarKardex, editarKardex, eliminarKardex

def cnlistadokardex():
    try:
        datos = listarKardex()
        return jsonify(datos), 200
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def cnregistrarkardex():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"mensaje": "No se enviaron datos JSON"}), 400

        requerido = ["kar_id", "kar_pro_id_fk", "kar_lot_id_fk", "kar_inm_id_fk", "kar_fecha", "kar_tipo", "kar_cantidad", "kar_saldo_anterior", "kar_saldo_actual", "kar_costo_unitario", "kar_costo_total"]
        faltantes = [x for x in requerido if x not in data]
        if faltantes:
            return jsonify({"mensaje": f"Faltan los siguientes campos: {faltantes}"}), 400

        # Validar tipo
        tipos_validos = ["Entrada", "Salida", "Ajuste"]
        if data["kar_tipo"] not in tipos_validos:
            return jsonify({"mensaje": f"Tipo inválido. Valores permitidos: {tipos_validos}"}), 400

        # Validar cantidad positiva
        try:
            cantidad = int(data["kar_cantidad"])
            if cantidad <= 0:
                return jsonify({"mensaje": "La cantidad debe ser mayor a 0"}), 400
        except (ValueError, TypeError):
            return jsonify({"mensaje": "La cantidad debe ser un número entero"}), 400

        # Validar saldos no negativos
        try:
            saldo_ant = int(data["kar_saldo_anterior"])
            saldo_act = int(data["kar_saldo_actual"])
            if saldo_ant < 0 or saldo_act < 0:
                return jsonify({"mensaje": "Los saldos no pueden ser negativos"}), 400
        except (ValueError, TypeError):
            return jsonify({"mensaje": "Los saldos deben ser números enteros"}), 400

        # Validar duplicado
        c = current_app.mysql.connection.cursor()
        c.execute("SELECT kar_id FROM t_kardex WHERE kar_id = %s", (data["kar_id"],))
        if c.fetchone():
            c.close()
            return jsonify({"mensaje": f"Ya existe un registro de kardex con el ID {data['kar_id']}"}), 409

        # Validar que el producto exista
        c.execute("SELECT pro_id FROM t_producto WHERE pro_id = %s", (data["kar_pro_id_fk"],))
        if not c.fetchone():
            c.close()
            return jsonify({"mensaje": f"No existe un producto con el ID {data['kar_pro_id_fk']}"}), 404

        # Validar que el lote exista
        c.execute("SELECT lot_id FROM t_lote WHERE lot_id = %s", (data["kar_lot_id_fk"],))
        if not c.fetchone():
            c.close()
            return jsonify({"mensaje": f"No existe un lote con el ID {data['kar_lot_id_fk']}"}), 404

        # Validar que el movimiento exista
        c.execute("SELECT inm_id FROM t_inventario_movimiento WHERE inm_id = %s", (data["kar_inm_id_fk"],))
        if not c.fetchone():
            c.close()
            return jsonify({"mensaje": f"No existe un movimiento con el ID {data['kar_inm_id_fk']}"}), 404
        c.close()

        resultado = registrarKardex(
            data["kar_id"], data["kar_pro_id_fk"], data["kar_lot_id_fk"],
            data["kar_inm_id_fk"], data["kar_fecha"], data["kar_tipo"],
            data["kar_cantidad"], data["kar_saldo_anterior"], data["kar_saldo_actual"],
            data["kar_costo_unitario"], data["kar_costo_total"]
        )
        return jsonify({"mensaje": "Registro de kardex guardado correctamente", "datos": resultado}), 201

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500



def cneditarkardex():
    try:
        data = request.get_json()
        if not data or "kar_id" not in data:
            return jsonify({"mensaje": "ID de kardex requerido"}), 400

        # Validar si el registro existe
        if not buscarKardex(data["kar_id"]):
            return jsonify({"mensaje": "El registro de kardex no existe"}), 404

        # Validar foráneas (Producto, Lote, Movimiento)
        c = current_app.mysql.connection.cursor()
        
        # Producto
        c.execute("SELECT pro_id FROM t_producto WHERE pro_id = %s", (data["kar_pro_id_fk"],))
        if not c.fetchone():
            c.close()
            return jsonify({"mensaje": "Producto no encontrado"}), 404
            
        # Lote
        c.execute("SELECT lot_id FROM t_lote WHERE lot_id = %s", (data["kar_lot_id_fk"],))
        if not c.fetchone():
            c.close()
            return jsonify({"mensaje": "Lote no encontrado"}), 404

        c.close()

        resultado = editarKardex(
            data["kar_id"], data["kar_pro_id_fk"], data["kar_lot_id_fk"],
            data["kar_inm_id_fk"], data["kar_fecha"], data["kar_tipo"],
            data["kar_cantidad"], data["kar_saldo_anterior"], data["kar_saldo_actual"],
            data["kar_costo_unitario"], data["kar_costo_total"]
        )
        return jsonify({"mensaje": "Kardex actualizado correctamente", "datos": resultado}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def cneliminarkardex(kar_id):
    try:
        if not buscarKardex(kar_id):
            return jsonify({"mensaje": "Registro no encontrado"}), 404
        return jsonify(eliminarKardex(kar_id)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def cnbuscarkardex():
    try:
        kar_id = request.args.get("kar_id")
        resultado = buscarKardex(kar_id)
        if resultado:
            return jsonify(resultado), 200
        return jsonify({"mensaje": "Registro no encontrado"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500