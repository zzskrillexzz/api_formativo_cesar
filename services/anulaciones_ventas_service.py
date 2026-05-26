from flask import current_app
from models.anulaciones_ventas_model import anulaciones_ventas
from utils.search_builder import SearchBuilder

def listarAnulacionesVentas(page=1, limit=50, q=None, order_by=None, **filters):
    c = current_app.mysql.connection.cursor()
    sb = SearchBuilder(
        table='t_anulacion_venta',
        search_fields=['anu_id', 'anu_motivo'],
        exact_fields=['anu_fac_id_fk', 'anu_usu_id_fk'],
        range_fields={'anu_fecha': 'date'},
        default_order='anu_fecha DESC'
    )
    result = sb.execute(c, page=page, limit=limit, q=q, order_by=order_by, **filters)
    c.close()

    lista = []
    for item in result['data']:
        av = anulaciones_ventas(item['anu_id'], item['anu_fac_id_fk'], item['anu_usu_id_fk'],
                                item['anu_fecha'], item['anu_motivo']).todic()
        lista.append(av)

    result['data'] = lista
    return result

def registrarAnulacionesVentas(ANU_ID, ANU_FAC_ID_FK, ANU_USU_ID_FK, ANU_FECHA, ANU_MOTIVO):
    c = current_app.mysql.connection.cursor()
    sql = """
        INSERT INTO t_anulacion_venta (anu_id, anu_fac_id_fk, anu_usu_id_fk, anu_fecha, anu_motivo) 
        VALUES (%s, %s, %s, %s, %s)
    """
    c.execute(sql, (ANU_ID, ANU_FAC_ID_FK, ANU_USU_ID_FK, ANU_FECHA, ANU_MOTIVO))
    current_app.mysql.connection.commit()
    id = c.lastrowid
    c.close()
    return anulaciones_ventas(ANU_ID, ANU_FAC_ID_FK, ANU_USU_ID_FK, ANU_FECHA, ANU_MOTIVO).todic()

def editarAnulacionesVentas(ANU_ID, ANU_FAC_ID_FK, ANU_USU_ID_FK, ANU_FECHA, ANU_MOTIVO):
    c = current_app.mysql.connection.cursor()
    sql = """
        UPDATE t_anulacion_venta
        SET anu_fac_id_fk=%s, anu_usu_id_fk=%s, anu_fecha=%s, anu_motivo=%s
        WHERE anu_id=%s
    """
    c.execute(sql, (ANU_FAC_ID_FK, ANU_USU_ID_FK, ANU_FECHA, ANU_MOTIVO, ANU_ID))
    current_app.mysql.connection.commit()
    filas = c.rowcount
    c.close()
    if filas == 0:
        return None
    return anulaciones_ventas(ANU_ID, ANU_FAC_ID_FK, ANU_USU_ID_FK, ANU_FECHA, ANU_MOTIVO).todic()


def eliminarAnulacionesVentas(ANU_ID):
    c = current_app.mysql.connection.cursor()
    c.execute("DELETE FROM t_anulacion_venta WHERE anu_id=%s", (ANU_ID,))
    current_app.mysql.connection.commit()
    filas = c.rowcount
    c.close()
    return filas > 0


def buscarAnulacionVenta(ANU_ID):
    c = current_app.mysql.connection.cursor()
    c.execute("""
        SELECT anu_id, anu_fac_id_fk, anu_usu_id_fk, anu_fecha, anu_motivo
        FROM t_anulacion_venta WHERE anu_id=%s
    """, (ANU_ID,))
    r = c.fetchone()
    c.close()
    if not r:
        return None
    return anulaciones_ventas(r[0], r[1], r[2], r[3], r[4]).todic()
