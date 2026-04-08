from flask import current_app
import MySQLdb.cursors

def listarMovimientos():
    try:
        cursor = current_app.mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute("""
            SELECT 
                inm_id              AS id,
                inm_tipo_movimiento AS tipo_movimiento,
                inm_pro_id_fk       AS producto_id,
                inm_cantidad        AS cantidad,
                inm_fecha           AS fecha,
                inm_motivo          AS motivo,
                inm_usu_id_fk       AS usuario_id
            FROM t_inventario_movimiento
        """)
        datos = cursor.fetchall()
        cursor.close()
        return datos
    except Exception as e:
        print(f"Error en listarMovimientos: {str(e)}")
        return []

def registrarMovimiento(data):
    try:
        cursor = current_app.mysql.connection.cursor()
        sql = """
            INSERT INTO t_inventario_movimiento 
                (inm_id, inm_tipo_movimiento, inm_pro_id_fk, inm_cantidad, inm_fecha, inm_motivo, inm_usu_id_fk)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql, (
            data.get('id'),
            data.get('tipo_movimiento'),
            data.get('producto_id'),
            data.get('cantidad'),
            data.get('fecha'),
            data.get('motivo'),
            data.get('usuario_id')
        ))
        current_app.mysql.connection.commit()
        cursor.close()
        return {"mensaje": "Movimiento registrado correctamente"}
    except Exception as e:
        print(f"Error en registrarMovimiento: {str(e)}")
        raise e

def editarMovimiento(inm_id, data):
    try:
        cursor = current_app.mysql.connection.cursor()
        sql = """
            UPDATE t_inventario_movimiento
            SET inm_tipo_movimiento = %s,
                inm_pro_id_fk       = %s,
                inm_cantidad        = %s,
                inm_fecha           = %s,
                inm_motivo          = %s,
                inm_usu_id_fk       = %s
            WHERE inm_id = %s
        """
        cursor.execute(sql, (
            data.get('tipo_movimiento'),
            data.get('producto_id'),
            data.get('cantidad'),
            data.get('fecha'),
            data.get('motivo'),
            data.get('usuario_id'),
            inm_id
        ))
        current_app.mysql.connection.commit()
        cursor.close()
        return {"mensaje": "Movimiento actualizado correctamente"}
    except Exception as e:
        print(f"Error en editarMovimiento: {str(e)}")
        raise e

def eliminarMovimiento(inm_id):
    try:
        cursor = current_app.mysql.connection.cursor()
        cursor.execute("DELETE FROM t_inventario_movimiento WHERE inm_id = %s", (inm_id,))
        current_app.mysql.connection.commit()
        cursor.close()
        return {"mensaje": "Movimiento eliminado correctamente"}
    except Exception as e:
        print(f"Error en eliminarMovimiento: {str(e)}")
        raise e

def buscarMovimiento(inm_id):
    try:
        cursor = current_app.mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute("""
            SELECT 
                inm_id              AS id,
                inm_tipo_movimiento AS tipo_movimiento,
                inm_pro_id_fk       AS producto_id,
                inm_cantidad        AS cantidad,
                inm_fecha           AS fecha,
                inm_motivo          AS motivo,
                inm_usu_id_fk       AS usuario_id
            FROM t_inventario_movimiento
            WHERE inm_id = %s
        """, (inm_id,))
        dato = cursor.fetchone()
        cursor.close()
        return dato
    except Exception as e:
        print(f"Error en buscarMovimiento: {str(e)}")
        raise e