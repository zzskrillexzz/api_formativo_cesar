from flask import current_app
from models.detalles_compras_model import detalles_compras

def listarDetallesCompras():
    c = current_app.mysql.connection.cursor()
    sql = """
        SELECT dco_id, dco_com_id_fk, dco_pro_id_fk, dco_lot_id_fk, dco_cantidad, dco_precio_compra, dco_subtotal 
        FROM t_detalle_compra
    """
    c.execute(sql)
    datos = c.fetchall()
    lista = []
    for p in datos:
        dc = detalles_compras(p[0], p[1], p[2], p[3], p[4], p[5], p[6]).todic()
        lista.append(dc)
    return lista

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