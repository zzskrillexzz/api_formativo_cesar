from flask import Blueprint
from controllers.detalle_de_pedido_controllers import cnlistadodet

detalles_bp = Blueprint('detalles',__name__)

@detalles_bp.route('/')
def listado():
    return cnlistadodet()