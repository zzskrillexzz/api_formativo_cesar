from flask import current_app
from models.mas_vendidos_model import mas_vendidos
from utils.search_builder import SearchBuilder

def listarMasVendidos(page=1, limit=50, q=None, order_by=None, **filters):
    c = current_app.mysql.connection.cursor()
    sb = SearchBuilder(
        table='v_mas_vendidos',
        search_fields=['pro_id', 'pro_nombre'],
        default_order='total_unidades_vendidas DESC'
    )
    result = sb.execute(c, page=page, limit=limit, q=q, order_by=order_by, **filters)
    c.close()

    lista = []
    for item in result['data']:
        lista.append(mas_vendidos(
            item['pro_id'],
            item['pro_nombre'],
            item.get('total_unidades_vendidas', 0),
            item.get('total_ingresos', 0)
        ).todic())

    result['data'] = lista
    return result
