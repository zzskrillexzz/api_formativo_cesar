from models.factura_model import factura
import MySQLdb.cursors
from flask import current_app

def listarFactura():
    try:
        cursor = current_app.mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute("""
            SELECT
                fac_id as id,
                fac_fecha_emision as fecha_emision,
                fac_email_enviado as email_enviado,
                fac_forma_pago as forma_pago,
                fac_total as total,
                fac_usu_id_fk as usuario_id
            FROM factura
        """)
        facturas = cursor.fetchall()
        cursor.close()
        return facturas
    except Exception as e:
        print(f"Error en listarFactura: {str(e)}")
        return []