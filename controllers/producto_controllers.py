from flask import jsonify, request
from services.producto_service import listarProducto

def cnlistado():
    try:
        datos = listarProducto()
        return jsonify(datos), 200
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500