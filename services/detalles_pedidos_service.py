from flask import current_app
from models.detalles_pedidos_model import detalles_pedidos

def listarDetallesPedidos():
    c = current_app.mysql.connection.cursor()
    
    sql = "SELECT det_id, det_cantidad, det_subtotal, det_ped_id_fk, det_pro_id_fk, det_precio_unitario FROM t_detalle_pedido"
    c.execute(sql)
    obj = c.fetchall()
    
    listadetped = []
    
    for x in obj:
        det = detalles_pedidos(
            ID = int(x[0]) if str(x[0]).isdigit() else None,
            CANTIDAD = x[1],
            SUBTOTAL = x[2],
            det_ped_id_fk = x[3],
            det_pro_id_fk = x[4],
            det_precio_unitario = x[5]
        ).diccionario_ped()
        listadetped.append(det)
        
    return listadetped


def registrarDetallesPedidos(ID, CANTIDAD, SUBTOTAL, det_ped_id_fk=None, det_pro_id_fk=None, det_precio_unitario=None):
    c = current_app.mysql.connection.cursor()
    sql = "INSERT INTO t_detalle_pedido (det_id, det_cantidad, det_subtotal, det_ped_id_fk, det_pro_id_fk, det_precio_unitario) VALUES (%s, %s, %s, %s, %s, %s)"
    
    c.execute(sql, (ID, CANTIDAD, SUBTOTAL, det_ped_id_fk, det_pro_id_fk, det_precio_unitario))
    current_app.mysql.connection.commit()
    
    c.close()
    return detalles_pedidos(ID, CANTIDAD, SUBTOTAL, det_ped_id_fk, det_pro_id_fk, det_precio_unitario).diccionario_ped()