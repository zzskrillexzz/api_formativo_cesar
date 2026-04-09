from flask import current_app
from models.lotes_model import lotes

def listarLotes():
    c = current_app.mysql.connection.cursor()
    sql = """
        SELECT lot_id, lot_numero, lot_fecha_fabricacion, lot_fecha_vencimiento, 
               lot_cantidad_inicial, lot_cantidad_actual, lot_pro_id_fk, lot_prov_id_fk, lot_estado 
        FROM t_lote
    """
    c.execute(sql)
    datos = c.fetchall()
    
    lista = []
    for x in datos:
        l = lotes(
            lot_id = x[0],
            lot_numero = x[1],
            lot_fecha_fabricacion = x[2],
            lot_fecha_vencimiento = x[3],
            lot_cantidad_inicial = x[4],
            lot_cantidad_actual = x[5],
            lot_pro_id_fk = x[6],
            lot_prov_id_fk = x[7],
            lot_estado = x[8]
        ).todic()
        lista.append(l)
    return lista

def registrarLotes(LOT_ID, LOT_NUMERO, LOT_FECHA_FABRICACION, LOT_FECHA_VENCIMIENTO, 
                   LOT_CANTIDAD_INICIAL, LOT_CANTIDAD_ACTUAL, LOT_PRO_ID_FK, LOT_PROV_ID_FK, LOT_ESTADO):
    c = current_app.mysql.connection.cursor()
    sql = """
        INSERT INTO t_lote (lot_id, lot_numero, lot_fecha_fabricacion, lot_fecha_vencimiento, 
                            lot_cantidad_inicial, lot_cantidad_actual, lot_pro_id_fk, lot_prov_id_fk, lot_estado) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    c.execute(sql, (LOT_ID, LOT_NUMERO, LOT_FECHA_FABRICACION, LOT_FECHA_VENCIMIENTO, 
                    LOT_CANTIDAD_INICIAL, LOT_CANTIDAD_ACTUAL, LOT_PRO_ID_FK, LOT_PROV_ID_FK, LOT_ESTADO))
    current_app.mysql.connection.commit()
    c.close()
    return lotes(LOT_ID, LOT_NUMERO, LOT_FECHA_FABRICACION, LOT_FECHA_VENCIMIENTO, 
                 LOT_CANTIDAD_INICIAL, LOT_CANTIDAD_ACTUAL, LOT_PRO_ID_FK, LOT_PROV_ID_FK, LOT_ESTADO).todic()

def buscarLotes(LOT_ID):
    c = current_app.mysql.connection.cursor()
    sql = """
        SELECT lot_id, lot_numero, lot_fecha_fabricacion, lot_fecha_vencimiento, 
               lot_cantidad_inicial, lot_cantidad_actual, lot_pro_id_fk, lot_prov_id_fk, lot_estado 
        FROM t_lote WHERE lot_id = %s
    """
    c.execute(sql, (LOT_ID,))
    dato = c.fetchone()
    if dato:
        return lotes(dato[0], dato[1], dato[2], dato[3], dato[4], dato[5], dato[6], dato[7], dato[8]).todic()
    return None

def editarLotes(LOT_ID, data):
    c = current_app.mysql.connection.cursor()
    sql = """
        UPDATE t_lote 
        SET lot_numero = %s, lot_fecha_fabricacion = %s, lot_fecha_vencimiento = %s, 
            lot_cantidad_inicial = %s, lot_cantidad_actual = %s, lot_pro_id_fk = %s, 
            lot_prov_id_fk = %s, lot_estado = %s 
        WHERE lot_id = %s
    """
    c.execute(sql, (
        data.get('lot_numero'), data.get('lot_fecha_fabricacion'), data.get('lot_fecha_vencimiento'),
        data.get('lot_cantidad_inicial'), data.get('lot_cantidad_actual'), data.get('lot_pro_id_fk'),
        data.get('lot_prov_id_fk'), data.get('lot_estado'), LOT_ID
    ))
    current_app.mysql.connection.commit()
    c.close()
    return {"mensaje": "Lote actualizado correctamente"}

def eliminarLotes(LOT_ID):
    c = current_app.mysql.connection.cursor()
    c.execute("DELETE FROM t_lote WHERE lot_id = %s", (LOT_ID,))
    current_app.mysql.connection.commit()
    c.close()
    return {"mensaje": "Lote eliminado correctamente"}