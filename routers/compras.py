from flask import Blueprint
from controllers.compras_controllers import cnlistadocompras, cnregistrarcompras

compras_bp = Blueprint('compras', __name__)

@compras_bp.route('/')
def listado():
    return cnlistadocompras()

@compras_bp.route('/', methods=["POST"])
def registrar():
    return cnregistrarcompras()