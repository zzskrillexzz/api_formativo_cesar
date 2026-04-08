#from models.producto_model import producto
import MySQLdb.cursors
from flask import current_app

def listarProducto():
    try:
        cursor = current_app.mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute("""
            SELECT 
                pro_id as id,
                pro_categoria as categoria,
                pro_cantidad_disponible as cantidad_disponible,
                pro_precio as precio,
                pro_nombre as nombre,
                pro_fecha_caducidad as fecha_caducidad,
                pro_descripcion as descripcion,
                pro_prov_id_fk as proveedor_id,
                pro_det_id_fk as detalle_id
            FROM producto
        """)
        productos = cursor.fetchall()
        cursor.close()
        return productos
    except Exception as e:
        print(f"Error en listarProducto: {str(e)}")
        return []