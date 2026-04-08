from flask import jsonify, request
from services.pedido_service import listarPedido

def cnlistadoped():
    try:
        x = listarPedido()
        return jsonify(x), 200
    
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500