from flask import current_app
from models.anulaciones_ventas_model import anulaciones_ventas

def listarAnulacionesVentas():
    c = current_app.mysql.connection.cursor()
    sql = "SELECT anu_id, anu_fac_id_fk, anu_usu_id_fk, anu_fecha, anu_motivo FROM t_anulacion_venta"
    c.execute(sql)
    datos = c.fetchall()
    lista = []
    for p in datos:
        av = anulaciones_ventas(p[0], p[1], p[2], p[3], p[4]).todic()
        lista.append(av)
    return lista

def registrarAnulacionesVentas(ANU_ID, ANU_FAC_ID_FK, ANU_USU_ID_FK, ANU_FECHA, ANU_MOTIVO):
    c = current_app.mysql.connection.cursor()
    sql = """
        INSERT INTO t_anulacion_venta (anu_id, anu_fac_id_fk, anu_usu_id_fk, anu_fecha, anu_motivo) 
        VALUES (%s, %s, %s, %s, %s)
    """
    c.execute(sql, (ANU_ID, ANU_FAC_ID_FK, ANU_USU_ID_FK, ANU_FECHA, ANU_MOTIVO))
    current_app.mysql.connection.commit()
    id = c.lastrowid
    c.close()
    return anulaciones_ventas(ANU_ID, ANU_FAC_ID_FK, ANU_USU_ID_FK, ANU_FECHA, ANU_MOTIVO).todic()

def editarAnulacionesVentas():
    return

def eliminarAnulacionesVentas():
    return

def buscarAnulacionesVentas():
    return