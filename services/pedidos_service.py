from flask import current_app
from models.pedidos_model import pedidos

def listarPedidos():
    c = current_app.mysql.connection.cursor()
    sql = "SELECT ped_id, ped_fecha, ped_metodo_pago, ped_estado_entrega, ped_total, ped_cli_id_fk, ped_usu_id_fk FROM t_pedido"
    c.execute(sql)
    reg = c.fetchall()
    listav = []
    for p in reg:
        ped = pedidos(
            ID=p[0], FECHA=p[1], METODO_DE_PAGO=p[2], ESTADO=p[3],
            TOTAL=p[4], ID_CLIENTE=p[5], ped_usu_id_fk=p[6]
        ).a_diccionario()
        listav.append(ped)
    return listav

def registrarPedidos(ID, FECHA, METODO_DE_PAGO, ESTADO, TOTAL, ID_CLIENTE, ped_usu_id_fk=None):
    c = current_app.mysql.connection.cursor()
    sql = "INSERT INTO t_pedido (ped_id, ped_fecha, ped_metodo_pago, ped_estado_entrega, ped_total, ped_cli_id_fk, ped_usu_id_fk) VALUES (%s,%s,%s,%s,%s,%s,%s)"
    c.execute(sql, (ID, FECHA, METODO_DE_PAGO, ESTADO, TOTAL, ID_CLIENTE, ped_usu_id_fk))
    current_app.mysql.connection.commit()
    c.close()
    return pedidos(ID, FECHA, METODO_DE_PAGO, ESTADO, TOTAL, ID_CLIENTE, ped_usu_id_fk).a_diccionario()
