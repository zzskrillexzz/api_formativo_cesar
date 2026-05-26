from flask import jsonify, request, current_app
from services.roles_service import listarRoles, registrarRoles, editarRoles, eliminarRoles, buscarRoles
from utils.validators import validar_campos_texto
from utils.error_handler import safe_controller

@safe_controller
def cnListarRoles():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 50, type=int)
    q = request.args.get('q', None)
    order_by = request.args.get('order_by', None)
    filtros = {k: v for k, v in request.args.items() if k not in ('page', 'limit', 'q', 'order_by')}
    datos = listarRoles(page=page, limit=limit, q=q, order_by=order_by, **filtros)
    return jsonify(datos), 200

@safe_controller
def cnRegistrarRoles():
    data = request.get_json()
    if not data:
        return jsonify({"mensaje": "No se enviaron datos JSON"}), 400

    requerido = ["id", "nombre"]
    faltantes = [x for x in requerido if x not in data]
    if faltantes:
        return jsonify({"mensaje": f"Faltan los siguientes campos: {faltantes}"}), 400

    # Validar campos no vacíos
    for campo in ["id", "nombre"]:
        if str(data[campo]).strip() == "":
            return jsonify({"mensaje": f"El campo {campo} no puede estar vacío"}), 400

    # Validar longitud del nombre
    msg = validar_campos_texto(data, "nombre")
    if msg:
        return jsonify({"mensaje": " | ".join(msg)}), 400

    # Validar estado
    if data.get("estado") not in [0, 1, None]:
        return jsonify({"mensaje": "El estado debe ser 0 (Inactivo) o 1 (Activo)"}), 400

    # Validar duplicado por ID
    c = current_app.mysql.connection.cursor()
    c.execute("SELECT rol_id FROM t_rol WHERE rol_id = %s", (data["id"],))
    if c.fetchone():
        c.close()
        return jsonify({"mensaje": f"Ya existe un rol con el ID {data['id']}"}), 409
    c.close()

    resultado = registrarRoles(data)
    return jsonify(resultado), 201

@safe_controller
def cnEditarRoles():
    data = request.get_json()
    if not data:
        return jsonify({"mensaje": "No se enviaron datos JSON"}), 400

    if "id" not in data:
        return jsonify({"mensaje": "El campo 'id' es requerido para editar"}), 400

    # Validar campos no vacíos
    if str(data.get("nombre", "")).strip() == "":
        return jsonify({"mensaje": "El campo nombre no puede estar vacío"}), 400

    # Validar longitud del nombre
    msg = validar_campos_texto(data, "nombre")
    if msg:
        return jsonify({"mensaje": " | ".join(msg)}), 400

    # Validar que el rol exista
    c = current_app.mysql.connection.cursor()
    c.execute("SELECT rol_id FROM t_rol WHERE rol_id = %s", (data["id"],))
    if not c.fetchone():
        c.close()
        return jsonify({"mensaje": f"No existe un rol con el ID {data['id']}"}), 404
    c.close()

    # Validar estado
    if data.get("estado") not in [0, 1, None]:
        return jsonify({"mensaje": "El estado debe ser 0 (Inactivo) o 1 (Activo)"}), 400

    resultado = editarRoles(data)
    return jsonify(resultado), 200

@safe_controller
def cnEliminarRoles(rol_id):
    # Validar que el rol exista
    c = current_app.mysql.connection.cursor()
    c.execute("SELECT rol_id FROM t_rol WHERE rol_id = %s", (rol_id,))
    if not c.fetchone():
        c.close()
        return jsonify({"mensaje": f"No existe un rol con el ID {rol_id}"}), 404
    c.close()

    resultado = eliminarRoles(rol_id)
    
    if resultado.get("error"):
        return jsonify({"mensaje": resultado["mensaje"]}), 409
    
    return jsonify(resultado), 200

@safe_controller
def cnBuscarRoles():
    rol_id = request.args.get("rol_id")
    if not rol_id:
        return jsonify({"mensaje": "Debe proporcionar un ID de rol"}), 400
    
    resultado = buscarRoles(rol_id)
    if resultado:
        return jsonify(resultado), 200
    return jsonify({"mensaje": "Rol no encontrado"}), 404
