from flask import Blueprint
from controllers.detalles_compras_controllers import cnlistadodetallescompras, cnregistrardetallescompras

detalles_compras_bp = Blueprint('detalles_compras', __name__)

@detalles_compras_bp.route('/')
def listado():
    return cnlistadodetallescompras()

@detalles_compras_bp.route('/', methods=["POST"])
def registrar():
    return cnregistrardetallescompras()