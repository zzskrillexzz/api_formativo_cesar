from flask import Blueprint
from controllers.cliente_controllers import cnlistado, cnregistrarcliente

clientes_bp = Blueprint('clientes', __name__)
@clientes_bp.route('/')
def listado():
    return cnlistado()

@clientes_bp.route('/',methods=["post"]) 
def registrar():
    return cnregistrarcliente()