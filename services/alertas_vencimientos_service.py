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

def editarAlertasVencimientos():
    return

def eliminarAlertasVencimientos():
    return

def buscarAlertasVencimientos():
    return
