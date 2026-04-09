from flask import current_app
from models.proveedores_model import proveedores

def listarProveedores():
    c = current_app.mysql.connection.cursor()
    sql = "SELECT prov_id, prov_nit, prov_nombre, prov_tipo, prov_contacto, prov_direccion, prov_email FROM t_proveedor"
    c.execute(sql)
    reg = c.fetchall()
    lista = []
    for p in reg:
        prov = proveedores(
            provID=p[0], provNit=p[1], provNombre=p[2], provTipo=p[3],
            provContacto=p[4], provDireccion=p[5], provEmail=p[6]
        ).todic()
        lista.append(prov)
    return lista

def registrarProveedores(data):
    try:
        cursor = current_app.mysql.connection.cursor()
        sql = """
            INSERT INTO t_proveedor (prov_id, prov_nit, prov_nombre, prov_tipo, prov_contacto, prov_direccion, prov_email)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql, (
            data.get('id'),
            data.get('nit'),
            data.get('nombre'),
            data.get('tipo', 'Laboratorio'),
            data.get('contacto'),
            data.get('direccion'),
            data.get('email')
        ))
        current_app.mysql.connection.commit()
        cursor.close()
        return {"mensaje": "Proveedor registrado correctamente"}
    except Exception as e:
        raise e
