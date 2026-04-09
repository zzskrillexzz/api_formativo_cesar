from flask import current_app
from models.clientes_model import clientes

def listarClientes():
    c = current_app.mysql.connection.cursor()
    
    sql = """
        SELECT cli_id, cli_tipo_documento, cli_nombre, cli_apellido, cli_telefono, cli_direccion, cli_correo 
        FROM t_cliente
    """
    c.execute(sql)
    datos = c.fetchall()
    
    lista = []
    
    for p in datos:
        cli = clientes(
            cli_id = p[0],
            cli_tipo_documento = p[1],
            cli_nombre = p[2],
            cli_apellido = p[3],
            cli_telefono = p[4],
            cli_direccion = p[5],
            cli_correo = p[6]
        ).todic()
        lista.append(cli)
    
    return lista


def registrarClientes(CLI_ID, CLI_TIPO_DOCUMENTO, CLI_NOMBRE, CLI_APELLIDO, CLI_TELEFONO, CLI_DIRECCION, CLI_CORREO):
    c = current_app.mysql.connection.cursor()
    sql = """
        INSERT INTO t_cliente (cli_id, cli_tipo_documento, cli_nombre, cli_apellido, cli_telefono, cli_direccion, cli_correo) 
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    
    c.execute(sql, (CLI_ID, CLI_TIPO_DOCUMENTO, CLI_NOMBRE, CLI_APELLIDO, CLI_TELEFONO, CLI_DIRECCION, CLI_CORREO))
    current_app.mysql.connection.commit()
    id = c.lastrowid
    c.close()
    return clientes(CLI_ID, CLI_TIPO_DOCUMENTO, CLI_NOMBRE, CLI_APELLIDO, CLI_TELEFONO, CLI_DIRECCION, CLI_CORREO).todic()


def editarClientes():
    return


def eliminarClientes():
    return


def buscarClientes():
    return