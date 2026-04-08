from flask import jsonify, request
from services.inventario_movimiento_service import (
    listarMovimientos,
    registrarMovimiento,
    editarMovimiento,
    eliminarMovimiento,
    buscarMovimiento
)

def cnListarMovimientos():
    try:
        datos = listarMovimientos()
        return jsonify(datos), 200
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def cnRegistrarMovimiento():
    try:
        data = request.get_json()
        resultado = registrarMovimiento(data)
        return jsonify(resultado), 201
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def cnEditarMovimiento(inm_id):
    try:
        data = request.get_json()
        resultado = editarMovimiento(inm_id, data)
        return jsonify(resultado), 200
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def cnEliminarMovimiento(inm_id):
    try:
        resultado = eliminarMovimiento(inm_id)
        return jsonify(resultado), 200
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def cnBuscarMovimiento(inm_id):
    try:
        dato = buscarMovimiento(inm_id)
        if dato:
            return jsonify(dato), 200
        return jsonify({"mensaje": "Movimiento no encontrado"}), 404
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500