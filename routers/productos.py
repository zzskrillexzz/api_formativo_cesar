from flask import Blueprint
from services.auth_service import token_requerido
from controllers.productos_controllers import cnListarProductos, cnRegistrarProductos, cnEditarProductos, cnEliminarProductos

productos_bp = Blueprint('productos', __name__)

@productos_bp.route('/')
@token_requerido
def listado():
    return cnListarProductos()

@productos_bp.route('/', methods=["POST"])
@token_requerido
def registrar():
    return cnRegistrarProductos()

@productos_bp.route('/', methods=["PUT"])
@token_requerido
def editar():
    return cnEditarProductos()

@productos_bp.route('/<id>', methods=["DELETE"])
@token_requerido
def eliminar(id):
    return cnEliminarProductos(id)
