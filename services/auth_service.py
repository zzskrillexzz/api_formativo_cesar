from flask import current_app
from datetime import datetime, timedelta
import bcrypt
import jwt

def buscarPorCorreo(USU_CORREO):
    c = current_app.mysql.connection.cursor()
    sql = """
        SELECT usu_id, usu_nombre, usu_rol, usu_correo, usu_contrasena, usu_estado
        FROM t_usuario
        WHERE usu_correo = %s
    """
    c.execute(sql, (USU_CORREO,))
    p = c.fetchone()
    c.close()
    if p:
        return {
            "usu_id":         p[0],
            "usu_nombre":     p[1],
            "usu_rol":        p[2],
            "usu_correo":     p[3],
            "usu_contrasena": p[4],
            "usu_estado":     p[5]
        }
    return None

def verificarPassword(password_plano, password_hash):
    return bcrypt.checkpw(
        password_plano.encode('utf-8'),
        password_hash.encode('utf-8')
    )

def crearToken(usu_id, usu_correo, usu_rol):
    print("SECRET_KEY:", current_app.config['SECRET_KEY'])  # ← agrega esto
    payload = {
        "sub": usu_correo,
        "id":  usu_id,
        "rol": usu_rol,
        "exp": datetime.utcnow() + timedelta(hours=8)
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm="HS256")

def login(USU_CORREO, USU_CONTRASENA):
    usuario = buscarPorCorreo(USU_CORREO)
    if not usuario:
        return None
    if not verificarPassword(USU_CONTRASENA, usuario['usu_contrasena']):
        return None
    if usuario['usu_estado'] != 1:
        return None
    token = crearToken(usuario['usu_id'], usuario['usu_correo'], usuario['usu_rol'])
    return {
        "access_token": token,
        "token_type":   "bearer",
        "usu_nombre":   usuario['usu_nombre'],
        "usu_rol":      usuario['usu_rol']
    }