from flask import jsonify, request, current_app
from services.proveedores_productos_service import (
    listarProveedoresProductos, 
    registrarProveedoresProductos, 
    eliminarProveedoresProductos,
    buscarProductosPorProveedor,
    buscarProveedoresPorProducto
)

def cnlistadoproveedoresproductos():
    try:
        datos = listarProveedoresProductos()
        return jsonify(datos), 200
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def cnregistrarproveedoresproductos():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"mensaje": "No se enviaron datos JSON"}), 400

        requerido = ["ppp_prov_id_fk", "ppp_pro_id_fk"]
        faltantes = [x for x in requerido if x not in data or str(data[x]).strip() == ""]
        if faltantes:
            return jsonify({"mensaje": f"Faltan los siguientes campos o están vacíos: {faltantes}"}), 400

        c = current_app.mysql.connection.cursor()

        # Validar que el proveedor exista
        c.execute("SELECT prov_id FROM t_proveedor WHERE prov_id = %s", (data["ppp_prov_id_fk"],))
        if not c.fetchone():
            c.close()
            return jsonify({"mensaje": f"No existe un proveedor con el ID {data['ppp_prov_id_fk']}"}), 404

        # Validar que el producto exista
        c.execute("SELECT pro_id FROM t_producto WHERE pro_id = %s", (data["ppp_pro_id_fk"],))
        if not c.fetchone():
            c.close()
            return jsonify({"mensaje": f"No existe un producto con el ID {data['ppp_pro_id_fk']}"}), 404

        # Validar relación duplicada
        c.execute("SELECT ppp_prov_id_fk FROM t_proveedor_producto WHERE ppp_prov_id_fk = %s AND ppp_pro_id_fk = %s", 
                  (data["ppp_prov_id_fk"], data["ppp_pro_id_fk"]))
        if c.fetchone():
            c.close()
            return jsonify({"mensaje": f"Ya existe la relación entre proveedor {data['ppp_prov_id_fk']} y producto {data['ppp_pro_id_fk']}"}), 409
        c.close()

        resultado = registrarProveedoresProductos(data["ppp_prov_id_fk"], data["ppp_pro_id_fk"])
        return jsonify({"mensaje": "Relación proveedor-producto registrada correctamente", "datos": resultado}), 201

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def cneliminarproveedoresproductos():
    requerido = ["ppp_prov_id_fk", "ppp_pro_id_fk"]
    faltantes = [x for x in requerido if x not in request.json]
    if faltantes:
        return jsonify({"mensaje": f"Faltan los siguientes campos: {faltantes}"}), 400

    proveedor_id = request.json["ppp_prov_id_fk"]
    producto_id = request.json["ppp_pro_id_fk"]
    resultado = eliminarProveedoresProductos(proveedor_id, producto_id)
    return jsonify(resultado), 200

def cnbuscarproductosporproveedor(prov_id):
    try:
        datos = buscarProductosPorProveedor(prov_id)
        if datos:
            return jsonify(datos), 200
        return jsonify({"mensaje": "No se encontraron productos para este proveedor"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def cnbuscarproveedoresporproducto(pro_id):
    try:
        datos = buscarProveedoresPorProducto(pro_id)
        if datos:
            return jsonify(datos), 200
        return jsonify({"mensaje": "No se encontraron proveedores para este producto"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
