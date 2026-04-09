from flask import jsonify, request, current_app
from services.compras_service import listarCompras, registrarCompras

def cnlistadocompras():
    try:
        datos = listarCompras()
        return jsonify(datos), 200
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def cnregistrarcompras():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"mensaje": "No se enviaron datos JSON"}), 400

        requerido = ["com_id", "com_fecha", "com_prov_id_fk", "com_usu_id_fk", "com_total", "com_estado", "com_observacion"]
        faltantes = [x for x in requerido if x not in data]
        if faltantes:
            return jsonify({"mensaje": f"Faltan los siguientes campos: {faltantes}"}), 400

        # Validar campos no vacíos
        for campo in ["com_id", "com_fecha", "com_prov_id_fk", "com_usu_id_fk"]:
            if str(data[campo]).strip() == "":
                return jsonify({"mensaje": f"El campo {campo} no puede estar vacío"}), 400

        # Validar estado
        estados_validos = ["Pendiente", "Recibida", "Cancelada"]
        if data["com_estado"] not in estados_validos:
            return jsonify({"mensaje": f"Estado inválido. Valores permitidos: {estados_validos}"}), 400

        # Validar total positivo
        try:
            total = float(data["com_total"])
            if total <= 0:
                return jsonify({"mensaje": "El total debe ser mayor a 0"}), 400
        except (ValueError, TypeError):
            return jsonify({"mensaje": "El total debe ser un número válido"}), 400

        # Validar duplicado
        c = current_app.mysql.connection.cursor()
        c.execute("SELECT com_id FROM t_compra WHERE com_id = %s", (data["com_id"],))
        if c.fetchone():
            c.close()
            return jsonify({"mensaje": f"Ya existe una compra con el ID {data['com_id']}"}), 409

        # Validar que el proveedor exista
        c.execute("SELECT prov_id FROM t_proveedor WHERE prov_id = %s", (data["com_prov_id_fk"],))
        if not c.fetchone():
            c.close()
            return jsonify({"mensaje": f"No existe un proveedor con el ID {data['com_prov_id_fk']}"}), 404

        # Validar que el usuario exista
        c.execute("SELECT usu_id FROM t_usuario WHERE usu_id = %s", (data["com_usu_id_fk"],))
        if not c.fetchone():
            c.close()
            return jsonify({"mensaje": f"No existe un usuario con el ID {data['com_usu_id_fk']}"}), 404
        c.close()

        resultado = registrarCompras(
            data["com_id"], data["com_fecha"], data["com_prov_id_fk"],
            data["com_usu_id_fk"], data["com_total"], data["com_estado"], data["com_observacion"]
        )
        return jsonify({"mensaje": "Compra registrada correctamente", "datos": resultado}), 201

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
