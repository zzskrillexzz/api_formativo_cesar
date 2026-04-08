from flask import Blueprint
from controllers.producto_controllers import cnlistado

productos_bp = Blueprint('productos', __name__)

@productos_bp.route('/')
def listado():
    return cnlistado()