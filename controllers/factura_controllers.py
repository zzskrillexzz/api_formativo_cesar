from flask import jsonify
from services.factura_service import listarFactura

def cnlistado():
    try:
        datos = listarFactura()
        return jsonify(datos), 200
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
