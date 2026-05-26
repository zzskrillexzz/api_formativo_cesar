from flask import current_app
from models.roles_model import roles
from utils.search_builder import SearchBuilder

def listarRoles(page=1, limit=50, q=None, order_by=None, **filters):
    c = current_app.mysql.connection.cursor()
    sb = SearchBuilder(
        table='t_rol',
        search_fields=['rol_id', 'rol_nombre', 'rol_descripcion'],
        exact_fields=['rol_estado'],
        default_order='rol_nombre ASC'
    )
    result = sb.execute(c, page=page, limit=limit, q=q, order_by=order_by, **filters)
    c.close()

    lista = []
    for item in result['data']:
        rol = roles(
            rol_id=item['rol_id'],
            rol_nombre=item['rol_nombre'],
            rol_descripcion=item['rol_descripcion'],
            rol_estado=item['rol_estado']
        ).toDic()
        lista.append(rol)

    result['data'] = lista
    return result

def registrarRoles(data):
    try:
        cursor = current_app.mysql.connection.cursor()
        sql = """
            INSERT INTO t_rol (rol_id, rol_nombre, rol_descripcion, rol_estado)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(sql, (
            data.get('id'),
            data.get('nombre'),
            data.get('descripcion'),
            data.get('estado', 1)
        ))
        current_app.mysql.connection.commit()
        cursor.close()
        return {"mensaje": "Rol registrado correctamente"}
    except Exception as e:
        raise e

def editarRoles(data):
    try:
        cursor = current_app.mysql.connection.cursor()
        sql = """
            UPDATE t_rol 
            SET rol_nombre = %s, rol_descripcion = %s, rol_estado = %s
            WHERE rol_id = %s
        """
        cursor.execute(sql, (
            data.get('nombre'),
            data.get('descripcion'),
            data.get('estado', 1),
            data.get('id')
        ))
        current_app.mysql.connection.commit()
        cursor.close()
        return {"mensaje": "Rol actualizado correctamente"}
    except Exception as e:
        raise e

def eliminarRoles(rol_id):
    try:
        cursor = current_app.mysql.connection.cursor()
        
        # Verificar si hay usuarios con este rol
        cursor.execute("SELECT usu_id FROM t_usuario WHERE usu_rol_id_fk = %s LIMIT 1", (rol_id,))
        if cursor.fetchone():
            cursor.close()
            return {"mensaje": "No se puede eliminar: hay usuarios con este rol", "error": True}
        
        sql = "DELETE FROM t_rol WHERE rol_id = %s"
        cursor.execute(sql, (rol_id,))
        current_app.mysql.connection.commit()
        cursor.close()
        return {"mensaje": "Rol eliminado correctamente"}
    except Exception as e:
        raise e

def buscarRoles(rol_id):
    try:
        cursor = current_app.mysql.connection.cursor()
        sql = "SELECT rol_id, rol_nombre, rol_descripcion, rol_estado FROM t_rol WHERE rol_id = %s"
        cursor.execute(sql, (rol_id,))
        p = cursor.fetchone()
        cursor.close()
        
        if p:
            return roles(
                rol_id=p[0],
                rol_nombre=p[1],
                rol_descripcion=p[2],
                rol_estado=p[3]
            ).toDic()
        return None
    except Exception as e:
        raise e
