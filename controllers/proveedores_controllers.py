from flask import jsonify, request, current_app
from services.proveedores_service import listarProveedores, registrarProveedores

def cnlistadoproveedores():
    try:
        datos = listarProveedores()
        return jsonify(datos), 200
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def cnregistrarproveedores():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"mensaje": "No se enviaron datos JSON"}), 400

        requerido = ["id", "nit", "nombre", "tipo", "contacto", "direccion", "email"]
        faltantes = [x for x in requerido if x not in data or str(data[x]).strip() == ""]
        if faltantes:
            return jsonify({"mensaje": f"Faltan los siguientes campos o están vacíos: {faltantes}"}), 400

        # Validar tipo
        tipos_validos = ["Laboratorio", "Distribuidor", "Importador"]
        if data["tipo"] not in tipos_validos:
            return jsonify({"mensaje": f"Tipo inválido. Valores permitidos: {tipos_validos}"}), 400

        # Validar duplicado por ID
        c = current_app.mysql.connection.cursor()
        c.execute("SELECT prov_id FROM t_proveedor WHERE prov_id = %s", (data["id"],))
        if c.fetchone():
            c.close()
            return jsonify({"mensaje": f"Ya existe un proveedor con el ID {data['id']}"}), 409

        # Validar NIT duplicado
        c.execute("SELECT prov_id FROM t_proveedor WHERE prov_nit = %s", (data["nit"],))
        if c.fetchone():
            c.close()
            return jsonify({"mensaje": f"Ya existe un proveedor con el NIT {data['nit']}"}), 409
        c.close()

        resultado = registrarProveedores(data)
        return jsonify(resultado), 201

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
