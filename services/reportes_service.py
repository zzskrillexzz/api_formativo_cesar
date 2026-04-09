from flask import current_app
from models.reportes_model import reportes

def listarReportes():
    c = current_app.mysql.connection.cursor()
    sql = "SELECT rep_id, rep_tipo, rep_fecha, rep_parametros, rep_usu_id_fk, rep_resultado FROM t_reporte"
    c.execute(sql)
    datos = c.fetchall()
    lista = []
    for p in datos:
        r = reportes(p[0], p[1], p[2], p[3], p[4], p[5]).todic()
        lista.append(r)
    return lista

def registrarReportes(REP_ID, REP_TIPO, REP_FECHA, REP_PARAMETROS, REP_USU_ID_FK, REP_RESULTADO):
    c = current_app.mysql.connection.cursor()
    sql = """
        INSERT INTO t_reporte (rep_id, rep_tipo, rep_fecha, rep_parametros, rep_usu_id_fk, rep_resultado) 
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    c.execute(sql, (REP_ID, REP_TIPO, REP_FECHA, REP_PARAMETROS, REP_USU_ID_FK, REP_RESULTADO))
    current_app.mysql.connection.commit()
    id = c.lastrowid
    c.close()
    return reportes(REP_ID, REP_TIPO, REP_FECHA, REP_PARAMETROS, REP_USU_ID_FK, REP_RESULTADO).todic()

def editarReportes():
    return

def eliminarReportes():
    return

def buscarReportes():
    return