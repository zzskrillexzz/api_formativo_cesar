from flask import current_app
from models.alertas_vencimientos_model import alertas_vencimientos
from utils.search_builder import SearchBuilder

def listarAlertasVencimientos(page=1, limit=50, q=None, order_by=None, **filters):
    c = current_app.mysql.connection.cursor()
    sb = SearchBuilder(
        table='t_alerta_vencimiento',
        search_fields=['alv_id'],
        exact_fields=['alv_estado', 'alv_pro_id_fk', 'alv_lot_id_fk'],
        range_fields={'alv_fecha_generacion': 'date', 'alv_fecha_vencimiento': 'date', 'alv_dias_restantes': 'int'},
        default_order='alv_fecha_vencimiento ASC'
    )
    result = sb.execute(c, page=page, limit=limit, q=q, order_by=order_by, **filters)
    c.close()

    lista = []
    for item in result['data']:
        av = alertas_vencimientos(item['alv_id'], item['alv_pro_id_fk'], item['alv_lot_id_fk'],
                                  item['alv_fecha_generacion'], item['alv_fecha_vencimiento'],
                                  item['alv_dias_restantes'], item['alv_estado'], item.get('alv_usu_id_fk')).todic()
        lista.append(av)

    result['data'] = lista
    return result

def registrarAlertasVencimientos(ALV_ID, ALV_PRO_ID_FK, ALV_LOT_ID_FK, ALV_FECHA_GENERACION, ALV_FECHA_VENCIMIENTO, ALV_DIAS_RESTANTES, ALV_ESTADO, ALV_USU_ID_FK):
    c = current_app.mysql.connection.cursor()
    sql = """
        INSERT INTO t_alerta_vencimiento (alv_id, alv_pro_id_fk, alv_lot_id_fk, alv_fecha_generacion, alv_fecha_vencimiento, alv_dias_restantes, alv_estado, alv_usu_id_fk) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    c.execute(sql, (ALV_ID, ALV_PRO_ID_FK, ALV_LOT_ID_FK, ALV_FECHA_GENERACION, ALV_FECHA_VENCIMIENTO, ALV_DIAS_RESTANTES, ALV_ESTADO, ALV_USU_ID_FK))
    current_app.mysql.connection.commit()
    id = c.lastrowid
    c.close()
    return alertas_vencimientos(ALV_ID, ALV_PRO_ID_FK, ALV_LOT_ID_FK, ALV_FECHA_GENERACION, ALV_FECHA_VENCIMIENTO, ALV_DIAS_RESTANTES, ALV_ESTADO, ALV_USU_ID_FK).todic()

def editarAlertasVencimientos(ALV_ID, data):
    c = current_app.mysql.connection.cursor()
    sql = """
        UPDATE t_alerta_vencimiento
        SET alv_estado=%s, alv_usu_id_fk=%s
        WHERE alv_id=%s
    """
    c.execute(sql, (data.get('alv_estado', 'Pendiente'), data.get('alv_usu_id_fk'), ALV_ID))
    current_app.mysql.connection.commit()
    c.close()
    return {"mensaje": "Alerta actualizada"}


def eliminarAlertasVencimientos(ALV_ID):
    c = current_app.mysql.connection.cursor()
    c.execute("DELETE FROM t_alerta_vencimiento WHERE alv_id = %s", (ALV_ID,))
    current_app.mysql.connection.commit()
    c.close()
    return {"mensaje": "Alerta eliminada"}


def buscarAlertasVencimientos(ALV_ID):
    c = current_app.mysql.connection.cursor()
    c.execute("""
        SELECT alv_id, alv_pro_id_fk, alv_lot_id_fk, alv_fecha_generacion,
               alv_fecha_vencimiento, alv_dias_restantes, alv_estado, alv_usu_id_fk
        FROM t_alerta_vencimiento WHERE alv_id = %s
    """, (ALV_ID,))
    row = c.fetchone()
    c.close()
    if row:
        return {
            "alv_id": row[0], "alv_pro_id_fk": row[1], "alv_lot_id_fk": row[2],
            "alv_fecha_generacion": str(row[3]) if row[3] else None,
            "alv_fecha_vencimiento": str(row[4]) if row[4] else None,
            "alv_dias_restantes": row[5], "alv_estado": row[6],
            "alv_usu_id_fk": row[7]
        }
    return None
