from flask import current_app
from models.detalles_compras_model import detalles_compras
from utils.search_builder import SearchBuilder

def listarDetallesCompras(page=1, limit=50, q=None, order_by=None, **filters):
    c = current_app.mysql.connection.cursor()
    sb = SearchBuilder(
        table='t_detalle_compra',
        search_fields=['dco_id', 'dco_com_id_fk', 'dco_pro_id_fk'],
        exact_fields=['dco_com_id_fk', 'dco_pro_id_fk', 'dco_lot_id_fk'],
        default_order='dco_id ASC'
    )
    result = sb.execute(c, page=page, limit=limit, q=q, order_by=order_by, **filters)
    c.close()

    lista = []
    for item in result['data']:
        dc = detalles_compras(item['dco_id'], item['dco_com_id_fk'], item['dco_pro_id_fk'],
                              item.get('dco_lot_id_fk'), item['dco_cantidad'],
                              item['dco_precio_compra'], item['dco_subtotal']).todic()
        lista.append(dc)

    result['data'] = lista
    return result

def registrarDetallesCompras(DCO_ID, DCO_COM_ID_FK, DCO_PRO_ID_FK, DCO_LOT_ID_FK, DCO_CANTIDAD, DCO_PRECIO_COMPRA, DCO_SUBTOTAL):
    c = current_app.mysql.connection.cursor()
    sql = """
        INSERT INTO t_detalle_compra (dco_id, dco_com_id_fk, dco_pro_id_fk, dco_lot_id_fk, dco_cantidad, dco_precio_compra, dco_subtotal) 
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    c.execute(sql, (DCO_ID, DCO_COM_ID_FK, DCO_PRO_ID_FK, DCO_LOT_ID_FK, DCO_CANTIDAD, DCO_PRECIO_COMPRA, DCO_SUBTOTAL))
    current_app.mysql.connection.commit()
    id = c.lastrowid
    c.close()
    return detalles_compras(DCO_ID, DCO_COM_ID_FK, DCO_PRO_ID_FK, DCO_LOT_ID_FK, DCO_CANTIDAD, DCO_PRECIO_COMPRA, DCO_SUBTOTAL).todic()

def editarDetallesCompras():
    return

def eliminarDetallesCompras():
    return

def buscarDetallesCompras():
    return
