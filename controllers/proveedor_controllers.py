from flask import jsonify, request
from services.proveedor_service import (
    listarProveedores,
    registrarProveedor,
    editarProveedor,
    eliminarProveedor,
    buscarProveedor
)

def cnListarProveedores():
    try:
        datos = listarProveedores()
        return jsonify(datos), 200
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def cnRegistrarProveedor():
    try:
        data = request.get_json()
        resultado = registrarProveedor(data)
        return jsonify(resultado), 201
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def cnEditarProveedor(prov_id):
    try:
        data = request.get_json()
        resultado = editarProveedor(prov_id, data)
        return jsonify(resultado), 200
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def cnEliminarProveedor(prov_id):
    try:
        resultado = eliminarProveedor(prov_id)
        return jsonify(resultado), 200
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def cnBuscarProveedor(prov_id):
    try:
        dato = buscarProveedor(prov_id)
        if dato:
            return jsonify(dato), 200
        return jsonify({"mensaje": "Proveedor no encontrado"}), 404
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500