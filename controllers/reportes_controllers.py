from flask import jsonify, request, current_app
from services.reportes_service import listarReportes, registrarReportes

def cnlistadoreportes():
    try:
        datos = listarReportes()
        return jsonify(datos), 200
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def cnregistrarreportes():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"mensaje": "No se enviaron datos JSON"}), 400

        requerido = ["rep_id", "rep_tipo", "rep_fecha", "rep_usu_id_fk"]
        faltantes = [x for x in requerido if x not in data]
        if faltantes:
            return jsonify({"mensaje": f"Faltan los siguientes campos: {faltantes}"}), 400

        # Validar tipo de reporte
        tipos_validos = ["Ventas", "Inventario", "Más vendidos", "Por vencer"]
        if data["rep_tipo"] not in tipos_validos:
            return jsonify({"mensaje": f"Tipo de reporte inválido. Valores permitidos: {tipos_validos}"}), 400

        # Validar duplicado
        c = current_app.mysql.connection.cursor()
        c.execute("SELECT rep_id FROM t_reporte WHERE rep_id = %s", (data["rep_id"],))
        if c.fetchone():
            c.close()
            return jsonify({"mensaje": f"Ya existe un reporte con el ID {data['rep_id']}"}), 409

        # Validar que el usuario exista
        c.execute("SELECT usu_id FROM t_usuario WHERE usu_id = %s", (data["rep_usu_id_fk"],))
        if not c.fetchone():
            c.close()
            return jsonify({"mensaje": f"No existe un usuario con el ID {data['rep_usu_id_fk']}"}), 404
        c.close()

        parametros = data.get("rep_parametros")
        resultado_rep = data.get("rep_resultado")

        resultado = registrarReportes(
            data["rep_id"], data["rep_tipo"], data["rep_fecha"],
            parametros, data["rep_usu_id_fk"], resultado_rep
        )
        return jsonify({"mensaje": "Reporte registrado correctamente", "datos": resultado}), 201

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
