from flask import jsonify, request, current_app
from services.clientes_service import listarClientes, registrarClientes

def cnlistadoclientes():
    try:
        datos = listarClientes()
        return jsonify(datos), 200
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def cnregistrarclientes():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"mensaje": "No se enviaron datos JSON"}), 400

        requerido = ["cli_id", "cli_tipo_documento", "cli_nombre", "cli_apellido", "cli_telefono", "cli_direccion", "cli_correo"]
        faltantes = [x for x in requerido if x not in data or str(data[x]).strip() == ""]
        if faltantes:
            return jsonify({"mensaje": f"Faltan los siguientes campos o están vacíos: {faltantes}"}), 400

        # Validar tipo documento
        tipos_validos = ["CC", "NIT", "CE", "TI"]
        if data["cli_tipo_documento"] not in tipos_validos:
            return jsonify({"mensaje": f"Tipo de documento inválido. Valores permitidos: {tipos_validos}"}), 400

        # Validar duplicado por ID
        c = current_app.mysql.connection.cursor()
        c.execute("SELECT cli_id FROM t_cliente WHERE cli_id = %s", (data["cli_id"],))
        if c.fetchone():
            c.close()
            return jsonify({"mensaje": f"Ya existe un cliente con el ID {data['cli_id']}"}), 409

        # Validar correo duplicado
        c.execute("SELECT cli_id FROM t_cliente WHERE cli_correo = %s", (data["cli_correo"],))
        if c.fetchone():
            c.close()
            return jsonify({"mensaje": f"Ya existe un cliente con el correo {data['cli_correo']}"}), 409
        c.close()

        resultado = registrarClientes(
            data["cli_id"], data["cli_tipo_documento"], data["cli_nombre"],
            data["cli_apellido"], data["cli_telefono"], data["cli_direccion"], data["cli_correo"]
        )
        return jsonify({"mensaje": "Cliente registrado correctamente", "datos": resultado}), 201

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
