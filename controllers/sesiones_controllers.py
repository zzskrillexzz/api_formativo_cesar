from flask import jsonify, request, current_app
from services.sesiones_service import listarSesiones, registrarSesiones

def cnlistadosesiones():
    try:
        datos = listarSesiones()
        return jsonify(datos), 200
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def cnregistrarsesiones():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"mensaje": "No se enviaron datos JSON"}), 400

        requerido = ["ses_id", "ses_usu_id_fk", "ses_fecha_inicio", "ses_ip", "ses_activa"]
        faltantes = [x for x in requerido if x not in data]
        if faltantes:
            return jsonify({"mensaje": f"Faltan los siguientes campos: {faltantes}"}), 400

        # Validar activa (0 o 1)
        if data["ses_activa"] not in [0, 1]:
            return jsonify({"mensaje": "ses_activa debe ser 0 (Cerrada) o 1 (Activa)"}), 400

        # Validar duplicado
        c = current_app.mysql.connection.cursor()
        c.execute("SELECT ses_id FROM t_sesion WHERE ses_id = %s", (data["ses_id"],))
        if c.fetchone():
            c.close()
            return jsonify({"mensaje": f"Ya existe una sesión con el ID {data['ses_id']}"}), 409

        # Validar que el usuario exista
        c.execute("SELECT usu_id FROM t_usuario WHERE usu_id = %s", (data["ses_usu_id_fk"],))
        if not c.fetchone():
            c.close()
            return jsonify({"mensaje": f"No existe un usuario con el ID {data['ses_usu_id_fk']}"}), 404
        c.close()

        fecha_fin = data.get("ses_fecha_fin")

        resultado = registrarSesiones(
            data["ses_id"], data["ses_usu_id_fk"], data["ses_fecha_inicio"],
            fecha_fin, data["ses_ip"], data["ses_activa"]
        )
        return jsonify({"mensaje": "Sesión registrada correctamente", "datos": resultado}), 201

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
