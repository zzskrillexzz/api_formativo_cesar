from flask import Blueprint
from controllers.pedidos_controllers import cnlistadopedidos, cnregistrarpedidos

pedidos_bp = Blueprint('pedidos', __name__)

@pedidos_bp.route('/')
def listado_pedidos():
    return cnlistadopedidos()

@pedidos_bp.route('/', methods=["POST"])
def registrar_pedidos():
    return cnregistrarpedidos()