from flask import current_app
from models.inventarios_movimientos_model import inventarios_movimientos

def listarInventariosMovimientos():
    c = current_app.mysql.connection.cursor()
    
    sql = """
        SELECT inm_id, inm_tipo_movimiento, inm_pro_id_fk, inm_cantidad, inm_fecha, inm_motivo, inm_usu_id_fk, inm_lot_id_fk 
        FROM t_inventario_movimiento
    """
    c.execute(sql)
    datos = c.fetchall()
    
    lista = []
    
    for p in datos:
        inv = inventarios_movimientos(
            inm_id = p[0],
            inm_tipo_movimiento = p[1],
            inm_pro_id_fk = p[2],
            inm_cantidad = p[3],
            inm_fecha = p[4],
            inm_motivo = p[5],
            inm_usu_id_fk = p[6],
            inm_lot_id_fk = p[7]
        ).todic()
        lista.append(inv)
    
    return lista


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