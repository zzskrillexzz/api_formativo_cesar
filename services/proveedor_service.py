from flask import current_app
import MySQLdb.cursors

def listarProveedores():
    try:
        cursor = current_app.mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute("""
            SELECT 
                prov_id        AS id,
                prov_nombre    AS nombre,
                prov_contacto  AS contacto,
                prov_direccion AS direccion,
                prov_email     AS email,
                prov_pro_id_fk AS producto_id
            FROM t_proveedor
        """)
        datos = cursor.fetchall()
        cursor.close()
        return datos
    except Exception as e:
        print(f"Error en listarProveedores: {str(e)}")
        return []

def registrarProveedor(data):
    try:
        cursor = current_app.mysql.connection.cursor()
        sql = """
            INSERT INTO t_proveedor (prov_id, prov_nombre, prov_contacto, prov_direccion, prov_email, prov_pro_id_fk)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql, (
            data.get('id'),
            data.get('nombre'),
            data.get('contacto'),
            data.get('direccion'),
            data.get('email'),
            data.get('producto_id')
        ))
        current_app.mysql.connection.commit()
        cursor.close()
        return {"mensaje": "Proveedor registrado correctamente"}
    except Exception as e:
        print(f"Error en registrarProveedor: {str(e)}")
        raise e

def editarProveedor(prov_id, data):
    try:
        cursor = current_app.mysql.connection.cursor()
        sql = """
            UPDATE t_proveedor
            SET prov_nombre = %s,
                prov_contacto = %s,
                prov_direccion = %s,
                prov_email = %s,
                prov_pro_id_fk = %s
            WHERE prov_id = %s
        """
        cursor.execute(sql, (
            data.get('nombre'),
            data.get('contacto'),
            data.get('direccion'),
            data.get('email'),
            data.get('producto_id'),
            prov_id
        ))
        current_app.mysql.connection.commit()
        cursor.close()
        return {"mensaje": "Proveedor actualizado correctamente"}
    except Exception as e:
        print(f"Error en editarProveedor: {str(e)}")
        raise e

def eliminarProveedor(prov_id):
    try:
        cursor = current_app.mysql.connection.cursor()
        cursor.execute("DELETE FROM t_proveedor WHERE prov_id = %s", (prov_id,))
        current_app.mysql.connection.commit()
        cursor.close()
        return {"mensaje": "Proveedor eliminado correctamente"}
    except Exception as e:
        print(f"Error en eliminarProveedor: {str(e)}")
        raise e

def buscarProveedor(prov_id):
    try:
        cursor = current_app.mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute("""
            SELECT 
                prov_id        AS id,
                prov_nombre    AS nombre,
                prov_contacto  AS contacto,
                prov_direccion AS direccion,
                prov_email     AS email,
                prov_pro_id_fk AS producto_id
            FROM t_proveedor
            WHERE prov_id = %s
        """, (prov_id,))
        dato = cursor.fetchone()
        cursor.close()
        return dato
    except Exception as e:
        print(f"Error en buscarProveedor: {str(e)}")
        raise e