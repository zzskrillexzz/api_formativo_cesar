from flask import jsonify, request, current_app
from services.anulaciones_ventas_service import listarAnulacionesVentas, registrarAnulacionesVentas

def cnlistadoanulacionesventas():
    try:
        datos = listarAnulacionesVentas()
        return jsonify(datos), 200
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def cnregistraranulacionesventas():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"mensaje": "No se enviaron datos JSON"}), 400

        requerido = ["anu_id", "anu_fac_id_fk", "anu_usu_id_fk", "anu_fecha", "anu_motivo"]
        faltantes = [x for x in requerido if x not in data]
        if faltantes:
            return jsonify({"mensaje": f"Faltan los siguientes campos: {faltantes}"}), 400

        # Validar campos no vacíos
        for campo in requerido:
            if str(data[campo]).strip() == "":
                return jsonify({"mensaje": f"El campo {campo} no puede estar vacío"}), 400

        # Validar duplicado
        c = current_app.mysql.connection.cursor()
        c.execute("SELECT anu_id FROM t_anulacion_venta WHERE anu_id = %s", (data["anu_id"],))
        if c.fetchone():
            c.close()
            return jsonify({"mensaje": f"Ya existe una anulación con el ID {data['anu_id']}"}), 409

        # Validar que la factura exista
        c.execute("SELECT fac_id FROM t_factura WHERE fac_id = %s", (data["anu_fac_id_fk"],))
        if not c.fetchone():
            c.close()
            return jsonify({"mensaje": f"No existe una factura con el ID {data['anu_fac_id_fk']}"}), 404

        # Validar que la factura no esté ya anulada
        c.execute("SELECT anu_id FROM t_anulacion_venta WHERE anu_fac_id_fk = %s", (data["anu_fac_id_fk"],))
        if c.fetchone():
            c.close()
            return jsonify({"mensaje": f"La factura {data['anu_fac_id_fk']} ya tiene una anulación registrada"}), 409

        # Validar que el usuario exista
        c.execute("SELECT usu_id FROM t_usuario WHERE usu_id = %s", (data["anu_usu_id_fk"],))
        if not c.fetchone():
            c.close()
            return jsonify({"mensaje": f"No existe un usuario con el ID {data['anu_usu_id_fk']}"}), 404
        c.close()

        resultado = registrarAnulacionesVentas(
            data["anu_id"], data["anu_fac_id_fk"], data["anu_usu_id_fk"],
            data["anu_fecha"], data["anu_motivo"]
        )
        return jsonify({"mensaje": "Anulación registrada correctamente", "datos": resultado}), 201

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
