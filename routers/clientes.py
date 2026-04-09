from flask import Blueprint
from controllers.clientes_controllers import cnlistadoclientes, cnregistrarclientes

clientes_bp = Blueprint('clientes', __name__)

@clientes_bp.route('/')
def listado():
    return cnlistadoclientes()

@clientes_bp.route('/', methods=["POST"])
def registrar():
    return cnregistrarclientes()