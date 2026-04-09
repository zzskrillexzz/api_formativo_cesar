from flask import current_app
from models.alertas_vencimientos_model import alertas_vencimientos

def listarAlertasVencimientos():
    c = current_app.mysql.connection.cursor()
    sql = """
        SELECT alv_id, alv_pro_id_fk, alv_lot_id_fk, alv_fecha_generacion, alv_fecha_vencimiento, 
               alv_dias_restantes, alv_estado, alv_usu_id_fk 
        FROM t_alerta_vencimiento
    """
    c.execute(sql)
    datos = c.fetchall()
    lista = []
    for p in datos:
        av = alertas_vencimientos(p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7]).todic()
        lista.append(av)
    return lista

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