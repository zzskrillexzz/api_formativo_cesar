from flask import current_app
from models.inventarios_movimientos_model import inventarios_movimientos
from utils.search_builder import SearchBuilder

def listarInventariosMovimientos(page=1, limit=50, q=None, order_by=None, **filters):
    c = current_app.mysql.connection.cursor()
    sb = SearchBuilder(
        table='t_inventario_movimiento',
        search_fields=['inm_id', 'inm_tipo_movimiento', 'inm_motivo'],
        exact_fields=['inm_tipo_movimiento', 'inm_pro_id_fk', 'inm_lot_id_fk', 'inm_usu_id_fk'],
        range_fields={'inm_fecha': 'date', 'inm_cantidad': 'int'},
        default_order='inm_fecha DESC'
    )
    result = sb.execute(c, page=page, limit=limit, q=q, order_by=order_by, **filters)
    c.close()

    lista = []
    for item in result['data']:
        inv = inventarios_movimientos(
            inm_id=item['inm_id'],
            inm_tipo_movimiento=item['inm_tipo_movimiento'],
            inm_pro_id_fk=item['inm_pro_id_fk'],
            inm_cantidad=item['inm_cantidad'],
            inm_fecha=item['inm_fecha'],
            inm_motivo=item['inm_motivo'],
            inm_usu_id_fk=item.get('inm_usu_id_fk'),
            inm_lot_id_fk=item.get('inm_lot_id_fk')
        ).todic()
        lista.append(inv)

    result['data'] = lista
    return result


def registrarInventariosMovimientos(INM_ID, INM_TIPO_MOVIMIENTO, INM_PRO_ID_FK, INM_CANTIDAD, INM_FECHA, INM_MOTIVO, INM_USU_ID_FK, INM_LOT_ID_FK=None):
    c = current_app.mysql.connection.cursor()
    sql = """
        INSERT INTO t_inventario_movimiento (inm_id, inm_tipo_movimiento, inm_pro_id_fk, inm_cantidad, inm_fecha, inm_motivo, inm_usu_id_fk, inm_lot_id_fk) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    c.execute(sql, (INM_ID, INM_TIPO_MOVIMIENTO, INM_PRO_ID_FK, INM_CANTIDAD, INM_FECHA, INM_MOTIVO, INM_USU_ID_FK, INM_LOT_ID_FK))
    current_app.mysql.connection.commit()
    
    id = c.lastrowid
    c.close()
    return inventarios_movimientos(INM_ID, INM_TIPO_MOVIMIENTO, INM_PRO_ID_FK, INM_CANTIDAD, INM_FECHA, INM_MOTIVO, INM_USU_ID_FK, INM_LOT_ID_FK).todic()
