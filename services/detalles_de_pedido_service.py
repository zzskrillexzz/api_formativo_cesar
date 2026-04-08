from flask import current_app
from models.detalles_de_pedido_model import detalle_de_pedido

def listarDetallePedido():
    c = current_app.mysql.connection.cursor()
    
    sql = "SELECT det_id, det_cantidad, det_subtotal FROM t_detalle_pedido"
    c.execute(sql)
    obj = c.fetchall()
    
    listadetped = []
    
    for x in obj:
        det = detalle_de_pedido(
            ID = int(x[0]) if str(x[0]).isdigit() else None,
            CATIDAD= x[1],
            SUBTOTAL    = x[2]            
        ).diccionario_ped()
        listadetped.append(det)
    return listadetped

