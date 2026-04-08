from flask import jsonify, request
from services.cliente_service import listarCliente,registrarCliente

def cnlistado():
    try:
        datos = listarCliente()
        return jsonify(datos), 200

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
    

def cnregistrarcliente():
    # vlaidar en la peticion 
    requerido = ["cli_correo", "cli_nombre","cli_apellido", "cli_telefono", "cli_direccion", "cli_id"]
    
    faltantes = [x for x in requerido if x not in request.json]
    print(faltantes)
    if faltantes:
        return jsonify({"mensaje":f"faltan los siguentes campos{faltantes}"}),400
    
    
    
    correo_cliente = request.json["cli_correo"]
    nombre_cliente = request.json["cli_nombre"]
    apellido_cliente = request.json["cli_apellido"]
    telefono_cliente = request.json["cli_telefono"]
    direccion_cliente = request.json["cli_direccion"]
    id_cliente = request.json["cli_id"]
    
    p = registrarCliente(id_cliente,nombre_cliente, apellido_cliente, telefono_cliente, direccion_cliente, correo_cliente)
    
    return jsonify ({"mensaje": "cliente registrado", "datos":p}), 201
    