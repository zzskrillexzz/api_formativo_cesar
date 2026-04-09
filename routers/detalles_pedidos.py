from flask import Blueprint
from controllers.detalles_pedidos_controllers import cnlistadodetallespedidos, cnregistrardetallespedidos

detalles_pedidos_bp = Blueprint('detalles_pedidos', __name__)

@detalles_pedidos_bp.route('/')
def listado():
    return cnlistadodetallespedidos()

@detalles_pedidos_bp.route('/', methods=["POST"])
def registrar():
    return cnregistrardetallespedidos()