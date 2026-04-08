from flask import Blueprint
from controllers.factura_controllers import cnlistado

facturas_bp = Blueprint('facturas', __name__)

@facturas_bp.route('/')
def listado():
    return cnlistado()
