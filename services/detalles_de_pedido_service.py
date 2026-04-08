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

def registrardetalledepedido(ID, CANTIDAD, SUBTOTAL):
    # 1. Abrimos la conexión
    c = current_app.mysql.connection.cursor()
    
    # 2. Preparamos el SQL (Asegúrate de que los nombres de columnas coincidan con tu DB)
    sql = "INSERT INTO t_detalle_pedido (det_id, det_cantidad, det_subtotal) VALUES (%s, %s, %s)"
    
    # 3. Ejecutamos y guardamos cambios
    c.execute(sql, (ID, CANTIDAD, SUBTOTAL))
    current_app.mysql.connection.commit()
    
    # 4. Cerramos el cursor
    c.close()
    
    # 5. Retornamos el objeto convertido a diccionario
    # IMPORTANTE: Usamos los paréntesis () al final para que devuelva los DATOS
    return detalle_de_pedido(ID, CANTIDAD, SUBTOTAL).diccionario_ped()