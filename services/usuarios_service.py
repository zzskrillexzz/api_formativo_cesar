from flask import current_app
from models.usuarios_model import usuarios

def listarUsuarios():
    c = current_app.mysql.connection.cursor()
    sql = """
        SELECT usu_id, usu_nombre, usu_rol, usu_correo, usu_contrasena, usu_estado, usu_ultimo_acceso 
        FROM t_usuario
    """
    c.execute(sql)
    datos = c.fetchall()
    
    lista = []
    for p in datos:
        u = usuarios(
            usu_id = p[0],
            usu_nombre = p[1],
            usu_rol = p[2],
            usu_correo = p[3],
            usu_contrasena = p[4],
            usu_estado = p[5],
            usu_ultimo_acceso = p[6]
        ).todic()
        lista.append(u)
    
    return lista


def registrarUsuarios(USU_ID, USU_NOMBRE, USU_ROL, USU_CORREO, USU_CONTRASENA, USU_ESTADO, USU_ULTIMO_ACCESO):
    c = current_app.mysql.connection.cursor()
    sql = """
        INSERT INTO t_usuario (usu_id, usu_nombre, usu_rol, usu_correo, usu_contrasena, usu_estado, usu_ultimo_acceso) 
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    c.execute(sql, (USU_ID, USU_NOMBRE, USU_ROL, USU_CORREO, USU_CONTRASENA, USU_ESTADO, USU_ULTIMO_ACCESO))
    current_app.mysql.connection.commit()
    id = c.lastrowid
    c.close()
    return usuarios(USU_ID, USU_NOMBRE, USU_ROL, USU_CORREO, USU_CONTRASENA, USU_ESTADO, USU_ULTIMO_ACCESO).todic()


def editarUsuarios():
    return


def eliminarUsuarios():
    return


def buscarUsuarios():
    return