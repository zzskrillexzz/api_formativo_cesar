from flask import Blueprint
from controllers.productos_controllers import cnListarProductos, cnRegistrarProductos

productos_bp = Blueprint('productos', __name__)

@productos_bp.route('/')
def listado():
    return cnListarProductos()

@productos_bp.route('/', methods=["POST"])
def registrar():
    return cnRegistrarProductos()
