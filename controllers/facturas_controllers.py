from flask import jsonify, request, current_app
from services.facturas_service import listarFacturas, registrarFacturas, editarFacturas, eliminarFacturas, buscarFacturas
from utils.validators import validar_campos_texto

def cnListarFacturas():
    try:
        datos = listarFacturas()
        return jsonify(datos), 200
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def cnRegistrarFacturas():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"mensaje": "No se enviaron datos JSON"}), 400

        requerido = ["id", "fecha_emision", "email_enviado", "forma_pago", "total", "usuario_id"]
        faltantes = [x for x in requerido if x not in data]
        if faltantes:
            return jsonify({"mensaje": f"Faltan los siguientes campos: {faltantes}"}), 400

        # Validar longitud de campos de texto
        errores = validar_campos_texto(data, "forma_pago", "cuenta_bancaria")
        if errores:
            return jsonify({"mensaje": " | ".join(errores)}), 400

        # Validar email_enviado (0 o 1)
        if data["email_enviado"] not in [0, 1]:
            return jsonify({"mensaje": "email_enviado debe ser 0 o 1"}), 400

        # Validar estado
        estados_validos = ["Vigente", "Anulada"]
        if data.get("estado") and data["estado"] not in estados_validos:
            return jsonify({"mensaje": f"Estado inválido. Valores permitidos: {estados_validos}"}), 400

        # Validar total positivo
        try:
            total = float(data["total"])
            if total <= 0:
                return jsonify({"mensaje": "El total debe ser mayor a 0"}), 400
        except (ValueError, TypeError):
            return jsonify({"mensaje": "El total debe ser un número válido"}), 400

        # Validar duplicado (fac_id = ped_id)
        c = current_app.mysql.connection.cursor()
        c.execute("SELECT fac_id FROM t_factura WHERE fac_id = %s", (data["id"],))
        if c.fetchone():
            c.close()
            return jsonify({"mensaje": f"Ya existe una factura con el ID {data['id']}"}), 409

        # Validar que el pedido exista (fac_id referencia a ped_id)
        c.execute("SELECT ped_id FROM t_pedido WHERE ped_id = %s", (data["id"],))
        if not c.fetchone():
            c.close()
            return jsonify({"mensaje": f"No existe un pedido con el ID {data['id']}. La factura debe referenciar un pedido existente"}), 404

        # Validar que el usuario exista
        c.execute("SELECT usu_id FROM t_usuario WHERE usu_id = %s", (data["usuario_id"],))
        if not c.fetchone():
            c.close()
            return jsonify({"mensaje": f"No existe un usuario con el ID {data['usuario_id']}"}), 404

        # Obtener el cliente asociado al pedido si no se envía cli_id_fk
        cli_id_fk = data.get('cli_id_fk')
        if not cli_id_fk:
            c.execute("SELECT ped_cli_id_fk FROM t_pedido WHERE ped_id = %s", (data["id"],))
            row = c.fetchone()
            if row:
                cli_id_fk = row[0]
        if cli_id_fk:
            c.execute("SELECT cli_id FROM t_cliente WHERE cli_id = %s", (cli_id_fk,))
            if not c.fetchone():
                c.close()
                return jsonify({"mensaje": f"No existe un cliente con el ID {cli_id_fk}"}), 404
        c.close()

        data['cli_id_fk'] = cli_id_fk
        resultado = registrarFacturas(data)
        return jsonify(resultado), 201

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def cnEditarFacturas(fac_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({"mensaje": "No se enviaron datos JSON"}), 400

        # Obtener el cliente asociado al pedido si no se envía cli_id_fk
        cli_id_fk = data.get('cli_id_fk')
        if not cli_id_fk:
            c = current_app.mysql.connection.cursor()
            c.execute("SELECT ped_cli_id_fk FROM t_pedido WHERE ped_id = %s", (fac_id,))
            row = c.fetchone()
            if row:
                cli_id_fk = row[0]
            c.close()
        if cli_id_fk:
            c = current_app.mysql.connection.cursor()
            c.execute("SELECT cli_id FROM t_cliente WHERE cli_id = %s", (cli_id_fk,))
            if not c.fetchone():
                c.close()
                return jsonify({"mensaje": f"No existe un cliente con el ID {cli_id_fk}"}), 404
            c.close()

        data['cli_id_fk'] = cli_id_fk
        resultado = editarFacturas(fac_id, data)
        return jsonify(resultado), 200
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def cnEliminarFacturas(fac_id):
    try:
        resultado = eliminarFacturas(fac_id)
        return jsonify(resultado), 200
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def cnBuscarFacturas(fac_id):
    try:
        dato = buscarFacturas(fac_id)
        if dato:
            return jsonify(dato), 200
        return jsonify({"mensaje": "Factura no encontrada"}), 404
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
