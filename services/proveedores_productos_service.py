from flask import current_app
from models.proveedores_productos_model import proveedores_productos

def listarProveedoresProductos():
    c = current_app.mysql.connection.cursor()
    sql = "SELECT ppp_prov_id_fk, ppp_pro_id_fk FROM t_proveedor_producto"
    c.execute(sql)
    datos = c.fetchall()
    
    lista = []
    for p in datos:
        pp = proveedores_productos(
            ppp_prov_id_fk = p[0],
            ppp_pro_id_fk = p[1]
        ).todic()
        lista.append(pp)
    
    return lista


def registrarProveedoresProductos(PPP_PROV_ID_FK, PPP_PRO_ID_FK):
    c = current_app.mysql.connection.cursor()
    sql = """
        INSERT INTO t_proveedor_producto (ppp_prov_id_fk, ppp_pro_id_fk) 
        VALUES (%s, %s)
    """
    c.execute(sql, (PPP_PROV_ID_FK, PPP_PRO_ID_FK))
    current_app.mysql.connection.commit()
    id = c.lastrowid
    c.close()
    return proveedores_productos(PPP_PROV_ID_FK, PPP_PRO_ID_FK).todic()


def eliminarProveedoresProductos(PPP_PROV_ID_FK, PPP_PRO_ID_FK):
    c = current_app.mysql.connection.cursor()
    sql = """
        DELETE FROM t_proveedor_producto 
        WHERE ppp_prov_id_fk = %s AND ppp_pro_id_fk = %s
    """
    c.execute(sql, (PPP_PROV_ID_FK, PPP_PRO_ID_FK))
    current_app.mysql.connection.commit()
    c.close()
    return {"mensaje": "Relación proveedor-producto eliminada correctamente"}


def buscarProductosPorProveedor(PPP_PROV_ID_FK):
    c = current_app.mysql.connection.cursor()
    sql = "SELECT ppp_prov_id_fk, ppp_pro_id_fk FROM t_proveedor_producto WHERE ppp_prov_id_fk = %s"
    c.execute(sql, (PPP_PROV_ID_FK,))
    datos = c.fetchall()
    
    lista = []
    for p in datos:
        pp = proveedores_productos(p[0], p[1]).todic()
        lista.append(pp)
    
    return lista


def buscarProveedoresPorProducto(PPP_PRO_ID_FK):
    c = current_app.mysql.connection.cursor()
    sql = "SELECT ppp_prov_id_fk, ppp_pro_id_fk FROM t_proveedor_producto WHERE ppp_pro_id_fk = %s"
    c.execute(sql, (PPP_PRO_ID_FK,))
    datos = c.fetchall()
    
    lista = []
    for p in datos:
        pp = proveedores_productos(p[0], p[1]).todic()
        lista.append(pp)
    
    return lista